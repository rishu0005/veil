let recentTabs = [];

browser.tabs.onActivated.addListener((activeInfo) => {

    recentTabs = recentTabs.filter(id => id !== activeInfo.tabId);

    recentTabs.unshift(activeInfo.tabId);

    recentTabs = recentTabs.slice(0, 10);
});


browser.runtime.onMessage.addListener(async (message) => {

    if (message.type === "GET_RECENT_TABS") {

        const tabs = [];

        for (const tabId of recentTabs.slice(0, 4)) {

            try {
                const tab = await browser.tabs.get(tabId);

                tabs.push({
                    id: tab.id,
                    title: tab.title,
                    url: tab.url,
                    favicon: tab.favIconUrl,
                    active: tab.active
                });

            } catch (error) {
                // Tab may have been closed
            }
        }

        return tabs;
    }
});

async function initializeRecentTabs() {

    const tabs = await browser.tabs.query({
        currentWindow: true
    });

    const activeTab = tabs.find(tab => tab.active);

    if (activeTab) {
        recentTabs.unshift(activeTab.id);
    }
}

initializeRecentTabs();