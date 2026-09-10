/**
 * Single voice-alert queue for the interview page.
 * Alerts never overlap and each key has its own cooldown.
 *
 * NOTE (future): real-time voice conversation, AI digital humans and recorded
 * audio will replace this browser speech-synthesis placeholder.
 */
const lastSpoken = new Map<string, number>();
let speaking = false;

export function speakOnce(key: string, text: string, cooldownMs = 15000): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const now = Date.now();
  const last = lastSpoken.get(key) ?? 0;
  if (speaking || now - last < cooldownMs) return false;
  lastSpoken.set(key, now);
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    speaking = true;
    utterance.onend = () => { speaking = false; };
    utterance.onerror = () => { speaking = false; };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    speaking = false;
    return false;
  }
}

export function resetSpeech() {
  speaking = false;
  lastSpoken.clear();
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
