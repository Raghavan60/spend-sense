// =========================================================
// Spend Sense — Firebase Configuration + Auto Demo Mode
// =========================================================
// No top-level await — safe for GitHub Pages and all browsers
// =========================================================

const firebaseConfig = {
  apiKey:            "AIzaSyCwyw6-9LHEPUvRrgU13I62B2pHnzNqyVA",
  authDomain:        "spend-sense-242ca.firebaseapp.com",
  projectId:         "spend-sense-242ca",
  storageBucket:     "spend-sense-242ca.firebasestorage.app",
  messagingSenderId: "795239602578",
  appId:             "1:795239602578:web:4996347dd219046d56094b"
};

const IS_DEMO = firebaseConfig.apiKey.startsWith('REPLACE');

// Cached promise — only loads once
let _promise = null;

export function getFirebase() {
  if (_promise) return _promise;
  _promise = IS_DEMO ? _loadDemo() : _loadFirebase();
  return _promise;
}

async function _loadDemo() {
  console.info('%c⚡ Spend Sense — DEMO MODE (localStorage)', 'color:#3D8B6B;font-weight:bold');
  const m = await import('./local-db.js');
  return {
    auth: m.auth, db: m.db,
    createUserWithEmailAndPassword:  m.createUserWithEmailAndPassword,
    signInWithEmailAndPassword:      m.signInWithEmailAndPassword,
    signOut:                         m.signOut,
    onAuthStateChanged:              m.onAuthStateChanged,
    sendPasswordResetEmail:          m.sendPasswordResetEmail,
    doc: m.doc, collection: m.collection,
    getDoc: m.getDoc, setDoc: m.setDoc,
    addDoc: m.addDoc, deleteDoc: m.deleteDoc, getDocs: m.getDocs,
    query: m.query, orderBy: m.orderBy,
    onSnapshot: m.onSnapshot, serverTimestamp: m.serverTimestamp,
  };
}

async function _loadFirebase() {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  const a = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
  const f = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
  const app = initializeApp(firebaseConfig);
  return {
    auth: a.getAuth(app), db: f.getFirestore(app),
    createUserWithEmailAndPassword:  a.createUserWithEmailAndPassword,
    signInWithEmailAndPassword:      a.signInWithEmailAndPassword,
    signOut:                         a.signOut,
    onAuthStateChanged:              a.onAuthStateChanged,
    sendPasswordResetEmail:          a.sendPasswordResetEmail,
    doc: f.doc, collection: f.collection,
    getDoc: f.getDoc, setDoc: f.setDoc,
    addDoc: f.addDoc, deleteDoc: f.deleteDoc, getDocs: f.getDocs,
    query: f.query, orderBy: f.orderBy,
    onSnapshot: f.onSnapshot, serverTimestamp: f.serverTimestamp,
  };
}
