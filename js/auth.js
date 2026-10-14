// =========================================================
// Spend Sense — Authentication Logic
// =========================================================

import { getFirebase } from './firebase-config.js';

// ── Utility Helpers ──────────────────────────────────────
function showAlert(el, message, type = 'error') {
  el.textContent = message;
  el.className = `alert alert--${type} visible`;
  setTimeout(() => el.classList.remove('visible'), 5000);
}

function setLoading(btn, spinner, loading) {
  btn.disabled = loading;
  spinner.classList.toggle('visible', loading);
  btn.querySelector('.btn-text').style.opacity = loading ? '0' : '1';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Auth State Guard ─────────────────────────────────────
export async function requireAuth(redirectTo = 'auth.html') {
  const { auth, onAuthStateChanged } = await getFirebase();
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        resolve(user);
      } else {
        window.location.href = redirectTo;
        reject(new Error('Not authenticated'));
      }
    });
  });
}

export async function redirectIfLoggedIn(redirectTo = 'dashboard.html') {
  const { auth, onAuthStateChanged } = await getFirebase();
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = redirectTo;
  });
}

// ── Auth Page Logic ──────────────────────────────────────
export async function initAuthPage() {
  const {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail
  } = await getFirebase();

  // Redirect if already logged in
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = 'dashboard.html';
  });

  const tabLogin      = document.getElementById('tab-login');
  const tabSignup     = document.getElementById('tab-signup');
  const sectionLogin  = document.getElementById('section-login');
  const sectionSignup = document.getElementById('section-signup');
  const forgotPanel   = document.getElementById('forgot-panel');

  tabLogin.addEventListener('click',  () => switchTab('login'));
  tabSignup.addEventListener('click', () => switchTab('signup'));

  function switchTab(tab) {
    tabLogin.classList.toggle('active',   tab === 'login');
    tabSignup.classList.toggle('active',  tab === 'signup');
    sectionLogin.classList.toggle('active',  tab === 'login');
    sectionSignup.classList.toggle('active', tab === 'signup');
    forgotPanel.classList.remove('visible');
  }

  // ── Login ──────────────────────────────────────────────
  const loginForm    = document.getElementById('login-form');
  const loginAlert   = document.getElementById('login-alert');
  const loginBtn     = document.getElementById('login-btn');
  const loginSpinner = document.getElementById('login-spinner');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!validateEmail(email)) { showAlert(loginAlert, 'Please enter a valid email address.'); return; }
    if (password.length < 6)   { showAlert(loginAlert, 'Password must be at least 6 characters.'); return; }

    setLoading(loginBtn, loginSpinner, true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = 'dashboard.html';
    } catch (err) {
      setLoading(loginBtn, loginSpinner, false);
      showAlert(loginAlert, friendlyError(err.code));
    }
  });

  // ── Sign Up ────────────────────────────────────────────
  const signupForm    = document.getElementById('signup-form');
  const signupAlert   = document.getElementById('signup-alert');
  const signupBtn     = document.getElementById('signup-btn');
  const signupSpinner = document.getElementById('signup-spinner');

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm  = document.getElementById('signup-confirm').value;

    if (!validateEmail(email)) { showAlert(signupAlert, 'Please enter a valid email address.'); return; }
    if (password.length < 6)   { showAlert(signupAlert, 'Password must be at least 6 characters.'); return; }
    if (password !== confirm)   { showAlert(signupAlert, 'Passwords do not match.'); return; }

    setLoading(signupBtn, signupSpinner, true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      window.location.href = 'dashboard.html';
    } catch (err) {
      setLoading(signupBtn, signupSpinner, false);
      showAlert(signupAlert, friendlyError(err.code));
    }
  });

  // ── Forgot Password ────────────────────────────────────
  const forgotLink    = document.getElementById('forgot-link');
  const forgotBack    = document.getElementById('forgot-back');
  const forgotForm    = document.getElementById('forgot-form');
  const forgotAlert   = document.getElementById('forgot-alert');
  const forgotBtn     = document.getElementById('forgot-btn');
  const forgotSpinner = document.getElementById('forgot-spinner');

  forgotLink.addEventListener('click', () => {
    sectionLogin.classList.remove('active');
    forgotPanel.classList.add('visible');
  });
  forgotBack.addEventListener('click', () => {
    forgotPanel.classList.remove('visible');
    sectionLogin.classList.add('active');
  });

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    if (!validateEmail(email)) { showAlert(forgotAlert, 'Please enter a valid email address.'); return; }
    setLoading(forgotBtn, forgotSpinner, true);
    try {
      await sendPasswordResetEmail(auth, email);
      showAlert(forgotAlert, 'Reset email sent! Check your inbox.', 'success');
    } catch (err) {
      showAlert(forgotAlert, friendlyError(err.code));
    } finally {
      setLoading(forgotBtn, forgotSpinner, false);
    }
  });

  // ── Password Visibility Toggles ────────────────────────
  document.querySelectorAll('.input-group__toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input  = btn.closest('.input-group').querySelector('input');
      const isText = input.type === 'text';
      input.type   = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁️' : '🙈';
    });
  });
}

// ── Sign Out ─────────────────────────────────────────────
export async function signOutUser() {
  const { auth, signOut } = await getFirebase();
  await signOut(auth);
  window.location.href = 'index.html';
}

export async function getCurrentUser() {
  const { auth } = await getFirebase();
  return auth.currentUser;
}

// ── Friendly Error Messages ───────────────────────────────
function friendlyError(code) {
  const map = {
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/email-already-in-use':   'An account already exists with this email.',
    'auth/weak-password':          'Password should be at least 6 characters.',
    'auth/invalid-email':          'Invalid email address.',
    'auth/too-many-requests':      'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-credential':     'Incorrect email or password.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
