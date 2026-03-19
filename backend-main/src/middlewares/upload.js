import multer from "multer";

const storage = multer.memoryStorage(); // guardamos temporalmente en memoria
const upload = multer({
  storage,
  limits: {
    fileSize: 60 * 1024 * 1024,
  },
  fileFilter: (_, file, cb) => {
    const mime = file?.mimetype || "";
    if (mime.startsWith("image/") || mime.startsWith("video/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Solo se permiten imagenes o videos"));
  },
});

export default upload;
