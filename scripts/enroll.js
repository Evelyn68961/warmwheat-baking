/* ==========================================================================
   enroll.js — 報名前評估 + 四步驟報名流程
   A 5-question self-assessment that returns fit / caution / stop before the
   user reaches the booking form. The intent is to stop someone booking a
   course that cannot work for them — wrong level, or an allergen the recipe
   cannot drop — rather than to collect data.
   ========================================================================== */

(function () {
  'use strict';

  var stepper = document.getElementById('stepper');
  var panels  = Array.prototype.slice.call(document.querySelectorAll('.step-panel'));
  if (!stepper || !panels.length) return;

  var steps = Array.prototype.slice.call(stepper.children);
  var current = 1;

  /* This course is 入門 level and contains 小麥 / 乳製品 / 蛋.
     With a real backend these would come from the course record. */
  var COURSE = {
    level: 'beginner',
    contains: ['gluten', 'dairy', 'egg'],
    crossContact: ['nut'],
    price: 1880
  };

  var ALLERGY_LABEL = {
    none: '無', dairy: '乳製品', egg: '蛋', nut: '堅果',
    gluten: '麩質', vegan: '純素'
  };

  /* ------------------------------------------------------- step handling */
  function goTo(n) {
    current = n;
    panels.forEach(function (p) {
      if (Number(p.dataset.step) === n) {
        p.setAttribute('data-active', '');
      } else {
        p.removeAttribute('data-active');
      }
    });
    steps.forEach(function (li, i) {
      var idx = i + 1;
      if (idx < n) li.dataset.state = 'done';
      else if (idx === n) li.dataset.state = 'current';
      else delete li.dataset.state;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-back]').forEach(function (btn) {
    btn.addEventListener('click', function () { goTo(current - 1); });
  });

  /* ============================================ STEP 1 — the assessment */
  var assessForm  = document.getElementById('assessForm');
  var verdictEl   = document.getElementById('verdict');
  var toStep2     = document.getElementById('toStep2');
  var assessError = document.getElementById('assessError');
  var answers     = null;

  function readAssessment() {
    var one = function (name) {
      var el = assessForm.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    };
    var many = function (name) {
      return Array.prototype.slice
        .call(assessForm.querySelectorAll('input[name="' + name + '"]:checked'))
        .map(function (i) { return i.value; });
    };
    return {
      exp: one('exp'),
      goal: one('goal'),
      time: many('time'),
      allergy: many('allergy'),
      party: one('party')
    };
  }

  /* Returns { level, title, text, notes[] }.
     level: 'fit' | 'warn' | 'stop' — stop wins, then warn. */
  function evaluate(a) {
    var notes = [];
    var level = 'fit';

    // Hard blockers: the recipe cannot be adapted.
    var blocking = a.allergy.filter(function (x) {
      return COURSE.contains.indexOf(x) !== -1;
    });
    if (a.allergy.indexOf('vegan') !== -1) blocking.push('vegan');

    if (blocking.length) {
      level = 'stop';
      notes.push('本課程配方含' + COURSE.contains.map(function (c) { return ALLERGY_LABEL[c]; }).join('、') +
                 ',無法替換成其他材料。');
      notes.push('建議改上「歐式酸種麵包」，該課程為純素配方，不含蛋與乳製品。');
    }

    // Cross-contact warning — not a blocker, but must be disclosed.
    if (a.allergy.indexOf('nut') !== -1) {
      if (level === 'fit') level = 'warn';
      notes.push('教室同時處理堅果類產品，無法完全避免交叉接觸，請自行評估。');
    }

    // Level mismatch.
    if (level !== 'stop' && a.exp === 'none' && COURSE.level === 'advanced') {
      level = 'warn';
      notes.push('這堂課屬於進階，建議先上「基礎麵團」再回來。');
    }

    // Direction mismatch — informational only.
    if (level !== 'stop' && a.goal === 'sweet') {
      if (level === 'fit') level = 'warn';
      notes.push('你想學的是甜點類，這堂是麵包課。若想做甜點，可以看看蛋糕或塔派課程。');
    }
    if (level !== 'stop' && a.goal === 'career') {
      notes.push('若目標是證照，建議另外看「丙級烘焙食品證照班」，本課程不含考照輔導。');
    }

    // Schedule fit.
    if (level !== 'stop' && a.time.length && a.time.indexOf('weekend') === -1 &&
        a.time.indexOf('wd-night') === -1) {
      notes.push('本課程目前只開週末與平日晚間梯次，請確認時段是否能配合。');
    }

    // Party size vs class cap.
    if (a.party === '3') {
      notes.push('三人以上同行請先來電，我們會確認是否能安排相鄰工作檯。');
    }

    if (level === 'fit') {
      notes.push('沒有經驗也沒關係，所有步驟老師都會先示範一次。');
      notes.push('當天空手來即可，圍裙、工具與材料教室都會準備。');
    }

    var copy = {
      fit:  { title: '✓ 這堂課適合你', text: '依你的回答，這堂日式生吐司很適合現在的你。可以直接進入下一步選擇梯次。' },
      warn: { title: '! 可以上，但有幾點要先知道', text: '這堂課你仍然可以報名，不過以下幾點請先確認再決定。' },
      stop: { title: '× 建議先看看其他課程', text: '依你填寫的飲食限制，這堂課的配方無法調整。以下是我們的建議。' }
    }[level];

    return { level: level, title: copy.title, text: copy.text, notes: notes };
  }

  function showVerdict() {
    var a = readAssessment();

    // Every question except 過敏 must be answered; 過敏 may legitimately be empty
    // only if 「沒有」 was ticked, which is itself a value.
    if (!a.exp || !a.goal || !a.party || !a.time.length || !a.allergy.length) {
      assessError.textContent = '請完成全部 5 題後再看評估結果。';
      verdictEl.hidden = true;
      toStep2.disabled = true;
      return;
    }

    assessError.textContent = '';
    answers = a;

    var v = evaluate(a);
    verdictEl.dataset.level = v.level;
    document.getElementById('verdictTitle').textContent = v.title;
    document.getElementById('verdictText').textContent = v.text;

    var list = document.getElementById('verdictList');
    list.innerHTML = '';
    v.notes.forEach(function (n) {
      var li = document.createElement('li');
      li.textContent = n;
      list.appendChild(li);
    });

    verdictEl.hidden = false;
    // A 'stop' verdict still lets the user continue — it is advice, not a gate.
    toStep2.disabled = false;
    toStep2.textContent = v.level === 'stop' ? '仍要報名這堂課' : '下一步：選擇梯次';
  }

  document.getElementById('assessSubmit').addEventListener('click', showVerdict);
  toStep2.addEventListener('click', function () { if (!toStep2.disabled) goTo(2); });

  /* 「沒有」 is not one option among six — it is the claim that there are none,
     so it cannot stand alongside a specific restriction. Left unenforced, the
     summary reads 「飲食限制：無、麩質」 and that contradiction is what gets
     handed to the kitchen. Checking 沒有 clears the rest; checking anything
     else clears 沒有. */
  var allergyBoxes = Array.prototype.slice.call(
    assessForm.querySelectorAll('input[name="allergy"]')
  );
  allergyBoxes.forEach(function (box) {
    box.addEventListener('change', function () {
      if (!box.checked) return;
      allergyBoxes.forEach(function (other) {
        if (other === box) return;
        if (box.value === 'none' || other.value === 'none') other.checked = false;
      });
    });
  });

  // Re-answering invalidates the shown verdict.
  assessForm.addEventListener('change', function () {
    if (!verdictEl.hidden) {
      verdictEl.hidden = true;
      toStep2.disabled = true;
      toStep2.textContent = '下一步：選擇梯次';
    }
  });

  /* ================================================ STEP 2 — the session */
  var sessionError = document.getElementById('sessionError');

  document.getElementById('toStep3').addEventListener('click', function () {
    var picked = document.querySelector('input[name="pick"]:checked');
    if (!picked) {
      sessionError.textContent = '請選擇一個梯次。';
      return;
    }
    sessionError.textContent = '';
    goTo(3);
  });

  /* ================================================ STEP 3 — the details */
  var detailForm = document.getElementById('detailForm');

  var rules = {
    name:  function (v) { return v.trim() ? '' : '請填寫姓名'; },
    phone: function (v) {
      return /^09\d{8}$/.test(v.replace(/[\s-]/g, '')) ? '' : '請填寫 09 開頭的 10 位手機號碼';
    },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : '請填寫正確的 Email';
    }
  };

  function validateField(input) {
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

  Object.keys(rules).forEach(function (name) {
    var input = detailForm.elements[name];
    if (!input) return;
    input.addEventListener('blur', function () { validateField(input); });
    input.addEventListener('input', function () {
      if (input.closest('.field').classList.contains('is-invalid')) validateField(input);
    });
  });

  detailForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var input = detailForm.elements[name];
      if (input && !validateField(input) && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    fillSummary();
    goTo(4);
  });

  /* ================================================ STEP 4 — the summary */
  function fillSummary() {
    var picked = document.querySelector('input[name="pick"]:checked');
    var set = function (id, value) {
      document.getElementById(id).textContent = value || '—';
    };

    set('sumSession', picked ? picked.value : '');
    set('sumName',    detailForm.elements.name.value.trim());
    set('sumPhone',   detailForm.elements.phone.value.trim());
    set('sumEmail',   detailForm.elements.email.value.trim());
    set('sumNote',    detailForm.elements.note.value.trim());

    var partyLabel = { '1': '1 人', '2': '2 人', '3': '3 人以上' };
    set('sumParty', answers ? partyLabel[answers.party] : '');

    var allergy = answers
      ? answers.allergy.map(function (a) { return ALLERGY_LABEL[a]; }).join('、')
      : '';
    set('sumAllergy', allergy);

    var people = answers && answers.party === '2' ? 2 : 1;
    set('sumPrice', 'NT$' + (COURSE.price * people).toLocaleString('en-US') +
                    (people > 1 ? '（' + people + ' 人）' : ''));
  }

  document.getElementById('submitAll').addEventListener('click', function () {
    // Front-end demo only — no request is made.
    document.getElementById('doneNote').hidden = false;
    this.disabled = true;
    this.textContent = '已送出';
  });

  /* -------------------------------------------------------------- boot */
  goTo(1);
})();
