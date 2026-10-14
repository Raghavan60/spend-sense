// =========================================================
// Spend Sense — Firebase Configuration + Auto Demo Mode
// =========================================================
// If API keys are placeholders → runs in DEMO MODE (localStorage)
// If API keys are filled in    → runs with real Firebase
// =========================================================

const firebaseConfig = {
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket:     "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId:             "REPLACE_WITH_YOUR_APP_ID"
};

// ── Auto-detect Demo Mode ──────────────────────────────
const IS_DEMO = firebaseConfig.apiKey.startsWith('REPLACE');

let auth, db;
let createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    doc, collection, getDoc, setDoc,
    addDoc, deleteDoc, getDocs,
    query, orderBy, onSnapshot,
    serverTimestamp;

if (IS_DEMO) {
  // ── DEMO MODE: use localStorage mock ─────────────────
  console.info('%c⚡ Spend Sense running in DEMO MODE (localStorage)', 'color:#3D8B6B;font-weight:bold');
  console.info('Add your Firebase keys to js/firebase-config.js to enable real accounts.');

  const local = await import('./local-db.js');
  auth                          = local.auth;
  db                            = local.db;
  createUserWithEmailAndPassword = local.createUserWithEmailAndPassword;
  signInWithEmailAndPassword    = local.signInWithEmailAndPassword;
  signOut                       = local.signOut;
  onAuthStateChanged            = local.onAuthStateChanged;
  sendPasswordResetEmail        = local.sendPasswordResetEmail;
  doc                           = local.doc;
  collection                    = local.collection;
  getDoc                        = local.getDoc;
  setDoc                        = local.setDoc;
  addDoc                        = local.addDoc;
  deleteDoc                     = local.deleteDoc;
  getDocs                       = local.getDocs;
  query                         = local.query;
  orderBy                       = local.orderBy;
  onSnapshot                    = local.onSnapshot;
  serverTimestamp               = local.serverTimestamp;

} else {
  // ── FIREBASE MODE: use real Firebase ──────────────────
  const { initializeApp }  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  const authMod            = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
  const fsMod              = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

  const app = initializeApp(firebaseConfig);
  auth = authMod.getAuth(app);
  db   = fsMod.getFirestore(app);

  createUserWithEmailAndPassword = authMod.createUserWithEmailAndPassword;
  signInWithEmailAndPassword    = authMod.signInWithEmailAndPassword;
  signOut                       = authMod.signOut;
  onAuthStateChanged            = authMod.onAuthStateChanged;
  sendPasswordResetEmail        = authMod.sendPasswordResetEmail;
  doc                           = fsMod.doc;
  collection                    = fsMod.collection;
  getDoc                        = fsMod.getDoc;
  setDoc                        = fsMod.setDoc;
  addDoc                        = fsMod.addDoc;
  deleteDoc                     = fsMod.deleteDoc;
  getDocs                       = fsMod.getDocs;
  query                         = fsMod.query;
  orderBy                       = fsMod.orderBy;
  onSnapshot                    = fsMod.onSnapshot;
  serverTimestamp               = fsMod.serverTimestamp;
}

export {
  auth, db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  doc, collection, getDoc, setDoc,
  addDoc, deleteDoc, getDocs,
  query, orderBy, onSnapshot,
  serverTimestamp
};
