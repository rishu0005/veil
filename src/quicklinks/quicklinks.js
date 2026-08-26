import {
    getQuickLinks,
    saveQuickLink,
    updateQuickLink,
    removeQuickLink
} from "../storage/quicklink.js";


const els = {
    overlay: document.getElementById("quickLinksOverlay"),

    listView: document.getElementById("quickLinksListView"),
    list: document.getElementById("quickLinksList"),
    count: document.getElementById("quickLinksCount"),

    form: document.getElementById("quickLinkForm"),
    formTitle: document.getElementById("quickLinkFormTitle"),

    keyword: document.getElementById("quickLinkKeyword"),
    url: document.getElementById("quickLinkUrl"),
    description: document.getElementById("quickLinkDescription"),

    message: document.getElementById("quickLinkFormMessage"),

    add: document.getElementById("addQuickLink"),
    close: document.getElementById("closeQuickLinks"),
    back: document.getElementById("backToQuickLinks"),
    cancel: document.getElementById("cancelQuickLink")
};


let editingKeyword = null;


function openQuickLinks() {
    els.overlay.classList.remove("hidden");

    showListView();
    renderQuickLinks();
}


function closeQuickLinks() {
    els.overlay.classList.add("hidden");
    resetForm();
}


function showListView() {
    els.listView.classList.remove("hidden");
    els.form.classList.add("hidden");
}


function showFormView() {
    els.listView.classList.add("hidden");
    els.form.classList.remove("hidden");

    setTimeout(() => {
        els.keyword.focus();
    }, 0);
}


function resetForm() {
    editingKeyword = null;

    els.form.reset();

    els.formTitle.textContent = "Add Quick Link";

    els.message.textContent = "";
    els.message.classList.add("hidden");
}


function showMessage(message) {
    els.message.textContent = message;
    els.message.classList.remove("hidden");
}


function openCreateForm() {
    resetForm();

    els.formTitle.textContent = "Add Quick Link";

    showFormView();
}


function openEditForm(keyword) {

    const quickLinks = getQuickLinks();
    const quickLink = quickLinks[keyword];

    if (!quickLink) {
        return;
    }

    editingKeyword = keyword;

    els.formTitle.textContent = "Edit Quick Link";

    els.keyword.value = quickLink.keyword;
    els.url.value = quickLink.url;
    els.description.value = quickLink.description || "";

    els.message.textContent = "";
    els.message.classList.add("hidden");

    showFormView();
}


function renderQuickLinks() {

    const quickLinks = getQuickLinks();
    const entries = Object.values(quickLinks);

    els.count.textContent =
        `${entries.length} ${entries.length === 1 ? "link" : "links"}`;

    els.list.innerHTML = "";


    if (entries.length === 0) {

        els.list.innerHTML = `
            <div class="quick-links-empty">
                <div class="quick-links-empty-title">
                    No quick links yet
                </div>

                <div class="quick-links-empty-text">
                    Create one to quickly access your favorite websites.
                </div>
            </div>
        `;

        return;
    }


    for (const quickLink of entries) {

        const item = document.createElement("div");

        item.className = "quick-link-item";

        item.innerHTML = `
            <div class="quick-link-icon">
                ${escapeHtml(quickLink.keyword.charAt(0).toUpperCase())}
            </div>

            <div class="quick-link-info">

                <div class="quick-link-keyword">
                    ${escapeHtml(quickLink.keyword)}
                </div>

                <div class="quick-link-url">
                    ${escapeHtml(quickLink.url)}
                </div>

                ${
                    quickLink.description
                        ? `
                            <div class="quick-link-description">
                                ${escapeHtml(quickLink.description)}
                            </div>
                        `
                        : ""
                }

            </div>

            <div class="quick-link-actions">

                <button
                    type="button"
                    class="quick-link-action edit"
                    data-action="edit"
                    title="Edit">
                    ✎
                </button>

                <button
                    type="button"
                    class="quick-link-action delete"
                    data-action="delete"
                    title="Delete">
                    ×
                </button>

            </div>
        `;


        item.querySelector('[data-action="edit"]')
            .addEventListener("click", () => {
                openEditForm(quickLink.keyword);
            });


        item.querySelector('[data-action="delete"]')
            .addEventListener("click", () => {
                handleDelete(quickLink.keyword);
            });


        els.list.appendChild(item);
    }
}


function handleDelete(keyword) {

    const quickLink = getQuickLinks()[keyword];

    if (!quickLink) {
        return;
    }


    const confirmed = confirm(
        `Remove "${quickLink.keyword}"?`
    );

    if (!confirmed) {
        return;
    }


    const result = removeQuickLink(keyword);

    if (!result.status) {
        alert(result.message);
        return;
    }

    renderQuickLinks();
}


function handleSubmit(event) {

    event.preventDefault();


    const keyword = els.keyword.value.trim();
    const url = els.url.value.trim();
    const description = els.description.value.trim();


    let result;


    if (editingKeyword) {

        result = updateQuickLink(
            editingKeyword,
            {
                keyword,
                url,
                description
            }
        );

    } else {

        result = saveQuickLink(
            keyword,
            url,
            description
        );

    }


    if (!result.status) {
        showMessage(result.message);
        return;
    }


    showListView();
    resetForm();
    renderQuickLinks();
}


function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


/* EVENTS */

els.add.addEventListener(
    "click",
    openCreateForm
);

els.close.addEventListener(
    "click",
    closeQuickLinks
);

els.back.addEventListener(
    "click",
    () => {
        resetForm();
        showListView();
    }
);

els.cancel.addEventListener(
    "click",
    () => {
        resetForm();
        showListView();
    }
);

els.form.addEventListener(
    "submit",
    handleSubmit
);

export {
    openQuickLinks,
    closeQuickLinks,
    renderQuickLinks
};