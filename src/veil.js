import { startVeil, isExactShortcut } from "./js/helper.js";
import { isUrl, openUrl } from "./utils/url.js";
import { saveMedia,  getMedia, clearMedia} from "./storage/db.js";
import { setClockVisible } from "./bg-wallpaper/clock.js";
import { showStatus, hideStatus} from "./bg-wallpaper/status.js";
import { renderMedia } from "./bg-wallpaper/wallpaper.js";
import { getOpenTabs, renderSuggestions, displayedSuggestions, setSelectedSuggestionIndex, 
         getSelectedSuggestionIndex, setSelectedTabIndex,   } from "./tabs/tabs.js";
import { updateAutocomplete, saveSearchQuery, performSearch,
         getAutocompleteSuggestion, renderSuggestionUI, selectSuggestion } from "./search/search.js";

import { parseQuery } from "./search/parseQuery.js";
import { executeCommand } from "./search/command.js";
import { els} from "./js/dom.js";

const MAX_VIDEO_BYTES = 300 * 1024 * 1024; // 300MB
const MAX_IMAGE_BYTES = 300 * 1024 * 1024; // 300MB


// ---------- Settings panel ----------

els.settingsToggle.addEventListener("click", () => {
  els.settingsPanel.classList.toggle("hidden");
  document.body.classList.toggle("settings-panel-open", !els.settingsPanel.classList.contains("hidden"));
});

document.addEventListener("click", (e) => {
  const clickedInsidePanel = els.settingsPanel.contains(e.target);
  const clickedToggle = els.settingsToggle.contains(e.target);
  if (!clickedInsidePanel && !clickedToggle) {
    els.settingsPanel.classList.add("hidden");
    document.body.classList.remove("settings-panel-open");
  }
});

// ---------- Hover-reveal toggle ----------

els.hoverRevealToggle.addEventListener("change", async (e) => {
  const enabled = e.target.checked;
  document.body.classList.toggle("hover-reveal", enabled);
  await browser.storage.local.set({ hoverReveal: enabled });
});

// ---------- Upload handling ----------

els.fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = ""; // allow re-selecting the same file later
  if (!file) return;

  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  if (!isVideo && !isImage) {
    showStatus("Please choose an image or video file.", "error");
    return;
  }

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    showStatus(`Video is ${mb}MB — the limit is 300MB.`, "error");
    return;
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    showStatus(`Image is ${mb}MB — the limit is 300MB.`, "error");
    return;
  }

  showStatus("Saving wallpaper…", "loading");

  try {
    await saveMedia(file); // this clears out the previous file too
    const record = await getMedia();
    renderMedia(record);
    showStatus("Wallpaper updated.", "success");
    setTimeout(hideStatus, 2500);
  } catch (err) {
    console.error(err);
    showStatus("Something went wrong saving that file.", "error");
  }
});

els.removeMediaBtn.addEventListener("click", async () => {
  try {
    await clearMedia();
    renderMedia(null);
    showStatus("Wallpaper removed.", "success");
    setTimeout(hideStatus, 2000);
  } catch (err) {
    console.error(err);
    showStatus("Couldn't remove the wallpaper.", "error");
  }
});

// ---------- Clock toggle ----------

els.clockToggle.addEventListener("change", async (e) => {
  const enabled = e.target.checked;
  setClockVisible(enabled);
  await browser.storage.local.set({ showClock: enabled });
});

els.bgVideo.loop = false;
els.bgVideo.addEventListener('ended', () => {
  els.bgVideo.currentTime = 0;
  els.bgVideo.play().catch(() => {
    els.bgVideo.load();
    els.bgVideo.play().catch(() => {});
  });
});


let stallTimer = null;
els.bgVideo.addEventListener('waiting', () => {
  clearTimeout(stallTimer);
  stallTimer = setTimeout(() => {
    if (els.bgVideo.readyState < 3) {
      const t = els.bgVideo.currentTime;
      els.bgVideo.load();
      els.bgVideo.currentTime = t;
      els.bgVideo.play().catch(() => {});
    }
  }, 8000);
});
els.bgVideo.addEventListener('playing', () => clearTimeout(stallTimer));

