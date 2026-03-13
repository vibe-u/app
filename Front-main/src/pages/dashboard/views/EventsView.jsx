const EventsView = () => {
  return (
    <section className="panel__dash">
      <h3>Eventos U</h3>
      <div className="events_grid__dash">
        <div className="event_card__dash">
          <h4>Feria Tech</h4>
          <p>Viernes 18:00 - Campus Norte</p>
        </div>
        <div className="event_card__dash">
          <h4>Networking Day</h4>
          <p>Sabado 11:00 - Auditorio</p>
        </div>
        <div className="event_card__dash">
          <h4>Workshop IA</h4>
          <p>Lunes 16:00 - Lab 3</p>
        </div>
      </div>
    </section>
  );
};

export default EventsView;

