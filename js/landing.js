// =========================================================
// Spend Sense — Landing Page Interactivity
// =========================================================

// ── Scroll Reveal ─────────────────────────────────────────
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));
}

// ── Animated Counter ──────────────────────────────────────
function animateCounters() {
  const counters = document.querySelectorAll('[data-count]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 1500;
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        el.textContent = prefix + (Number.isInteger(target) ? Math.round(current) : current.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }

      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// ── Hero Mock SVG Ring Chart ──────────────────────────────
function initRingChart() {
  const svg = document.getElementById('ring-chart-svg');
  if (!svg) return;

  const data = [
    { value: 45, color: '#3D8B6B' },  // food
    { value: 25, color: '#5B8FC4' },  // transit
    { value: 30, color: '#E8934A' },  // fun
  ];

  const cx = 45, cy = 45, r = 36, strokeWidth = 12;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  svg.setAttribute('viewBox', '0 0 90 90');
  svg.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#EDF3F0" stroke-width="${strokeWidth}" />`;

  data.forEach(seg => {
    const pct = seg.value / 100;
    const dash = pct * circumference;
    const gap  = circumference - dash;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', seg.color);
    circle.setAttribute('stroke-width', strokeWidth);
    circle.setAttribute('stroke-dasharray', `${dash} ${gap}`);
    circle.setAttribute('stroke-dashoffset', -(offset * circumference));
    circle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    circle.style.transition = 'stroke-dasharray 0.8s ease';

    svg.appendChild(circle);
    offset += pct;
  });
}

// ── Animated Bars on scroll ───────────────────────────────
function initMockupBars() {
  const bars = document.querySelectorAll('.mockup__bar-fill');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        bars.forEach(bar => {
          const target = bar.dataset.width || '60%';
          bar.style.width = target;
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const mockup = document.querySelector('.hero__mockup');
  if (mockup) observer.observe(mockup);
}

// ── Sticky Nav Shadow ─────────────────────────────────────
function initStickyNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10
      ? 'var(--shadow-sm)'
      : 'none';
  }, { passive: true });
}

// ── Init on DOMContentLoaded ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  animateCounters();
  initRingChart();
  initMockupBars();
  initStickyNav();

  // Page fade in
  requestAnimationFrame(() => {
    document.querySelector('.page-fade')?.classList.add('visible');
  });
});
