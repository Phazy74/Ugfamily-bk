// import multer from "multer";
// const storage = multer.memoryStorage(); // we’ll stream to Cloudinary
// export const upload = multer({ storage });
import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
