/* ================================================================
   TENACITY – Propellant Batch Tracker
   app.js – All frontend logic
   ================================================================ */

'use strict';

// ────────────────────────────────────────────────────────────────
//  CONFIG  — Paste your deployed Apps Script URL below
// ────────────────────────────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyFkdkxJ_IaIMFVsKIpnV_OqIHgtOyTOiTNSvb2_Y9Lc9Ov77ncqTI650vJN8mChiaSw/exec';

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
//  LOADING MESSAGES
// ────────────────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  '🔬 Validating Propellant Data...',
  '🛡️ Verifying Unique ID Against Database...',
  '📡 Connecting to Lab Spreadsheet...',
  '📊 Writing Batch Data to New Sheet...',
];
const LOADING_STEP_MS = 1750;

// ────────────────────────────────────────────────────────────────
//  DOM REFS & STATE
// ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

let catalystEnabled = false;
let selectedStatus = '';
let uploadedImages = []; // Array of { id, name, dataUrl }
let mediaStream = null;

// ── PHOTO CAPTURE & UPLOAD HANDLERS ──────────────────────────────────────
async function startLiveCamera() {
  const cameraArea = $('cameraArea');
  const video = $('cameraVideo');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Camera API is not supported in this browser.');
    return;
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    if (video) video.srcObject = mediaStream;
    if (cameraArea) cameraArea.style.display = 'block';
  } catch (err) {
    console.error('Camera access error:', err);
    alert('Could not access live camera: ' + err.message);
  }
}

function stopLiveCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }
  const cameraArea = $('cameraArea');
  if (cameraArea) cameraArea.style.display = 'none';
}

function compressImage(dataUrl, maxDim = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function capturePhoto() {
  const video = $('cameraVideo');
  const canvas = $('cameraCanvas');
  if (!video || !canvas) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const raw = canvas.toDataURL('image/jpeg', 0.85);
  const compressed = await compressImage(raw);
  const photoIndex = uploadedImages.length + 1;
  addPhotoToGallery(compressed, `Camera_Photo_${photoIndex}.jpg`);
}

function handleFileSelect(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  processSelectedImageFiles(Array.from(files));
  event.target.value = '';
}

function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  const dz = $('dropZone');
  if (dz) dz.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  const dz = $('dropZone');
  if (dz) dz.classList.remove('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const dz = $('dropZone');
  if (dz) dz.classList.remove('drag-over');

  const files = event.dataTransfer && event.dataTransfer.files;
  if (!files || files.length === 0) return;
  processSelectedImageFiles(Array.from(files));
}

async function processSelectedImageFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const compressed = await compressImage(e.target.result);
        addPhotoToGallery(compressed, file.name);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }
}

function addPhotoToGallery(dataUrl, name) {
  uploadedImages.push({
    id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name: name || `photo_${uploadedImages.length + 1}.jpg`,
    dataUrl: dataUrl
  });
  renderPhotoGallery();
}

function removePhotoFromGallery(imgId) {
  uploadedImages = uploadedImages.filter(img => img.id !== imgId);
  renderPhotoGallery();
}

function clearAllPhotos() {
  uploadedImages = [];
  renderPhotoGallery();
  const fileInput = $('imageFileInput');
  if (fileInput) fileInput.value = '';
}

function renderPhotoGallery() {
  const previewContainer = $('photoPreviewContainer');
  const countBadge = $('photoCountBadge');
  const grid = $('photoGalleryGrid');
  if (!previewContainer || !grid) return;

  if (countBadge) countBadge.textContent = uploadedImages.length;

  if (uploadedImages.length === 0) {
    previewContainer.style.display = 'none';
    grid.innerHTML = '';
    return;
  }

  previewContainer.style.display = 'flex';
  grid.innerHTML = uploadedImages.map((img, idx) => `
    <div class="gallery-item-card" title="${img.name}">
      <img src="${img.dataUrl}" alt="${img.name}">
      <button type="button" class="remove-item-btn" onclick="removePhotoFromGallery('${img.id}')" title="Remove photo">✕</button>
      <span class="gallery-item-index">#${idx + 1}</span>
    </div>
  `).join('');
}

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
    propellantId: $('propellantId')?.value || '',
    uniqueUid: $('uniqueUid')?.value || '',
    recordedAt: $('recordedAt')?.value || '',
    propellantName: $('propellantName')?.value || '',
    propellantType: $('propellantType')?.value || '',
    mixRatio: $('mixRatio')?.value || '',
    chem1Name: $('chem1Name')?.value || '',
    chem1Pct: $('chem1Pct')?.value || '',
    chem2Name: $('chem2Name')?.value || '',
    chem2Pct: $('chem2Pct')?.value || '',
    catalystEnabled,
    catalystPct: $('catalystPct')?.value || '',
    totalGrams: $('totalGrams')?.value || '',
    cookTime: $('cookTime')?.value || '',
    description: $('description')?.value || '',
    motorInnerDia: $('motorInnerDia')?.value || '',
    motorOuterDia: $('motorOuterDia')?.value || '',
    motorLength: $('motorLength')?.value || '',
    motorType: $('motorType')?.value || '',
    motorCasingMass: $('motorCasingMass')?.value || '',
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

  if (state.propellantName && $('propellantName')) $('propellantName').value = state.propellantName;
  if (state.cookTime && $('cookTime')) $('cookTime').value = state.cookTime;
  if (state.description && $('description')) $('description').value = state.description;
  if (state.totalGrams && $('totalGrams')) $('totalGrams').value = state.totalGrams;
  if (state.motorInnerDia && $('motorInnerDia')) $('motorInnerDia').value = state.motorInnerDia;
  if (state.motorOuterDia && $('motorOuterDia')) $('motorOuterDia').value = state.motorOuterDia;
  if (state.motorLength && $('motorLength')) $('motorLength').value = state.motorLength;
  if (state.motorType && $('motorType')) $('motorType').value = state.motorType;
  if (state.motorCasingMass && $('motorCasingMass')) $('motorCasingMass').value = state.motorCasingMass;

  if (state.propellantType && $('propellantType')) {
    $('propellantType').value = state.propellantType;
    handleTypeChange(false);

    if (state.mixRatio && $('mixRatio')) {
      $('mixRatio').value = state.mixRatio;
      handleRatioChange(false);
    }
    if (state.chem1Name && $('chem1Name')) $('chem1Name').value = state.chem1Name;
    if (state.chem1Pct && $('chem1Pct')) $('chem1Pct').value = state.chem1Pct;
    if (state.chem2Name && $('chem2Name')) $('chem2Name').value = state.chem2Name;
    if (state.chem2Pct && $('chem2Pct')) $('chem2Pct').value = state.chem2Pct;

    if (state.catalystEnabled !== undefined) {
      setCatalyst(state.catalystEnabled, false);
    }
    if (state.catalystPct && $('catalystPct')) $('catalystPct').value = state.catalystPct;
  }
  calcTotalAssemblyMass();
  updatePreview();
}

