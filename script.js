// Particle field
(function() {
  function fillField(field) {
    if (!field) return;
    const count = 120;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 1.5 + Math.random() * 3.5;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.bottom = '-10px';
      p.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
      p.style.setProperty('--op', (0.45 + Math.random() * 0.55).toFixed(2));
      p.style.animationDuration = (22 + Math.random() * 24) + 's';
      p.style.animationDelay = (Math.random() * -46) + 's';
      // independent twinkle timing
      p.style.setProperty('--tw', (1.5 + Math.random() * 2.5).toFixed(2) + 's');
      field.appendChild(p);
    }
  }
  fillField(document.getElementById('particleField'));
  fillField(document.getElementById('particleFieldContact'));
})();

// Timeline draw-on line + dot pulse
(function() {
  const tl = document.getElementById('timeline');
  if (!tl) return;
  const rows = tl.querySelectorAll('.tl-row');

  const tlIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) tl.classList.add('in-view'); });
  }, { threshold: 0.05 });
  tlIO.observe(tl);

  const rowIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
  }, { threshold: 0.4 });
  rows.forEach(r => rowIO.observe(r));
})();

// Sliding navbar indicator
(function() {
  const navLinks = document.getElementById('navLinks');
  const slider = document.getElementById('navSlider');
  if (!navLinks || !slider) return;
  const links = navLinks.querySelectorAll('a');

  function moveSlider(link) {
    const containerRect = navLinks.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    slider.style.left = (linkRect.left - containerRect.left) + 'px';
    slider.style.width = linkRect.width + 'px';
  }

  links.forEach(link => {
    link.addEventListener('click', () => {
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      moveSlider(link);
    });
  });

  // sync slider with scroll-based active section
  const sectionIds = ['hero','proj1','overview','exp','contact'];
  const linkMap = {};
  links.forEach(l => linkMap[l.getAttribute('href').slice(1)] = l);

  const navIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const link = linkMap[e.target.id];
        if (link) {
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
          moveSlider(link);
        }
      }
    });
  }, { threshold: 0.5 });
  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) navIO.observe(el);
  });

  window.addEventListener('resize', () => {
    const active = navLinks.querySelector('a.active');
    if (active) moveSlider(active);
  });

  requestAnimationFrame(() => moveSlider(links[0]));
})();

const panels = document.querySelectorAll('.panel[id]');
const dots   = document.querySelectorAll('.nd');

const revealIO = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
panels.forEach(p => revealIO.observe(p));

const dotIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      dots.forEach(d => d.classList.remove('active'));
      const d = document.querySelector(`.nd[data-t="${e.target.id}"]`);
      if (d) d.classList.add('active');
    }
  });
}, { threshold: 0.4 });
panels.forEach(p => dotIO.observe(p));

dots.forEach(d => d.addEventListener('click', () =>
  document.getElementById(d.dataset.t)?.scrollIntoView({ behavior: 'smooth' })
));

// ── Smooth/elastic scroll (with fallback if Lenis fails to load) ──
if (typeof Lenis !== 'undefined') {
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.2,
  });
  window.__lenis = lenis;
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  document.querySelectorAll('a[href^="#"], .nd').forEach(el => {
    el.addEventListener('click', (e) => {
      const targetId = el.dataset?.t || el.getAttribute('href')?.slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.2 });
      }
    });
  });
} else {
  // fallback: native smooth scroll
  document.documentElement.style.scrollBehavior = 'smooth';
  document.querySelectorAll('a[href^="#"], .nd').forEach(el => {
    el.addEventListener('click', (e) => {
      const targetId = el.dataset?.t || el.getAttribute('href')?.slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ── Smooth scroll to hash on page load (e.g. returning via "Back" to #proj1) ──
(function() {
  const hash = window.location.hash;
  if (!hash) return;
  const target = document.getElementById(hash.slice(1));
  if (!target) return;

  // disable the browser's instant jump, then animate smoothly
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  function go() {
    if (typeof Lenis !== 'undefined' && window.__lenis) {
      window.__lenis.scrollTo(target, { duration: 1.4, offset: -10 });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    // make sure the section is revealed (panels start hidden until in view)
    target.classList.add('visible');
  }
  // wait a beat so layout + Lenis are ready
  setTimeout(go, 250);
})();

// ── Contact reveal popups (email / phone) ──
(function() {
  const buttons = document.querySelectorAll('.ct-link[data-reveal]');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pop = document.getElementById(btn.getAttribute('data-reveal'));
      if (!pop) return;
      const isOpen = pop.classList.contains('open');
      // close all others
      document.querySelectorAll('.ct-pop.open').forEach(p => p.classList.remove('open'));
      // toggle this one
      if (!isOpen) pop.classList.add('open');
    });
  });
})();