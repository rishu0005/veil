let searchEngines = [];
let selectedEngine = null;
// ----------  Rendering Functions ----------

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

function renderClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  els.clockTime.textContent = `${hh}:${mm}`;
  els.clockDate.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

let clockInterval = null;
function setClockVisible(visible) {
  els.clockWrap.classList.toggle("hidden", !visible);
  if (visible) {
    renderClock();
    if (!clockInterval) clockInterval = setInterval(renderClock, 1000 * 15);
  } else if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}

// ---------- Status messages ----------

function showStatus(message, kind) {
  els.uploadStatus.textContent = message;
  els.uploadStatus.className = `status ${kind}`;
  els.uploadStatus.classList.remove("hidden");
}

function hideStatus() {
  els.uploadStatus.classList.add("hidden");
} 

// ---------- Tab Functions ----------
let selectedTabIndex = -1;
let openTabs = [];
let displayedTabs = [];
let searchHistoryResults = [];
let displayedSuggestions = [];
let selectedSuggestionIndex = -1;

async function getOpenTabs() {
    try {
        const tabs = await browser.tabs.query({});

         if (tabs.length === 0) {
            openTabs = [];
            displayedTabs = [];
            els.DisplayTabs.innerHTML = '';
            console.log("No tabs found.");
            return;
        }

        const activeTab = tabs.find(tab => tab.active);
       
        openTabs = tabs
                  .filter(tab => tab.id !== activeTab?.id)
                  .sort(() => Math.random() - 0.5);
                  // .slice(0, 4);

          selectedTabIndex = -1;

       renderSuggestions(
            els.searchInput.value.trim()
        );

    } catch (error) {
        console.error("Error getting tabs:", error);
    }
}

async function jumpToTab(targetTabId) {
  try {
    let tab = await browser.tabs.get(targetTabId);
    await browser.tabs.update(targetTabId, { active: true });

    await browser.windows.update(tab.windowId, { focused: true });
  } catch (error) {
    console.error("Failed to jump to tab:", error);
  }
}


function updateSelectedTab() {
    const tabs = els.DisplayTabs.querySelectorAll('.open-tab');

    tabs.forEach((tab, index) => {
        tab.classList.toggle(
            'selected',
            index === selectedTabIndex
        );
    });
}

function moveTabSelection(direction) {

    const tabs = els.DisplayTabs.querySelectorAll('.open-tab');

    if (tabs.length === 0) {
        return;
    }

    // Move down
    if (direction === 'down') {
        selectedTabIndex++;
        // Loop back to first tab
        if (selectedTabIndex >= tabs.length) {
            selectedTabIndex = 0;
        }
    }

    // Move up
    if (direction === 'up') {
        selectedTabIndex--;
        // Loop to last tab
        if (selectedTabIndex < 0) {
            selectedTabIndex = tabs.length - 1;
        }
    }
    updateSelectedTab();
}

// ---------- Keyboard Control Functions  ----------

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



// ---------- Search Function ----------
function isUrl(query) {

    query = query.trim();

    // Already has a protocol
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(query)) {
        return true;
    }

    // localhost
    if (/^localhost(?::\d+)?(?:\/.*)?$/i.test(query)) {
        return true;
    }

    // IPv4 address
    if (
        /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/.*)?$/.test(query)
    ) {
        return true;
    }

    // Domain name
    if (
        /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/.*)?$/i.test(query)
    ) {
        return true;
    }

    return false;
}

function getSearchHistory() {
    return JSON.parse(
        localStorage.getItem('veil-search-history') || '[]'
    );
}

function saveSearchQuery(query) {

    query = query.trim();

    if (!query) {
        return;
    }

    let history = getSearchHistory();

    // Remove duplicate
    history = history.filter(
        item => item.toLowerCase() !== query.toLowerCase()
    );

    // Put newest search at the beginning
    history.unshift(query);

    // Keep only latest 50
    history = history.slice(0, MAX_SEARCH_HISTORY);

    localStorage.setItem(
        'veil-search-history',
        JSON.stringify(history)
    );
}