// Auto-calculate total assembly mass (propellant + motor casing)
function calcTotalAssemblyMass() {
  const propG = parseFloat($('totalGrams')?.value) || 0;
  const casingG = parseFloat($('motorCasingMass')?.value) || 0;
  const total = propG + casingG;
  const el = $('totalAssemblyMass');
  if (el) el.value = total > 0 ? total.toFixed(2) : '';
}

// ────────────────────────────────────────────────────────────────
//  TYPE CHANGE HANDLER
// ────────────────────────────────────────────────────────────────
function handleTypeChange(resetFields = true) {
  const type = $('propellantType').value;

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
    $('ratioGroup').style.display = '';
    populateRatioDropdown(type);

    makeChemReadonly('chem1Name', preset.chem1);
    makeChemReadonly('chem2Name', preset.chem2);
    if (resetFields) {
      $('chem1Pct').value = '';
      $('chem2Pct').value = '';
      $('mixRatio').value = '';
    }

    if (type === 'KNDX') {
      $('catalystSection').style.display = '';
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
  const idx = $('mixRatio').selectedIndex - 1;
  if (!type || type === 'Custom' || idx < 0) return;

  const ratios = PRESETS[type].ratios;
  const ratio = ratios[idx];
  if (!ratio) return;

  const isCustomRatio = ratio.isCustom === true;

  if (!isCustomRatio) {
    $('chem1Pct').value = ratio.c1 !== null ? ratio.c1 : '';
    $('chem2Pct').value = ratio.c2 !== null ? ratio.c2 : '';
  } else {
    if (resetCustom) {
      $('chem1Pct').value = '';
      $('chem2Pct').value = '';
    }
  }

  if (type === 'KNDX') {
    if (!isCustomRatio) {
      if (ratio.hasCatalyst) {
        setCatalyst(true, false, 'locked-yes');
        if (ratio.cat !== null) $('catalystPct').value = ratio.cat;
      } else {
        setCatalyst(false, false, 'locked-no');
        $('catalystPct').value = '';
      }
    } else {
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
function setCatalyst(enabled, updatePreviewNow = true, lockMode = 'free') {
  catalystEnabled = enabled;
  const yesBtn = $('catalystYesBtn');
  const noBtn = $('catalystNoBtn');
  const grp = $('catalystInputGroup');
  const prevRow = $('prev-catalyst-row');

  yesBtn.className = 'toggle-btn' + (enabled ? ' active' : '');
  noBtn.className = 'toggle-btn' + (!enabled ? ' active-no' : '');

  const DISABLED_STYLE = 'opacity:0.35; cursor:not-allowed; pointer-events:none;';
  const ENABLED_STYLE = '';
  if (lockMode === 'locked-yes') {
    yesBtn.setAttribute('style', ENABLED_STYLE);
    noBtn.setAttribute('style', DISABLED_STYLE);
    noBtn.title = 'This mix ratio requires a catalyst';
  } else if (lockMode === 'locked-no') {
    yesBtn.setAttribute('style', DISABLED_STYLE);
    yesBtn.title = 'This mix ratio has no catalyst';
    noBtn.setAttribute('style', ENABLED_STYLE);
    noBtn.title = '';
  } else {
    yesBtn.setAttribute('style', ENABLED_STYLE);
    noBtn.setAttribute('style', ENABLED_STYLE);
    yesBtn.title = '';
    noBtn.title = '';
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

  const pctSumEl = $('pctSumValue');
  if (type) {
    $('pctSumDisplay').style.display = '';
    pctSumEl.textContent = sumPct + ' %';
    if (sumPct === 100) { pctSumEl.className = 'pct-ok'; }
    else if (sumPct > 100) { pctSumEl.className = 'pct-err'; }
    else { pctSumEl.className = 'pct-warn'; }
  } else {
    $('pctSumDisplay').style.display = 'none';
  }

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
  const type = $('propellantType')?.value || '';
  const name = $('propellantName')?.value?.trim() || '';
  const c1Pct = parseFloat($('chem1Pct')?.value) || 0;
  const c2Pct = parseFloat($('chem2Pct')?.value) || 0;
  const catPct = catalystEnabled ? (parseFloat($('catalystPct')?.value) || 0) : 0;
  const totalG = parseFloat($('totalGrams')?.value) || 0;
  const cookT = parseFloat($('cookTime')?.value) || 0;
  const desc = $('description')?.value?.trim() || '';

  if (!type) return 'Please select a Propellant Type.';
  if (!name) return 'Please enter a Propellant Name.';
  if (type !== 'Custom' && !$('mixRatio')?.value) return 'Please select a Mix Ratio.';
  if (!c1Pct) return 'Chemical 1 percentage is required.';
  if (!c2Pct) return 'Chemical 2 percentage is required.';
  if (!$('chem1Name')?.value?.trim()) return 'Chemical 1 name is required.';
  if (!$('chem2Name')?.value?.trim()) return 'Chemical 2 name is required.';
  if (catalystEnabled && !catPct) return 'Catalyst percentage is required when catalyst is enabled.';
  if (!totalG || totalG <= 0) return 'Total batch mass (grams) is required and must be > 0.';
  if (!cookT || cookT < 1) return 'Cook time is required and must be at least 1 minute.';
  if (!desc) return 'Description / Purpose is required.';

  // Motor Casing fields are required (mandatory)
  const motorInner = parseFloat($('motorInnerDia')?.value) || 0;
  const motorOuter = parseFloat($('motorOuterDia')?.value) || 0;
  const motorLen = parseFloat($('motorLength')?.value) || 0;
  const motorMat = $('motorType')?.value?.trim() || '';
  const casingMass = parseFloat($('motorCasingMass')?.value) || 0;

  if (!motorInner || motorInner <= 0) return 'Motor Casing Inner Diameter (mm) is required and must be > 0.';
  if (!motorOuter || motorOuter <= 0) return 'Motor Casing Outer Diameter (mm) is required and must be > 0.';
  if (motorOuter <= motorInner) return 'Motor Casing Outer Diameter must be greater than Inner Diameter.';
  if (!motorLen || motorLen <= 0) return 'Motor Length (mm) is required and must be > 0.';
  if (!motorMat) return 'Motor Casing Material is required.';
  if (!casingMass || casingMass <= 0) return 'Motor Casing Mass (g) is required and must be > 0.';

  const sumPct = c1Pct + c2Pct + (catalystEnabled ? catPct : 0);
  if (Math.abs(sumPct - 100) > 0.5) {
    return `Chemical percentages must sum to 100%. Current sum: ${round2(sumPct)}%`;
  }

  // Photos are mandatory (1 or more required)
  if (uploadedImages.length === 0) {
    return 'At least one Batch / Burn Photo is required (mandatory). Please capture or upload a photo.';
  }

  return null;
}

// ────────────────────────────────────────────────────────────────
//  SHOW OUTPUT
// ────────────────────────────────────────────────────────────────
function showOutput(html, cssClass) {
  const out = $('output');
  if (!out) return;
  out.innerHTML = html;
  out.className = cssClass;
  out.style.display = 'block';
  out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideOutput() {
  const out = $('output');
  if (!out) return;
  out.style.display = 'none';
  out.innerHTML = '';
  out.className = '';
}

// ────────────────────────────────────────────────────────────────
//  FORM SUBMISSION
// ────────────────────────────────────────────────────────────────
document.getElementById('propellantForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const validErr = validateForm();
  if (validErr) {
    showOutput(`<strong>⚠️ Validation Error:</strong> ${validErr}`, 'error');
    return;
  }

  const submitBtn = $('submitBtn');
  if (submitBtn) submitBtn.disabled = true;

  const propellantId = $('propellantId')?.value || '';
  const uniqueUid = $('uniqueUid')?.value || '';
  const submittedAt = $('recordedAt')?.value || '';
  const propName = $('propellantName')?.value?.trim() || '';
  const propType = $('propellantType')?.value || '';
  const mixRatioEl = $('mixRatio');
  const mixRatioLabel = (mixRatioEl && mixRatioEl.selectedIndex >= 0)
    ? mixRatioEl.options[mixRatioEl.selectedIndex]?.text || ''
    : '';
  const c1Name = $('chem1Name')?.value?.trim() || '';
  const c1Pct = parseFloat($('chem1Pct')?.value) || 0;
  const c2Name = $('chem2Name')?.value?.trim() || '';
  const c2Pct = parseFloat($('chem2Pct')?.value) || 0;
  const catPct = catalystEnabled ? (parseFloat($('catalystPct')?.value) || 0) : 0;
  const catName = $('catalystName')?.value?.trim() || '';
  const totalG = parseFloat($('totalGrams')?.value) || 0;
  const cookTime = parseFloat($('cookTime')?.value) || 0;
  const description = $('description')?.value?.trim() || '';

  // Motor Casing fields (optional)
  const motorInnerDia = parseFloat($('motorInnerDia')?.value) || 0;
  const motorOuterDia = parseFloat($('motorOuterDia')?.value) || 0;
  const motorLength = parseFloat($('motorLength')?.value) || 0;
  const motorType = $('motorType')?.value?.trim() || '';
  const motorCasingMass = parseFloat($('motorCasingMass')?.value) || 0;
  const totalAssemblyMass = totalG + motorCasingMass;

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
    description,
    motorInnerDia,
    motorOuterDia,
    motorLength,
    motorType,
    motorCasingMass,
    totalAssemblyMass: round2(totalAssemblyMass),
    images: uploadedImages.map((img, idx) => ({
      name: img.name || `photo_${idx + 1}.jpg`,
      base64: img.dataUrl
    }))
  };

  let msgIdx = 0;
  hideOutput();

  const btnLoader = $('btnLoadingArea');
  const btnMsg = $('btnLoadingMsg');
  if (btnLoader) btnLoader.style.display = 'flex';
  if (btnMsg) {
    btnMsg.textContent = LOADING_MESSAGES[0];
    btnMsg.style.opacity = '1';
  }

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
    const checkUrl = `${APPS_SCRIPT_URL}?action=checkId&propellantId=${encodeURIComponent(propellantId)}&uniqueUid=${encodeURIComponent(uniqueUid)}`;
    const checkRes = await fetch(checkUrl);
    const checkData = await checkRes.json();

    if (checkData.exists) {
      clearInterval(loadInterval);
      getNextCounter();
      const n2 = peekCounter();
      $('propellantId').value = buildPropellantId(n2);
      $('uniqueUid').value = buildUniqueUid(n2);
      payload.propellantId = $('propellantId').value;
      payload.uniqueUid = $('uniqueUid').value;
    }

    const fetchDone = fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const [_, res] = await Promise.all([animationDone, fetchDone]);
    clearInterval(loadInterval);
    hideBtnLoader();

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message || result.error || 'Server returned an error.');
    }

    const finalPropellantId = result.propellantId || payload.propellantId;
    const finalUniqueUid = result.uniqueUid || payload.uniqueUid;

    // Increment counter past the successfully submitted ID
    const idMatch = String(finalPropellantId).match(/(\d+)$/);
    const submittedNum = idMatch ? parseInt(idMatch[1], 10) : peekCounter();
    localStorage.setItem(SK.counter, submittedNum);

    const newN = submittedNum + 1;
    const newId = buildPropellantId(newN);
    const newUid = buildUniqueUid(newN);

    saveLocalHistory({
      propellantId: finalPropellantId,
      uniqueUid: finalUniqueUid,
      propellantName: propName,
      propellantType: propType,
      submittedAt,
      status: 'Pending',
      totalGrams: totalG,
      cookTimeMinutes: cookTime,
      drivePhotoUrl: result.drivePhotoUrl || result.driveFolderUrl || ''
    });

    const state = loadFormState() || {};
    state._submitted = true;
    localStorage.setItem(SK.formState, JSON.stringify(state));

    const photoInfoHtml = result.drivePhotoUrl ? `
      <div style="margin-top:8px;">
        <b>📁 Drive Photos Folder:</b> <a href="${result.drivePhotoUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline;">Open Batch Folder on Drive (${uploadedImages.length} photo${uploadedImages.length > 1 ? 's' : ''})</a>
      </div>` : '';

    showOutput(`
      <p style="font-size:1.15em;color:var(--success-color);font-weight:700;margin-bottom:14px;">
        ✅ Propellant Batch Submitted Successfully!
      </p>
      <div style="background:rgba(56,193,114,0.08);border:1px solid var(--success-color);border-radius:10px;padding:16px 20px;margin-bottom:14px;font-size:14px;line-height:1.8;">
        <b>Batch ID:</b> ${finalPropellantId}<br>
        <b>UID:</b> ${finalUniqueUid}<br>
        <b>Name:</b> ${propName}<br>
        <b>Type:</b> ${propType} | <b>Ratio:</b> ${payload.mixRatio}<br>
        <b>Sheet:</b> ${result.sheetName || finalPropellantId}
        ${photoInfoHtml}
      </div>
      <p style="color:var(--muted);font-size:13px;">
        🍳 Cook time: <b>${cookTime} min</b>. 
        After cooking, go to the <b>History section below</b> to update the batch status.
      </p>
      <p style="color:var(--muted);font-size:12px;margin-top:8px;">
        Next batch ID ready: <b style="color:var(--accent)">${newId}</b>
      </p>`, 'success');

    document.getElementById('propellantForm').reset();
    clearConditionalUI();
    $('propellantId').value = newId;
    $('uniqueUid').value = newUid;
    $('recordedAt').value = buildTimestamp();

    localStorage.removeItem(SK.formState);
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
  setCatalyst(false, false, 'free');
  clearAllPhotos();
  // Clear motor casing fields
  const mcIds = ['motorInnerDia', 'motorOuterDia', 'motorLength', 'motorType', 'motorCasingMass', 'totalAssemblyMass'];
  mcIds.forEach(id => { const el = $(id); if (el) el.value = ''; });
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

  // Merge: supplement remote entries with local data for any missing fields (e.g. submittedAt)
  const localData = getLocalHistory();
  const remoteIds = new Set(remoteData.map(d => d.propellantId));
  const localMap = new Map(localData.map(d => [d.propellantId, d]));
  const mergedRemote = remoteData.map(d => {
    const loc = localMap.get(d.propellantId);
    if (!loc) return d;
    // Local fills in missing fields; remote wins for status, name, etc.
    return {
      submittedAt: d.submittedAt || loc.submittedAt || loc.recordedAt || '',
      ...loc,
      ...d
    };
  });
  const localOnly = localData.filter(d => !remoteIds.has(d.propellantId));
  const allData = [...mergedRemote, ...localOnly];
  window.cachedHistoryData = allData;

  // Auto-synchronize counter with highest batch ID in the database
  let maxIdNum = 0;
  allData.forEach(entry => {
    const match = String(entry.propellantId || '').match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxIdNum) maxIdNum = n;
    }
  });

  if (maxIdNum > 0) {
    const cur = parseInt(localStorage.getItem(SK.counter) || '0', 10);
    if (maxIdNum >= cur) {
      localStorage.setItem(SK.counter, maxIdNum);
      const formId = $('propellantId')?.value || '';
      if (!formId || formId.startsWith('PROPP-')) {
        const nextId = buildPropellantId(maxIdNum + 1);
        const nextUid = buildUniqueUid(maxIdNum + 1);
        if ($('propellantId')) $('propellantId').value = nextId;
        if ($('uniqueUid')) $('uniqueUid').value = nextUid;
      }
    }
  }

  if (allData.length === 0) {
    sel.innerHTML = '<option value="">— No batches found —</option>';
    return;
  }

  sel.innerHTML = '<option value="">— Select a Propellant Batch —</option>' +
    allData.map(d => {
      const id   = d['Propellant ID'] || d.propellantId || '';
      const name = d['Propellant Name'] || d.propellantName || d.name || '';
      const stat = d['Status'] || d.status || 'Pending';
      const rawDate = d.submittedAt || d['Submitted At'] || d.recordedAt || d['Recorded At'] || '';
      let datePart = '';
      if (rawDate) {
        try {
          const dt = new Date(rawDate);
          if (!isNaN(dt.getTime())) {
            const day  = String(dt.getDate()).padStart(2, '0');
            const mon  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()];
            const yr   = dt.getFullYear();
            const hr   = String(dt.getHours()).padStart(2, '0');
            const min  = String(dt.getMinutes()).padStart(2, '0');
            datePart   = ` | ${day}-${mon}-${yr} ${hr}:${min}`;
          }
        } catch(e) {}
      }
      return `<option value="${id}">${id}${name ? ' – ' + name : ''} [${stat}]${datePart}</option>`;
    }).join('');
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

  if (!data && window.cachedHistoryData) {
    const cached = window.cachedHistoryData.find(d =>
      String(d['Propellant ID'] || d.propellantId || '').trim().toLowerCase() === String(propellantId).trim().toLowerCase()
    );
    if (cached) data = cached;
  }

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
  const mInner = parseFloat(data['Motor Inner Dia (mm)'] !== undefined ? data['Motor Inner Dia (mm)'] : data.motorInnerDia) || 0;
  const mOuter = parseFloat(data['Motor Outer Dia (mm)'] !== undefined ? data['Motor Outer Dia (mm)'] : data.motorOuterDia) || 0;
  const mLen = parseFloat(data['Motor Length (mm)'] !== undefined ? data['Motor Length (mm)'] : data.motorLength) || 0;
  const mType = data['Motor Casing Type'] || data.motorType || '';
  const mMass = parseFloat(data['Motor Casing Mass (g)'] !== undefined ? data['Motor Casing Mass (g)'] : data.motorCasingMass) || 0;
  const mTotMass = parseFloat(data['Total Assembly Mass (g)'] !== undefined ? data['Total Assembly Mass (g)'] : data.totalAssemblyMass) || (totG + mMass);

  const status  = data['Status'] || data.status || 'Pending';
  const stDesc  = data['Status Description'] || data.statusDescription || '';
  const stAt    = data['Status Updated At'] || data.statusUpdatedAt || '';
  const rawSubmAt = data['Submitted At'] || data.submittedAt || data['Recorded At'] || data.recordedAt || '';
  let submAt = rawSubmAt;
  if (rawSubmAt) {
    try {
      const dt = new Date(rawSubmAt);
      if (!isNaN(dt.getTime())) {
        const day = String(dt.getDate()).padStart(2, '0');
        const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()];
        const yr  = dt.getFullYear();
        const hr  = String(dt.getHours()).padStart(2, '0');
        const min = String(dt.getMinutes()).padStart(2, '0');
        submAt = `${day}-${mon}-${yr} ${hr}:${min}`;
      }
    } catch(e) {}
  }
  const detailsUrl   = data['Propellant Details Drive URL'] || data.detailsDriveUrl || data['Drive Photo URL'] || data.drivePhotoUrl || data.photoUrl || '';
  const testUrl      = data['Propellant Test Drive URL'] || data.testDriveUrl || '';
  const mainFolderUrl = data['Main Batch Drive Folder URL'] || data.driveFolderUrl || '';

  activeHistoryEntry = {
    pId, uid, pName, ratio, cookTm, desc, totG,
    mInner, mOuter, mLen, mType, mMass, mTotMass
  };

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



  const photoBtnHtml = `
    ${detailsUrl ? `
      <a href="${detailsUrl}" target="_blank" rel="noopener noreferrer" class="view-photo-btn" title="Open Propellant Details Photos Folder on Google Drive">
        📁 Propellant Details Photos
      </a>` : ''}
    ${testUrl ? `
      <a href="${testUrl}" target="_blank" rel="noopener noreferrer" class="view-photo-btn" style="border-color:var(--accent); color:var(--accent); background:rgba(77,166,255,0.12);" title="Open Propellant Test & Reports Folder on Google Drive">
        📂 Propellant Test & Reports
      </a>` : ''}
    ${mainFolderUrl && mainFolderUrl !== detailsUrl && mainFolderUrl !== testUrl ? `
      <a href="${mainFolderUrl}" target="_blank" rel="noopener noreferrer" class="view-photo-btn" style="border-color:#ffc107; color:#ffc107; background:rgba(255,193,7,0.12);" title="Open Main Batch Folder on Google Drive">
        ☁️ Main Batch Folder
      </a>` : ''}
  `;

  display.innerHTML = `
    <div class="history-card">
      <div class="history-card-header">
        <div>
          <div class="history-card-title">🔬 ${pName || pId}</div>
          <div class="history-card-id">ID: ${pId} &nbsp;|&nbsp; UID: ${uid}</div>
          <div class="history-card-id" style="margin-top:4px">Submitted: ${submAt}</div>
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
          ${photoBtnHtml}
          <button type="button" class="history-edit-toggle-btn"
                  onclick="openEditModal()"
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
        <div class="history-data-item">
          <div class="history-data-label">Motor Inner / Outer Dia</div>
          <div class="history-data-value">${mInner > 0 ? `${mInner} mm / ${mOuter} mm` : '—'}</div>
        </div>
        <div class="history-data-item">
          <div class="history-data-label">Motor Length</div>
          <div class="history-data-value">${mLen > 0 ? `${mLen} mm` : '—'}</div>
        </div>
        <div class="history-data-item">
          <div class="history-data-label">Motor Material / Type</div>
          <div class="history-data-value">${mType || '—'}</div>
        </div>
        <div class="history-data-item">
          <div class="history-data-label">Casing Mass</div>
          <div class="history-data-value">${mMass > 0 ? `${mMass} g` : '—'}</div>
        </div>
        <div class="history-data-item" style="border:1px solid rgba(77,166,255,0.3); background:rgba(77,166,255,0.08);">
          <div class="history-data-label" style="color:var(--accent);">Total Assembly Mass</div>
          <div class="history-data-value" style="color:#ffffff; font-weight:800;">${mTotMass > 0 ? `${mTotMass} g` : '—'}</div>
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

      <!-- ☁️ GOOGLE DRIVE STORAGE LINKS BELOW DESCRIPTION -->
      <div style="background:rgba(77,166,255,0.06); border:1px solid rgba(77,166,255,0.25); border-radius:12px; padding:16px 18px; margin-top:16px; margin-bottom:18px;">
        <div style="font-size:11px; font-weight:800; color:var(--accent); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
          ☁️ Batch Google Drive Storage Folders
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          ${detailsUrl ? `
            <a href="${detailsUrl}" target="_blank" rel="noopener noreferrer" class="view-photo-btn" style="padding:10px 16px; font-size:13px; font-weight:700; border-radius:8px;" title="Open Propellant Details Folder on Drive">
              📁 Propellant Details Drive Folder
            </a>` : ''}
          ${testUrl ? `
            <a href="${testUrl}" target="_blank" rel="noopener noreferrer" class="view-photo-btn" style="padding:10px 16px; font-size:13px; font-weight:700; border-radius:8px; border-color:var(--accent); color:var(--accent); background:rgba(77,166,255,0.14);" title="Open Propellant Test Folder on Drive">
              📂 Propellant Test & Reports Drive Folder
            </a>` : ''}
          ${mainFolderUrl && mainFolderUrl !== detailsUrl && mainFolderUrl !== testUrl ? `
            <a href="${mainFolderUrl}" target="_blank" rel="noopener noreferrer" class="view-photo-btn" style="padding:10px 16px; font-size:13px; font-weight:700; border-radius:8px; border-color:#ffc107; color:#ffc107; background:rgba(255,193,7,0.14);" title="Open Main Batch Folder on Drive">
              ☁️ Main Batch Root Folder
            </a>` : ''}
          ${!detailsUrl && !testUrl && !mainFolderUrl ? `
            <span style="font-size:12px; color:var(--muted); font-style:italic;">No Drive folders created yet. Upload photos/documents to generate folders on Google Drive.</span>
          ` : ''}
        </div>
      </div>
    </div>`;

  display.style.display = '';
  selectedStatus = status === 'Pending' ? '' : status;
  if (selectedStatus && selectedStatus !== 'Pending') selectStatus(selectedStatus);

  // Store active history batch details
  currentAttachBatchId = pId;
  currentAttachUniqueUid = uid;
  currentAttachBatchName = pName;
  currentAttachDriveUrl = detailsUrl || testUrl || mainFolderUrl;
  pendingAttachments = [];
  renderAttachPreviewList();

  // Show attachment uploader (above) and status update (below)
  const attachSection = $('historyAttachSection');
  if (attachSection) attachSection.style.display = '';
  const statusSection = $('historyStatusSection');
  if (statusSection) statusSection.style.display = '';

  const attachResult = $('attachUploadResult');
  if (attachResult) { attachResult.style.display = 'none'; attachResult.innerHTML = ''; }
  const statusResult = $('statusUpdateResult');
  if (statusResult) { statusResult.style.display = 'none'; statusResult.innerHTML = ''; }
  if ($('statusDescInput')) $('statusDescInput').value = stDesc || '';

  display.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

