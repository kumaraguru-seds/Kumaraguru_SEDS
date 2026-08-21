/* ================================================================
   TENACITY – Propellant Batch Tracker
   app.js – All frontend logic
   ================================================================ */

'use strict';

// ────────────────────────────────────────────────────────────────
//  CONFIG  — Paste your deployed Apps Script URL below
// ────────────────────────────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzPGLbJlP9Hde93biMpYgkS-Vh3Ps83AfSF18cpouG7IY_CH8CI6yYWgkAB3FRB5MpxrA/exec';

// ────────────────────────────────────────────────────────────────
//  PROPELLANT PRESETS
// ────────────────────────────────────────────────────────────────
const PRESETS = {
  KNSB: {
    chem1: 'Potassium Nitrate (KNO₃)',
    chem2: 'Sorbitol',
    hasCatalyst: false,
    ratios: [
      { label: '60 / 40  — Standard Burn', c1: 60, c2: 40 },
      { label: '62 / 38', c1: 62, c2: 38 },
      { label: '65 / 35  — Common', c1: 65, c2: 35 },
      { label: '68 / 32', c1: 68, c2: 32 },
      { label: '70 / 30  — High Oxidizer', c1: 70, c2: 30 },
      { label: '72 / 28', c1: 72, c2: 28 },
      { label: '74 / 26', c1: 74, c2: 26 },
      { label: '75 / 25  — Lean Fuel', c1: 75, c2: 25 },
    ]
  },
  KNSU: {
    chem1: 'Potassium Nitrate (KNO₃)',
    chem2: 'Sucrose',
    hasCatalyst: false,
    ratios: [
      { label: '60 / 40  — Standard Burn', c1: 60, c2: 40 },
      { label: '62 / 38', c1: 62, c2: 38 },
      { label: '65 / 35  — Common', c1: 65, c2: 35 },
      { label: '68 / 32', c1: 68, c2: 32 },
      { label: '70 / 30  — High Oxidizer', c1: 70, c2: 30 },
      { label: '72 / 28', c1: 72, c2: 28 },
      { label: '74 / 26', c1: 74, c2: 26 },
      { label: '75 / 25  — Lean Fuel', c1: 75, c2: 25 },
    ]
  },
  KNDX: {
    chem1: 'Potassium Nitrate (KNO₃)',
    chem2: 'Dextrose',
    catalystName: 'Red Iron Oxide (Fe₂O₃)',
    ratios: [
      // ── Without catalyst ──
      { label: '60 / 40  — No Catalyst', c1: 60, c2: 40, cat: 0, hasCatalyst: false },
      { label: '65 / 35  — No Catalyst', c1: 65, c2: 35, cat: 0, hasCatalyst: false },
      { label: '68 / 32  — No Catalyst', c1: 68, c2: 32, cat: 0, hasCatalyst: false },
      { label: '70 / 30  — No Catalyst', c1: 70, c2: 30, cat: 0, hasCatalyst: false },
      { label: '72 / 28  — No Catalyst', c1: 72, c2: 28, cat: 0, hasCatalyst: false },
      { label: '75 / 25  — No Catalyst', c1: 75, c2: 25, cat: 0, hasCatalyst: false },
      // ── With 2 % Red Iron Oxide ──
      { label: '66 / 32 / 2  — 2 % RIO', c1: 66, c2: 32, cat: 2, hasCatalyst: true },
      { label: '68 / 30 / 2  — 2 % RIO', c1: 68, c2: 30, cat: 2, hasCatalyst: true },
      { label: '70 / 28 / 2  — 2 % RIO', c1: 70, c2: 28, cat: 2, hasCatalyst: true },
      // ── With 3 % Red Iron Oxide ──
      { label: '65 / 32 / 3  — 3 % RIO', c1: 65, c2: 32, cat: 3, hasCatalyst: true },
      { label: '68 / 29 / 3  — 3 % RIO', c1: 68, c2: 29, cat: 3, hasCatalyst: true },
      { label: '70 / 27 / 3  — 3 % RIO', c1: 70, c2: 27, cat: 3, hasCatalyst: true },
      { label: '72 / 25 / 3  — 3 % RIO', c1: 72, c2: 25, cat: 3, hasCatalyst: true },
      // ── With 5 % Red Iron Oxide ──
      { label: '65 / 30 / 5  — 5 % RIO', c1: 65, c2: 30, cat: 5, hasCatalyst: true },
      { label: '68 / 27 / 5  — 5 % RIO', c1: 68, c2: 27, cat: 5, hasCatalyst: true },
      { label: '70 / 25 / 5  — 5 % RIO', c1: 70, c2: 25, cat: 5, hasCatalyst: true },
      { label: '72 / 23 / 5  — 5 % RIO', c1: 72, c2: 23, cat: 5, hasCatalyst: true },
      // ── Custom ratio with catalyst (manual entry) ──
      {
        label: '✏️ Custom Ratio + Catalyst — Enter manually',
        c1: null, c2: null, cat: null, hasCatalyst: true, isCustom: true
      }
    ]
  }
};

// ────────────────────────────────────────────────────────────────
//  STORAGE KEYS
// ────────────────────────────────────────────────────────────────
const SK = {
  counter: 'tenacity_counter',
  formState: 'tenacity_form_state',
  submitted: 'tenacity_submitted',
  history: 'tenacity_local_history'
};

// ────────────────────────────────────────────────────────────────
//  LOADING MESSAGES (like shorturl.html)
// ────────────────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  '🔬 Validating Propellant Data...',
  '🛡️ Verifying Unique ID Against Database...',
  '📡 Connecting to Lab Spreadsheet...',
  '📊 Writing Batch Data to New Sheet...',
];
const LOADING_STEP_MS = 1750;

// ────────────────────────────────────────────────────────────────
//  DOM REFS
// ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

