from fastapi import FastAPI, UploadFile, File, Form, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # for web backend (CORS so frontend can read responses)
import cv2
import numpy as np
import io
import os
import json
from pathlib import Path
from starlette.responses import StreamingResponse
from datetime import datetime
from typing import Optional
from jose import jwt, JWTError
from bson import ObjectId
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
from ultralytics import YOLO  # <--- NEW IMPORT
from mongodb import get_db

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
  cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
  api_key=os.getenv("CLOUDINARY_API_KEY"),
  api_secret=os.getenv("CLOUDINARY_API_SECRET")
) 

app = FastAPI()

# --- for web backend: CORS so the frontend (localhost + production) can read API responses ---
# Add FRONTEND_URL env var in Render to your Vercel URL (e.g. https://dainggrader.vercel.app)
_cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
if _url := os.getenv("FRONTEND_URL", "").strip():
    _cors_origins.append(_url.rstrip("/"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 🧠 LOAD YOUR AI MODEL HERE ---
# We load it outside the function so it stays in memory (faster)
# Make sure 'best.pt' is in the same folder as this script!
try:
    print("Loading AI Model...")
    model = YOLO("best.pt")
    print("✅ AI Model Loaded Successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("Did you forget to put best.pt in the folder?")
# ----------------------------------

# Dataset & History Setup
DATASET_DIR = Path("dataset")
DATASET_DIR.mkdir(exist_ok=True)
HISTORY_FILE = Path("history_log.json")

def _read_history_entries():
  if not HISTORY_FILE.exists():
    return []
  try:
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
      return json.load(f)
  except json.JSONDecodeError:
    return []

def _write_history_entries(entries):
  with open(HISTORY_FILE, "w", encoding="utf-8") as f:
    json.dump(entries, f, indent=2)

def add_history_entry(entry):
  entries = _read_history_entries()
  entries.insert(0, entry)
  _write_history_entries(entries[:200])

def _get_scan_collection():
  """for web backend: return scan_history collection if MongoDB is configured."""
  try:
    return get_db()["scan_history"]
  except Exception:
    return None

def _try_get_user_from_request(request: Request) -> Optional[dict]:
  """for web backend: best-effort user lookup from JWT (optional)."""
  auth_header = request.headers.get("Authorization", "")
  if not auth_header.startswith("Bearer "):
    return None
  token = auth_header.replace("Bearer ", "").strip()
  if not token:
    return None
  try:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
  except JWTError:
    return None
  user_id = payload.get("sub")
  if not user_id:
    return None
  try:
    db = get_db()
    return db["users"].find_one({"_id": ObjectId(user_id)})
  except Exception:
    return None

def _grade_from_score(score: float) -> str:
  if score >= 0.9:
    return "Export"
  if score >= 0.8:
    return "Local"
  return "Reject"

def _normalize_scan_entry(entry: dict) -> dict:
  return {
    "id": entry.get("id") or str(entry.get("_id")),
    "timestamp": entry.get("timestamp") or "",
    "url": entry.get("url") or None,
    "fish_type": entry.get("fish_type") or "Unknown",
    "grade": entry.get("grade") or "Unknown",
    "score": entry.get("score") if entry.get("score") is not None else None,
    "user_name": entry.get("user_name") or "Unknown",
  }

def _require_admin_user(user=Depends(_get_current_user)):
  role = (user.get("role") or "user").strip().lower()
  if role != "admin":
    raise HTTPException(status_code=403, detail="Admins only")
  return user

def remove_history_entry(entry_id: str):
  entries = _read_history_entries()
  filtered = [e for e in entries if e.get("id") != entry_id]
  if len(filtered) == len(entries):
    return None
  _write_history_entries(filtered)
  removed = next(e for e in entries if e.get("id") == entry_id)
  return removed

@app.get("/")
def root():
  """Health/connection check for web and mobile clients."""
  return {"status": "ok"}

# --- for web backend: auth routes (signup/login) ---
from auth_web import router as auth_router, _get_current_user, JWT_SECRET, JWT_ALGORITHM
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# --- for web backend: contact form (sends email to shathesisgroup@gmail.com) ---
from contact_web import router as contact_router
app.include_router(contact_router, tags=["contact"])

@app.post("/analyze")
async def analyze_fish(request: Request, file: UploadFile = File(...)):
  print("Received an image for AI Analysis...") 
  
  # 1. READ IMAGE
  contents = await file.read()
  nparr = np.frombuffer(contents, np.uint8)
  img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

  # 2. RUN AI INFERENCE (The Real Deal)
  # This replaces the manual cv2.rectangle code
  results = model(img)
  
  # 3. FILTER DETECTIONS BY CONFIDENCE THRESHOLD
  # Set a minimum confidence threshold to avoid false positives
  CONFIDENCE_THRESHOLD = 0.8  # Only accept detections with 50% confidence or higher
  
  # Get the detection boxes from results
  boxes = results[0].boxes
  fish_type = "Unknown"
  best_score = 0.0
  if boxes is not None and len(boxes) > 0:
    confidences = boxes.conf.cpu().numpy()
    best_idx = int(np.argmax(confidences))
    best_score = float(confidences[best_idx])
    class_id = int(boxes.cls[best_idx].cpu().numpy())
    names = getattr(results[0], "names", {})
    if isinstance(names, dict) and class_id in names:
      fish_type = str(names[class_id]).replace("_", " ").title()
  
  # Filter detections based on confidence
  if boxes is not None and len(boxes) > 0:
    # Get confidence scores
    confidences = boxes.conf.cpu().numpy()
    # Check if any detection meets the threshold
    high_conf_detections = confidences >= CONFIDENCE_THRESHOLD
    
    if not high_conf_detections.any():
      # NO DAING DETECTED - Add text overlay
      annotated_img = img.copy()
      h, w = annotated_img.shape[:2]
      
      # Add semi-transparent overlay
      overlay = annotated_img.copy()
      cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
      cv2.addWeighted(overlay, 0.3, annotated_img, 0.7, 0, annotated_img)
      
      # Add "NO DAING DETECTED" text in the center
      text = "NO DAING DETECTED"
      font = cv2.FONT_HERSHEY_SIMPLEX
      font_scale = 1.5
      thickness = 3
      
      # Get text size for centering
      (text_w, text_h), _ = cv2.getTextSize(text, font, font_scale, thickness)
      text_x = (w - text_w) // 2
      text_y = (h + text_h) // 2
      
      # Draw text with outline for better visibility
      cv2.putText(annotated_img, text, (text_x, text_y), font, font_scale, (0, 0, 0), thickness + 2)
      cv2.putText(annotated_img, text, (text_x, text_y), font, font_scale, (255, 255, 255), thickness)
      
      print("⚠️ No high-confidence daing detected")
    else:
      # DAING DETECTED - Filter and draw only high-confidence boxes
      # Create a mask for high confidence detections
      indices = [i for i, conf in enumerate(confidences) if conf >= CONFIDENCE_THRESHOLD]
      
      # Filter the results to only include high-confidence detections
      filtered_boxes = boxes[indices]
      results[0].boxes = filtered_boxes
      
      # Draw boxes and labels for filtered detections
      annotated_img = results[0].plot()
      print(f"✅ Found {len(indices)} high-confidence daing detection(s)")
  else:
    # No detections at all
    annotated_img = img.copy()
    h, w = annotated_img.shape[:2]
    
    # Add semi-transparent overlay
    overlay = annotated_img.copy()
    cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.3, annotated_img, 0.7, 0, annotated_img)
    
    # Add "NO DAING DETECTED" text
    text = "NO DAING DETECTED"
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 1.5
    thickness = 3
    
    (text_w, text_h), _ = cv2.getTextSize(text, font, font_scale, thickness)
    text_x = (w - text_w) // 2
    text_y = (h + text_h) // 2
    
    cv2.putText(annotated_img, text, (text_x, text_y), font, font_scale, (0, 0, 0), thickness + 2)
    cv2.putText(annotated_img, text, (text_x, text_y), font, font_scale, (255, 255, 255), thickness)
    
    print("⚠️ No daing detected at all")

  # 4. PREPARE RESPONSE
  success, encoded_img = cv2.imencode('.jpg', annotated_img)
  if not success:
    raise ValueError("Failed to encode image")

  # Convert to bytes - this creates the actual JPEG file data
  image_bytes = encoded_img.tobytes()

  # 5. UPLOAD TO CLOUDINARY & LOG HISTORY
  try:
    now = datetime.now()
    date_folder = now.strftime("%Y-%m-%d")
    history_folder = f"daing-history/{date_folder}"
    history_id = f"scan_{now.strftime('%Y%m%d_%H%M%S_%f')}"
    grade = _grade_from_score(best_score)
    user = _try_get_user_from_request(request)
    user_name = (user or {}).get("name") or "Unknown"
    user_id = str(user["_id"]) if user and user.get("_id") else None

    # We upload the ANNOTATED image (with boxes) so you can see what the AI saw
    # Use io.BytesIO to create a file-like object from the JPEG encoded data
    upload_result = cloudinary.uploader.upload(
      io.BytesIO(image_bytes),
      folder=history_folder,
      public_id=history_id,
      resource_type="image"
    )

    entry = {
      "id": history_id,
      "timestamp": now.isoformat(),
      "url": upload_result.get("secure_url"),
      "folder": history_folder,
      "fish_type": fish_type,
      "grade": grade,
      "score": round(best_score, 4),
      "user_id": user_id,
      "user_name": user_name,
    }
    add_history_entry(entry)
    collection = _get_scan_collection()
    if collection:
      # for web backend: store full scan metadata for admin dashboard
      collection.insert_one(entry)
    print(f"📚 History saved: {history_folder}/{history_id}")
  except Exception as history_error:
    print(f"⚠️ Failed to save history: {history_error}")
    import traceback
    traceback.print_exc()

  # Return the image with boxes drawn on it
  return StreamingResponse(io.BytesIO(image_bytes), media_type="image/jpeg")


# --- KEEP YOUR DATASET/HISTORY ENDPOINTS BELOW AS IS ---
@app.post("/upload-dataset")
async def upload_dataset(
  file: UploadFile = File(...),
  fish_type: str = Form(...),
  condition: str = Form(...)
):
  # ... (Keep your existing code here) ...
  # Just copying the start to show where it goes
  print(f"📸 Data Gathering: {fish_type} - {condition}")
  contents = await file.read()
  timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
  filename = f"{fish_type}_{condition}_{timestamp}"
  date_folder = datetime.now().strftime("%Y-%m-%d")
  
  try:
    folder_path_1 = f"daing-dataset/{fish_type}/{condition}"
    upload_result_1 = cloudinary.uploader.upload(
      contents,
      folder=folder_path_1,
      public_id=filename,
      resource_type="image"
    )
    folder_path_2 = f"daing-dataset/date/{date_folder}/{fish_type}/{condition}"
    upload_result_2 = cloudinary.uploader.upload(
      contents,
      folder=folder_path_2,
      public_id=filename,
      resource_type="image"
    )
    return {
      "status": "success", 
      "message": "Image uploaded", 
      "filename": filename,
      "uploads": [{"url": upload_result_1.get("secure_url")}, {"url": upload_result_2.get("secure_url")}]
    }
  except Exception as e:
    return {"status": "error", "message": str(e)}

@app.get("/history")
def get_history():
  """Fetch history from Cloudinary directly - always in sync!"""
  try:
    # Get all resources from the daing-history folder
    result = cloudinary.api.resources(
      type="upload",
      prefix="daing-history/",
      max_results=500,
      resource_type="image"
    )
    
    entries = []
    for resource in result.get("resources", []):
      # Extract info from the resource
      public_id = resource.get("public_id", "")
      # public_id format: "daing-history/2026-01-30/scan_20260130_123456_789012"
      parts = public_id.split("/")
      if len(parts) >= 3:
        folder = "/".join(parts[:2])  # "daing-history/2026-01-30"
        scan_id = parts[2]  # "scan_20260130_123456_789012"
        
        # Parse timestamp from scan_id (scan_YYYYMMDD_HHMMSS_ffffff)
        try:
          timestamp_str = scan_id.replace("scan_", "")
          # Format: 20260130_123456_789012
          date_part = timestamp_str[:8]  # 20260130
          time_part = timestamp_str[9:15]  # 123456
          micro_part = timestamp_str[16:]  # 789012
          iso_timestamp = f"{date_part[:4]}-{date_part[4:6]}-{date_part[6:8]}T{time_part[:2]}:{time_part[2:4]}:{time_part[4:6]}.{micro_part}"
        except:
          iso_timestamp = resource.get("created_at", "")
        
        entries.append({
          "id": scan_id,
          "timestamp": iso_timestamp,
          "url": resource.get("secure_url"),
          "folder": folder
        })
    
    # Sort by timestamp descending (newest first)
    entries.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {"status": "success", "entries": entries}
  except Exception as e:
    print(f"⚠️ Failed to fetch from Cloudinary: {e}")
    # Fallback to JSON file if Cloudinary fails
    return {"status": "success", "entries": _read_history_entries()}

@app.delete("/history/{entry_id}")
def delete_history(entry_id: str):
  """Delete from both Cloudinary and local JSON"""
  try:
    # Try to get folder info from JSON first
    entry = remove_history_entry(entry_id)
    
    # If not in JSON, try to find it in Cloudinary by searching
    if not entry:
      # Search in Cloudinary for this scan ID
      try:
        result = cloudinary.api.resources(
          type="upload",
          prefix=f"daing-history/",
          max_results=500,
          resource_type="image"
        )
        for resource in result.get("resources", []):
          public_id = resource.get("public_id", "")
          if entry_id in public_id:
            # Found it! Delete from Cloudinary
            cloudinary.uploader.destroy(public_id, resource_type="image")
            return {"status": "success"}
      except Exception as search_error:
        print(f"⚠️ Failed to search Cloudinary: {search_error}")
      
      return {"status": "error", "message": "Entry not found"}
    
    # Delete from Cloudinary using the folder info from JSON
    public_id = f"{entry.get('folder')}/{entry_id}" if entry.get("folder") else entry_id
    cloudinary.uploader.destroy(public_id, resource_type="image")
    return {"status": "success"}
  except Exception as e:
    print(f"⚠️ Failed to delete: {e}")
    return {"status": "error", "message": str(e)}

# --- for web backend: admin analytics (scan summary + paginated table) ---
@app.get("/admin/scans")
def get_admin_scans(page: int = 1, page_size: int = 10, user=Depends(_require_admin_user)):
  page = max(page, 1)
  page_size = min(max(page_size, 1), 50)
  collection = _get_scan_collection()

  if collection:
    total = collection.count_documents({})
    cursor = collection.find({}, sort=[("timestamp", -1)]).skip((page - 1) * page_size).limit(page_size)
    entries = [_normalize_scan_entry(doc) for doc in cursor]
  else:
    all_entries = _read_history_entries()
    total = len(all_entries)
    start = (page - 1) * page_size
    end = start + page_size
    entries = [_normalize_scan_entry(e) for e in all_entries[start:end]]

  return {
    "status": "success",
    "page": page,
    "page_size": page_size,
    "total": total,
    "entries": entries,
  }

@app.get("/admin/scans/summary")
def get_admin_scan_summary(year: int, user=Depends(_require_admin_user)):
  collection = _get_scan_collection()
  if collection:
    entries = list(collection.find({}, {"timestamp": 1}))
  else:
    entries = _read_history_entries()

  months = {f"{year}-{m:02d}": 0 for m in range(1, 13)}
  for entry in entries:
    ts = entry.get("timestamp") or ""
    if ts.startswith(f"{year}-"):
      key = ts[:7]
      if key in months:
        months[key] += 1

  labels = [
    {"key": f"{year}-01", "label": "Jan"},
    {"key": f"{year}-02", "label": "Feb"},
    {"key": f"{year}-03", "label": "Mar"},
    {"key": f"{year}-04", "label": "Apr"},
    {"key": f"{year}-05", "label": "May"},
    {"key": f"{year}-06", "label": "Jun"},
    {"key": f"{year}-07", "label": "Jul"},
    {"key": f"{year}-08", "label": "Aug"},
    {"key": f"{year}-09", "label": "Sep"},
    {"key": f"{year}-10", "label": "Oct"},
    {"key": f"{year}-11", "label": "Nov"},
    {"key": f"{year}-12", "label": "Dec"},
  ]

  return {
    "status": "success",
    "year": year,
    "months": [{"key": m["key"], "label": m["label"], "count": months[m["key"]]} for m in labels],
  }