let currentAttachUniqueUid = '';

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

function submitStatusUpdateNow() {
  submitStatusUpdate(currentAttachBatchId, currentAttachUniqueUid);
}

async function submitStatusUpdate(propellantId, uniqueUid) {
  if (!selectedStatus) {
    alert('Please select a status (Success / Failure / OK) first.');
    return;
  }
  const statusDesc = $('statusDescInput')?.value?.trim() || '';
  if (!statusDesc) {
    alert('Status Description is mandatory! Please enter details about the cook / burn test before saving status.');
    $('statusDescInput')?.focus();
    return;
  }
  const btn = $('statusSubmitBtn');
  const loader = $('statusUpdateLoadingArea');
  const resEl = $('statusUpdateResult');

  if (btn) btn.disabled = true;
  if (loader) loader.style.display = 'block';
  if (resEl) resEl.style.display = 'none';

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

    const hist = getLocalHistory().map(h => {
      if (h.propellantId === propellantId) {
        h.status = selectedStatus;
      }
      return h;
    });
    localStorage.setItem(SK.history, JSON.stringify(hist));

    if (resEl) {
      resEl.style.display = 'block';
      resEl.style.color = 'var(--success-color)';
      resEl.innerHTML = `✅ Status updated successfully to "${selectedStatus}"!`;
    }

    if (btn) {
      btn.textContent = '✅ Status Updated!';
      btn.style.background = 'var(--success-color)';
      btn.style.color = '#fff';
    }

    await loadHistoryList();
    if ($('historySelect')) $('historySelect').value = propellantId;

  } catch (err) {
    console.error('Status update error:', err);
    if (resEl) {
      resEl.style.display = 'block';
      resEl.style.color = 'var(--error-color)';
      resEl.innerHTML = `❌ Failed to update status: ${err.message}`;
    }
  } finally {
    if (btn) btn.disabled = false;
    if (loader) loader.style.display = 'none';
  }
}

