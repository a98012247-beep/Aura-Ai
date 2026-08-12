const DB_NAME = 'awavox_voice_preview_cache';
const STORE_NAME = 'previews';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedPreview(voiceId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(voiceId);
      req.onsuccess = () => {
        const val = req.result;
        if (val instanceof Blob) {
          resolve(URL.createObjectURL(val));
        } else if (val instanceof ArrayBuffer) {
          const blob = new Blob([val], { type: 'audio/mpeg' });
          resolve(URL.createObjectURL(blob));
        } else if (typeof val === 'string') {
          resolve(val);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("IndexedDB read error:", err);
    return null;
  }
}

export async function saveCachedPreview(voiceId: string, audioBlob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(audioBlob, voiceId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB write error:", err);
  }
}
