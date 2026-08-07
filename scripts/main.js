/* ==========================================================================
   main.js — shared behaviour (all pages)
   Kept deliberately small. The case description specifies 切版實作 only; the
   two feature scripts (courses.js / enroll.js) are where the real work lives
   and are the parts to re-quote if the client confirms them as in scope.
   ========================================================================== */

(function () {
  'use strict';

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
    initFaq();
    initSearchForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
