import { els } from "../veil.js";
import { getMedia} from "./storage/db.js";
import { setClockVisible} from "./bg-wallpaper/clock.js";
import { renderMedia} from "./bg-wallpaper/wallpaper.js";

let searchEngines = [];
let selectedEngine = null;

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

async function selectSuggestion(index) {

    if (index < 0 || index >= displayedSuggestions.length) {
        return;
    }

    const selected = displayedSuggestions[index];

    if (selected.type === "tab") {

        await jumpToTab(selected.data.id);

        return;
    }

    if (selected.type === "search") {

        const query = selected.data;

        els.searchInput.value = query;

        if (isUrl(query)) {
            let url = query;
            if (!/^https?:\/\//i.test(url)) {
                url = "https://" + url;
            }
            window.location.href = url;
            return;
        }
        await performSearch(query);

        return;
    }
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
                    class="open-tab no-decoration ${index === selectedSuggestionIndex ? 'selected' : ''}"
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
                class="open-tab selected"
                
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


export {startVeil, isExactShortcut, renderSuggestionUI, selectSuggestion, saveSearchQuery, isUrl, performSearch,  }