let catalystEnabled = false;
let selectedStatus = '';

// ────────────────────────────────────────────────────────────────
//  DATETIME
// ────────────────────────────────────────────────────────────────
function startClock() {
  function update() {
    const now = new Date();
    const opts = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    };
    $('liveDateTime').textContent = '🕐 ' + now.toLocaleString('en-IN', opts);
  }
  update();
  setInterval(update, 1000);
}

// ────────────────────────────────────────────────────────────────
//  ID GENERATION
// ────────────────────────────────────────────────────────────────
function getNextCounter() {
  const c = parseInt(localStorage.getItem(SK.counter) || '0', 10) + 1;
  localStorage.setItem(SK.counter, c);
  return c;
}
function peekCounter() {
  return parseInt(localStorage.getItem(SK.counter) || '0', 10) + 1;
}
function buildPropellantId(n) {
  return `PropellantTest${n}`;
}
function buildUniqueUid(n) {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PT${n}-${ts}-${rand}`;
}
function buildTimestamp() {
  return new Date().toLocaleString('en-IN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
}

// ────────────────────────────────────────────────────────────────
//  INITIALIZE NEW BATCH IDS
// ────────────────────────────────────────────────────────────────
function initBatchIds(forceNew = false) {
  const state = loadFormState();
  if (!forceNew && state && state.propellantId && !state._submitted) {
    // Restore existing in-progress IDs
    $('propellantId').value = state.propellantId;
    $('uniqueUid').value = state.uniqueUid;
    $('recordedAt').value = state.recordedAt;
  } else {
    const n = peekCounter();
    $('propellantId').value = buildPropellantId(n);
    $('uniqueUid').value = buildUniqueUid(n);
    $('recordedAt').value = buildTimestamp();
  }
}

// ────────────────────────────────────────────────────────────────
//  LOCAL STORAGE – FORM STATE
// ────────────────────────────────────────────────────────────────
function saveFormState() {
  const state = {
    propellantId: $('propellantId').value,
    uniqueUid: $('uniqueUid').value,
    recordedAt: $('recordedAt').value,
    propellantName: $('propellantName').value,
    propellantType: $('propellantType').value,
    mixRatio: $('mixRatio').value,
    chem1Name: $('chem1Name').value,
    chem1Pct: $('chem1Pct').value,
    chem2Name: $('chem2Name').value,
    chem2Pct: $('chem2Pct').value,
    catalystEnabled,
    catalystPct: $('catalystPct').value,
    totalGrams: $('totalGrams').value,
    cookTime: $('cookTime').value,
    description: $('description').value,
    _submitted: false
  };
  localStorage.setItem(SK.formState, JSON.stringify(state));
}

function loadFormState() {
  try { return JSON.parse(localStorage.getItem(SK.formState) || 'null'); }
  catch { return null; }
}

function restoreFormState() {
  const state = loadFormState();
  if (!state || state._submitted) return;

  // Restore simple fields
  if (state.propellantName) $('propellantName').value = state.propellantName;
  if (state.cookTime) $('cookTime').value = state.cookTime;
  if (state.description) $('description').value = state.description;
  if (state.totalGrams) $('totalGrams').value = state.totalGrams;

  // Restore type first (this triggers dropdowns)
  if (state.propellantType) {
    $('propellantType').value = state.propellantType;
    handleTypeChange(false); // don't reset fields yet

    // Restore ratio
    if (state.mixRatio) {
      $('mixRatio').value = state.mixRatio;
      handleRatioChange(false); // don't reset fields
    }
    // Restore chem fields (may override preset)
    if (state.chem1Name) $('chem1Name').value = state.chem1Name;
    if (state.chem1Pct) $('chem1Pct').value = state.chem1Pct;
    if (state.chem2Name) $('chem2Name').value = state.chem2Name;
    if (state.chem2Pct) $('chem2Pct').value = state.chem2Pct;

    // Restore catalyst
    if (state.catalystEnabled !== undefined) {
      setCatalyst(state.catalystEnabled, false);
    }
    if (state.catalystPct) $('catalystPct').value = state.catalystPct;
  }
  updatePreview();
}

// ────────────────────────────────────────────────────────────────
//  TYPE CHANGE HANDLER
// ────────────────────────────────────────────────────────────────
function handleTypeChange(resetFields = true) {
  const type = $('propellantType').value;

  // Hide all conditional sections
  $('mixHeader').style.display = 'none';
  $('ratioGroup').style.display = 'none';
  $('chem1Row').style.display = 'none';
  $('chem2Row').style.display = 'none';
  $('catalystSection').style.display = 'none';

  if (!type) { updatePreview(); return; }

  $('mixHeader').style.display = '';
  $('chem1Row').style.display = '';
  $('chem2Row').style.display = '';

  if (type === 'Custom') {
    // Custom: editable name + percentage
    makeChemEditable('chem1Name', 'chem1Pct', 'Chemical Name 1', '');
    makeChemEditable('chem2Name', 'chem2Pct', 'Chemical Name 2', '');
    if (resetFields) {
      $('chem1Name').value = '';
      $('chem1Pct').value = '';
      $('chem2Name').value = '';
      $('chem2Pct').value = '';
    }
  } else {
    const preset = PRESETS[type];
    // Populate ratio dropdown
    $('ratioGroup').style.display = '';
    populateRatioDropdown(type);

    // Pre-fill chemical names (readonly for non-custom)
    makeChemReadonly('chem1Name', preset.chem1);
    makeChemReadonly('chem2Name', preset.chem2);
    if (resetFields) {
      $('chem1Pct').value = '';
      $('chem2Pct').value = '';
      $('mixRatio').value = '';
    }

    // Show catalyst section for KNDX only
    if (type === 'KNDX') {
      $('catalystSection').style.display = '';
      // Always reset to 'free' lock when type changes so buttons aren't stale-disabled
      if (resetFields) setCatalyst(false, false, 'free');
      else setCatalyst(catalystEnabled, false, 'free');
    }
  }

  $('previewBadge').textContent = type || '—';
  updatePreview();
}

// ────────────────────────────────────────────────────────────────
//  RATIO CHANGE HANDLER
// ────────────────────────────────────────────────────────────────
function handleRatioChange(resetCustom = true) {
  const type = $('propellantType').value;
  const idx = $('mixRatio').selectedIndex - 1; // -1 for placeholder
  if (!type || type === 'Custom' || idx < 0) return;

  const ratios = PRESETS[type].ratios;
  const ratio = ratios[idx];
  if (!ratio) return;

  const isCustomRatio = ratio.isCustom === true;

  // Set percentages
  if (!isCustomRatio) {
    $('chem1Pct').value = ratio.c1 !== null ? ratio.c1 : '';
    $('chem2Pct').value = ratio.c2 !== null ? ratio.c2 : '';
  } else {
    if (resetCustom) {
      $('chem1Pct').value = '';
      $('chem2Pct').value = '';
    }
  }

  // Handle KNDX catalyst — lock toggle based on preset
  if (type === 'KNDX') {
    if (!isCustomRatio) {
      // Preset ratio — catalyst state is FIXED
      if (ratio.hasCatalyst) {
        // Catalyst is REQUIRED for this ratio
        setCatalyst(true, false, 'locked-yes');   // lock YES on, NO disabled
        if (ratio.cat !== null) $('catalystPct').value = ratio.cat;
      } else {
        // No catalyst for this ratio
        setCatalyst(false, false, 'locked-no');   // lock NO on, YES disabled
        $('catalystPct').value = '';
      }
    } else {
      // Custom ratio — both buttons free
      setCatalyst(false, false, 'free');
      if (resetCustom) $('catalystPct').value = '';
    }
  }

  updatePreview();
}

// ────────────────────────────────────────────────────────────────
//  POPULATE RATIO DROPDOWN
// ────────────────────────────────────────────────────────────────
function populateRatioDropdown(type) {
  const sel = $('mixRatio');
  sel.innerHTML = '<option value="">— Select Mix Ratio —</option>';
  PRESETS[type].ratios.forEach((r, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = r.label;
    sel.appendChild(opt);
  });
}

// ────────────────────────────────────────────────────────────────
//  CHEMICAL NAME HELPERS
// ────────────────────────────────────────────────────────────────
function makeChemReadonly(nameId, value) {
  const el = $(nameId);
  el.value = value;
  el.readOnly = true;
  el.classList.add('readonly-field');
}
function makeChemEditable(nameId, pctId, namePlaceholder, defaultValue) {
  const el = $(nameId);
  el.value = defaultValue || '';
  el.readOnly = false;
  el.placeholder = namePlaceholder;
  el.classList.remove('readonly-field');
}

// ────────────────────────────────────────────────────────────────
//  CATALYST TOGGLE
// ────────────────────────────────────────────────────────────────
// lockMode: 'free' = both buttons clickable
//           'locked-yes' = YES active + NO disabled (ratio requires catalyst)
//           'locked-no'  = NO active  + YES disabled (ratio has no catalyst)
function setCatalyst(enabled, updatePreviewNow = true, lockMode = 'free') {
  catalystEnabled = enabled;
  const yesBtn  = $('catalystYesBtn');
  const noBtn   = $('catalystNoBtn');
  const grp     = $('catalystInputGroup');
  const prevRow = $('prev-catalyst-row');

  // Active classes
  yesBtn.className = 'toggle-btn' + (enabled  ? ' active'    : '');
  noBtn.className  = 'toggle-btn' + (!enabled ? ' active-no' : '');

  // Disable / enable based on lock mode
  const DISABLED_STYLE = 'opacity:0.35; cursor:not-allowed; pointer-events:none;';
  const ENABLED_STYLE  = '';
  if (lockMode === 'locked-yes') {
    // Catalyst is required — disable "No" button
    yesBtn.setAttribute('style', ENABLED_STYLE);
    noBtn.setAttribute('style', DISABLED_STYLE);
    noBtn.title = 'This mix ratio requires a catalyst';
  } else if (lockMode === 'locked-no') {
    // No catalyst — disable "Yes" button
    yesBtn.setAttribute('style', DISABLED_STYLE);
    yesBtn.title = 'This mix ratio has no catalyst';
    noBtn.setAttribute('style', ENABLED_STYLE);
    noBtn.title = '';
  } else {
    // Free: both buttons usable
    yesBtn.setAttribute('style', ENABLED_STYLE);
    noBtn.setAttribute('style', ENABLED_STYLE);
    yesBtn.title = '';
    noBtn.title  = '';
  }

  grp.style.display = enabled ? '' : 'none';
  if (prevRow) prevRow.style.display = enabled ? '' : 'none';

  if (!enabled) $('catalystPct').value = '';
  if (updatePreviewNow) updatePreview();
}

// ────────────────────────────────────────────────────────────────
//  GRAM CALCULATOR + LIVE PREVIEW
// ────────────────────────────────────────────────────────────────
function round2(n) { return Math.round(n * 100) / 100; }

function updatePreview() {
  const type = $('propellantType').value;
  const totalG = parseFloat($('totalGrams').value) || 0;
  const c1Pct = parseFloat($('chem1Pct').value) || 0;
  const c2Pct = parseFloat($('chem2Pct').value) || 0;
  const catPct = catalystEnabled ? (parseFloat($('catalystPct').value) || 0) : 0;
  const c1Name = $('chem1Name').value || 'Chemical 1';
  const c2Name = $('chem2Name').value || 'Chemical 2';
  const catName = $('catalystName').value || 'Red Iron Oxide (Fe₂O₃)';
  const cookT = $('cookTime').value;
  const propId = $('propellantId').value;

  const c1G = round2(totalG * c1Pct / 100);
  const c2G = round2(totalG * c2Pct / 100);
  const catG = round2(totalG * catPct / 100);
  const sumPct = round2(c1Pct + c2Pct + catPct);
  const totalCalc = round2(c1G + c2G + catG);

  // Populate preview cells
  $('prev-chem1-name').textContent = c1Name;
  $('prev-chem1-pct').textContent = c1Pct ? c1Pct + ' %' : '—';
  $('prev-chem1-grams').textContent = totalG && c1Pct ? c1G + ' g' : '— g';

  $('prev-chem2-name').textContent = c2Name;
  $('prev-chem2-pct').textContent = c2Pct ? c2Pct + ' %' : '—';
  $('prev-chem2-grams').textContent = totalG && c2Pct ? c2G + ' g' : '— g';

  $('prev-catalyst-name').textContent = catName;
  $('prev-catalyst-pct').textContent = catPct ? catPct + ' %' : '—';
  $('prev-catalyst-grams').textContent = totalG && catPct ? catG + ' g' : '— g';

  $('prev-total-pct').textContent = sumPct ? sumPct + ' %' : '—';
  $('prev-total-grams').textContent = totalCalc ? totalCalc + ' g' : '— g';

  // Percentage sum check
  const pctSumEl = $('pctSumValue');
  if (type) {
    $('pctSumDisplay').style.display = '';
    pctSumEl.textContent = sumPct + ' %';
    if (sumPct === 100) { pctSumEl.className = 'pct-ok'; }
    else if (sumPct > 100) { pctSumEl.className = 'pct-err'; }
    else if (sumPct >= 95) { pctSumEl.className = 'pct-warn'; }
    else { pctSumEl.className = 'pct-warn'; }
  } else {
    $('pctSumDisplay').style.display = 'none';
  }

  // Info chips
  if (type) {
    $('previewInfo').style.display = '';
    $('chip-type').textContent = type;
    $('chip-cook').textContent = cookT ? cookT + ' min' : '—';
    $('chip-id').textContent = propId || '—';
    $('previewPlaceholder').style.display = 'none';
  } else {
    $('previewInfo').style.display = 'none';
    $('previewPlaceholder').style.display = '';
  }
}

// ────────────────────────────────────────────────────────────────
//  FORM VALIDATION
// ────────────────────────────────────────────────────────────────
function validateForm() {
  const type = $('propellantType').value;
  const name = $('propellantName').value.trim();
  const c1Pct = parseFloat($('chem1Pct').value);
  const c2Pct = parseFloat($('chem2Pct').value);
  const catPct = catalystEnabled ? parseFloat($('catalystPct').value) : 0;
  const totalG = parseFloat($('totalGrams').value);
  const cookT = parseFloat($('cookTime').value);
  const desc = $('description').value.trim();

  if (!type) return 'Please select a Propellant Type.';
  if (!name) return 'Please enter a Propellant Name.';
  if (type !== 'Custom' && !$('mixRatio').value) return 'Please select a Mix Ratio.';
  if (!c1Pct) return 'Chemical 1 percentage is required.';
  if (!c2Pct) return 'Chemical 2 percentage is required.';
  if (!$('chem1Name').value.trim()) return 'Chemical 1 name is required.';
  if (!$('chem2Name').value.trim()) return 'Chemical 2 name is required.';
  if (catalystEnabled && !catPct) return 'Catalyst percentage is required when catalyst is enabled.';
  if (!totalG || totalG <= 0) return 'Total batch mass (grams) is required and must be > 0.';
  if (!cookT || cookT < 1) return 'Cook time is required and must be at least 1 minute.';
  if (!desc) return 'Description / Purpose is required.';

  const sumPct = c1Pct + c2Pct + (catalystEnabled ? catPct : 0);
  if (Math.abs(sumPct - 100) > 0.5) {
    return `Chemical percentages must sum to 100%. Current sum: ${round2(sumPct)}%`;
  }
  return null; // OK
}

// ────────────────────────────────────────────────────────────────
//  SHOW OUTPUT  (same pattern as shorturl.html)
// ────────────────────────────────────────────────────────────────
function showOutput(html, cssClass) {
  const out = $('output');
  out.innerHTML = html;
  out.className = cssClass;
  out.style.display = 'block';
  out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideOutput() {
  $('output').style.display = 'none';
  $('output').innerHTML = '';
  $('output').className = '';
}

// ────────────────────────────────────────────────────────────────
//  FORM SUBMISSION
// ────────────────────────────────────────────────────────────────
document.getElementById('propellantForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Validate
  const validErr = validateForm();
  if (validErr) {
    showOutput(`<strong>⚠️ Validation Error:</strong> ${validErr}`, 'error');
    return;
  }

  const submitBtn = $('submitBtn');
  submitBtn.disabled = true;


  // Collect data
  const propellantId = $('propellantId').value;
  const uniqueUid = $('uniqueUid').value;
  const submittedAt = $('recordedAt').value;
  const propName = $('propellantName').value.trim();
  const propType = $('propellantType').value;
  const mixRatioVal = $('mixRatio').value;
  const mixRatioLabel = $('mixRatio').options[$('mixRatio').selectedIndex]?.text || '';
  const c1Name = $('chem1Name').value.trim();
  const c1Pct = parseFloat($('chem1Pct').value);
  const c2Name = $('chem2Name').value.trim();
  const c2Pct = parseFloat($('chem2Pct').value);
  const catPct = catalystEnabled ? (parseFloat($('catalystPct').value) || 0) : 0;
  const catName = $('catalystName').value.trim();
  const totalG = parseFloat($('totalGrams').value);
  const cookTime = parseFloat($('cookTime').value);
  const description = $('description').value.trim();

  const c1G = round2(totalG * c1Pct / 100);
  const c2G = round2(totalG * c2Pct / 100);
  const catG = round2(totalG * catPct / 100);

  const payload = {
    action: 'submit',
    propellantId,
    uniqueUid,
    propellantName: propName,
    submittedAt,
    propellantType: propType,
    mixRatio: mixRatioLabel || propType,
    chem1Name: c1Name,
    chem1Percent: c1Pct,
    chem1Grams: c1G,
    chem2Name: c2Name,
    chem2Percent: c2Pct,
    chem2Grams: c2G,
    hasCatalyst: catalystEnabled,
    catalystName: catalystEnabled ? catName : '',
    catalystPercent: catPct,
    catalystGrams: catalystEnabled ? catG : 0,
    totalGrams: totalG,
    cookTimeMinutes: cookTime,
    description
  };

  // ── Loading sequence ──
  let msgIdx = 0;
  hideOutput(); // Hide any previous error message

  // Show inline loading area matching shorturl.html UI design
  const btnLoader = $('btnLoadingArea');
  const btnMsg = $('btnLoadingMsg');
  if (btnLoader) btnLoader.style.display = 'flex';
  if (btnMsg) {
    btnMsg.textContent = LOADING_MESSAGES[0];
    btnMsg.style.opacity = '1';
  }

  // Helper to hide button loader
  function hideBtnLoader() {
    if (btnLoader) btnLoader.style.display = 'none';
  }

  const loadInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
    if (btnMsg) {
      btnMsg.style.opacity = '0';
      setTimeout(() => {
        if (btnMsg) {
          btnMsg.textContent = LOADING_MESSAGES[msgIdx];
          btnMsg.style.opacity = '1';
        }
      }, 400);
    }
  }, LOADING_STEP_MS);

  const animationDone = new Promise(r => setTimeout(r, LOADING_MESSAGES.length * LOADING_STEP_MS));

  try {
    // ── Check for ID/UID conflicts (GET – no preflight) ──────────────────
    const checkUrl = `${APPS_SCRIPT_URL}?action=checkId&propellantId=${encodeURIComponent(propellantId)}&uniqueUid=${encodeURIComponent(uniqueUid)}`;
    const checkRes = await fetch(checkUrl);
    const checkData = await checkRes.json();

    if (checkData.exists) {
      clearInterval(loadInterval);
      // Auto-advance ID
      getNextCounter();
      const n2 = peekCounter();
      $('propellantId').value = buildPropellantId(n2);
      $('uniqueUid').value = buildUniqueUid(n2);
      // Retry once
      payload.propellantId = $('propellantId').value;
      payload.uniqueUid = $('uniqueUid').value;
    }

    // Submit + wait for animation
    // Use URLSearchParams (application/x-www-form-urlencoded) — no CORS preflight!
    const fetchDone = fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      body: new URLSearchParams(payload)
    });

    const [_, res] = await Promise.all([animationDone, fetchDone]);
    clearInterval(loadInterval);
    hideBtnLoader();

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message || result.error || 'Server returned an error.');
    }

    // ── Success ──
    // Increment counter and generate new IDs for next batch
    getNextCounter();
    const newN = peekCounter();
    const newId = buildPropellantId(newN);
    const newUid = buildUniqueUid(newN);

    // Save to local history
    saveLocalHistory({
      propellantId, uniqueUid, propellantName: propName,
      propellantType: propType, submittedAt, status: 'Pending',
      totalGrams: totalG, cookTimeMinutes: cookTime
    });

    // Mark old state as submitted
    const state = loadFormState() || {};
    state._submitted = true;
    localStorage.setItem(SK.formState, JSON.stringify(state));

    showOutput(`
      <p style="font-size:1.15em;color:var(--success-color);font-weight:700;margin-bottom:14px;">
        ✅ Propellant Batch Submitted Successfully!
      </p>
      <div style="background:rgba(56,193,114,0.08);border:1px solid var(--success-color);border-radius:10px;padding:16px 20px;margin-bottom:14px;font-size:14px;line-height:1.8;">
        <b>Batch ID:</b> ${propellantId}<br>
        <b>UID:</b> ${uniqueUid}<br>
        <b>Name:</b> ${propName}<br>
        <b>Type:</b> ${propType} | <b>Ratio:</b> ${payload.mixRatio}<br>
        <b>Sheet:</b> ${result.sheetName || propellantId}
      </div>
      <p style="color:var(--muted);font-size:13px;">
        🍳 Cook time: <b>${cookTime} min</b>. 
        After cooking, go to the <b>History section below</b> to update the batch status.
      </p>
      <p style="color:var(--muted);font-size:12px;margin-top:8px;">
        Next batch ID ready: <b style="color:var(--accent)">${newId}</b>
      </p>`, 'success');

    // Reset form and prepare new batch
    document.getElementById('propellantForm').reset();
    clearConditionalUI();
    $('propellantId').value = newId;
    $('uniqueUid').value = newUid;
    $('recordedAt').value = buildTimestamp();

    // Clear form state for next batch
    localStorage.removeItem(SK.formState);

    // Refresh history list
    loadHistoryList();

  } catch (err) {
    clearInterval(loadInterval);
    hideBtnLoader();
    console.error('Submit error:', err);
    showOutput(`<strong>❌ Submission Failed:</strong> ${err.message}<br>
      <small style="color:var(--muted)">Please check your Apps Script URL and try again.</small>`, 'error');
    submitBtn.disabled = false;
  }
});

// Reset conditional UI after submission
function clearConditionalUI() {
  $('mixHeader').style.display = 'none';
  $('ratioGroup').style.display = 'none';
  $('chem1Row').style.display = 'none';
  $('chem2Row').style.display = 'none';
  $('catalystSection').style.display = 'none';
  $('previewBadge').textContent = '—';
  $('previewInfo').style.display = 'none';
  $('pctSumDisplay').style.display = 'none';
  $('previewPlaceholder').style.display = '';
  catalystEnabled = false;
  setCatalyst(false, false, 'free'); // Unlock both catalyst buttons
  updatePreview();
}

// ────────────────────────────────────────────────────────────────
//  LOCAL HISTORY MANAGEMENT
// ────────────────────────────────────────────────────────────────
function saveLocalHistory(entry) {
  const hist = getLocalHistory();
  hist.unshift(entry);
  localStorage.setItem(SK.history, JSON.stringify(hist.slice(0, 100)));
}
function getLocalHistory() {
  try { return JSON.parse(localStorage.getItem(SK.history) || '[]'); }
  catch { return []; }
}

// ────────────────────────────────────────────────────────────────
//  HISTORY – LOAD LIST (from sheet + local)
// ────────────────────────────────────────────────────────────────
async function loadHistoryList() {
  const sel = $('historySelect');
  sel.innerHTML = '<option value="">— Loading... —</option>';

  let remoteData = [];
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getAll`);
    const result = await res.json();
    if (result.success) remoteData = result.data || [];
  } catch (e) {
    console.warn('Could not fetch remote history:', e);
  }

  // Merge with local history
  const localData = getLocalHistory();
  const remoteIds = new Set(remoteData.map(d => d.propellantId));
  const localOnly = localData.filter(d => !remoteIds.has(d.propellantId));
  const allData = [...remoteData, ...localOnly];

  sel.innerHTML = '<option value="">— Select a Propellant Batch —</option>';
  if (allData.length === 0) {
    sel.innerHTML += '<option value="" disabled>No batches found</option>';
    return;
  }

  allData.forEach(entry => {
    const opt = document.createElement('option');
    opt.value = entry.propellantId;
    // Status badge
    const badge = entry.status && entry.status !== 'Pending'
      ? ` [${entry.status}]` : ' [Pending]';
    // Date/time — shorten if too long
    const dt = entry.submittedAt
      ? ' | ' + String(entry.submittedAt).replace(/\s+/g, ' ').trim()
      : '';
    const label = entry.name || entry.propellantName || '';
    opt.textContent = `${entry.propellantId} — ${label}${dt}${badge}`;
    sel.appendChild(opt);
  });
}

