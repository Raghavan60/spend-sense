// =========================================================
// Spend Sense — Local Storage Firebase Mock (Demo Mode)
// Works 100% offline — no Firebase needed for testing
// =========================================================

// ── Internal Event Bus ─────────────────────────────────
const _bus = {};
function _emit(event, data) {
  (_bus[event] || []).forEach(fn => fn(data));
}
function _on(event, fn) {
  if (!_bus[event]) _bus[event] = [];
  _bus[event].push(fn);
  return () => { _bus[event] = _bus[event].filter(f => f !== fn); };
}

// ── LocalStorage Helpers ───────────────────────────────
function _get(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function _set(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
  _emit('change:' + key, val);
}
function _del(key) {
  localStorage.removeItem(key);
  _emit('change:' + key, null);
}
function _pathKey(...segs) {
  return 'ss_fs_' + segs.join('/');
}

// ── Mock Auth ──────────────────────────────────────────
export const auth = {
  currentUser: null,
  _stateListeners: []
};

// Restore session on load
const _saved = _get('ss_session');
if (_saved) auth.currentUser = _saved;

function _notifyAuth(user) {
  auth.currentUser = user;
  auth._stateListeners.forEach(fn => fn(user));
}

export function createUserWithEmailAndPassword(authObj, email, password) {
  return new Promise((resolve, reject) => {
    const users = _get('ss_users') || {};
    if (users[email]) { reject({ code: 'auth/email-already-in-use' }); return; }
    const uid = 'uid_' + Math.random().toString(36).slice(2, 10);
    users[email] = { password, uid };
    _set('ss_users', users);
    const user = { uid, email };
    _set('ss_session', user);
    _notifyAuth(user);
    resolve({ user });
  });
}

export function signInWithEmailAndPassword(authObj, email, password) {
  return new Promise((resolve, reject) => {
    const users = _get('ss_users') || {};
    const u = users[email];
    if (!u)               { reject({ code: 'auth/user-not-found' });      return; }
    if (u.password !== password) { reject({ code: 'auth/invalid-credential' }); return; }
    const user = { uid: u.uid, email };
    _set('ss_session', user);
    _notifyAuth(user);
    resolve({ user });
  });
}

export function signOut(authObj) {
  return new Promise(resolve => {
    _del('ss_session');
    _notifyAuth(null);
    resolve();
  });
}

export function onAuthStateChanged(authObj, callback) {
  authObj._stateListeners.push(callback);
  setTimeout(() => callback(authObj.currentUser), 0);
  return () => {
    authObj._stateListeners = authObj._stateListeners.filter(f => f !== callback);
  };
}

export function sendPasswordResetEmail(authObj, email) {
  return new Promise((resolve, reject) => {
    const users = _get('ss_users') || {};
    // In demo mode simulate success always (can't send real email)
    resolve();
  });
}

// ── Mock Firestore ─────────────────────────────────────
export const db = { _type: 'firestore' };

export function doc(dbObj, ...segs) {
  return { _type: 'doc', _path: segs };
}

export function collection(dbObj, ...segs) {
  return { _type: 'collection', _path: segs };
}

export function query(collRef, ...constraints) {
  return { _type: 'query', _colRef: collRef, _constraints: constraints };
}

export function orderBy(field, dir = 'asc') {
  return { _type: 'orderBy', field, dir };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export function getDoc(ref) {
  return new Promise(resolve => {
    const data = _get(_pathKey(...ref._path));
    resolve({
      exists: () => data !== null && data !== undefined,
      data:   () => data,
      id:     ref._path[ref._path.length - 1]
    });
  });
}

export function setDoc(ref, data) {
  return new Promise(resolve => {
    _set(_pathKey(...ref._path), data);
    resolve();
  });
}

export function addDoc(collRef, data) {
  return new Promise(resolve => {
    const id  = 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const colKey = _pathKey(...collRef._path);
    const ids = [id, ...(_get(colKey + '/__ids__') || [])]; // newest first
    _set(colKey + '/__ids__', ids);
    _set(_pathKey(...collRef._path, id), { ...data, id });
    _emit('col:' + colKey, null);
    resolve({ id });
  });
}

export function deleteDoc(ref) {
  return new Promise(resolve => {
    const key    = _pathKey(...ref._path);
    const id     = ref._path[ref._path.length - 1];
    const parent = ref._path.slice(0, -1);
    const colKey = _pathKey(...parent);
    _del(key);
    const ids = (_get(colKey + '/__ids__') || []).filter(i => i !== id);
    _set(colKey + '/__ids__', ids);
    _emit('col:' + colKey, null);
    resolve();
  });
}

export function getDocs(queryObj) {
  return new Promise(resolve => {
    const colRef = queryObj._colRef || queryObj;
    const colKey = _pathKey(...colRef._path);
    const ids    = _get(colKey + '/__ids__') || [];
    const docs   = ids
      .map(id => {
        const data = _get(_pathKey(...colRef._path, id));
        return data ? { id, data: () => data, exists: () => true } : null;
      })
      .filter(Boolean);
    resolve({ docs });
  });
}

export function onSnapshot(queryObj, callback) {
  const colRef = queryObj._colRef || queryObj;
  const colKey = _pathKey(...colRef._path);

  function refresh() {
    const ids  = _get(colKey + '/__ids__') || [];
    const docs = ids
      .map(id => {
        const data = _get(_pathKey(...colRef._path, id));
        return data ? { id, data: () => data, exists: () => true } : null;
      })
      .filter(Boolean);
    callback({ docs });
  }

  setTimeout(refresh, 0);
  return _on('col:' + colKey, refresh);
}
