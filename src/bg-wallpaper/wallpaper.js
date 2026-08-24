// ----------  Rendering Functions ----------
import { els } from "../veil.js";
let currentObjectUrl = null; 

function clearBackground() {
  els.bgVideo.pause();
  els.bgVideo.removeAttribute("src");
  els.bgVideo.load();
  els.bgVideo.style.display = "none";

  els.bgImage.style.backgroundImage = "";
  els.bgImage.style.display = "none";

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

function renderMedia(record) {
  clearBackground();

  if (!record) {
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");
  currentObjectUrl = URL.createObjectURL(record.file);

  if (record.type.startsWith("video/")) {
    els.bgVideo.preload = "auto";
    els.bgVideo.src = currentObjectUrl;

    const showAndPlay = () => {
      els.bgVideo.style.display = "block";
      els.bgVideo.play().catch(() => {});
    };

    if (isFullyBuffered(els.bgVideo)) {
      showAndPlay();
    } else {
      els.bgVideo.addEventListener("canplaythrough", showAndPlay, { once: true });
      els.bgVideo.load();
    }
  } else {
    els.bgImage.style.backgroundImage = `url("${currentObjectUrl}")`;
    els.bgImage.style.display = "block";
  }
}

function isFullyBuffered(video) {
  const buffered = video.buffered;
  if (!buffered.length || !video.duration) return false;
  return buffered.end(buffered.length - 1) >= video.duration - 0.1;
}

export {  renderMedia}