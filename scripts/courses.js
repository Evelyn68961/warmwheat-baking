/* ==========================================================================
   courses.js — 課程查詢：篩選 / 關鍵字 / 排序 / 已選條件 chip / 空狀態
   The course grid itself is plain static HTML. This file layers filtering
   on top of it, so removing the script leaves a working (unfiltered) list
   rather than an empty page.
   ========================================================================== */

(function () {
  'use strict';

  var form = document.getElementById('filters');
  var results = document.getElementById('results');
  if (!form || !results) return;

  var cards      = Array.prototype.slice.call(results.querySelectorAll('.course-card'));
  var countEl    = document.getElementById('count');
  var chipsEl    = document.getElementById('activeChips');
  var emptyEl    = document.getElementById('noResults');
  var sortEl     = document.getElementById('sort');
  var pagerEl    = document.querySelector('.pager');
  var kwInput    = document.getElementById('kw');

  var LABELS = {
    cat:   { bread: '麵包', cake: '蛋糕', cookie: '餅乾', tart: '塔派', nobake: '免烤甜點', pro: '證照班' },
    lv:    { beginner: '入門', advanced: '進階', pro: '專業' },
    time:  { 'wd-day': '平日白天', 'wd-night': '平日晚間', weekend: '週末' },
    price: { a: 'NT$1,500 以下', b: 'NT$1,500–2,500', c: 'NT$2,500–4,000', d: 'NT$4,000 以上' }
  };

  var PRICE_BANDS = {
    a: function (p) { return p < 1500; },
    b: function (p) { return p >= 1500 && p < 2500; },
    c: function (p) { return p >= 2500 && p < 4000; },
    d: function (p) { return p >= 4000; }
  };

  /* ------------------------------------------------- read current filters */
  function readState() {
    var checked = function (name) {
      return Array.prototype.slice
        .call(form.querySelectorAll('input[name="' + name + '"]:checked'))
        .map(function (i) { return i.value; })
        .filter(Boolean);
    };
    return {
      kw:    (kwInput.value || '').trim().toLowerCase(),
      cat:   checked('cat'),
      time:  checked('time'),
      lv:    (form.querySelector('input[name="lv"]:checked') || {}).value || '',
      price: (form.querySelector('input[name="price"]:checked') || {}).value || '',
      avail: form.querySelector('input[name="avail"]').checked
    };
  }

  /* --------------------------------------------------------- match a card */
  function matches(card, s) {
    if (s.cat.length && s.cat.indexOf(card.dataset.cat) === -1) return false;
    if (s.time.length && s.time.indexOf(card.dataset.time) === -1) return false;
    if (s.lv && card.dataset.lv !== s.lv) return false;
    if (s.price && !PRICE_BANDS[s.price](Number(card.dataset.price))) return false;
    if (s.avail && Number(card.dataset.seats) === 0) return false;
    if (s.kw && card.dataset.title.toLowerCase().indexOf(s.kw) === -1) return false;
    return true;
  }

  /* ----------------------------------------------------- active-filter chips */
  function renderChips(s) {
    chipsEl.innerHTML = '';

    var add = function (group, value, label) {
      var chip = document.createElement('span');
      chip.className = 'achip';
      chip.innerHTML = '<span></span><button type="button" aria-label="移除篩選：' + label + '">×</button>';
      chip.firstChild.textContent = label;
      chip.querySelector('button').addEventListener('click', function () {
        clearOne(group, value);
      });
      chipsEl.appendChild(chip);
    };

    s.cat.forEach(function (v) { add('cat', v, LABELS.cat[v]); });
    s.time.forEach(function (v) { add('time', v, LABELS.time[v]); });
    if (s.lv)    add('lv', s.lv, '難度：' + LABELS.lv[s.lv]);
    if (s.price) add('price', s.price, LABELS.price[s.price]);
    if (s.avail) add('avail', '1', '只看尚有名額');
    if (s.kw)    add('kw', '', '關鍵字：' + kwInput.value.trim());
  }

  function clearOne(group, value) {
    if (group === 'kw') {
      kwInput.value = '';
    } else if (group === 'lv' || group === 'price') {
      // Radios: fall back to the "all" option rather than leaving none selected.
      form.querySelector('input[name="' + group + '"][value=""]').checked = true;
    } else {
      var input = form.querySelector('input[name="' + group + '"][value="' + value + '"]');
      if (input) input.checked = false;
    }
    apply();
  }

  /* ------------------------------------------------------------- sorting */
  function sortCards(visible) {
    var mode = sortEl ? sortEl.value : 'recommend';
    var by = {
      'recommend':  function (a, b) { return num(a, 'rank')  - num(b, 'rank'); },
      'price-asc':  function (a, b) { return num(a, 'price') - num(b, 'price'); },
      'price-desc': function (a, b) { return num(b, 'price') - num(a, 'price'); },
      'newest':     function (a, b) { return num(b, 'new')   - num(a, 'new'); }
    }[mode];

    visible.slice().sort(by).forEach(function (card) { results.appendChild(card); });
  }

  function num(card, key) { return Number(card.dataset[key]); }

  /* --------------------------------------------------------------- apply */
  function apply() {
    var s = readState();
    var visible = [];

    cards.forEach(function (card) {
      var ok = matches(card, s);
      card.hidden = !ok;
      if (ok) visible.push(card);
    });

    sortCards(visible);
    renderChips(s);

    countEl.textContent = visible.length;
    emptyEl.hidden = visible.length > 0;
    // A single filtered page has nothing to page through.
    if (pagerEl) pagerEl.hidden = visible.length !== cards.length;
  }

  function resetAll() {
    form.reset();
    kwInput.value = '';
    apply();
  }

  /* ------------------------------------------- hydrate from query string */
  /* Lets the homepage search bar (?q=&cat=&lv=) deep-link into this page. */
  function hydrate() {
    var p = new URLSearchParams(window.location.search);

    var q = p.get('q');
    if (q) kwInput.value = q;

    var cat = p.get('cat');
    if (cat) {
      var catInput = form.querySelector('input[name="cat"][value="' + cat + '"]');
      if (catInput) catInput.checked = true;
    }

    var lv = p.get('lv');
    if (lv) {
      var lvInput = form.querySelector('input[name="lv"][value="' + lv + '"]');
      if (lvInput) lvInput.checked = true;
    }
  }

  /* ---------------------------------------------------------------- wire */
  form.addEventListener('change', apply);
  kwInput.addEventListener('input', apply);
  if (sortEl) sortEl.addEventListener('change', apply);

  document.getElementById('resetAll').addEventListener('click', resetAll);
  var resetEmpty = document.getElementById('resetEmpty');
  if (resetEmpty) resetEmpty.addEventListener('click', resetAll);

  // Filtering is instant, so the form must never actually submit.
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  hydrate();
  apply();
})();
