/* ==========================================================================
   main.js — shared behaviour (all pages)
   Kept deliberately small. The case description specifies 切版實作 only; the
   two feature scripts (courses.js / enroll.js) are where the real work lives
   and are the parts to re-quote if the client confirms them as in scope.
   ========================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------- Mobile nav */
  /* Below 720px the CSS used to just hide the nav, with nothing in its place:
     課程總覽, 關於教室 and 常見問題 were unreachable from the header on every
     page. This makes the panel a real overlay — scrim, scroll lock, focus trap
     — rather than a dropdown you can tab and scroll straight past. */
  function initNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('nav');
    if (!toggle || !nav) return;

    /* Injected rather than authored: the scrim does nothing without the JS
       that opens the panel, so in static markup it would be a dead overlay
       for anyone with scripting off. The toggle is authored instead, because
       it takes up space in the bar and a late-appearing control makes the
       header jump. */
    var scrim = document.createElement('div');
    scrim.className = 'nav-scrim';
    document.body.appendChild(scrim);

    /* The lock goes on <body>, not <html>: overflow on the root propagates to
       the viewport, which stops the root being the scrollport `position:
       sticky` resolves against, and this header — which the panel hangs off —
       would drop away with it. The scrollbar's width goes to body as padding
       so nothing shifts sideways as it disappears. */
    var lockScroll = function () {
      var bar = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (bar > 0) document.body.style.paddingRight = bar + 'px';
    };

    var unlockScroll = function () {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };

    var isOpen = function () { return toggle.getAttribute('aria-expanded') === 'true'; };

    var open = function () {
      lockScroll();
      nav.setAttribute('data-open', 'true');
      scrim.setAttribute('data-open', '');
      document.body.setAttribute('data-nav-open', '');
      toggle.setAttribute('aria-expanded', 'true');
    };

    var close = function (restoreFocus) {
      /* Guarded, because unlockScroll() is not this function's to give away:
         the saved drawer holds the same lock, and crossing the breakpoint with
         the drawer open would otherwise release it underneath. */
      if (!isOpen()) return;
      nav.removeAttribute('data-open');
      scrim.removeAttribute('data-open');
      document.body.removeAttribute('data-nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      unlockScroll();
      /* preventScroll: the toggle lives in a sticky header so it is already on
         screen, but scroll-into-view resolves a sticky element against its
         natural position in the document — the very top of the page. */
      if (restoreFocus) toggle.focus({ preventScroll: true });
    };

    toggle.addEventListener('click', function () {
      if (isOpen()) close(false); else open();
    });

    scrim.addEventListener('click', function () { close(false); });

    /* Every link here leaves the page, but the lock must be released first or
       going Back returns to a document that cannot scroll. */
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) close(false);
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { close(true); return; }

      /* With the page dimmed and locked the panel is modal in effect, so Tab
         has to stay inside it. The toggle is part of the cycle: while the
         panel is open it is the close button. */
      if (e.key !== 'Tab') return;
      var f = [toggle].concat(
        Array.prototype.slice.call(nav.querySelectorAll('a[href], button:not([disabled])'))
      ).filter(function (el) { return el.offsetParent !== null; });
      if (f.length < 2) return;

      /* preventScroll throughout: these all live inside the sticky header, so
         scroll-into-view aims at the top of the document rather than at where
         they are painted. The scroll lock does not help — it stops the wheel
         and the finger, not a programmatic scroll. */
      var first = f[0];
      var last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    });

    /* Leaving the mobile breakpoint must not strand the panel half-open, and
       must release the lock — otherwise a desktop-width window inherits a
       document that cannot scroll. Wrapped rather than passed directly, or
       `close` would take the MediaQueryListEvent as `restoreFocus` and pull
       focus to a button that is now hidden. */
    window.matchMedia('(min-width: 721px)').addEventListener('change', function () {
      close(false);
    });
  }

  /* ------------------------------------------------------- FAQ accordion */
  function initFaq() {
    var items = document.querySelectorAll('.faq__q');
    if (!items.length) return;

    items.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        btn.setAttribute('aria-expanded', String(!open));
        if (panel) panel.hidden = open;
      });
    });
  }

  /* --------------------------------------------- Carry hero search across */
  /* The homepage search bar is a plain GET form pointing at courses.html.
     courses.js reads the query string on load, so nothing else is needed here
     — this only trims empty params so the URL stays readable. */
  function initSearchForm() {
    var form = document.querySelector('.searchbar');
    if (!form) return;

    form.addEventListener('submit', function () {
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name && !el.value) el.disabled = true;
      });
    });
  }

  function init() {
    initNav();
    initFaq();
    initSearchForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
