import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// File filter to allow only specific file types
const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, path.join(__dirname, "uploads", "donations"));
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  },
});

// Multer instance for handling multiple file uploads
export const uploadDonationsImages = multer({
  storage: storage,
  fileFilter: fileFilter,
}).array("donationImages", 10);
