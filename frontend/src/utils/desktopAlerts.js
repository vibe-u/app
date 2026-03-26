const ALERT_SETTINGS_KEY = "vibeu.alert.settings.v1";

const DEFAULT_ALERT_SETTINGS = {
  consentAsked: false,
  enabled: false,
  soundEnabled: false,
  desktopEnabled: false,
};

let audioContextInstance = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContextInstance) {
    audioContextInstance = new AudioContextClass();
  }
  return audioContextInstance;
};

export const readAlertSettings = () => {
  if (typeof window === "undefined") return { ...DEFAULT_ALERT_SETTINGS };
  try {
    const raw = localStorage.getItem(ALERT_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_ALERT_SETTINGS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_ALERT_SETTINGS };
    return {
      ...DEFAULT_ALERT_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_ALERT_SETTINGS };
  }
};

export const saveAlertSettings = (settings) => {
  if (typeof window === "undefined") return;
  const normalized = {
    ...DEFAULT_ALERT_SETTINGS,
    ...(settings || {}),
  };
  localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(normalized));
};

export const requestDesktopNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
};

export const showDesktopNotification = (title, body) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return;
  new Notification(title, { body });
};

export const playAlertSound = async () => {
  const context = getAudioContext();
  if (!context) return false;
  try {
    if (context.state === "suspended") {
      await context.resume();
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
    return true;
  } catch {
    return false;
  }
};

