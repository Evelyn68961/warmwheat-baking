/* ==========================================================================
   saved.js — 收藏課程
   Persists a set of course ids in localStorage and renders them into a
   slide-out drawer. No backend. Runs on every page: the header button and
   drawer are shared markup, the card toggles only exist where cards do.

   State lives in one place (the `saved` array); the header count, the card
   hearts and the drawer rows are all rendered from it, so they cannot drift
   out of sync.
   ========================================================================== */

(function () {
  'use strict';

  var KEY = 'ww_saved_courses';

  /* --------------------------------------------------------------- store */
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      // Private mode, quota, or hand-edited junk: degrade to an empty list
      // rather than breaking every page that loads this script.
      return [];
    }
  }

  function write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) { /* nothing sensible to do; UI still reflects this session */ }
  }

  var saved = read();

  function has(id) { return saved.some(function (c) { return c.id === id; }); }

  function toggle(course) {
    if (has(course.id)) {
      saved = saved.filter(function (c) { return c.id !== course.id; });
      return false;
    }
    saved = saved.concat(course);
    return true;
  }

  /* ---------------------------------------------------------------- toast */
  var toastEl = null;
  var toastTimer = null;

  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.setAttribute('data-show', '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.removeAttribute('data-show');
    }, 2200);
  }

  /* ---------------------------------------------------------------- render */
  function renderCount() {
    var el = document.getElementById('savedCount');
    if (!el) return;
    el.textContent = saved.length;
    if (saved.length) el.removeAttribute('data-empty');
    else el.setAttribute('data-empty', '');
  }

  function renderDrawer() {
    var body = document.getElementById('savedList');
    var empty = document.getElementById('savedEmpty');
    if (!body) return;

    body.innerHTML = '';
    if (empty) empty.hidden = saved.length > 0;

    saved.forEach(function (c) {
      var row = document.createElement('div');
      row.className = 'saved-item';

      var img = document.createElement('img');
      img.src = c.img; img.alt = ''; img.width = 72; img.height = 54;

      var mid = document.createElement('div');
      var h = document.createElement('h3');
      var a = document.createElement('a');
      a.href = c.href; a.textContent = c.title;
      h.appendChild(a);
      var p = document.createElement('p');
      p.textContent = c.price;
      mid.appendChild(h); mid.appendChild(p);

      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'saved-item__remove';
      rm.setAttribute('aria-label', '移除收藏：' + c.title);
      rm.textContent = '×';
      rm.addEventListener('click', function () {
        saved = saved.filter(function (x) { return x.id !== c.id; });
        write(saved);
        syncToggles();
        renderCount();
        renderDrawer();
      });

      row.appendChild(img); row.appendChild(mid); row.appendChild(rm);
      body.appendChild(row);
    });
  }

  /* Keep every visible heart in step with the store (the same course can
     appear on several pages, and the drawer can remove one behind its back). */
  function syncToggles() {
    document.querySelectorAll('.save-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(has(btn.dataset.id)));
    });
  }

  /* ----------------------------------------------------------------- wire */
  var HEART = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" ' +
              'stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">' +
              '<path d="M12 20.5 4.2 12.9a4.9 4.9 0 0 1 0-7 4.9 4.9 0 0 1 7 0l.8.8.8-.8a4.9 ' +
              '4.9 0 0 1 7 0 4.9 4.9 0 0 1 0 7z"/></svg>';

  function slug(text) {
    return text.trim().replace(/\s+/g, '-').slice(0, 60);
  }

  /* The toggle is injected rather than authored into the HTML: it cannot work
     without JS and localStorage, so shipping it in static markup would leave a
     dead control on the page for anyone with scripting off. */
  function injectToggles() {
    document.querySelectorAll('.course-card').forEach(function (card) {
      var media = card.querySelector('.course-card__media');
      var link = card.querySelector('.course-card__title a');
      if (!media || !link || media.querySelector('.save-toggle')) return;

      var title = link.textContent.trim();
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'save-toggle';
      btn.dataset.id = slug(title);
      btn.dataset.href = link.getAttribute('href');
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', '收藏：' + title);
      btn.innerHTML = HEART;
      media.appendChild(btn);
    });
  }

  function initToggles() {
    document.querySelectorAll('.save-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var card = btn.closest('.course-card') || document;
        var titleEl = card.querySelector('.course-card__title, .detail-title');
        var priceEl = card.querySelector('.price');
        var imgEl = card.querySelector('img');

        var added = toggle({
          id: btn.dataset.id,
          title: (titleEl ? titleEl.textContent : '').trim(),
          price: (priceEl ? priceEl.textContent : '').trim(),
          href: btn.dataset.href || 'course.html',
          img: imgEl ? imgEl.getAttribute('src') : ''
        });

        write(saved);
        syncToggles();
        renderCount();
        renderDrawer();
        toast(added ? '已加入收藏' : '已移除收藏');
      });
    });
  }

  function initDrawer() {
    var drawer = document.getElementById('savedDrawer');
    var openBtn = document.getElementById('savedBtn');
    if (!drawer || !openBtn) return;

    var lastFocus = null;

    /* Same reasoning as the waitlist dialog: with the drawer open the page
       behind the scrim still scrolls, so the panel stays put while the site
       slides past underneath. The scrollbar's width goes to body as padding
       so nothing shifts sideways when it disappears. */
    var lockScroll = function () {
      var bar = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      if (bar > 0) document.body.style.paddingRight = bar + 'px';
    };

    var unlockScroll = function () {
      document.documentElement.style.overflow = '';
      document.body.style.paddingRight = '';
    };

    var open = function () {
      lastFocus = document.activeElement;
      lockScroll();
      drawer.setAttribute('data-open', '');
      openBtn.setAttribute('aria-expanded', 'true');
      /* Flush the style recalc before focusing: the drawer is
         visibility:hidden until the attribute lands, and a hidden element
         cannot take focus. */
      void drawer.offsetHeight;
      var closeBtn = drawer.querySelector('.drawer__close');
      if (closeBtn) closeBtn.focus();
    };

    var close = function (restoreFocus) {
      if (!drawer.hasAttribute('data-open')) return;
      drawer.removeAttribute('data-open');
      unlockScroll();
      openBtn.setAttribute('aria-expanded', 'false');
      if (restoreFocus !== false && lastFocus) lastFocus.focus();
    };

    openBtn.addEventListener('click', open);
    drawer.querySelector('.drawer__scrim').addEventListener('click', function () { close(); });
    drawer.querySelector('.drawer__close').addEventListener('click', function () { close(); });

    /* A saved course links to course.html, so it leaves the page anyway — but
       the drawer must still release the scroll lock, otherwise going Back
       returns to a page that cannot scroll. */
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('.drawer__body a[href]')) close(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.hasAttribute('data-open')) close();
    });
  }

  function init() {
    injectToggles();
    initToggles();
    initDrawer();
    syncToggles();
    renderCount();
    renderDrawer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
