import {
    getAllNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote
} from "../storage/notes.js";

import {els} from "../js/dom.js";
 


function closeNotes() {
    els.overlay.classList.add("hidden");
}

els.close.addEventListener("click", closeNotes);


function renderNotes(notes = getAllNotes()) {

    els.list.innerHTML = "";

    els.count.textContent =
        `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;

    if (notes.length === 0) {
        els.list.innerHTML = `
            <div class="notes-empty">
                No notes found.
            </div>
        `;
        return;
    }

    notes.forEach(note => {

        const item = document.createElement("div");

        item.className = "note-item";

        item.innerHTML = `
            <div class="note-item-title">
                ${note.title}
            </div>

            <div class="note-item-description">
                ${note.description}
            </div>
        `;

        item.addEventListener("click", () => {
            showNote(note.id);
        });

        els.list.appendChild(item);
    });
}

function searchNotes(query) {

    const notes = getAllNotes();

    query = query.trim().toLowerCase();

    if (!query) {
        renderNotes(notes);
        return;
    }

    const filteredNotes = notes.filter(note => {

        return (
            note.title.toLowerCase().includes(query) ||
            note.description.toLowerCase().includes(query)
        );

    });

    renderNotes(filteredNotes);
}

function showListView() {

    els.listView.classList.remove("hidden");
    els.view.classList.add("hidden");
    els.form.classList.add("hidden");
}

function showView() {

    els.listView.classList.add("hidden");
    els.view.classList.remove("hidden");
    els.form.classList.add("hidden");
}

function showForm() {

    els.listView.classList.add("hidden");
    els.view.classList.add("hidden");
    els.form.classList.remove("hidden");
}

els.backToNotes.addEventListener("click", showListView);
els.backFromForm.addEventListener("click", showListView);
els.cancel.addEventListener("click", showListView);

function showNote(id) {

    const result = getNote(id);

    if (!result.status) {
        console.error(result.message);
        return;
    }

    const note = result.note;

    els.viewTitle.textContent = note.title;
    els.viewDescription.textContent = note.description;

    els.view.dataset.noteId = note.id;

    showView();
}

function openNotes() {
    els.overlay.classList.remove("hidden");

    els.search.value = "";

    showListView();
    renderNotes();
    els.search.focus();
}

function openNewNoteForm() {

    els.form.reset();

    els.formTitle.textContent = "New Note";
    els.save.textContent = "Save Note";

    delete els.form.dataset.noteId;

    els.message.textContent = "";
    els.message.classList.add("hidden");
    els.message.classList.remove("success", "error");

    showForm();

    els.title.focus();
}

els.add.addEventListener("click", openNewNoteForm);

els.form.addEventListener("submit", (event) => {

    event.preventDefault();

    const title = els.title.value;
    const description = els.description.value;

    const noteId = els.form.dataset.noteId;

    let result;

    if (noteId) {

        result = updateNote(
            noteId,
            title,
            description
        );

    } else {

        result = createNote(
            title,
            description
        );

    }

    if (!result.status) {
        showFormMessage(result.message, false);
        return;
    }

    renderNotes();
    showListView();
});

els.search.addEventListener("input", () => {
    searchNotes(els.search.value);
});

function showFormMessage(message, success) {
    els.message.textContent = message;

    els.message.classList.remove(
        "hidden",
        "success",
        "error"
    );

    els.message.classList.add(
        success ? "success" : "error"
    );
}

function openEditNote() {

    const id = els.view.dataset.noteId;

    if (!id) {
        console.error("No note selected.");
        return;
    }

    const result = getNote(id);

    if (!result.status) {
        console.error(result.message);
        return;
    }

    const note = result.note;

    // Populate form
    els.title.value = note.title;
    els.description.value = note.description;

    // Change form appearance
    els.formTitle.textContent = "Edit Note";
    els.save.textContent = "Update Note";

    // Remember which note we're editing
    els.form.dataset.noteId = note.id;

    // Clear previous message
    els.message.textContent = "";
    els.message.classList.add("hidden");
    els.message.classList.remove("success", "error");

    showForm();

    els.title.focus();
}

function deleteSelectedNote() {

    const id = els.view.dataset.noteId;

    if (!id) {
        console.error("No note selected.");
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
        return;
    }

    const result = deleteNote(id);

    if (!result.status) {
        console.error(result.message);
        return;
    }

    renderNotes();
    showListView();
}

els.delete.addEventListener("click", deleteSelectedNote);

els.edit.addEventListener("click", openEditNote);

export {
    openNotes,
    closeNotes
};