import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import { crearPost, subirMediaPost } from "../../../Services/posts";
import { getCroppedImg } from "../../../utils/cropImage";

const MAX_IMAGE_SIZE_MB = 8;
const MAX_VIDEO_SIZE_MB = 60;
const MAX_VIDEO_DURATION_SECONDS = 180;
const MB = 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

const fileToObjectUrl = (file) => URL.createObjectURL(file);

const getVideoDurationSeconds = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.onloadedmetadata = () => {
      const duration = Number(videoEl.duration || 0);
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };
    videoEl.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la duracion del video."));
    };
    videoEl.src = objectUrl;
  });

const getUploadErrorMessage = (err) => {
  const msg = err?.response?.data?.message || "";
  if (msg.includes("60MB")) return "El video supera el limite permitido de 60MB.";
  if (msg.toLowerCase().includes("solo se permiten")) {
    return "Formato no permitido. Usa JPG, PNG, WEBP, GIF, MP4, WEBM u OGG.";
  }
  return msg || "No se pudo adjuntar el archivo. Intenta nuevamente.";
};

const CreatePostView = ({ asModal = false, onClose, onPublished }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState("");
  const [video, setVideo] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  const [imageToCrop, setImageToCrop] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const mediaType = video ? "video" : imagen ? "image" : "";
  const currentStep = uploading ? 2 : mediaType ? 3 : 1;
  const canPublish = Boolean(texto.trim() || imagen || video) && !loading && !uploading;

  const uploadFileToServer = async (file) => {
    const token = localStorage.getItem("token");
    if (!token || !file) return;
    setUploading(true);
    setUploadProgress(0);
    setError("");
    try {
      const res = await subirMediaPost(file, token, setUploadProgress);
      if (res.data?.mediaType === "image") {
        setImagen(res.data.url || "");
        setVideo("");
      } else if (res.data?.mediaType === "video") {
        setVideo(res.data.url || "");
        setImagen("");
      }
      setUploadProgress(100);
      setSelectedFileName(file.name || "");
    } catch (err) {
      setError(getUploadErrorMessage(err));
      setSelectedFileName("");
    } finally {
      setUploading(false);
    }
  };

  const validateFile = async (file) => {
    if (!file) return { ok: false, message: "No se selecciono archivo." };
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      return { ok: false, message: "Solo se permiten imagenes o videos." };
    }
    if (isImage && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { ok: false, message: "Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF." };
    }
    if (isVideo && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return { ok: false, message: "Formato de video no permitido. Usa MP4, WEBM, OGG o MOV." };
    }
    if (isImage && file.size > MAX_IMAGE_SIZE_MB * MB) {
      return { ok: false, message: `La imagen supera el limite de ${MAX_IMAGE_SIZE_MB}MB.` };
    }
    if (isVideo && file.size > MAX_VIDEO_SIZE_MB * MB) {
      return { ok: false, message: `El video supera el limite de ${MAX_VIDEO_SIZE_MB}MB.` };
    }
    if (isVideo) {
      try {
        const duration = await getVideoDurationSeconds(file);
        if (duration > MAX_VIDEO_DURATION_SECONDS) {
          return {
            ok: false,
            message: `El video no debe superar ${Math.floor(MAX_VIDEO_DURATION_SECONDS / 60)} minutos.`,
          };
        }
      } catch {
        return { ok: false, message: "No se pudo validar la duracion del video." };
      }
    }
    return { ok: true, isImage, isVideo };
  };

  const handleSelectFile = async (file) => {
    const check = await validateFile(file);
    if (!check.ok) {
      setError(check.message);
      return;
    }

    if (check.isImage) {
      setError("");
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setImageToCrop(fileToObjectUrl(file));
      setCropOpen(true);
      return;
    }

    await uploadFileToServer(file);
  };

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirmCrop = useCallback(async () => {
    try {
      if (!imageToCrop || !croppedAreaPixels) return;
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels, rotation);
      if (!croppedBlob) {
        setError("No se pudo recortar la imagen.");
        return;
      }
      const croppedFile = new File([croppedBlob], `recorte-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      await uploadFileToServer(croppedFile);
      setCropOpen(false);
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop("");
    } catch {
      setError("No se pudo recortar la imagen.");
    }
  }, [imageToCrop, croppedAreaPixels, rotation]);

  const closeCrop = () => {
    if (imageToCrop) URL.revokeObjectURL(imageToCrop);
    setImageToCrop("");
    setCropOpen(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    await handleSelectFile(file);
  };

  const handlePublicar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    if (!texto.trim() && !imagen && !video) {
      setError("Agrega texto o adjunta un archivo antes de publicar.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await crearPost({ texto, imagen, video }, token);
      setTexto("");
      setImagen("");
      setVideo("");
      setSelectedFileName("");
      setUploadProgress(0);
      window.dispatchEvent(new Event("dash:post-created"));
      if (typeof onPublished === "function") onPublished();
      if (asModal) {
        if (typeof onClose === "function") onClose();
        return;
      }
      navigate("/dashboard/feed");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo publicar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel__dash">
      <h3>Crear publicacion</h3>
      <div className="publish_steps__dash">
        <span className={`publish_step__dash ${currentStep >= 1 ? "publish_step_active__dash" : ""}`}>
          1. Selecciona archivo
        </span>
        <span className={`publish_step__dash ${currentStep >= 2 ? "publish_step_active__dash" : ""}`}>
          2. Sube y revisa
        </span>
        <span className={`publish_step__dash ${currentStep >= 3 ? "publish_step_active__dash" : ""}`}>
          3. Publica
        </span>
      </div>
      <form onSubmit={handlePublicar}>
        <label>Texto</label>
        <textarea
          className="textarea__dash"
          rows="4"
          placeholder="Que quieres compartir hoy?"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />

        <label>Adjunta imagen o video</label>
        <div
          className={`media_dropzone__dash ${isDragOver ? "media_dropzone_active__dash" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <p>Arrastra y suelta aqui tu archivo o selecciona desde el dispositivo.</p>
          <p>
            Limites: imagen hasta {MAX_IMAGE_SIZE_MB}MB (JPG/PNG/WEBP/GIF), video hasta {MAX_VIDEO_SIZE_MB}MB
            (MP4/WEBM/OGG/MOV) y maximo {Math.floor(MAX_VIDEO_DURATION_SECONDS / 60)} minutos.
          </p>
          <button
            className="button__dash"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Seleccionar archivo
          </button>
          <input
            ref={fileInputRef}
            className="input__dash hidden_input__dash"
            type="file"
            accept="image/*,video/*"
            onChange={(e) => handleSelectFile(e.target.files?.[0])}
          />
        </div>

        {uploading ? (
          <div className="upload_progress_wrap__dash">
            <p className="chat_hint__dash">Subiendo archivo... {uploadProgress}%</p>
            <div className="upload_progress_bar__dash" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={uploadProgress}>
              <span style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : null}

        {!uploading && selectedFileName ? (
          <p className="chat_hint__dash">Archivo listo: {selectedFileName}</p>
        ) : null}

        {mediaType === "image" ? (
          <img className="post_media_preview__dash post_media_preview_vertical__dash" src={imagen} alt="Vista previa" />
        ) : null}
        {mediaType === "video" ? (
          <video className="post_media_preview__dash" controls>
            <source src={video} />
            Tu navegador no soporta video.
          </video>
        ) : null}

        {(imagen || video) ? (
          <button
            className="button__dash"
            type="button"
            onClick={() => {
              setImagen("");
              setVideo("");
              setSelectedFileName("");
              setUploadProgress(0);
            }}
          >
            Quitar archivo
          </button>
        ) : null}

        {error ? <p className="chat_error__dash">{error}</p> : null}
        <button className="button__dash" type="submit" disabled={!canPublish}>
          {loading ? "Publicando..." : "Publicar"}
        </button>
        {asModal ? (
          <button
            className="button__dash"
            type="button"
            onClick={() => onClose?.()}
            disabled={loading || uploading}
          >
            Cancelar
          </button>
        ) : null}
      </form>

      {cropOpen ? (
        <div className="crop_modal_overlay__dash">
          <div className="crop_modal__dash">
            <h4>Recorta tu imagen</h4>
            <div className="crop_area__dash">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={9 / 16}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                objectFit="contain"
              />
            </div>
            <div className="crop_controls__dash">
              <label>Zoom</label>
              <input
                className="input__dash"
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <label>Rotacion</label>
              <input
                className="input__dash"
                type="range"
                min="0"
                max="360"
                step="1"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
              />
            </div>
            <div className="confirm_modal_actions__dash">
              <button className="button__dash" type="button" onClick={closeCrop}>
                Cancelar
              </button>
              <button className="button__dash" type="button" onClick={handleConfirmCrop}>
                Recortar y usar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default CreatePostView;