async function renderSuggestions(query = '') {
    const MAX_SUGGESTIONS = 5;


    // 1. Filter open tabs
    const normalizedQuery = query.toLowerCase().trim();

    const filteredTabs = openTabs.filter(tab => {

        const title = (tab.title || '').toLowerCase();
        const url = (tab.url || '').toLowerCase();

        return (
            title.includes(normalizedQuery) ||
            url.includes(normalizedQuery)
        );
    })
    .slice(0, 3);

    // 2. Filter Veil search history
    const history = getSearchHistory();

    const filteredHistory = history
        .filter(item =>
            item.toLowerCase().includes(normalizedQuery)
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

    displayedSuggestions = [
        ...filteredTabs.map( tab => ({
            type: 'tab',
            data: tab,
        })),

        ...filteredHistory.map( search => ({
            type: 'search',
            data: search
        }))
    ].slice(0, MAX_SUGGESTIONS);

        selectedSuggestionIndex = -1;
        renderSuggestionUI(normalizedQuery);
}
function escapeHtml(value) {

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
async function performSearch(query) {

    if (!selectedEngine) {
        console.error("No search engine selected");
        return;
    }

    console.log("Searching with:", selectedEngine.name);

    await browser.search.search({
        query: query,
        engine: selectedEngine.name,
        disposition: "CURRENT_TAB"
    });
}

function getAutocompleteSuggestion(query) {

    if (!query) {
        return '';
    }

    const history = getSearchHistory();

    const normalizedQuery = query.toLowerCase();

    const match = history.find(item =>
        item.toLowerCase().startsWith(normalizedQuery)
    );

    return match || '';
}

function updateAutocomplete(query) {

    const suggestion = getAutocompleteSuggestion(query);

    if (!suggestion) {
        els.autocomplete.textContent = '';
        return;
    }

    const remaining = suggestion.slice(query.length);

    els.autocomplete.textContent = query + remaining;
}

function renderSuggestionUI(query){

        let html = '';
        displayedSuggestions.forEach((item, index) => {

        if (item.type === 'tab') {

            const tab = item.data;
            html += `
                <div
                    class="open-tab ${index === selectedSuggestionIndex ? 'selected' : ''}"
                    data-index="${index}"
                >
                    <div class="tab-favicon">
                        <img
                            src="${tab.favIconUrl || ''}"
                            alt=""
                        >
                    </div>

                    <div class="tab-info">
                        <div class="tab-title">
                            ${escapeHtml(tab.title || 'Untitled')}
                        </div>

                        <div class="tab-url">
                            ${escapeHtml(tab.url || '')}
                        </div>
                    </div>
                    <div class="tab-action">
                        ↵
                    </div>
                </div>
            `;

        } else {

            html += `
                <div
                    class="open-tab ${index === selectedSuggestionIndex ? 'selected' : ''}"
                    data-index="${index}"
                >
                    <div class="tab-favicon">
                        ⌕
                    </div>

                    <div class="tab-info">
                        <div class="tab-title">
                            ${escapeHtml(item.data)}
                        </div>
                    </div>
                        <div class="tab-action">
                              ↵
                        </div>
                </div>
            `;
        }
    });


    if(displayedSuggestions.length === 0){
        html +=  `<div
                class="open-tab"
                
            >
                <div class="tab-favicon">
                     ⌕
                </div>

                <div class="tab-info">
                    <div class="tab-title">
                        ${escapeHtml(query) || 'Untitled'}
                    </div>
                </div>
                <div class="tab-action">
                    ↵
                </div>
            </div>
        `;
    }

    els.DisplayTabs.innerHTML = html;
}

// ---------- Search Engine Function ----------

async function loadSearchEngines() {

    try {

        searchEngines = await browser.search.get();

        if (!searchEngines.length) {
            console.error("No search engines available.");
            return;
        }

        const saved = await browser.storage.local.get("searchEngine");

        if (saved.searchEngine) {

            selectedEngine = searchEngines.find(
                engine => engine.name === saved.searchEngine
            );

        }

        // Saved engine no longer exists
        if (!selectedEngine) {

            selectedEngine =
                searchEngines.find(
                    engine => engine.isDefault
                ) || searchEngines[0];

        }

        renderSelectedEngine();
        renderSearchEngines();

        console.log("Selected engine:", selectedEngine);

    } catch (error) {

        console.error(
            "Failed to load search engines:",
            error
        );

    }
}
function renderSelectedEngine() {

    if (!selectedEngine) {
        return;
    }

    const icon = document.getElementById("search-engine-icon");
    const name = document.getElementById("search-engine-name");

    // name.textContent = selectedEngine.name;

    if (selectedEngine.favIconUrl) {
        icon.src = selectedEngine.favIconUrl;
    }
}
function renderSearchEngines() {

    els.engineList.innerHTML = "";

    searchEngines.forEach(engine => {

        const button = document.createElement("button");

        button.className = "search-engine-option";

        button.innerHTML = `
            <img class="favicon"
                src="${engine.favIconUrl || ""}"
                alt=""
            >

            <span class="text-light">${engine.name}</span>
            
        `;

        button.addEventListener("click", () => {
            selectSearchEngine(engine);
        });

        els.engineList.appendChild(button);
    });
}
async function selectSearchEngine(engine) {

    selectedEngine = engine;

    await browser.storage.local.set({
        searchEngine: engine.name
    });

    renderSelectedEngine();

    els.engineList.classList.add("hidden");
}

// ---------- Start Function ----------
async function startVeil() {
    await loadSearchEngines();
    await init();
}