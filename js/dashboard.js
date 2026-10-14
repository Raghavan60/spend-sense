// =========================================================
// Spend Sense — Dashboard Logic
// =========================================================

import { auth, db } from './firebase-config.js';
import { requireAuth, signOutUser } from './auth.js';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── State ────────────────────────────────────────────────
let currentUser  = null;
let userProfile  = null;
let expenses     = [];
let unsubExpenses = null;

// ── Category Config ───────────────────────────────────────
const CATEGORIES = {
  food:    { label: 'Food',    icon: '🍔', color: '#3D8B6B' },
  transit: { label: 'Transit', icon: '🚌', color: '#5B8FC4' },
  fun:     { label: 'Fun',     icon: '🎉', color: '#E8934A' }
};

// ── Init ─────────────────────────────────────────────────
export async function initDashboard() {
  currentUser = await requireAuth();
  setupNav();
  await loadProfile();
  subscribeExpenses();
  setupLogForm();
  setupSetupBanner();
  document.querySelector('.dashboard-page').classList.add('visible');
}

// ── Nav & User Dropdown ───────────────────────────────────
function setupNav() {
  const avatarEl = document.getElementById('user-avatar');
  const dropdown = document.getElementById('user-dropdown');
  const emailEl  = document.getElementById('nav-user-email');
  const signoutBtn = document.getElementById('nav-signout');
  const profileLink = document.getElementById('nav-profile');

  emailEl.textContent = currentUser.email;
  avatarEl.textContent = currentUser.email[0].toUpperCase();

  avatarEl.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));

  signoutBtn.addEventListener('click', signOutUser);

  if (profileLink) {
    profileLink.addEventListener('click', () => {
      window.location.href = 'profile.html';
    });
  }
}

// ── Profile Load ──────────────────────────────────────────
async function loadProfile() {
  const ref = doc(db, 'users', currentUser.uid, 'profile', 'data');
  const snap = await getDoc(ref);

  if (snap.exists()) {
    userProfile = snap.data();
    hideBanner();
    updateBudgetUI();
  } else {
    userProfile = null;
    showBanner();
  }
}

// ── Setup Banner ──────────────────────────────────────────
function setupSetupBanner() {
  const banner = document.getElementById('setup-banner');
  const input  = document.getElementById('allowance-input');
  const btn    = document.getElementById('allowance-save-btn');

  btn.addEventListener('click', async () => {
    const amount = parseFloat(input.value);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      input.focus();
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Saving…';
    await saveAllowance(amount);
    btn.disabled = false;
    btn.textContent = 'Save';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn.click();
  });
}

async function saveAllowance(amount) {
  const now = new Date();
  userProfile = {
    allowance: amount,
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    createdAt: serverTimestamp()
  };
  const ref = doc(db, 'users', currentUser.uid, 'profile', 'data');
  await setDoc(ref, userProfile);
  hideBanner();
  updateBudgetUI();
  showToast('Allowance saved! 🎉', 'success');
}

function showBanner() {
  document.getElementById('setup-banner').classList.add('visible');
}

function hideBanner() {
  document.getElementById('setup-banner').classList.remove('visible');
}

// ── Expenses Subscription ────────────────────────────────
function subscribeExpenses() {
  if (unsubExpenses) unsubExpenses();

  const colRef = collection(db, 'users', currentUser.uid, 'expenses');
  const q = query(colRef, orderBy('timestamp', 'desc'));

  unsubExpenses = onSnapshot(q, (snapshot) => {
    expenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderExpenses();
    updateBudgetUI();
  });
}

// ── Log Expense Form ──────────────────────────────────────
function setupLogForm() {
  const form       = document.getElementById('log-form');
  const amountInput = document.getElementById('expense-amount');
  const noteInput  = document.getElementById('expense-note');
  const catBtns    = document.querySelectorAll('.category-btn');
  let selectedCat  = 'food';

  // Default select food
  document.querySelector('[data-cat="food"]').classList.add('selected');

  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCat = btn.dataset.cat;
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!userProfile) {
      showToast('Set your monthly allowance first!', 'error');
      document.getElementById('allowance-input').focus();
      showBanner();
      return;
    }

    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount', 'error');
      amountInput.focus();
      return;
    }

    const submitBtn = document.getElementById('log-expense-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging…';

    try {
      const now = new Date();
      await addDoc(collection(db, 'users', currentUser.uid, 'expenses'), {
        amount,
        category: selectedCat,
        note: noteInput.value.trim() || CATEGORIES[selectedCat].label,
        date: now.toISOString().split('T')[0],
        timestamp: serverTimestamp()
      });
      amountInput.value = '';
      noteInput.value = '';
      showToast('Expense logged! ✓', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to log expense', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log Expense';
    }
  });
}

// ── Delete Expense ────────────────────────────────────────
async function deleteExpense(id) {
  try {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'expenses', id));
    showToast('Expense removed', 'success');
  } catch (err) {
    showToast('Failed to remove expense', 'error');
  }
}