els.searchInput.addEventListener('keydown', async (event) =>{


  if(isExactShortcut(event, {
    code: "ArrowDown"
  })){

     event.preventDefault();

        if (displayedSuggestions.length === 0) {
            return;
        }

        if (getSelectedSuggestionIndex() === -1) {
            setSelectedSuggestionIndex(0);
        } else if (
            getSelectedSuggestionIndex() <
            displayedSuggestions.length - 1
        ) {
            setSelectedSuggestionIndex(getSelectedSuggestionIndex() + 1);
        } else {
            setSelectedSuggestionIndex(0);
        }
        renderSuggestionUI();

        return;
  }

  if(isExactShortcut(event, {
    code: "ArrowUp"
  })){
      event.preventDefault();

      if (displayedSuggestions.length === 0) {
          return;
      }

      if (getSelectedSuggestionIndex() === -1) {
          setSelectedSuggestionIndex(displayedSuggestions.length - 1);
      } else if (getSelectedSuggestionIndex() > 0) {
          setSelectedSuggestionIndex(getSelectedSuggestionIndex() - 1);
      } else {
          setSelectedSuggestionIndex(displayedSuggestions.length - 1);
      }

      renderSuggestionUI();
      return;
  }


  if(isExactShortcut(event, {
    code: 'Enter'
  })){

    event.preventDefault();

        if (getSelectedSuggestionIndex() !== -1) {

           await selectSuggestion(getSelectedSuggestionIndex());
          return;
          
        }
        const query = els.searchInput.value.trim();

        if (!query) {
            return;
        }

      saveSearchQuery(query);

      const result = parseQuery(query);

      switch(result.type){
        case "url":
          openUrl(result.value);
          break;
        
        case "search":
          await  performSearch(result.value);
          break;
        
        case "command":
          executeCommand(result.value);
          break


        case "empty":
          break;   
      }
  }
  
  if(isExactShortcut(event, {
    code: 'Escape'
  })){
    els.searchInput.value = "";
      setSelectedTabIndex(-1);
    els.searchInput.blur();
    return;
  } 

  if (isExactShortcut(event, {
    code: "Tab"
  })) {

    const query = els.searchInput.value.trim();

    const suggestion = getAutocompleteSuggestion(query);

    if (suggestion) {

        event.preventDefault();

        els.searchInput.value = suggestion;

        updateAutocomplete(suggestion);

        els.searchInput.setSelectionRange(
            suggestion.length,
            suggestion.length
        );
    }

    return;
}
});

els.searchInput.addEventListener('input', () => {

    const query = els.searchInput.value.trim();

    setSelectedSuggestionIndex(-1);
    updateAutocomplete(query);

    renderSuggestions(query);
}); 

els.DisplayTabs.addEventListener("click", async (event) => {

    const item = event.target.closest(".open-tab");
    console.log(item);

    if (!item) {

        return;
    }

    const index = Number(item.dataset.index);

    await selectSuggestion(index);
});
// ----------  Toggle Control Panel ----------
window.addEventListener('keydown', (event) => {
  if(isExactShortcut(event, {
    ctrl: true,
    shift: true,
    code: 'Slash'
  })){
    event.preventDefault();
    
    els.settingsPanel.classList.toggle('hidden');
    document.body.classList.toggle(
      'settings-panel-open',
      !els.settingsPanel.classList.contains('hidden')
    );
    
  }
  
  // ---------- Toggle Search Bar ----------
  if (isExactShortcut(event, {
    ctrl: true,
    code: 'KeyK'
  })){
    event.preventDefault();
    
    console.log('Ctrl + K');
    els.searchWrap.classList.toggle('hidden');
    
    els.searchInput.focus();
    els.searchInput.select();
    
    getOpenTabs();
  }
})


els.engineButton.addEventListener("click", (event) => {

    event.stopPropagation();

    els.engineList.classList.toggle("hidden");

});

// ---------- Init ----------
startVeil();

export { els };