export type VoiceIntent =
  | { type: 'navigation'; view: string }
  | { type: 'reminders' }
  | { type: 'notifications' }
  | { type: 'time' }
  | { type: 'help' }
  | { type: 'greeting' }
  | { type: 'unsupported' };

export type VoiceLocale = 'en-US' | 'hi-IN' | 'pa-IN';

export const voiceLocaleForLanguage = (language: string): VoiceLocale => {
  if (language === 'hi') return 'hi-IN';
  if (language === 'pa') return 'pa-IN';
  return 'en-US';
};

const normalize = (value: string) =>
  value.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

export const detectVoiceIntent = (input: string): VoiceIntent => {
  const command = normalize(input);

  if (/^(hello|hi|hey|namaste|sat sri akal)\b/.test(command)) return { type: 'greeting' };
  if (/(what can you do|help me|how can you help)/.test(command)) return { type: 'help' };
  if (/(what time is it|current time|tell me the time)/.test(command)) return { type: 'time' };
  if (/(notification|alert)/.test(command)) return { type: 'notifications' };
  if (/(reminder|what should i do today|take medicine)/.test(command)) return { type: 'reminders' };
  if (/(go back|return to dashboard|open dashboard|show dashboard)/.test(command)) return { type: 'navigation', view: 'dashboard' };
  if (/(open profile|show my profile)/.test(command)) return { type: 'navigation', view: 'profile' };
  if (/(open settings|show settings)/.test(command)) return { type: 'navigation', view: 'settings' };
  if (/(open notification|show notification)/.test(command)) return { type: 'navigation', view: 'notifications' };
  if (/(open reminder|show reminder)/.test(command)) return { type: 'navigation', view: 'reminders' };
  if (/(play a game|open memory game|open game|game progress)/.test(command)) return { type: 'navigation', view: 'game' };

  return { type: 'unsupported' };
};

export const getSpeechRecognition = (): SpeechRecognition | null => {
  if (typeof window === 'undefined') return null;
  const SpeechRecognitionConstructor =
    window.SpeechRecognition || (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
  return SpeechRecognitionConstructor ? new SpeechRecognitionConstructor() : null;
};
