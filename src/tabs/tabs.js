import { els } from "../js/dom.js";
import { getSearchHistory, renderSuggestionUI} from "../search/search.js";
let selectedTabIndex = -1;
let openTabs = [];
let displayedTabs = [];
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


export function getSelectedSuggestionIndex() {
  return selectedSuggestionIndex;
}

export function setSelectedSuggestionIndex(index) {
  selectedSuggestionIndex = index;
}
export function getSelectedTabIndex() {
  return selectedTabIndex;
}

export function setSelectedTabIndex(index) {
  selectedTabIndex = index;
}

export { getOpenTabs, renderSuggestions, displayedSuggestions,  selectedSuggestionIndex,
        jumpToTab, moveTabSelection
 };