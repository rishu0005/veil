import { CONSTANTS } from "../constants/constants.js";
import { STORAGE_KEYS } from "../constants/storageKeys.js";
import { capitalizeFirstLetter } from "../js/helper.js";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getNotes() {
    const raw = localStorage.getItem(STORAGE_KEYS.notes) || "{}";

    let parsed;

    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        console.error("Corrupted Notes data, resetting.", err);
        return {};
    }

    return parsed;
}


function generateNoteId() {
    return crypto.randomUUID();
}


/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/

function createNote(title, description) {

    title = capitalizeFirstLetter((title || "").trim());
    description = (description || "").trim();

    if (!title || !description) {
        return {
            status: false,
            message: "Title and description are required."
        };
    }

    const notes = getNotes();

    if (Object.keys(notes).length >= CONSTANTS.max_notes) {
        return {
            status: false,
            message: `Limit of ${CONSTANTS.max_notes} notes reached. Remove one first.`
        };
    }

    const id = generateNoteId();
    const now = Date.now();

    notes[id] = {
        id,
        title,
        description,
        createdAt: now,
        updatedAt: now
    };

    localStorage.setItem(
        STORAGE_KEYS.notes,
        JSON.stringify(notes)
    );

    return {
        status: true,
        message: "Note created successfully.",
        note: notes[id]
    };
}


/*
|--------------------------------------------------------------------------
| READ - ALL
|--------------------------------------------------------------------------
*/

function getAllNotes() {

    const notes = getNotes();

    return Object.values(notes);
}


/*
|--------------------------------------------------------------------------
| READ - SINGLE
|--------------------------------------------------------------------------
*/

function getNote(id) {

    const notes = getNotes();

    if (!notes[id]) {
        return {
            status: false,
            message: "Note not found."
        };
    }

    return {
        status: true,
        note: notes[id]
    };
}


/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/

function updateNote(id, title, description) {

    title = capitalizeFirstLetter((title || "").trim());
    description = (description || "").trim();

    if (!title || !description) {
        return {
            status: false,
            message: "Title and description are required."
        };
    }

    const notes = getNotes();

    if (!notes[id]) {
        return {
            status: false,
            message: "Note not found."
        };
    }

    notes[id] = {
        ...notes[id],
        title,
        description,
        updatedAt: Date.now()
    };

    localStorage.setItem(
        STORAGE_KEYS.notes,
        JSON.stringify(notes)
    );

    return {
        status: true,
        message: "Note updated successfully.",
        note: notes[id]
    };
}


/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

function deleteNote(id) {

    const notes = getNotes();

    if (!notes[id]) {
        return {
            status: false,
            message: "Note not found."
        };
    }

    delete notes[id];

    localStorage.setItem(
        STORAGE_KEYS.notes,
        JSON.stringify(notes)
    );

    return {
        status: true,
        message: "Note deleted successfully."
    };
}


export {
    getNotes,
    getAllNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote
};