// ────────────────────────────────────────────────────────────────
//  EDIT DETAILS POPUP MODAL HANDLERS
// ────────────────────────────────────────────────────────────────
let activeHistoryEntry = null;

function openEditModal() {
  if (!activeHistoryEntry) return;
  const e = activeHistoryEntry;
  $('editPropellantId').value        = e.pId   || '';
  $('editUniqueUid').value           = e.uid   || '';
  $('editPropName').value            = e.pName || '';
  $('editMixRatio').value            = e.ratio || '';
  $('editCookTime').value            = e.cookTm || '';
  $('editMotorInnerDia').value       = e.mInner || '';
  $('editMotorOuterDia').value       = e.mOuter || '';
  $('editMotorLength').value         = e.mLen   || '';
  $('editMotorType').value           = e.mType  || '';
  $('editMotorCasingMass').value     = e.mMass  || '';
  $('editTotalAssemblyMass').value   = e.mTotMass || (e.totG + e.mMass) || '';
  $('editPropDesc').value            = e.desc   || '';
  $('editModalTitle').textContent    = `✏️ Edit Batch — ${e.pId}`;

  // Auto-recalc total assembly mass when casing mass changes
  const casingInput = $('editMotorCasingMass');
  const totalInput  = $('editTotalAssemblyMass');
  if (casingInput && totalInput) {
    casingInput.oninput = () => {
      const casing = parseFloat(casingInput.value) || 0;
      const propG  = activeHistoryEntry ? (activeHistoryEntry.totG || 0) : 0;
      totalInput.value = (propG + casing).toFixed(2);
    };
  }

  const modal = $('editModalOverlay');
  if (modal) modal.style.display = 'flex';
}

