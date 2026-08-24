
// ---------- Search Function ----------
import { els } from "../js/dom.js";
import { isUrl } from "../utils/url.js";
import { displayedSuggestions, selectedSuggestionIndex, jumpToTab, getSelectedSuggestionIndex  } from "../tabs/tabs.js";
import {selectedEngine} from './engine.js';
const MAX_SEARCH_HISTORY = 50;
function updateAutocomplete(query) {

    const suggestion = getAutocompleteSuggestion(query);

    if (!suggestion) {
        els.autocomplete.textContent = '';
        return;
    }

    const remaining = suggestion.slice(query.length);

    els.autocomplete.textContent = query + remaining;
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

function renderSuggestionUI(query){

        let html = '';
        displayedSuggestions.forEach((item, index) => {

        if (item.type === 'tab') {

            const tab = item.data;
            html += `
                <div
                    class="open-tab no-decoration ${index === getSelectedSuggestionIndex() ? 'selected' : ''}"
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
                    class="open-tab ${index === getSelectedSuggestionIndex() ? 'selected' : ''}"
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

export { updateAutocomplete, saveSearchQuery, getSearchHistory, 
        renderSuggestionUI, performSearch, getAutocompleteSuggestion, selectSuggestion}