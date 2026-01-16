import axios from "axios";
import { SERVER_URL, DATA_GATHERING_URL } from "../constants/config";
import type { FishType, Condition } from "../types";

export const analyzeFish = async (imageUri: string): Promise<string> => {
  const formData = new FormData();
  // @ts-ignore: React Native FormData requires these specific fields
  formData.append("file", {
    uri: imageUri,
    name: "fish.jpg",
    type: "image/jpeg",
  });

  const response = await axios.post(SERVER_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "blob",
  });

  // Convert Blob to Viewable Image
  return new Promise((resolve, reject) => {
    const fileReaderInstance = new FileReader();
    fileReaderInstance.readAsDataURL(response.data);
    fileReaderInstance.onload = () => {
      if (typeof fileReaderInstance.result === "string") {
        resolve(fileReaderInstance.result);
      } else {
        reject(new Error("Failed to convert image"));
      }
    };
    fileReaderInstance.onerror = () =>
      reject(new Error("Failed to read image"));
  });
};

export const uploadDataset = async (
  imageUri: string,
  fishType: FishType,
  condition: Condition
): Promise<void> => {
  const formData = new FormData();
  // @ts-ignore: React Native FormData requires these specific fields
  formData.append("file", {
    uri: imageUri,
    name: `${fishType}_${condition}_${Date.now()}.jpg`,
    type: "image/jpeg",
  });
  formData.append("fish_type", fishType);
  formData.append("condition", condition);

  await axios.post(DATA_GATHERING_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
