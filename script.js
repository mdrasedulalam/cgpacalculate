/*!
 * BBA CGPA Calculator
 * Vanilla JS, no dependencies. Grading scale: A+ 4.00 down to F 0.00.
 * All data stays in the browser (localStorage) — nothing is transmitted anywhere.
 */
(function () {
  'use strict';

  // ---------- Grading scale ----------
  var GRADE_MAP = {
    'A+': 4.00, 'A': 3.75, 'A-': 3.50,
    'B+': 3.25, 'B': 3.00, 'B-': 2.75,
    'C+': 2.50, 'C': 2.25,
    'D': 2.00, 'F': 0.00
  };
  var GRADE_OPTIONS = Object.keys(GRADE_MAP);
  var STORAGE_KEY = 'cgpa-calculator-state';
  var THEME_KEY = 'cgpa-theme';

  // ---------- DOM references ----------
  var tbody = document.getElementById('courseRows');
  var addBtn = document.getElementById('addRowBtn');
  var calcBtn = document.getElementById('calculateBtn');
  var resetBtn = document.getElementById('resetBtn');
  var validationSummary = document.getElementById('validationSummary');

  var cumulativeDetails = document.getElementById('cumulativeDetails');
  var prevCgpaInput = document.getElementById('prevCgpa');
  var prevCreditsInput = document.getElementById('prevCredits');

  var resultsEmpty = document.getElementById('resultsEmpty');
  var resultsContent = document.getElementById('resultsContent');
  var resultBody = document.getElementById('resultBody');
  var totalCreditsDisplay = document.getElementById('totalCreditsDisplay');
  var totalQpDisplay = document.getElementById('totalQpDisplay');
  var cumulativeCard = document.getElementById('cumulativeCard');
  var cumulativeDisplay = document.getElementById('cumulativeDisplay');

  var gaugeFill = document.getElementById('gaugeFill');
  var gaugeNeedle = document.getElementById('gaugeNeedle');
  var gaugeValue = document.getElementById('gaugeValue');
  var gaugeLabel = document.getElementById('gaugeLabel');

  var copyBtn = document.getElementById('copyBtn');
  var printBtn = document.getElementById('printBtn');
  var themeToggle = document.getElementById('themeToggle');
  var toastEl = document.getElementById('toast');

  var rowCounter = 0;
  var autosaveTimer = null;
  var lastResult = null; // cached for copy-to-clipboard / gauge re-render

  // =========================================================
  // Row construction
  // =========================================================
  function createGradeSelect(selectedValue) {
    var sel = document.createElement('select');
    sel.className = 'course-grade';
    sel.setAttribute('aria-label', 'Letter grade');

    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '— Select —';
    placeholder.disabled = true;
    placeholder.selected = !selectedValue;
    sel.appendChild(placeholder);

    GRADE_OPTIONS.forEach(function (g) {
      var opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g + ' (' + GRADE_MAP[g].toFixed(2) + ')';
      if (g === selectedValue) opt.selected = true;
      sel.appendChild(opt);
    });
    return sel;
  }

  function createRow(name, credit, grade) {
    rowCounter++;
    var tr = document.createElement('tr');
    tr.dataset.rowId = rowCounter;
    tr.dataset.index = rowCounter;

    var tdNum = document.createElement('td');
    tdNum.className = 'col-num';
    tdNum.textContent = rowCounter;
    tr.appendChild(tdNum);

    var tdName = document.createElement('td');
    tdName.setAttribute('data-label', 'Course name');
    var inpName = document.createElement('input');
    inpName.type = 'text';
    inpName.className = 'course-name';
    inpName.placeholder = 'e.g. Financial Accounting';
    inpName.value = name || '';
    inpName.setAttribute('aria-label', 'Course name');
    tdName.appendChild(inpName);
    tr.appendChild(tdName);

    var tdCredit = document.createElement('td');
    tdCredit.setAttribute('data-label', 'Credit');
    var inpCredit = document.createElement('input');
    inpCredit.type = 'number';
    inpCredit.className = 'course-credit';
    inpCredit.placeholder = '3.0';
    inpCredit.step = '0.5';
    inpCredit.min = '0.5';
    inpCredit.max = '6.0';
    inpCredit.inputMode = 'decimal';
    inpCredit.setAttribute('aria-label', 'Credit hours');
    if (credit !== undefined && credit !== null && credit !== '') inpCredit.value = credit;
    tdCredit.appendChild(inpCredit);
    tr.appendChild(tdCredit);

    var tdGrade = document.createElement('td');
    tdGrade.setAttribute('data-label', 'Grade');
    var selGrade = createGradeSelect(grade || '');
    tdGrade.appendChild(selGrade);
    tr.appendChild(tdGrade);

    var tdAction = document.createElement('td');
    tdAction.className = 'col-action';
    var btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'btn-remove';
    btnRemove.setAttribute('aria-label', 'Remove this course');
    btnRemove.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    btnRemove.addEventListener('click', function () {
      if (tbody.children.length <= 1) {
        clearRow(tr);
      } else {
        tr.remove();
        renumberRows();
      }
      hideResults();
      scheduleAutosave();
    });
    tdAction.appendChild(btnRemove);
    tr.appendChild(tdAction);

    [inpName, inpCredit, selGrade].forEach(function (el) {
      el.addEventListener('input', function () { hideResults(); scheduleAutosave(); });
      el.addEventListener('change', function () { hideResults(); scheduleAutosave(); });
    });

    return tr;
  }

  function clearRow(tr) {
    tr.querySelectorAll('input, select').forEach(function (el) {
      if (el.tagName === 'SELECT') { el.selectedIndex = 0; } else { el.value = ''; }
      el.classList.remove('field-error');
    });
  }

  function renumberRows() {
    var rows = tbody.querySelectorAll('tr');
    rows.forEach(function (tr, idx) {
      tr.querySelector('.col-num').textContent = idx + 1;
      tr.dataset.rowId = idx + 1;
      tr.dataset.index = idx + 1;
    });
    rowCounter = rows.length;
  }

  // =========================================================
  // Validation & calculation
  // =========================================================
  function markField(el, hasError) {
    el.classList.toggle('field-error', !!hasError);
  }

  function showValidationErrors(errors) {
    if (!errors || errors.length === 0) {
      validationSummary.classList.remove('visible');
      validationSummary.innerHTML = '';
      return;
    }
    validationSummary.classList.add('visible');
    validationSummary.innerHTML = errors.map(function (e) {
      return '<div class="error-item">' + e + '</div>';
    }).join('');
  }

  function hideResults() {
    resultsContent.hidden = true;
    resultsEmpty.hidden = false;
    lastResult = null;
  }

  function calculateCGPA() {
    var errors = [];
    var rows = tbody.querySelectorAll('tr');
    var courseData = [];

    rows.forEach(function (tr, index) {
      var nameInput = tr.querySelector('.course-name');
      var creditInput = tr.querySelector('.course-credit');
      var gradeSelect = tr.querySelector('.course-grade');

      var name = nameInput.value.trim();
      var creditVal = creditInput.value.trim();
      var grade = gradeSelect.value;
      var rowErrors = [];

      if (!name) {
        rowErrors.push('Row ' + (index + 1) + ': course name is required.');
        markField(nameInput, true);
      } else { markField(nameInput, false); }

      var creditNum = parseFloat(creditVal);
      if (!creditVal) {
        rowErrors.push('Row ' + (index + 1) + ': credit is required.');
        markField(creditInput, true);
      } else if (isNaN(creditNum) || creditNum < 0.5 || creditNum > 6.0) {
        rowErrors.push('Row ' + (index + 1) + ': enter a valid credit (0.5 – 6.0).');
        markField(creditInput, true);
      } else { markField(creditInput, false); }

      if (!grade) {
        rowErrors.push('Row ' + (index + 1) + ': select a letter grade.');
        markField(gradeSelect, true);
      } else { markField(gradeSelect, false); }

      if (rowErrors.length) { errors.push.apply(errors, rowErrors); return; }

      courseData.push({
        name: name,
        credit: creditNum,
        grade: grade,
        gradePoint: GRADE_MAP[grade],
        qualityPoints: GRADE_MAP[grade] * creditNum
      });
    });

    if (errors.length) {
      showValidationErrors(errors);
      showToast('Please fix the highlighted fields', 'error');
      return;
    }

    var totalCredits = courseData.reduce(function (s, c) { return s + c.credit; }, 0);
    if (totalCredits <= 0) {
      showValidationErrors(['Total credits must be greater than zero.']);
      return;
    }

    var totalQP = courseData.reduce(function (s, c) { return s + c.qualityPoints; }, 0);
    var semesterGpa = Math.round((totalQP / totalCredits) * 100) / 100;

    // Optional cumulative CGPA
    var cumulative = null;
    if (cumulativeDetails.open) {
      var prevCgpa = parseFloat(prevCgpaInput.value);
      var prevCredits = parseFloat(prevCreditsInput.value);
      var cumErrors = [];
      if (prevCgpaInput.value.trim() || prevCreditsInput.value.trim()) {
        if (isNaN(prevCgpa) || prevCgpa < 0 || prevCgpa > 4) {
          cumErrors.push('Previous CGPA must be between 0.00 and 4.00.');
          markField(prevCgpaInput, true);
        } else { markField(prevCgpaInput, false); }

        if (isNaN(prevCredits) || prevCredits < 0) {
          cumErrors.push('Previous credits must be zero or greater.');
          markField(prevCreditsInput, true);
        } else { markField(prevCreditsInput, false); }

        if (cumErrors.length) {
          showValidationErrors(cumErrors);
          showToast('Check your previous CGPA details', 'error');
          return;
        }

        var combinedCredits = prevCredits + totalCredits;
        var combinedQP = (prevCgpa * prevCredits) + totalQP;
        cumulative = Math.round((combinedQP / combinedCredits) * 100) / 100;
      }
    }

    showValidationErrors(null);
    renderResults(courseData, totalCredits, totalQP, semesterGpa, cumulative);
    scheduleAutosave();
  }

  // =========================================================
  // Rendering
  // =========================================================
  function renderResults(data, totalCredits, totalQP, semesterGpa, cumulative) {
    resultBody.innerHTML = '';
    data.forEach(function (item) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td data-label="Course">' + escapeHtml(item.name) + '</td>' +
        '<td data-label="Credit">' + item.credit.toFixed(1) + '</td>' +
        '<td data-label="Grade">' + item.grade + '</td>' +
        '<td data-label="Grade point">' + item.gradePoint.toFixed(2) + '</td>' +
        '<td data-label="Quality points">' + item.qualityPoints.toFixed(2) + '</td>';
      resultBody.appendChild(tr);
    });

    var totalsRow = document.createElement('tr');
    totalsRow.className = 'totals-row';
    totalsRow.innerHTML =
      '<td data-label="Totals"><strong>Totals</strong></td>' +
      '<td data-label="Credit"><strong>' + totalCredits.toFixed(1) + '</strong></td>' +
      '<td data-label="Grade">—</td><td data-label="Grade point">—</td>' +
      '<td data-label="Quality points"><strong>' + totalQP.toFixed(2) + '</strong></td>';
    resultBody.appendChild(totalsRow);

    totalCreditsDisplay.textContent = totalCredits.toFixed(1);
    totalQpDisplay.textContent = totalQP.toFixed(2);

    if (cumulative !== null) {
      cumulativeCard.hidden = false;
      cumulativeDisplay.textContent = cumulative.toFixed(2);
    } else {
      cumulativeCard.hidden = true;
    }

    var gaugeTarget = cumulative !== null ? cumulative : semesterGpa;
    setGauge(gaugeTarget, cumulative !== null ? 'Cumulative CGPA' : 'Semester GPA');

    lastResult = {
      data: data, totalCredits: totalCredits, totalQP: totalQP,
      semesterGpa: semesterGpa, cumulative: cumulative
    };

    resultsEmpty.hidden = true;
    resultsContent.hidden = false;
    resultsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setGauge(value, label) {
    var fraction = Math.max(0, Math.min(1, value / 4));
    var circumference = 251.3;
    var offset = circumference * (1 - fraction);
    var degrees = -90 + fraction * 180;

    requestAnimationFrame(function () {
      gaugeFill.style.strokeDashoffset = offset;
      gaugeNeedle.style.transform = 'rotate(' + degrees + 'deg)';
    });
    animateNumber(gaugeValue, value);
    gaugeLabel.textContent = label;
  }

  function animateNumber(el, target) {
    var start = parseFloat(el.textContent) || 0;
    var duration = 700;
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min(1, (ts - startTime) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = start + (target - start) * eased;
      el.textContent = current.toFixed(2);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // =========================================================
  // Toast
  // =========================================================
  var toastTimer = null;
  function showToast(message, type) {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.className = 'toast visible' + (type ? ' ' + type : '');
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('visible');
    }, 2600);
  }

  // =========================================================
  // Copy & print
  // =========================================================
  copyBtn.addEventListener('click', function () {
    if (!lastResult) return;
    var lines = ['BBA CGPA Calculator — Transcript Summary', ''];
    lastResult.data.forEach(function (c) {
      lines.push(c.name + ' — ' + c.credit.toFixed(1) + ' cr — ' + c.grade + ' (' + c.gradePoint.toFixed(2) + ')');
    });
    lines.push('');
    lines.push('Total credits: ' + lastResult.totalCredits.toFixed(1));
    lines.push('Quality points: ' + lastResult.totalQP.toFixed(2));
    lines.push('Semester GPA: ' + lastResult.semesterGpa.toFixed(2));
    if (lastResult.cumulative !== null) {
      lines.push('Cumulative CGPA: ' + lastResult.cumulative.toFixed(2));
    }
    var text = lines.join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('Summary copied to clipboard', 'success');
      }, function () {
        showToast('Could not copy — please copy manually', 'error');
      });
    } else {
      showToast('Clipboard not supported on this browser', 'error');
    }
  });

  printBtn.addEventListener('click', function () {
    if (!lastResult) return;
    window.print();
  });

  // =========================================================
  // Theme toggle
  // =========================================================
  themeToggle.addEventListener('click', function () {
    var html = document.documentElement;
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    themeToggle.setAttribute('aria-pressed', String(next === 'dark'));
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });
  themeToggle.setAttribute('aria-pressed', String(document.documentElement.getAttribute('data-theme') === 'dark'));

  // =========================================================
  // Autosave / restore
  // =========================================================
  function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveState, 400);
  }

  function saveState() {
    try {
      var rows = Array.prototype.map.call(tbody.querySelectorAll('tr'), function (tr) {
        return {
          name: tr.querySelector('.course-name').value,
          credit: tr.querySelector('.course-credit').value,
          grade: tr.querySelector('.course-grade').value
        };
      });
      var state = {
        rows: rows,
        cumulativeOpen: cumulativeDetails.open,
        prevCgpa: prevCgpaInput.value,
        prevCredits: prevCreditsInput.value
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable — fail silently */ }
  }

  function restoreState() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (!raw) return false;
    try {
      var state = JSON.parse(raw);
      if (!state || !Array.isArray(state.rows) || !state.rows.length) return false;
      state.rows.forEach(function (r) {
        tbody.appendChild(createRow(r.name, r.credit, r.grade));
      });
      if (state.cumulativeOpen) cumulativeDetails.open = true;
      if (state.prevCgpa) prevCgpaInput.value = state.prevCgpa;
      if (state.prevCredits) prevCreditsInput.value = state.prevCredits;
      return true;
    } catch (e) { return false; }
  }

  // =========================================================
  // Reset
  // =========================================================
  resetBtn.addEventListener('click', function () {
    if (!window.confirm('Reset all courses and start over? This cannot be undone.')) return;
    tbody.innerHTML = '';
    rowCounter = 0;
    for (var i = 0; i < 3; i++) tbody.appendChild(createRow('', '', ''));
    prevCgpaInput.value = '';
    prevCreditsInput.value = '';
    cumulativeDetails.open = false;
    showValidationErrors(null);
    hideResults();
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    showToast('Everything has been reset');
  });

  // =========================================================
  // Wiring
  // =========================================================
  addBtn.addEventListener('click', function () {
    var tr = createRow('', '', '');
    tbody.appendChild(tr);
    hideResults();
    scheduleAutosave();
    var nameInput = tr.querySelector('.course-name');
    if (nameInput) setTimeout(function () { nameInput.focus(); }, 30);
  });

  calcBtn.addEventListener('click', calculateCGPA);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.closest('.table-scroll')) {
      e.preventDefault();
      calculateCGPA();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      calculateCGPA();
    }
  });

  [prevCgpaInput, prevCreditsInput].forEach(function (el) {
    el.addEventListener('input', function () { hideResults(); scheduleAutosave(); });
  });
  cumulativeDetails.addEventListener('toggle', scheduleAutosave);

  // ---------- Init ----------
  var restored = restoreState();
  if (!restored) {
    for (var i = 0; i < 3; i++) tbody.appendChild(createRow('', '', ''));
    rowCounter = 3;
  }
})();
