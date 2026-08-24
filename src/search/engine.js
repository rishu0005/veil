// ---------- Search Engine Function ----------
import { els } from "../js/dom.js";
let searchEngines = [];
let selectedEngine = null;
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

export {loadSearchEngines, selectedEngine}