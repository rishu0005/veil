import { els } from "../veil.js";
import { getMedia} from "../storage/db.js";
import { setClockVisible} from "../bg-wallpaper/clock.js";
import { renderMedia} from "../bg-wallpaper/wallpaper.js";
import { loadSearchEngines} from "../search/engine.js";
import { saveSearchQuery} from "../search/search.js";




function isExactShortcut(event, {
    ctrl = false,
    alt = false,
    shift = false,
    meta = false,
    code
}) {
    return (
        event.ctrlKey === ctrl &&
        event.altKey === alt &&
        event.shiftKey === shift &&
        event.metaKey === meta &&
        event.code === code
    );
}

// ---------- Imp Function ----------
async function init() {
  // Ask for persistent storage so the browser is less likely to evict
  // our IndexedDB data (relevant once videos get large).
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  const { showClock = true, hoverReveal = false } = await browser.storage.local.get(["showClock", "hoverReveal"]);
els.clockToggle.checked = showClock;
setClockVisible(showClock);

els.hoverRevealToggle.checked = hoverReveal;
document.body.classList.toggle("hover-reveal", hoverReveal);

  try {
    const record = await getMedia();
    renderMedia(record);
  } catch (err) {
    console.error(err);
    renderMedia(null);
  }
}

// ---------- Start Function ----------
async function startVeil() {
    await loadSearchEngines();
    await init();
}


export {startVeil, isExactShortcut }