// ── UI Rendering ──────────────────────────────────────────
function updateBudgetUI() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filter to current month only
  const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(currentMonth));

  // Totals
  const totalAllowance = userProfile?.allowance ?? 0;
  const totalSpent = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const remaining = Math.max(0, totalAllowance - totalSpent);

  // Days left
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, lastDayOfMonth - now.getDate() + 1);
  const safeToSpend = daysLeft > 0 ? remaining / daysLeft : 0;

  // Budget stats
  setEl('budget-total', formatCurrency(totalAllowance));
  setEl('budget-spent', formatCurrency(totalSpent));
  setEl('budget-remaining', formatCurrency(remaining));
  setEl('safe-spend-amount', formatCurrency(safeToSpend));
  setEl('safe-spend-days', `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in month`);

  // Month label
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  setEl('budget-month', `${monthNames[now.getMonth()]} ${now.getFullYear()}`);

  // Progress bar
  const pct = totalAllowance > 0 ? Math.min(100, (totalSpent / totalAllowance) * 100) : 0;
  const progressFill = document.getElementById('budget-progress-fill');
  if (progressFill) {
    progressFill.style.width = `${pct}%`;
    progressFill.className = 'progress-fill';
    if (pct >= 90) progressFill.classList.add('progress-fill--danger');
    else if (pct >= 70) progressFill.classList.add('progress-fill--warning');
  }
  setEl('budget-pct', `${Math.round(pct)}% used`);

  // Category breakdown
  const cats = { food: 0, transit: 0, fun: 0 };
  monthExpenses.forEach(e => {
    if (cats.hasOwnProperty(e.category)) cats[e.category] += e.amount;
  });
  const maxCat = Math.max(...Object.values(cats), 1);

  Object.keys(cats).forEach(cat => {
    const barEl = document.getElementById(`cat-bar-${cat}`);
    const amtEl = document.getElementById(`cat-amt-${cat}`);
    if (barEl) barEl.style.width = `${(cats[cat] / Math.max(totalSpent, 1)) * 100}%`;
    if (amtEl) amtEl.textContent = formatCurrency(cats[cat]);
  });
}

function renderExpenses() {
  const list = document.getElementById('expense-list');
  const now  = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (!list) return;

  // Show up to 30 most recent
  const recent = expenses.slice(0, 30);

  if (recent.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📋</div>
        <div class="empty-state__text">No expenses yet — start logging!</div>
      </div>`;
    return;
  }

  list.innerHTML = recent.map(exp => {
    const cat  = CATEGORIES[exp.category] || CATEGORIES.food;
    const isToday = exp.date === todayStr;
    const dateLabel = isToday ? 'Today' : formatDate(exp.date);

    return `
      <div class="expense-item" id="exp-${exp.id}">
        <div class="expense-item__icon expense-item__icon--${exp.category}">${cat.icon}</div>
        <div class="expense-item__info">
          <div class="expense-item__note">${escapeHtml(exp.note || cat.label)}</div>
          <div class="expense-item__meta">${dateLabel} · <span class="badge badge--${exp.category}">${cat.label}</span></div>
        </div>
        <div class="expense-item__amount">-${formatCurrency(exp.amount)}</div>
        <button class="expense-item__delete" onclick="window.deleteExpense('${exp.id}')" title="Delete expense">✕</button>
      </div>
    `;
  }).join('');
}

// ── Toast ─────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${escapeHtml(message)}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Helpers ───────────────────────────────────────────────
function formatCurrency(amount) {
  if (isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Expose delete to global scope for inline onclick
window.deleteExpense = deleteExpense;

// ── Profile Page Logic ────────────────────────────────────
export async function initProfile() {
  currentUser = await requireAuth();
  setupProfileNav();
  await loadProfile();
  setupProfileForms();
  document.querySelector('.dashboard-page')?.classList.add('visible');
}

function setupProfileNav() {
  const avatarEl    = document.getElementById('user-avatar');
  const emailEl     = document.getElementById('nav-user-email');
  const signoutBtn  = document.getElementById('nav-signout');
  const dropdown    = document.getElementById('user-dropdown');

  if (emailEl)    emailEl.textContent = currentUser.email;
  if (avatarEl)   avatarEl.textContent = currentUser.email[0].toUpperCase();

  if (avatarEl && dropdown) {
    avatarEl.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  if (signoutBtn) signoutBtn.addEventListener('click', signOutUser);
}

function setupProfileForms() {
  // Update allowance
  const allowanceForm = document.getElementById('update-allowance-form');
  if (allowanceForm) {
    const input = document.getElementById('new-allowance');
    if (userProfile) input.value = userProfile.allowance;

    allowanceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = parseFloat(input.value);
      if (!amount || amount <= 0) {
        showProfileAlert('Enter a valid amount', 'error');
        return;
      }
      await saveAllowance(amount);
      showProfileAlert('Allowance updated!', 'success');
    });
  }

  // Reset month
  const resetBtn = document.getElementById('reset-month-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (!confirm('This will delete all your expenses for the current month. Are you sure?')) return;
      resetBtn.disabled = true;
      resetBtn.textContent = 'Resetting…';
      try {
        const colRef = collection(db, 'users', currentUser.uid, 'expenses');
        const q = query(colRef);
        const snap = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
          .then(m => m.getDocs(q));
        const deletes = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletes);
        showProfileAlert('All expenses cleared!', 'success');
      } catch (err) {
        showProfileAlert('Failed to reset. Try again.', 'error');
      } finally {
        resetBtn.disabled = false;
        resetBtn.textContent = 'Reset Current Month';
      }
    });
  }

  // Sign out
  const profileSignout = document.getElementById('profile-signout');
  if (profileSignout) profileSignout.addEventListener('click', signOutUser);
}

function showProfileAlert(message, type) {
  const el = document.getElementById('profile-alert');
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert--${type} visible`;
  setTimeout(() => el.classList.remove('visible'), 4000);
}
