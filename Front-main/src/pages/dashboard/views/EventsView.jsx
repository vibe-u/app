import { useEffect, useMemo, useState } from "react";
import {
  createUniversityEvent,
  getUniversityEvents,
  toggleAttendEvent,
} from "../../../Services/events";

const formatDate = (value) => {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleString();
};

const emptyForm = {
  nombreEvento: "",
  portada: "",
  fechaHora: "",
  lugar: "",
  descripcionEvento: "",
  costo: "",
};

const EventsView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [coverPreview, setCoverPreview] = useState("");

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora)),
    [events]
  );

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getUniversityEvents();
      setEvents(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudieron cargar los eventos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await createUniversityEvent(form);
      setForm(emptyForm);
      setCoverPreview("");
      setShowCreateModal(false);
      await loadEvents();
    } catch (err) {
      setError(err?.response?.data?.msg || "No se pudo crear el evento.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCoverChange = async (file) => {
    if (!file) {
      setForm((prev) => ({ ...prev, portada: "" }));
      setCoverPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("La portada debe ser una imagen.");
      return;
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setForm((prev) => ({ ...prev, portada: dataUrl }));
    setCoverPreview(typeof dataUrl === "string" ? dataUrl : "");
  };

  const handleAttend = async (eventId, e) => {
    e.stopPropagation();
    try {
      setError("");
      const res = await toggleAttendEvent(eventId);
      const updated = res?.data?.evento;
      if (!updated?._id) return;
      setEvents((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      setSelectedEvent((prev) => (prev?._id === updated._id ? updated : prev));
    } catch (err) {
      setError(err?.response?.data?.msg || "No se pudo actualizar asistencia.");
    }
  };

  return (
    <section className="panel__dash">
      <div className="events_head_custom__dash">
        <h3>Eventos U</h3>
        <button className="button__dash" type="button" onClick={() => setShowCreateModal(true)}>
          Publicar evento
        </button>
      </div>

      {error ? <p className="chat_error__dash">{error}</p> : null}

      {loading ? (
        <p className="chat_hint__dash">Cargando eventos...</p>
      ) : (
        <div className="events_grid__dash events_custom_grid__dash">
          {sortedEvents.map((event) => (
            <article
              key={event._id}
              className="event_card__dash event_card_clickable__dash"
              onClick={() => setSelectedEvent(event)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedEvent(event);
              }}
            >
              <div className="event_card_body_custom__dash">
                <div className="event_card_main_custom__dash">
                  <h4>{event.nombreEvento}</h4>
                  <p>{formatDate(event.fechaHora)}</p>
                  <p>{event.lugar}</p>
                  <p>Asistentes: {event.asistentesCount || 0}</p>
                  <button
                    className="button__dash"
                    type="button"
                    onClick={(e) => handleAttend(event._id, e)}
                  >
                    {event.isAttending ? "Ya asistiré" : "Asistiré"}
                  </button>
                </div>
                {event.portada ? (
                  <img className="event_cover_custom__dash" src={event.portada} alt={`Portada de ${event.nombreEvento}`} />
                ) : null}
              </div>
            </article>
          ))}

          {!sortedEvents.length ? (
            <p className="chat_hint__dash">No hay eventos publicados para tu universidad.</p>
          ) : null}
        </div>
      )}

      {showCreateModal ? (
        <div className="events_modal_overlay__dash" role="dialog" aria-modal="true">
          <div className="events_modal__dash">
            <h4>Publicar evento</h4>
            <form className="events_form__dash" onSubmit={handleCreateEvent}>
              <input
                className="input__dash"
                placeholder="Nombre del evento"
                value={form.nombreEvento}
                onChange={(e) => setForm((prev) => ({ ...prev, nombreEvento: e.target.value }))}
              />
              <input
                className="input__dash"
                type="file"
                accept="image/*"
                onChange={(e) => handleCoverChange(e.target.files?.[0])}
              />
              {coverPreview ? (
                <img className="event_cover_preview_custom__dash" src={coverPreview} alt="Vista previa portada" />
              ) : null}
              <input
                className="input__dash"
                type="datetime-local"
                value={form.fechaHora}
                onChange={(e) => setForm((prev) => ({ ...prev, fechaHora: e.target.value }))}
              />
              <input
                className="input__dash"
                placeholder="Lugar"
                value={form.lugar}
                onChange={(e) => setForm((prev) => ({ ...prev, lugar: e.target.value }))}
              />
              <textarea
                className="textarea__dash"
                rows={4}
                placeholder="Descripcion del evento"
                value={form.descripcionEvento}
                onChange={(e) => setForm((prev) => ({ ...prev, descripcionEvento: e.target.value }))}
              />
              <input
                className="input__dash"
                placeholder="Costo"
                value={form.costo}
                onChange={(e) => setForm((prev) => ({ ...prev, costo: e.target.value }))}
              />
              <div className="events_actions__dash">
                <button className="button__dash" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button className="button__dash" type="submit" disabled={submitting}>
                  {submitting ? "Publicando..." : "Guardar evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {selectedEvent ? (
        <div className="events_modal_overlay__dash" role="dialog" aria-modal="true">
          <div className="events_modal__dash">
            <h4>{selectedEvent.nombreEvento}</h4>
            <p><strong>Fecha/Hora:</strong> {formatDate(selectedEvent.fechaHora)}</p>
            <p><strong>Lugar:</strong> {selectedEvent.lugar}</p>
            <p><strong>Descripcion:</strong> {selectedEvent.descripcionEvento}</p>
            <p><strong>Costo:</strong> {selectedEvent.costo}</p>
            <p><strong>Asistentes:</strong> {selectedEvent.asistentesCount || 0}</p>
            <div className="events_actions__dash">
              <button className="button__dash" type="button" onClick={() => setSelectedEvent(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default EventsView;

