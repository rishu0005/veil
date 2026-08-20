 /**
 * Tiny promise-based IndexedDB wrapper for storing a single
 * "current wallpaper" media file (image or video).
 *
 * We use IndexedDB (not browser.storage.local) because it can store
 * Blob/File objects natively and supports much larger quotas, which
 * matters for videos up to 100MB.
 */

const DB_NAME = "newtab-wallpaper-db";
const DB_VERSION = 1;
const STORE_NAME = "media";
const RECORD_KEY = "current";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Replace whatever wallpaper is currently stored with a new file.
 * Clearing the store first is our "delete the previous wallpaper" step.
 */
async function saveMedia(file) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.clear();
    store.put({
      id: RECORD_KEY,
      file,
      type: file.type,
      name: file.name,
      savedAt: Date.now(),
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Fetch the currently stored wallpaper record, or null if none exists. */
async function getMedia() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(RECORD_KEY);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/** Remove the stored wallpaper entirely (back to empty state). */
async function clearMedia() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export { saveMedia,  getMedia, clearMedia}