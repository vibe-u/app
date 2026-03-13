import multer from "multer";

const storage = multer.memoryStorage(); // guardamos temporalmente en memoria
const upload = multer({ storage });

export default upload;
