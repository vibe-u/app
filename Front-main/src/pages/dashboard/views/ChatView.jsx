const ChatView = () => {
  return (
    <section className="chat_layout__dash">
      <div className="panel__dash">
        <h3>Chats recientes</h3>
        <div className="chat_item__dash">
          <strong>Equipo de proyecto</strong>
          <p>Nos reunimos hoy a las 18h00.</p>
        </div>
        <div className="chat_item__dash">
          <strong>Comunidad de diseno</strong>
          <p>Ya subi los mockups finales.</p>
        </div>
      </div>
      <div className="panel__dash">
        <h3>Conversacion</h3>
        <div className="chat_messages__dash">
          <p className="mine__dash">Listo, envio la presentacion.</p>
          <p>Perfecto, gracias.</p>
        </div>
        <div className="chat_input__dash">
          <input placeholder="Escribe un mensaje..." />
          <button>Enviar</button>
        </div>
      </div>
    </section>
  );
};

export default ChatView;

