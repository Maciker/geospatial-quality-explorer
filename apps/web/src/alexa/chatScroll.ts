/** True when the scroller is at (or within threshold of) the bottom. */
export function shouldStickChatToBottom(
  element: { scrollTop: number; scrollHeight: number; clientHeight: number },
  thresholdPx = 64,
): boolean {
  const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
  return distanceFromBottom <= thresholdPx;
}
