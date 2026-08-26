export function playScanSound(): void {
  // fresh element each time: the browser releases it after playback
  const audio = new Audio('/scan.mp3');
  audio.volume = 0.7;
  void audio.play().catch(() => {});
}
