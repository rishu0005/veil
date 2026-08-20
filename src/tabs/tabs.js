
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
