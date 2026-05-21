/**
 * IndexedDB storage utility for large binary assets (e.g. background music, sound effects)
 * to bypass the strict 5MB localStorage quota limit.
 */

const DB_NAME = "QuizVerseAudioDB";
const STORE_NAME = "audioFiles";
const DB_VERSION = 1;

function getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in the browser"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export const audioDb = {
  /**
   * Save an audio asset (e.g. data URL or Blob) in IndexedDB
   */
  async saveAudio(key: string, data: string): Promise<void> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("IndexedDB saveAudio error:", err);
      // Fallback to localStorage if IndexedDB is blocked/unavailable
      try {
        localStorage.setItem(key, data);
      } catch (localErr) {
        console.error("localStorage fallback quota exceeded:", localErr);
      }
    }
  },

  /**
   * Retrieve an audio asset from IndexedDB
   */
  async getAudio(key: string): Promise<string | null> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("IndexedDB getAudio error:", err);
      // Fallback to localStorage
      if (typeof window !== "undefined") {
        return localStorage.getItem(key);
      }
      return null;
    }
  },

  /**
   * Delete an audio asset from IndexedDB
   */
  async deleteAudio(key: string): Promise<void> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("IndexedDB deleteAudio error:", err);
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
    }
  }
};
