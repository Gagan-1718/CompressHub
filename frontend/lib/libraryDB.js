// Per-device library stored in the browser (IndexedDB). This makes the library
// persistent and private to each device, and immune to the backend's ephemeral
// disk. Items hold a small thumbnail (for the grid) and the full image (for
// download), plus metadata.

const DB_NAME = 'compresshub'
const STORE = 'library'
const VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('kind', 'kind')
        store.createIndex('createdAt', 'createdAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function addLibraryItem(item) {
  const db = await openDB()
  const record = {
    id: item.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
    createdAt: Date.now(),
    ...item,
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(record)
    tx.oncomplete = () => resolve(record)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getLibraryItems() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.createdAt - a.createdAt))
    req.onerror = () => reject(req.error)
  })
}

export async function deleteLibraryItem(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Shrink a data URL to a small JPEG thumbnail for the library grid. */
export function makeThumbnail(dataUrl, maxPx = 320) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => resolve(dataUrl) // fall back to the original
    img.src = dataUrl
  })
}

/** Trigger a browser download of a data URL. */
export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
