# This file is for web backend: signup/login/auth API used by the daing-grader-web frontend.

import io
import os
import re
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

# --- for web backend: password hashing (bcrypt directly) and JWT ---
try:
    import bcrypt
except ImportError:
    bcrypt = None
try:
    from jose import jwt, JWTError
except ImportError:
    jwt = None
    JWTError = Exception

# for web backend: Cloudinary for profile avatar upload
try:
    import cloudinary
    import cloudinary.uploader
except ImportError:
    cloudinary = None

from bson import ObjectId
from mongodb import get_db

router = APIRouter()
security = HTTPBearer(auto_error=False)
BCRYPT_MAX_PASSWORD_BYTES = 72  # bcrypt limit; truncate to avoid ValueError

JWT_SECRET = os.getenv("JWT_SECRET", "dainggrader-web-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7  # 7 days

# for web backend: Cloudinary config for profile avatars (same as server.py)
if cloudinary and os.getenv("CLOUDINARY_CLOUD_NAME"):
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    )


def _get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """for web backend: get current user from JWT Bearer token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not jwt:
        raise HTTPException(status_code=500, detail="Auth not configured")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    db = get_db()
    try:
        user = db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


class RegisterBody(BaseModel):
    name: str
    email: str
    password: str


class LoginBody(BaseModel):
    email: str
    password: str


class ProfileUpdateBody(BaseModel):
    name: Optional[str] = None


def _password_bytes(password: str) -> bytes:
    """Truncate to 72 bytes for bcrypt (avoids ValueError)."""
    raw = password.encode("utf-8")
    return raw[:BCRYPT_MAX_PASSWORD_BYTES] if len(raw) > BCRYPT_MAX_PASSWORD_BYTES else raw


def _hash_password(password: str) -> str:
    if not bcrypt:
        raise HTTPException(status_code=500, detail="Auth not configured (install bcrypt)")
    pw_bytes = _password_bytes(password)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pw_bytes, salt)
    return hashed.decode("utf-8")


def _verify_password(plain: str, hashed: str) -> bool:
    if not bcrypt:
        return False
    try:
        pw_bytes = _password_bytes(plain)
        return bcrypt.checkpw(pw_bytes, hashed.encode("utf-8"))
    except Exception:
        return False


def _create_token(user_id: str, email: str) -> str:
    if not jwt:
        raise HTTPException(status_code=500, detail="Auth not configured (install python-jose[cryptography])")
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@router.post("/register")
async def register(body: RegisterBody):
    """Web backend: register a new user. Stores in MongoDB users collection."""
    name = (body.name or "").strip()
    email = (body.email or "").strip().lower()
    password = body.password or ""

    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    db = get_db()
    users = db["users"]

    existing = users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = _hash_password(password)
    doc = {
        "name": name,
        "email": email,
        "password_hash": hashed,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = users.insert_one(doc)
    user_id = str(result.inserted_id)

    token = _create_token(user_id, email)
    return {
        "token": token,
        "user": {"id": user_id, "name": name, "email": email},
    }


@router.post("/login")
async def login(body: LoginBody):
    """Web backend: login user. Verifies password against MongoDB users collection."""
    email = (body.email or "").strip().lower()
    password = body.password or ""

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")

    db = get_db()
    users = db["users"]

    user = users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    stored_hash = user.get("password_hash")
    if not stored_hash or not _verify_password(password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    name = user.get("name") or email.split("@")[0]
    token = _create_token(user_id, email)
    return {
        "token": token,
        "user": {"id": user_id, "name": name, "email": email},
    }


@router.get("/me")
async def get_me(user=Depends(_get_current_user)):
    """for web backend: return current user (id, name, email, avatar_url)."""
    uid = str(user["_id"])
    return {
        "id": uid,
        "name": user.get("name") or "",
        "email": user.get("email") or "",
        "avatar_url": user.get("avatar_url") or None,
    }


@router.patch("/profile")
async def update_profile(body: ProfileUpdateBody, user=Depends(_get_current_user)):
    """for web backend: update name (and optionally avatar_url set by /profile/avatar)."""
    db = get_db()
    users = db["users"]
    updates = {}
    if body.name is not None and len((body.name or "").strip()) >= 2:
        updates["name"] = body.name.strip()
    if updates:
        users.update_one({"_id": user["_id"]}, {"$set": updates})
    updated = users.find_one({"_id": user["_id"]})
    uid = str(updated["_id"])
    return {
        "id": uid,
        "name": updated.get("name") or "",
        "email": updated.get("email") or "",
        "avatar_url": updated.get("avatar_url") or None,
    }


@router.post("/profile/avatar")
async def upload_profile_avatar(file: UploadFile = File(...), user=Depends(_get_current_user)):
    """for web backend: upload profile image to Cloudinary, save URL in MongoDB users."""
    if not cloudinary:
        raise HTTPException(status_code=500, detail="Cloudinary not configured")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5 MB
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")
    user_id = str(user["_id"])
    folder = "daing-profile-avatars"
    public_id = f"avatar_{user_id}"
    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(content),
            folder=folder,
            public_id=public_id,
            resource_type="image",
            overwrite=True,
        )
        url = result.get("secure_url")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    db = get_db()
    db["users"].update_one({"_id": user["_id"]}, {"$set": {"avatar_url": url}})
    return {"avatar_url": url}
