/** Speak assistant text only if voice is still enabled at call time. */
export function speakReply(text: string, getEnabled: () => boolean): void {
  if (!getEnabled() || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