// ────────────────────────────────────────────────────────────────
//  HISTORY – LOAD ONE ENTRY
// ────────────────────────────────────────────────────────────────
async function loadHistoryEntry() {
  const propellantId = $('historySelect').value;
  if (!propellantId) {
    alert('Please select a propellant from the dropdown first.');
    return;
  }

  const display = $('historyDisplay');
  const loading = $('historyLoading');
  display.style.display = 'none';
  loading.style.display = '';

  let data = null;
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getOne&propellantId=${encodeURIComponent(propellantId)}`);
    const result = await res.json();
    if (result.success && result.data && Object.keys(result.data).length > 0) {
      data = result.data;
    }
  } catch (e) {
    console.warn('Remote getOne fetch error:', e);
  }

  // Fallback to local history cache if remote fetch failed or returned empty
  if (!data) {
    const local = getLocalHistory().find(d => d.propellantId === propellantId);
    if (local) data = local;
  }

  loading.style.display = 'none';

  if (!data) {
    display.innerHTML = `<div class="history-card">
      <p style="color:var(--muted);text-align:center;">Could not load data for <b>${propellantId}</b>. Check connection.</p>
    </div>`;
    display.style.display = '';
    return;
  }

  // Robust parsing for vertical key-value / flat object keys
  const pId = data['Propellant ID'] || data.propellantId || propellantId;
  const uid = data['Unique UID'] || data.uniqueUid || '';
  const pName = data['Propellant Name'] || data.name || data.propellantName || '';
  const pType = data['Propellant Type'] || data.propellantType || data.type || '';
  const ratio = data['Mix Ratio'] || data.mixRatio || '';
  const c1n = data['Chemical 1 Name'] || data.chem1Name || '';
  const c1p = parseFloat(data['Chemical 1 %'] !== undefined ? data['Chemical 1 %'] : data.chem1Percent) || 0;
  const c1g = parseFloat(data['Chemical 1 Grams (g)'] !== undefined ? data['Chemical 1 Grams (g)'] : data.chem1Grams) || 0;
  const c2n = data['Chemical 2 Name'] || data.chem2Name || '';
  const c2p = parseFloat(data['Chemical 2 %'] !== undefined ? data['Chemical 2 %'] : data.chem2Percent) || 0;
  const c2g = parseFloat(data['Chemical 2 Grams (g)'] !== undefined ? data['Chemical 2 Grams (g)'] : data.chem2Grams) || 0;

  const rawCat = data['Has Catalyst'] !== undefined ? data['Has Catalyst'] : data.hasCatalyst;
  const hasCat = String(rawCat).toLowerCase() === 'true';

  const catNm = data['Catalyst Name'] || data.catalystName || '';
  const catP = parseFloat(data['Catalyst %'] !== undefined ? data['Catalyst %'] : data.catalystPercent) || 0;
  const catG = parseFloat(data['Catalyst Grams (g)'] !== undefined ? data['Catalyst Grams (g)'] : data.catalystGrams) || 0;
  const totG = parseFloat(data['Total Grams (g)'] !== undefined ? data['Total Grams (g)'] : data.totalGrams) || 0;
  const cookTm = parseFloat(data['Cook Time (min)'] !== undefined ? data['Cook Time (min)'] : data.cookTimeMinutes) || 0;
  const desc = data['Description / Purpose'] !== undefined ? data['Description / Purpose'] : (data.description || '');
  const status = data['Status'] || data.status || 'Pending';
  const stDesc = data['Status Description'] || data.statusDescription || '';
  const stAt = data['Status Updated At'] || data.statusUpdatedAt || '';
  const submAt = data['Submitted At'] || data.submittedAt || '';

  const statusClass = {
    Pending: 'status-pending', Success: 'status-success',
    Failure: 'status-failure', OK: 'status-ok'
  }[status] || 'status-pending';

  const catalystRow = hasCat && catNm ? `
    <tr>
      <td style="color:#ff9f43">${catNm}</td>
      <td style="text-align:center;color:#ff9f43">${catP}%</td>
      <td style="text-align:right;color:#ff9f43">${catG} g</td>
    </tr>` : '';

  // Escaped strings for JS inline call
  const escName  = String(pName).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const escRatio = String(ratio).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const escDesc  = String(desc).replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n');

  display.innerHTML = `
    <div class="history-card">
      <div class="history-card-header">
        <div>
          <div class="history-card-title">🔬 ${pName || pId}</div>
          <div class="history-card-id">ID: ${pId} &nbsp;|&nbsp; UID: ${uid}</div>
          <div class="history-card-id" style="margin-top:4px">Submitted: ${submAt}</div>
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
          <button type="button" class="history-edit-toggle-btn"
                  onclick="openEditModal('${pId}', '${uid}', '${escName}', '${escRatio}', ${cookTm}, '${escDesc}')"
                  title="Edit Batch Details">
            ✏️ Edit Details
          </button>
          <span class="status-badge ${statusClass}">${status}</span>
        </div>
      </div>

      <div class="history-data-grid">
        <div class="history-data-item">
          <div class="history-data-label">Type</div>
          <div class="history-data-value">${pType}</div>
        </div>
        <div class="history-data-item">
          <div class="history-data-label">Mix Ratio</div>
          <div class="history-data-value">${ratio}</div>
        </div>
        <div class="history-data-item">
          <div class="history-data-label">Total Batch</div>
          <div class="history-data-value">${totG} g</div>
        </div>
        <div class="history-data-item">
          <div class="history-data-label">Cook Time</div>
          <div class="history-data-value">${cookTm} min</div>
        </div>
      </div>

      <table class="history-chem-table">
        <thead>
          <tr>
            <th>Chemical</th>
            <th style="text-align:center">%</th>
            <th style="text-align:right">Grams</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${c1n}</td>
            <td style="text-align:center">${c1p}%</td>
            <td style="text-align:right">${c1g} g</td>
          </tr>
          <tr>
            <td>${c2n}</td>
            <td style="text-align:center">${c2p}%</td>
            <td style="text-align:right">${c2g} g</td>
          </tr>
          ${catalystRow}
          <tr class="total-row">
            <td><b>TOTAL</b></td>
            <td style="text-align:center"><b>100%</b></td>
            <td style="text-align:right"><b>${totG} g</b></td>
          </tr>
        </tbody>
      </table>

      ${desc ? `<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px 16px;margin-bottom:18px;">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:6px;">Description / Purpose</div>
        <div style="font-size:14px;line-height:1.6;">${desc}</div>
      </div>` : ''}

      ${stDesc ? `<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px 16px;margin-bottom:18px;">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:6px;">Status Note</div>
        <div style="font-size:14px;color:var(--muted)">${stDesc}</div>
        ${stAt ? `<div style="font-size:12px;color:var(--muted);margin-top:4px">Updated: ${stAt}</div>` : ''}
      </div>` : ''}

      <!-- 🔄 Status Update Form -->
      <div class="status-update-form" style="margin-top:16px;">
        <h4>🔄 Update Status After Cook</h4>
        <div class="status-options">
          <button class="status-opt-btn opt-success" onclick="selectStatus('Success')">✅ Success</button>
          <button class="status-opt-btn opt-failure" onclick="selectStatus('Failure')">❌ Failure</button>
          <button class="status-opt-btn opt-ok"      onclick="selectStatus('OK')">🟡 OK</button>
        </div>
        <div class="field-group">
          <label style="font-size:13px;color:var(--muted)">Status Description (optional)</label>
          <textarea id="statusDescInput" placeholder="Describe the outcome, observations, burn characteristics..." rows="3"></textarea>
        </div>
        <button class="status-submit-btn" id="statusSubmitBtn"
          onclick="submitStatusUpdate('${pId}', '${uid}')">
          💾 Save Status Update
        </button>
      </div>
    </div>`;

  display.style.display = '';
  selectedStatus = status === 'Pending' ? '' : status;
  // Re-highlight if already has a status
  if (selectedStatus && selectedStatus !== 'Pending') selectStatus(selectedStatus);
  display.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ────────────────────────────────────────────────────────────────
//  STATUS UPDATE HANDLERS
// ────────────────────────────────────────────────────────────────
function selectStatus(val) {
  selectedStatus = val;
  document.querySelectorAll('.status-opt-btn').forEach(btn => btn.classList.remove('selected'));
  const selectorMap = { Success: '.opt-success', Failure: '.opt-failure', OK: '.opt-ok' };
  const targetClass = selectorMap[val];
  if (targetClass) {
    const btn = document.querySelector(targetClass);
    if (btn) btn.classList.add('selected');
  }
}

async function submitStatusUpdate(propellantId, uniqueUid) {
  if (!selectedStatus) {
    alert('Please select a status (Success / Failure / OK) first.');
    return;
  }
  const statusDesc = $('statusDescInput')?.value?.trim() || '';
  const btn = $('statusSubmitBtn');
  if (btn) btn.disabled = true;

  try {
    const payload = {
      action: 'updateStatus',
      propellantId,
      uniqueUid,
      status: selectedStatus,
      statusDescription: statusDesc,
      updatedAt: new Date().toISOString()
    };

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      body: new URLSearchParams(payload)
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || result.error);

    // Update local history cache
    const hist = getLocalHistory().map(h => {
      if (h.propellantId === propellantId) {
        h.status = selectedStatus;
      }
      return h;
    });
    localStorage.setItem(SK.history, JSON.stringify(hist));

    // Show success feedback
    if (btn) {
      btn.textContent = '✅ Status Updated!';
      btn.style.background = 'var(--success-color)';
      btn.style.color = '#fff';
    }

    // Refresh history dropdown & reload history entry display
    await loadHistoryList();
    $('historySelect').value = propellantId;
    await loadHistoryEntry();

  } catch (err) {
    console.error('Status update error:', err);
    alert('Failed to update status: ' + err.message);
    if (btn) btn.disabled = false;
  }
}


// ────────────────────────────────────────────────────────────────
//  EDIT DETAILS POPUP MODAL HANDLERS
// ────────────────────────────────────────────────────────────────
function openEditModal(pId, uid, pName, ratio, cookTm, desc) {
  $('editPropellantId').value = pId || '';
  $('editUniqueUid').value    = uid || '';
  $('editPropName').value     = pName || '';
  $('editMixRatio').value     = ratio || '';
  $('editCookTime').value     = cookTm || '';
  $('editPropDesc').value     = desc || '';
  $('editModalTitle').textContent = `✏️ Edit Batch Details — ${pId}`;

  const modal = $('editModalOverlay');
  if (modal) modal.style.display = 'flex';
}

function closeEditModal() {
  const modal = $('editModalOverlay');
  if (modal) modal.style.display = 'none';
}

async function saveHistoryEdit() {
  const propellantId = $('editPropellantId').value;
  const uniqueUid    = $('editUniqueUid').value;
  const newName      = $('editPropName').value.trim();
  const newRatio     = $('editMixRatio').value.trim();
  const newCookTime  = parseFloat($('editCookTime').value) || 0;
  const newDesc      = $('editPropDesc').value.trim();
  const btn          = $('editSaveBtn');

  if (!newName) {
    alert('Propellant name cannot be empty.');
    $('editPropName').focus();
    return;
  }

  if (btn) btn.disabled = true;

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST', mode: 'cors',
      body: new URLSearchParams({
        action: 'updateDetails',
        propellantId,
        uniqueUid,
        propellantName: newName,
        mixRatio: newRatio,
        cookTimeMinutes: newCookTime,
        description: newDesc
      })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || result.error);

    // Update local history cache
    const hist = getLocalHistory().map(h => {
      if (h.propellantId === propellantId) {
        h.propellantName = newName;
        h.name = newName;
        h.mixRatio = newRatio;
        h.cookTimeMinutes = newCookTime;
        h.description = newDesc;
      }
      return h;
    });
    localStorage.setItem(SK.history, JSON.stringify(hist));

    closeEditModal();

    // Refresh history dropdown & reload history entry display
    await loadHistoryList();
    $('historySelect').value = propellantId;
    await loadHistoryEntry();

  } catch (err) {
    console.error('Edit save error:', err);
    alert('Failed to save changes: ' + err.message);
    if (btn) btn.disabled = false;
  }
}

// ────────────────────────────────────────────────────────────────
//  CLEAR ALL FORM
// ────────────────────────────────────────────────────────────────
function clearAllForm() {
  if (!confirm('Clear all entered data and start a fresh batch?')) return;

  // Reset the HTML form
  document.getElementById('propellantForm').reset();

  // Reset conditional UI
  clearConditionalUI();

  // Generate fresh IDs for the next batch
  const n = peekCounter();
  $('propellantId').value = buildPropellantId(n);
  $('uniqueUid').value    = buildUniqueUid(n);
  $('recordedAt').value   = buildTimestamp();

  // Remove saved form state
  localStorage.removeItem(SK.formState);

  // Hide output box
  hideOutput();

  // Scroll to top of form
  $('formSection')?.scrollIntoView({ behavior: 'smooth' });
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}
document.addEventListener('click', function (e) {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.querySelector('.hamburger');
  if (sidebar.classList.contains('active')
    && !sidebar.contains(e.target)
    && !hamburger.contains(e.target)) {
    sidebar.classList.remove('active');
  }
});

// ────────────────────────────────────────────────────────────────
//  INTERSECTION OBSERVER (same as shorturl.html)
// ────────────────────────────────────────────────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('show'); });
}, { threshold: 0.05 });
document.querySelectorAll('.section').forEach(s => observer.observe(s));

// ────────────────────────────────────────────────────────────────
//  FALLING STARS  (same as shorturl.html)
// ────────────────────────────────────────────────────────────────
(function createStars() {
  const container = document.getElementById('starsContainer');
  for (let i = 0; i < 200; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    const sz = Math.random() * 3 + 1;
    star.style.cssText = `
      width:${sz}px; height:${sz}px;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      animation: fall ${Math.random() * 5 + 3}s linear ${Math.random() * 5}s infinite;
    `;
    container.appendChild(star);
  }
})();

// ────────────────────────────────────────────────────────────────
//  EVENT LISTENERS – auto-save + preview
// ────────────────────────────────────────────────────────────────
$('propellantType').addEventListener('change', () => { handleTypeChange(); saveFormState(); });
$('mixRatio').addEventListener('change', () => { handleRatioChange(); saveFormState(); });

['propellantName', 'chem1Name', 'chem1Pct', 'chem2Name', 'chem2Pct', 'catalystPct',
  'totalGrams', 'cookTime', 'description'].forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('input', () => { updatePreview(); saveFormState(); });
      el.addEventListener('change', () => { updatePreview(); saveFormState(); });
    }
  });


// ────────────────────────────────────────────────────────────────
//  INIT
// ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  initBatchIds();
  restoreFormState();
  loadHistoryList();
  updatePreview();
});
