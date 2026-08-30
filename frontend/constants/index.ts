import { Platform } from "react-native";

// Expo Web এর জন্য 'localhost' সবচেয়ে নিরাপদ
const getBaseUrl = () => {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
};

export const API_URL = getBaseUrl();

export const CLOUDINARY_CLOUD_NAME = "bp7adzo0";
export const CLOUDINARY_UPLOAD_PRESET = "images";
export const CLOUDINARY_UPLOAD_PRESEST = CLOUDINARY_UPLOAD_PRESET;