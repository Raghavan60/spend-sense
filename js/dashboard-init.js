// =========================================================
// Spend Sense — Dashboard (self-contained, no module imports)
// Uses localStorage — zero dependency on Firebase or ES modules
// =========================================================
(function () {
  'use strict';

  // ── LocalStorage helpers ─────────────────────────────────
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
  function lsSet(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function lsDel(k)  { localStorage.removeItem(k); }
  function pathKey() { return 'ss_fs_' + Array.from(arguments).join('/'); }

  // ── Auth guard ────────────────────────────────────────────
  const session = lsGet('ss_session');
  if (!session || !session.uid) { window.location.href = 'auth.html'; return; }
  const currentUser = session;

  // ── Category config ───────────────────────────────────────
  const CATS = {
    food:    { label: 'Food',    icon: '🍔' },
    transit: { label: 'Transit', icon: '🚌' },
    fun:     { label: 'Fun',     icon: '🎉' }
  };

  // ── DOM ready ─────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();

  function init() {
    setupNav();
    loadProfile();
    loadExpenses();
    setupLogForm();
    setupBanner();
    setupUpdateAllowanceModal();

    // Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const greetEl = document.getElementById('nav-greeting');
    if (greetEl) greetEl.textContent = greeting + '!';

    // Show page
    const page = document.querySelector('.dashboard-page');
    if (page) page.classList.add('visible');
  }

  // ── Nav ───────────────────────────────────────────────────
  function setupNav() {
    const avatarEl   = document.getElementById('user-avatar');
    const dropdown   = document.getElementById('user-dropdown');
    const emailEl    = document.getElementById('nav-user-email');
    const signoutBtn = document.getElementById('nav-signout');
    const profileLink = document.getElementById('nav-profile');

    if (emailEl)  emailEl.textContent  = currentUser.email;
    if (avatarEl) avatarEl.textContent = currentUser.email[0].toUpperCase();

    if (avatarEl && dropdown) {
      avatarEl.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', function () { dropdown.classList.remove('open'); });
    }
    if (signoutBtn) signoutBtn.addEventListener('click', signOut);
    if (profileLink) profileLink.addEventListener('click', function () { window.location.href = 'profile.html'; });
  }

  function signOut() {
    lsDel('ss_session');
    window.location.href = 'index.html';
  }
  window._signOut = signOut;

  // ── Profile (allowance) ───────────────────────────────────
  var userProfile = null;

  function loadProfile() {
    const key  = pathKey('users', currentUser.uid, 'profile', 'data');
    userProfile = lsGet(key);
    if (userProfile) { hideBanner(); updateBudgetUI(); }
    else             { showBanner(); }
  }

  function saveAllowance(amount) {
    const now = new Date();
    userProfile = {
      allowance: amount,
      month: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
    };
    lsSet(pathKey('users', currentUser.uid, 'profile', 'data'), userProfile);
    hideBanner();
    updateBudgetUI();
    showToast('Allowance saved! 🎉', 'success');
  }

  function showBanner() { var b = document.getElementById('setup-banner'); if (b) b.classList.add('visible'); }
  function hideBanner()  { var b = document.getElementById('setup-banner'); if (b) b.classList.remove('visible'); }

  // ── Setup Banner ──────────────────────────────────────────
  function setupBanner() {
    var input = document.getElementById('allowance-input');
    var btn   = document.getElementById('allowance-save-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var amount = parseFloat(input.value);
      if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); input.focus(); return; }
      btn.disabled    = true;
      btn.textContent = 'Saving…';
      saveAllowance(amount);
      btn.disabled    = false;
      btn.textContent = 'Save Allowance';
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.click(); });
  }

  // ── Expenses ──────────────────────────────────────────────
  var expenses = [];

  function getColKey() { return pathKey('users', currentUser.uid, 'expenses'); }

  function loadExpenses() {
    var colKey = getColKey();
    var ids    = lsGet(colKey + '/__ids__') || [];
    expenses = ids.map(function (id) {
      var d = lsGet(pathKey('users', currentUser.uid, 'expenses', id));
      return d ? Object.assign({ id: id }, d) : null;
    }).filter(Boolean);
    renderExpenses();
    updateBudgetUI();
  }

  function addExpense(data) {
    var id     = 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
    var colKey = getColKey();
    var ids    = [id].concat(lsGet(colKey + '/__ids__') || []);
    lsSet(colKey + '/__ids__', ids);
    lsSet(pathKey('users', currentUser.uid, 'expenses', id), Object.assign({ id: id }, data));
    loadExpenses();
  }

  function deleteExpense(id) {
    var colKey = getColKey();
    lsDel(pathKey('users', currentUser.uid, 'expenses', id));
    var ids = (lsGet(colKey + '/__ids__') || []).filter(function (i) { return i !== id; });
    lsSet(colKey + '/__ids__', ids);
    loadExpenses();
    showToast('Expense removed', 'success');
  }
  window._delExp = deleteExpense;

  // ── Log Form ──────────────────────────────────────────────
  function setupLogForm() {
    var form        = document.getElementById('log-form');
    var amountInput = document.getElementById('expense-amount');
    var noteInput   = document.getElementById('expense-note');
    var catBtns     = document.querySelectorAll('.category-btn');
    var selectedCat = 'food';

    var firstBtn = document.querySelector('[data-cat="food"]');
    if (firstBtn) firstBtn.classList.add('selected');

    catBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        catBtns.forEach(function (b) { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        selectedCat = btn.dataset.cat;
      });
    });

    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!userProfile) { showToast('Set your monthly allowance first!', 'error'); showBanner(); return; }
      var amount = parseFloat(amountInput.value);
      if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); amountInput.focus(); return; }

      var submitBtn = document.getElementById('log-expense-btn');
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Logging…';

      var now = new Date();
      addExpense({
        amount:    amount,
        category:  selectedCat,
        note:      noteInput.value.trim() || CATS[selectedCat].label,
        date:      now.toISOString().split('T')[0],
        timestamp: now.toISOString()
      });

      amountInput.value = '';
      noteInput.value   = '';
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Log Expense';
      showToast('Expense logged! ✓', 'success');
    });
  }

  // ── Budget UI ─────────────────────────────────────────────
  function updateBudgetUI() {
    var now          = new Date();
    var currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var monthExp     = expenses.filter(function (e) { return e.date && e.date.startsWith(currentMonth); });

    var totalAllowance = (userProfile && userProfile.allowance) ? userProfile.allowance : 0;
    var totalSpent     = monthExp.reduce(function (s, e) { return s + (e.amount || 0); }, 0);
    var remaining      = Math.max(0, totalAllowance - totalSpent);
    var lastDay        = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var daysLeft       = Math.max(1, lastDay - now.getDate() + 1);
    var safeToSpend    = remaining / daysLeft;

    setEl('budget-total',      fmt(totalAllowance));
    setEl('budget-spent',      fmt(totalSpent));
    setEl('budget-remaining',  fmt(remaining));
    setEl('safe-spend-amount', fmt(safeToSpend));

    var daysEl = document.getElementById('safe-spend-days');
    if (daysEl) daysEl.innerHTML = '<span>📅</span> <span>' + daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + ' left in month</span>';

    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    setEl('budget-month', months[now.getMonth()] + ' ' + now.getFullYear());

    var pct  = totalAllowance > 0 ? Math.min(100, (totalSpent / totalAllowance) * 100) : 0;
    var fill = document.getElementById('budget-progress-fill');
    if (fill) {
      fill.style.width = pct + '%';
      fill.className   = 'progress-fill';
      if (pct >= 90) fill.classList.add('progress-fill--danger');
      else if (pct >= 70) fill.classList.add('progress-fill--warning');
    }
    setEl('budget-pct', Math.round(pct) + '% used');

    var cats = { food: 0, transit: 0, fun: 0 };
    monthExp.forEach(function (e) { if (e.category in cats) cats[e.category] += e.amount; });
    Object.keys(cats).forEach(function (cat) {
      var barEl  = document.getElementById('cat-bar-' + cat);
      var amtEl  = document.getElementById('cat-amt-' + cat);
      var pctCat = totalSpent > 0 ? (cats[cat] / totalSpent) * 100 : 0;
      if (barEl) barEl.style.width = pctCat + '%';
      if (amtEl) amtEl.textContent = fmt(cats[cat]);
    });
  }

  // ── Render Expenses ───────────────────────────────────────
  function renderExpenses() {
    var list     = document.getElementById('expense-list');
    var todayStr = new Date().toISOString().split('T')[0];
    if (!list) return;

    if (expenses.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📋</div><div class="empty-state__text">No expenses yet — start logging!</div></div>';
      return;
    }

    list.innerHTML = expenses.slice(0, 30).map(function (exp) {
      var cat       = CATS[exp.category] || CATS.food;
      var dateLabel = exp.date === todayStr ? 'Today' : fmtDate(exp.date);
      return '<div class="expense-item" id="exp-' + exp.id + '">' +
        '<div class="expense-item__icon expense-item__icon--' + exp.category + '">' + cat.icon + '</div>' +
        '<div class="expense-item__info">' +
          '<div class="expense-item__note">' + esc(exp.note || cat.label) + '</div>' +
          '<div class="expense-item__meta">' + dateLabel + ' · <span class="badge badge--' + exp.category + '">' + cat.label + '</span></div>' +
        '</div>' +
        '<div class="expense-item__amount">-' + fmt(exp.amount) + '</div>' +
        '<button class="expense-item__delete" onclick="window._delExp(\'' + exp.id + '\')" title="Delete">✕</button>' +
      '</div>';
    }).join('');
  }

  // ── Toast ──────────────────────────────────────────────────
  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + (type || 'success');
    toast.innerHTML = '<span>' + (type === 'success' ? '✓' : '✕') + '</span> ' + esc(message);
    container.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity    = '0';
      toast.style.transform  = 'translateY(8px)';
      toast.style.transition = '0.3s ease';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  // ── Update Allowance Modal ────────────────────────────────
  function setupUpdateAllowanceModal() {
    var openBtn  = document.getElementById('update-allowance-btn');
    var modal    = document.getElementById('update-modal');
    var closeBtn = document.getElementById('modal-close');
    var input    = document.getElementById('update-allowance-input');
    var saveBtn  = document.getElementById('update-allowance-save');
    if (!openBtn || !modal) return;

    function openModal() {
      if (userProfile && userProfile.allowance) input.value = userProfile.allowance;
      else input.value = '';
      modal.classList.add('open');
      setTimeout(function () { input.focus(); input.select(); }, 200);
    }
    function closeModal() { modal.classList.remove('open'); }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    saveBtn.addEventListener('click', function () {
      var amount = parseFloat(input.value);
      if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); input.focus(); return; }
      saveBtn.disabled    = true;
      saveBtn.textContent = 'Saving…';
      saveAllowance(amount);
      saveBtn.disabled    = false;
      saveBtn.textContent = 'Save New Allowance';
      closeModal();
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') saveBtn.click(); });
  }

  // ── Helpers ────────────────────────────────────────────────

  function fmt(n) {
    if (isNaN(n) || n === undefined) return '₹0';
    return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  function fmtDate(s) {
    if (!s) return '';
    return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  function setEl(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
  function esc(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

})();