function closeEditModal() {
  const modal = $('editModalOverlay');
  if (modal) modal.style.display = 'none';
}

async function saveHistoryEdit() {
  const propellantId = $('editPropellantId').value;
  const uniqueUid = $('editUniqueUid').value;
  const newName = $('editPropName').value.trim();
  const newRatio = $('editMixRatio').value.trim();
  const newCookTime = parseFloat($('editCookTime').value) || 0;
  const newMotorInner = parseFloat($('editMotorInnerDia').value) || 0;
  const newMotorOuter = parseFloat($('editMotorOuterDia').value) || 0;
  const newMotorLength = parseFloat($('editMotorLength').value) || 0;
  const newMotorType = $('editMotorType').value.trim();
  const newCasingMass = parseFloat($('editMotorCasingMass').value) || 0;
  const totG = activeHistoryEntry ? activeHistoryEntry.totG : 0;
  const newTotalAssemblyMass = totG + newCasingMass;
  const newDesc = $('editPropDesc').value.trim();
  const btn = $('editSaveBtn');

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
        motorInnerDia: newMotorInner,
        motorOuterDia: newMotorOuter,
        motorLength: newMotorLength,
        motorType: newMotorType,
        motorCasingMass: newCasingMass,
        totalAssemblyMass: newTotalAssemblyMass,
        description: newDesc
      })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || result.error);

    const hist = getLocalHistory().map(h => {
      if (h.propellantId === propellantId) {
        h.propellantName = newName;
        h.name = newName;
        h.mixRatio = newRatio;
        h.cookTimeMinutes = newCookTime;
        h.motorInnerDia = newMotorInner;
        h.motorOuterDia = newMotorOuter;
        h.motorLength = newMotorLength;
        h.motorType = newMotorType;
        h.motorCasingMass = newCasingMass;
        h.totalAssemblyMass = newTotalAssemblyMass;
        h.description = newDesc;
      }
      return h;
    });
    localStorage.setItem(SK.history, JSON.stringify(hist));

    closeEditModal();

    await loadHistoryList();
    $('historySelect').value = propellantId;
    await loadHistoryEntry();

  } catch (err) {
    console.error('Edit save error:', err);
    alert('Failed to save changes: ' + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ────────────────────────────────────────────────────────────────
//  CLEAR ALL FORM
// ────────────────────────────────────────────────────────────────
function clearAllForm() {
  if (!confirm('Clear all entered data and start a fresh batch?')) return;

  document.getElementById('propellantForm').reset();
  clearConditionalUI();

  const n = peekCounter();
  $('propellantId').value = buildPropellantId(n);
  $('uniqueUid').value = buildUniqueUid(n);
  $('recordedAt').value = buildTimestamp();

  localStorage.removeItem(SK.formState);
  hideOutput();
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
//  INTERSECTION OBSERVER
// ────────────────────────────────────────────────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('show'); });
}, { threshold: 0.05 });
document.querySelectorAll('.section').forEach(s => observer.observe(s));

// ────────────────────────────────────────────────────────────────
//  FALLING STARS
// ────────────────────────────────────────────────────────────────
(function createStars() {
  const container = document.getElementById('starsContainer');
  if (!container) return;
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
$('propellantType')?.addEventListener('change', () => { handleTypeChange(); saveFormState(); });
$('mixRatio')?.addEventListener('change', () => { handleRatioChange(); saveFormState(); });

['propellantName', 'chem1Name', 'chem1Pct', 'chem2Name', 'chem2Pct', 'catalystPct',
  'totalGrams', 'cookTime', 'description',
  'motorInnerDia', 'motorOuterDia', 'motorLength', 'motorType', 'motorCasingMass'].forEach(id => {
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

// ────────────────────────────────────────────────────────────────
//  HISTORY ATTACHMENT UPLOAD
// ────────────────────────────────────────────────────────────────
let pendingAttachments = []; // Array of { id, name, type, dataUrl, size }
let currentAttachBatchId = '';
let currentAttachBatchName = '';
let currentAttachDriveUrl = '';

function handleAttachmentSelect(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  addAttachmentFiles(Array.from(files));
  event.target.value = '';
}

function handleAttachDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  const dz = $('attachDropZone');
  if (dz) dz.classList.add('drag-over');
}

function handleAttachDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  const dz = $('attachDropZone');
  if (dz) dz.classList.remove('drag-over');
}

function handleAttachDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const dz = $('attachDropZone');
  if (dz) dz.classList.remove('drag-over');
  const files = event.dataTransfer && event.dataTransfer.files;
  if (!files || files.length === 0) return;
  addAttachmentFiles(Array.from(files));
}

async function addAttachmentFiles(files) {
  for (const file of files) {
    await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        pendingAttachments.push({
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: e.target.result
        });
        renderAttachPreviewList();
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }
}

function removeAttachment(attId) {
  pendingAttachments = pendingAttachments.filter(a => a.id !== attId);
  renderAttachPreviewList();
}

function getFileIcon(name, type) {
  const ext = name.split('.').pop().toLowerCase();
  if (['xls', 'xlsx', 'xlsm', 'csv'].includes(ext)) return '📊';
  if (['pdf'].includes(ext)) return '📄';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return '📝';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return '🖼️';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️';
  if (['mp4', 'avi', 'mov', 'mkv'].includes(ext)) return '🎬';
  if (['mp3', 'wav', 'aac'].includes(ext)) return '🎵';
  if (['py', 'js', 'ts', 'html', 'css', 'json', 'xml', 'gs'].includes(ext)) return '💻';
  if (['ppt', 'pptx'].includes(ext)) return '📊';
  return '📎';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function renderAttachPreviewList() {
  const container = $('attachPreviewList');
  const placeholder = $('attachPlaceholder');
  const badge = $('uploadAttachBtn');
  if (!container) return;

  if (pendingAttachments.length === 0) {
    container.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    if (badge) badge.textContent = '☁️ Upload to Drive';
    return;
  }

  container.style.display = 'block';
  if (placeholder) placeholder.style.display = 'none';
  if (badge) badge.textContent = `☁️ Upload ${pendingAttachments.length} File${pendingAttachments.length > 1 ? 's' : ''} to Drive`;

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
      <div>
        <div style="font-size:14px; font-weight:700; color:var(--text);">
          📸 Selected Files (${pendingAttachments.length})
        </div>
        <div style="font-size:11px; color:var(--success-color); font-weight:600; margin-top:2px;">
          ✔ Saved in Drive folder for this batch
        </div>
      </div>
      <button type="button" onclick="pendingAttachments=[]; renderAttachPreviewList();"
              style="padding:4px 10px; border-radius:6px; background:rgba(231,76,60,0.15); color:var(--error-color); border:1px solid var(--error-color); font-size:12px; font-weight:600; cursor:pointer;">
        Clear All
      </button>
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:14px; margin-top:10px;">
      ${pendingAttachments.map((att, idx) => {
    const isImage = att.type.startsWith('image/') || (att.dataUrl && att.dataUrl.startsWith('data:image/'));
    return `
          <div style="position:relative; width:110px; height:110px; border-radius:12px; border:2px solid var(--accent); overflow:hidden; background:#071220; box-shadow:0 4px 14px rgba(0,0,0,0.4); flex-shrink:0;">
            ${isImage ? `
              <img src="${att.dataUrl}" alt="${att.name}" style="width:100%; height:100%; object-fit:cover; display:block;">
            ` : `
              <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8px; text-align:center; box-sizing:border-box;">
                <span style="font-size:32px; margin-bottom:4px;">${getFileIcon(att.name, att.type)}</span>
                <span style="font-size:10px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:95px;" title="${att.name}">${att.name}</span>
                <span style="font-size:9px; color:var(--muted); margin-top:2px;">${formatFileSize(att.size)}</span>
              </div>
            `}

            <!-- Top Right Delete Red Button -->
            <button type="button" onclick="removeAttachment('${att.id}')"
                    title="Remove file"
                    style="position:absolute; top:5px; right:5px; background:rgba(231,76,60,0.92); color:#fff; border:none; border-radius:50%; width:24px; height:24px; font-size:12px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.6); transition:transform 0.15s;"
                    onmouseover="this.style.transform='scale(1.15)'"
                    onmouseout="this.style.transform='scale(1)'">✕</button>

            <!-- Bottom Left Index Badge -->
            <div style="position:absolute; bottom:5px; left:5px; background:rgba(0,0,0,0.8); color:var(--accent); font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; border:1px solid rgba(77,166,255,0.4);">
              #${idx + 1}
            </div>
          </div>
        `;
  }).join('')}
    </div>`;
}

async function uploadAttachmentsNow() {
  if (!currentAttachBatchId) {
    alert('Please load a batch from history first before uploading attachments.');
    return;
  }
  if (pendingAttachments.length === 0) {
    alert('No files selected. Please add files first.');
    return;
  }

  const btn = $('uploadAttachBtn');
  const loader = $('attachLoadingArea');
  const resultEl = $('attachUploadResult');

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Uploading...'; }
  if (loader) loader.style.display = 'block';
  if (resultEl) resultEl.style.display = 'none';

  try {
    const payload = {
      action: 'uploadAttachments',
      propellantId: currentAttachBatchId,
      propellantName: currentAttachBatchName,
      attachments: pendingAttachments.map((att, idx) => ({
        name: att.name,
        type: att.type,
        base64: att.dataUrl
      }))
    };

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.success) {
      if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = `
          <div style="background:rgba(56,193,114,0.12); border:1px solid var(--success-color); border-radius:10px; padding:14px 16px;">
            <div style="font-weight:700; color:var(--success-color); margin-bottom:8px;">
              ✅ ${result.message || `${pendingAttachments.length} file(s) uploaded successfully!`}
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
              ${result.testFolderUrl || result.folderUrl ? `
                <a href="${result.testFolderUrl || result.folderUrl}" target="_blank" rel="noopener noreferrer" class="view-photo-btn" style="border-color:var(--accent); color:var(--accent);">
                  📂 Open "Propellant Test" Drive Folder
                </a>` : ''}
              ${result.mainFolderUrl ? `
                <a href="${result.mainFolderUrl}" target="_blank" rel="noopener noreferrer" class="view-photo-btn" style="border-color:#ffc107; color:#ffc107;">
                  ☁️ Open Main Batch Folder
                </a>` : ''}
            </div>
          </div>`;
      }
      pendingAttachments = [];
      renderAttachPreviewList();
      await loadHistoryEntry();
    } else {
      throw new Error(result.error || result.message || 'Upload failed.');
    }
  } catch (err) {
    console.error('Attachment upload error:', err);
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div style="background:rgba(231,76,60,0.12); border:1px solid var(--error-color); border-radius:10px; padding:14px 16px; color:var(--error-color);">
          ❌ Upload failed: ${err.message}
        </div>`;
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = `☁️ Upload to Drive`; }
    if (loader) loader.style.display = 'none';
  }
}

