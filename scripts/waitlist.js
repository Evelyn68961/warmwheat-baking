/* ==========================================================================
   waitlist.js — 候補名單
   The FAQ already promises this: 「每個梯次平均會有 1–2 位臨時改期，我們會照候補
   順序通知，通常在開課前三到五天。候補不需要先付款。」 Before this file the only
   thing a full session did was disable its radio, so the one place the site said
   it would capture demand was the one place it threw it away.

   Everything here is injected rather than authored into the HTML. The flow
   needs JS and localStorage to do anything at all, so shipping it in static
   markup would leave a dead 加入候補 button for a visitor with scripting off —
   worse than no button, because it makes a promise the page cannot keep.
   ========================================================================== */

(function () {
  'use strict';

  var KEY = 'ww_waitlist';

  /* ------------------------------------------------------------ storage */
  /* Private mode throws on both read and write. A waitlist that silently
     forgets is still usable this session; one that throws is not. */
  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      /* no-op — the in-memory state carries the rest of this visit */
    }
  }

  function entryFor(id) {
    var list = read();
    for (var i = 0; i < list.length; i++) {
      if (list[i].session === id) return list[i];
    }
    return null;
  }

  /* --------------------------------------------------------------- modal */
  var modal = null;
  var lastFocus = null;
  var current = null;   // the .session__item being joined

  /* Without a scroll lock the page keeps scrolling behind the scrim, so the
     dialog sits still while the course page slides around underneath it.
     `overflow: hidden` on <html> rather than `position: fixed` on <body>,
     because the header is sticky and taking body out of flow drops it back to
     its scrolled-away position. The scrollbar's width is handed to body as
     padding so the layout doesn't jump sideways when it disappears. */
  function lockScroll() {
    var bar = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    if (bar > 0) document.body.style.paddingRight = bar + 'px';
  }

  function unlockScroll() {
    document.documentElement.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  var CHECK = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
              'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" ' +
              'stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  function buildModal() {
    var el = document.createElement('div');
    el.className = 'modal';
    el.id = 'waitlistModal';
    el.innerHTML =
      '<div class="modal__scrim" data-close></div>' +
      '<div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="wlTitle">' +
        '<div class="modal__head">' +
          '<h2 id="wlTitle">加入候補</h2>' +
          '<button type="button" class="modal__close" data-close aria-label="關閉">&times;</button>' +
        '</div>' +
        '<div class="modal__body">' +
          '<form id="wlForm" novalidate>' +
            '<p class="wl-session"><strong data-date></strong><span data-queue></span></p>' +
            '<div class="field">' +
              '<label for="wlName">姓名 <span class="req">*</span></label>' +
              '<input type="text" id="wlName" name="name" autocomplete="name">' +
              '<p class="field__error" id="wlName-error" role="alert"></p>' +
            '</div>' +
            '<div class="field">' +
              '<label for="wlContact">Email 或手機 <span class="req">*</span></label>' +
              '<input type="text" id="wlContact" name="contact" autocomplete="email">' +
              '<p class="field__error" id="wlContact-error" role="alert"></p>' +
            '</div>' +
            '<label class="wl-check">' +
              '<input type="checkbox" id="wlFlexible" name="flexible" checked>' +
              '<span>其他梯次有位子也可以通知我</span>' +
            '</label>' +
            '<p class="wl-terms">候補不需要先付款。有人改期時我們會照順序通知，' +
              '通常在開課前三到五天，你收到通知後再決定要不要報名。</p>' +
            '<button type="submit" class="btn btn--primary btn--block">加入候補名單</button>' +
          '</form>' +
          '<div class="wl-done" hidden>' +
            '<p class="wl-done__icon">' + CHECK + '</p>' +
            '<h3>已加入候補</h3>' +
            '<p class="wl-done__pos">你是第 <strong data-pos></strong> 位</p>' +
            '<p class="wl-done__note">有位子時會照順序通知你，通常在開課前三到五天。' +
              '在那之前不會扣款，你也可以隨時取消。</p>' +
            '<button type="button" class="btn btn--ghost btn--block" data-close>知道了</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  function focusables() {
    return Array.prototype.slice.call(
      modal.querySelectorAll('button, input, [href]')
    ).filter(function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
  }

  function open(item) {
    current = item;
    var queued = Number(item.dataset.queue || 0);

    modal.querySelector('[data-date]').textContent = item.dataset.date || '';
    modal.querySelector('[data-queue]').textContent =
      queued > 0 ? '目前有 ' + queued + ' 人候補' : '目前還沒有人候補';

    modal.querySelector('#wlForm').hidden = false;
    modal.querySelector('.wl-done').hidden = true;
    modal.querySelector('#wlTitle').textContent = '加入候補';

    lastFocus = document.activeElement;
    lockScroll();
    modal.setAttribute('data-open', '');
    /* Force the style recalculation before focusing. The dialog is
       visibility:hidden until the attribute change is applied, and a hidden
       element cannot take focus — setAttribute() followed by focus() in the
       same tick can therefore silently do nothing, leaving focus on the page
       behind the scrim where Tab then walks the background. Reading a layout
       property flushes the pending recalc. */
    void modal.offsetHeight;
    modal.querySelector('#wlName').focus();
  }

  function close() {
    if (!modal.hasAttribute('data-open')) return;
    modal.removeAttribute('data-open');
    unlockScroll();
    modal.querySelector('#wlForm').reset();
    clearErrors();
    if (lastFocus) lastFocus.focus();
  }

  /* -------------------------------------------------------- validation */
  var rules = {
    name: function (v) { return v.trim() ? '' : '請填寫姓名'; },
    contact: function (v) {
      if (!v.trim()) return '請留下 Email 或手機號碼';
      var email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
      var phone = /^[0-9+\-() ]{8,}$/.test(v.trim());
      return email || phone ? '' : '請填寫正確的 Email 或手機號碼';
    }
  };

  function validate(input) {
    var rule = rules[input.name];
    if (!rule) return true;
    var msg = rule(input.value);
    var field = input.closest('.field');
    var err = document.getElementById(input.id + '-error');
    if (field) field.classList.toggle('is-invalid', Boolean(msg));
    if (err) err.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  function clearErrors() {
    modal.querySelectorAll('.field').forEach(function (f) {
      f.classList.remove('is-invalid');
      var err = f.querySelector('.field__error');
      if (err) err.textContent = '';
    });
  }

  /* ----------------------------------------------------------- buttons */
  /* Two states, one button slot: not on the list yet (join) or already on it
     (show the position, offer to leave). */
  function renderButton(item) {
    var existing = item.parentNode.querySelector(
      '.wl-action[data-for="' + item.dataset.session + '"]'
    );
    if (existing) existing.parentNode.removeChild(existing);

    var entry = entryFor(item.dataset.session);
    var wrap = document.createElement('div');
    wrap.className = 'wl-action';
    wrap.dataset.for = item.dataset.session;

    if (entry) {
      wrap.innerHTML =
        '<span class="wl-joined">' + CHECK + '已候補・第 ' + entry.pos + ' 位</span>' +
        '<button type="button" class="wl-leave">取消候補</button>';
      wrap.querySelector('.wl-leave').addEventListener('click', function () {
        write(read().filter(function (e) { return e.session !== item.dataset.session; }));
        renderButton(item);
        toast('已取消候補');
      });
    } else {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--ghost btn--sm wl-join';
      btn.textContent = '加入候補';
      btn.addEventListener('click', function () { open(item); });
      wrap.appendChild(btn);
    }

    item.parentNode.insertBefore(wrap, item.nextSibling);
  }

  /* ------------------------------------------------------------- toast */
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
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.removeAttribute('data-show');
    }, 2200);
  }

  /* -------------------------------------------------------------- init */
  function init() {
    var items = Array.prototype.slice.call(
      document.querySelectorAll('.session__item[data-full]')
    );
    if (!items.length) return;

    modal = buildModal();

    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!modal.hasAttribute('data-open')) return;
      if (e.key === 'Escape') { close(); return; }
      /* Keep Tab inside the dialog — a modal you can tab out of behind the
         scrim is a modal in appearance only. */
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0];
      var last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    var form = modal.querySelector('#wlForm');

    ['wlName', 'wlContact'].forEach(function (id) {
      var input = document.getElementById(id);
      // Only nag after the first blur, not on every keystroke.
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (input.closest('.field').classList.contains('is-invalid')) validate(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var first = null;
      ['wlName', 'wlContact'].forEach(function (id) {
        var input = document.getElementById(id);
        if (!validate(input) && !first) first = input;
      });
      if (first) { first.focus(); return; }

      /* The position offered is queue length + 1. Nothing is sent anywhere —
         this is a front-end demo — but the number shown has to be the number
         the page's own data implies, not a flattering guess. */
      var queued = Number(current.dataset.queue || 0);
      var list = read();
      list.push({
        session: current.dataset.session,
        date: current.dataset.date,
        pos: queued + 1,
        flexible: document.getElementById('wlFlexible').checked
      });
      write(list);

      modal.querySelector('[data-pos]').textContent = String(queued + 1);
      modal.querySelector('#wlTitle').textContent = '候補完成';
      form.hidden = true;
      modal.querySelector('.wl-done').hidden = false;
      modal.querySelector('.wl-done .btn').focus();

      renderButton(current);
    });

    items.forEach(renderButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
