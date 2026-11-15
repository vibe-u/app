
let audioCtx = null;

const getAudioContext = () => {
  const Ctx = window.AudioContext || window.webkitAudioContext;

  if (!Ctx) return null;

  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new Ctx();
  }

  return audioCtx;
};

export const unlockNotificationAudio = async () => {
  try {
    const ctx = getAudioContext();

    if (!ctx) return;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  } catch (error) {
    console.warn("No se pudo activar el audio:", error);
  }
};

export const playNotificationSound = async () => {
  try {
    const ctx = getAudioContext();

    if (!ctx) return;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    if (ctx.state !== "running") return;

    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.16, now);
    master.connect(ctx.destination);

    const tone = (frequency, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(frequency, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        0.22,
        start + 0.02
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + duration
      );

      osc.connect(gain);
      gain.connect(master);

      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    tone(880, now, 0.16);
    tone(1174, now + 0.12, 0.22);

    setTimeout(() => {
      master.disconnect();
    }, 500);

  } catch (error) {
    console.warn("Error al reproducir notificación:", error);
  }
};
