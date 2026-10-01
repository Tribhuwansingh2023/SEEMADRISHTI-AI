/**
 * Calculates the exact rendered rectangle of a video element styled with object-contain.
 * Deducts letterbox (horizontal bars) or pillarbox (vertical bars) offsets so that
 * bounding boxes and polygon zones stay pixel-perfectly aligned to video content.
 */
export function getVideoRenderedRect(video: HTMLVideoElement) {
  const containerW = video.clientWidth;
  const containerH = video.clientHeight;
  const videoW = video.videoWidth || 1920;
  const videoH = video.videoHeight || 1080;

  const videoRatio = videoW / videoH;
  const containerRatio = containerW / containerH;

  let renderW = containerW;
  let renderH = containerH;
  let offsetX = 0;
  let offsetY = 0;

  if (containerRatio > videoRatio) {
    // Pillarbox: vertical black bars on left & right
    renderW = containerH * videoRatio;
    offsetX = (containerW - renderW) / 2;
  } else {
    // Letterbox: horizontal black bars on top & bottom
    renderH = containerW / videoRatio;
    offsetY = (containerH - renderH) / 2;
  }

  return { offsetX, offsetY, renderW, renderH, containerW, containerH };
}
