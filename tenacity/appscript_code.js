// ================================================================
//  TENACITY – PROPELLANT BATCH TRACKER
//  Google Apps Script – Backend (Code.gs)
//  ---------------------------------------------------------------
//  INSTRUCTIONS:
//  1. Go to script.google.com → New Project
//  2. Paste ALL of this code into Code.gs
//  3. Deploy → New Deployment → Web App
//     - Execute as: Me
//     - Who has access: Anyone
//  4. Copy the deployment URL and paste it in app.js as APPS_SCRIPT_URL
// ================================================================

const SHEET_ID = '1NpcBnUd-kwpW6n_jeExwZ8KXMoTbQsl11xF56_i_5jI';
const MASTER_SHEET_NAME = 'Master Log';

const MASTER_HEADERS = [
  'Propellant ID',
  'Unique UID',
  'Propellant Name',
  'Submitted At',
  'Propellant Type',
  'Mix Ratio',
  'Chemical 1 Name',
  'Chemical 1 %',
  'Chemical 1 Grams (g)',
  'Chemical 2 Name',
  'Chemical 2 %',
  'Chemical 2 Grams (g)',
  'Has Catalyst',
  'Catalyst Name',
  'Catalyst %',
  'Catalyst Grams (g)',
  'Total Grams (g)',
  'Cook Time (min)',
  'Description / Purpose',
  'Status',
  'Status Description',
  'Status Updated At',
  'Sheet Tab Name'
];

// ── Column index map for the data sheet (1-based) ──
const DATA_COLS = {
  propellantId:       1,
  uniqueUid:          2,
  propellantName:     3,
  submittedAt:        4,
  propellantType:     5,
  mixRatio:           6,
  chem1Name:          7,
  chem1Percent:       8,
  chem1Grams:         9,
  chem2Name:          10,
  chem2Percent:       11,
  chem2Grams:         12,
  hasCatalyst:        13,
  catalystName:       14,
  catalystPercent:    15,
  catalystGrams:      16,
  totalGrams:         17,
  cookTimeMinutes:    18,
  description:        19,
  status:             20,
  statusDescription:  21,
  statusUpdatedAt:    22
};

const DATA_HEADERS = [
  'Propellant ID', 'Unique UID', 'Propellant Name', 'Submitted At',
  'Propellant Type', 'Mix Ratio',
  'Chemical 1 Name', 'Chemical 1 %', 'Chemical 1 Grams (g)',
  'Chemical 2 Name', 'Chemical 2 %', 'Chemical 2 Grams (g)',
  'Has Catalyst', 'Catalyst Name', 'Catalyst %', 'Catalyst Grams (g)',
  'Total Grams (g)', 'Cook Time (min)', 'Description / Purpose',
  'Status', 'Status Description', 'Status Updated At'
];

// ================================================================
//  ENTRY POINTS
// ================================================================

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const params = e.parameter;
    const action = params.action;

    if (action === 'submit')        return handleSubmit(ss, params);
    if (action === 'updateStatus')  return handleUpdateStatus(ss, params);
    if (action === 'updateDetails') return handleUpdateDetails(ss, params);

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doGet(e) {
  try {
    const ss  = SpreadsheetApp.openById(SHEET_ID);
    const p   = e.parameter;
    const action = p.action || '';

    if (action === 'getAll')  return handleGetAll(ss);
    if (action === 'getOne')  return handleGetOne(ss, p.propellantId);
    if (action === 'checkId') return handleCheckId(ss, p.propellantId, p.uniqueUid);

    return jsonResponse({ success: false, error: 'Unknown GET action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ================================================================
//  HANDLERS
// ================================================================

/**
 * Submit a new propellant batch.
 */
function handleSubmit(ss, params) {
  const propellantId = (params.propellantId || '').trim();
  const uniqueUid    = (params.uniqueUid    || '').trim();
  const propName     = (params.propellantName || 'Unnamed').trim().replace(/[\/\\?*\[\]:]/g, '-');

  if (!propellantId || !uniqueUid) {
    return jsonResponse({ success: false, error: 'propellantId and uniqueUid are required.' });
  }

  // ── Duplicate check ──────────────────────────────────────────
  const sheets = ss.getSheets();
  for (const sh of sheets) {
    const nm = sh.getName();
    if (nm.startsWith(propellantId + ' ') || nm === propellantId) {
      return jsonResponse({
        success: false,
        error: 'DUPLICATE_ID',
        message: `Propellant ID "${propellantId}" already exists. A sheet named "${nm}" was found.`
      });
    }
  }

  // Also scan master log for UID collision
  const masterSheet = getOrCreateMasterSheet(ss);
  const masterData  = masterSheet.getDataRange().getValues();
  for (let i = 1; i < masterData.length; i++) {
    if (String(masterData[i][1]) === uniqueUid) {
      return jsonResponse({
        success: false,
        error: 'DUPLICATE_UID',
        message: `Unique UID "${uniqueUid}" already exists in the master log.`
      });
    }
  }

  // ── Create new sheet tab ──────────────────────────────────────
  const rawName   = propellantId + ' – ' + propName;
  const sheetName = rawName.substring(0, 100);
  const newSheet  = ss.insertSheet(sheetName);

  const headerRange = newSheet.getRange(1, 1, 1, 2);
  headerRange.setValues([['Parameter / Field', 'Details / Value']]);
  styleHeaderRow(headerRange);
  newSheet.setFrozenRows(1);

  const verticalData = buildVerticalData(params);
  newSheet.getRange(2, 1, verticalData.length, 2).setValues(verticalData);

  newSheet.setColumnWidth(1, 220);
  newSheet.setColumnWidth(2, 380);
  newSheet.getRange(2, 1, verticalData.length, 1).setFontWeight('bold').setBackground('#f4f8fc');
  newSheet.getRange(2, 2, verticalData.length, 1).setHorizontalAlignment('left');

  // ── Append to Master Log ──────────────────────────────────────
  masterSheet.appendRow([
    String(params.propellantId || ''),
    String(params.uniqueUid || ''),
    String(params.propellantName || ''),
    String(params.submittedAt || ''),
    String(params.propellantType || ''),
    String(params.mixRatio || ''),
    String(params.chem1Name || ''),
    Number(params.chem1Percent) || 0,
    Number(params.chem1Grams) || 0,
    String(params.chem2Name || ''),
    Number(params.chem2Percent) || 0,
    Number(params.chem2Grams) || 0,
    String(params.hasCatalyst || 'false'),
    String(params.catalystName || ''),
    Number(params.catalystPercent) || 0,
    Number(params.catalystGrams) || 0,
    Number(params.totalGrams) || 0,
    Number(params.cookTimeMinutes) || 0,
    String(params.description || ''),
    'Pending',
    '',
    '',
    sheetName
  ]);

  return jsonResponse({
    success: true,
    message: `Propellant "${propellantId}" submitted successfully!`,
    sheetName: sheetName
  });
}

/** Update the status (Success / Failure / OK) of an existing batch in BOTH sheets. */
function handleUpdateStatus(ss, params) {
  const propellantId = (params.propellantId || '').trim();
  const uniqueUid    = (params.uniqueUid    || '').trim();

  if (!propellantId) {
    return jsonResponse({ success: false, error: 'propellantId is required.' });
  }

  const status     = params.status            || 'Pending';
  const statusDesc = params.statusDescription || '';
  const updatedAt  = params.updatedAt          || new Date().toISOString();

  // 1. Update status in Dedicated Propellant Batch Sheet
  const targetSheet = findSheetByPropellantId(ss, propellantId);
  if (targetSheet) {
    const data = targetSheet.getDataRange().getValues();
    if (data.length > 0) {
      const firstCell = String(data[0][0]).trim().toLowerCase();
      if (firstCell === 'parameter / field' || firstCell === 'parameter' || firstCell === 'propellant id') {
        // Vertical Sheet
        for (let i = 1; i < data.length; i++) {
          const key = String(data[i][0]).trim();
          if (key === 'Status')             targetSheet.getRange(i + 1, 2).setValue(status);
          if (key === 'Status Description') targetSheet.getRange(i + 1, 2).setValue(statusDesc);
          if (key === 'Status Updated At')  targetSheet.getRange(i + 1, 2).setValue(updatedAt);
        }
      } else {
        // Horizontal Sheet
        const headers = data[0].map(h => String(h).trim());
        const sCol  = headers.indexOf('Status') + 1;
        const sdCol = headers.indexOf('Status Description') + 1;
        const suCol = headers.indexOf('Status Updated At') + 1;
        if (sCol > 0)  targetSheet.getRange(2, sCol).setValue(status);
        if (sdCol > 0) targetSheet.getRange(2, sdCol).setValue(statusDesc);
        if (suCol > 0) targetSheet.getRange(2, suCol).setValue(updatedAt);
      }
    }
  }

  // 2. Update status in Master Log Sheet
  const masterSheet = ensureMasterHeaders(ss);
  const mData = masterSheet.getDataRange().getValues();
  if (mData.length > 0) {
    const mHeaders = mData[0].map(h => String(h).trim().toLowerCase());
    let mStatusCol = mHeaders.indexOf('status') + 1;
    if (mStatusCol <= 0) mStatusCol = 7; // Fallback to Col G if not found

    let mStatusDescCol = mHeaders.indexOf('status description') + 1;
    let mStatusUpdatedCol = mHeaders.indexOf('status updated at') + 1;

    for (let i = 1; i < mData.length; i++) {
      const rowId = String(mData[i][0]).trim().toLowerCase();
      if (rowId === propellantId.toLowerCase()) {
        masterSheet.getRange(i + 1, mStatusCol).setValue(status);
        if (mStatusDescCol > 0)    masterSheet.getRange(i + 1, mStatusDescCol).setValue(statusDesc);
        if (mStatusUpdatedCol > 0) masterSheet.getRange(i + 1, mStatusUpdatedCol).setValue(updatedAt);
        break;
      }
    }
  }

  return jsonResponse({ success: true, message: `Status updated to "${status}" for "${propellantId}".` });
}

/** Return all entries from the master log. */
function handleGetAll(ss) {
  const masterSheet = ensureMasterHeaders(ss);
  const rows = masterSheet.getDataRange().getValues();
  if (rows.length < 2) {
    return jsonResponse({ success: true, data: [] });
  }

  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const idCol    = headers.indexOf('propellant id');
  const uidCol   = headers.indexOf('unique uid');
  const nameCol  = headers.indexOf('propellant name');
  const typeCol  = headers.indexOf('propellant type') >= 0 ? headers.indexOf('propellant type') : headers.indexOf('type');
  const subCol   = headers.indexOf('submitted at');
  const sheetCol = headers.indexOf('sheet tab name') >= 0 ? headers.indexOf('sheet tab name') : headers.indexOf('sheet name');
  let statCol  = headers.indexOf('status');
  if (statCol < 0) statCol = 6; // Col G (0-indexed 6) fallback

  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const pid = idCol >= 0 ? r[idCol] : r[0];
    if (!pid) continue; // skip empty rows

    data.push({
      propellantId: String(pid),
      uniqueUid:    uidCol >= 0 ? String(r[uidCol]) : String(r[1] || ''),
      name:         nameCol >= 0 ? String(r[nameCol]) : String(r[2] || ''),
      propellantName: nameCol >= 0 ? String(r[nameCol]) : String(r[2] || ''),
      type:         typeCol >= 0 ? String(r[typeCol]) : String(r[4] || r[3] || ''),
      submittedAt:  subCol >= 0 ? String(r[subCol]) : String(r[3] || ''),
      sheetName:    sheetCol >= 0 ? String(r[sheetCol]) : String(r[5] || ''),
      status:       statCol >= 0 ? String(r[statCol] || 'Pending') : 'Pending'
    });
  }

  // Newest first
  data.reverse();
  return jsonResponse({ success: true, data: data });
}

/** Return full data for a single propellant by ID. Supports both vertical and horizontal sheets. */
function handleGetOne(ss, propellantId) {
  if (!propellantId) {
    return jsonResponse({ success: false, error: 'propellantId is required.' });
  }

  const sheet = findSheetByPropellantId(ss, propellantId);
  if (!sheet) {
    return jsonResponse({ success: false, error: `Propellant "${propellantId}" sheet tab not found.` });
  }

  const data = sheet.getDataRange().getValues();
  const result = {};

  if (data.length > 0) {
    const firstCell = String(data[0][0]).trim().toLowerCase();
    // Detect vertical key-value (Header: "Parameter / Field" or "Propellant ID")
    if (firstCell === 'parameter / field' || firstCell === 'parameter' || firstCell === 'propellant id') {
      for (let i = 1; i < data.length; i++) {
        const key = String(data[i][0]).trim();
        if (key !== '') {
          result[key] = data[i][1];
        }
      }
    } else {
      // Old horizontal layout (row 1 headers, row 2 values)
      const headers = data[0];
      const values = data[1] || [];
      headers.forEach((h, i) => {
        const key = String(h).trim();
        if (key !== '') result[key] = values[i];
      });
    }
  }

  return jsonResponse({ success: true, data: result });
}

function findSheetByPropellantId(ss, propellantId) {
  if (!propellantId) return null;
  const target = String(propellantId).trim().toLowerCase();
  for (const sh of ss.getSheets()) {
    const nm = sh.getName().trim().toLowerCase();
    if (nm === target) return sh;
    if (nm.startsWith(target)) {
      const charAfter = nm.charAt(target.length);
      if (!charAfter || !/\d/.test(charAfter)) {
        return sh;
      }
    }
  }
  return null;
}

/**
 * Check whether a propellantId or uniqueUid already exists.
 * Returns { exists: true/false, conflictType: 'ID'|'UID'|null }
 */
function handleCheckId(ss, propellantId, uniqueUid) {
  // Check sheet names
  const sheets = ss.getSheets();
  for (const sh of sheets) {
    const nm = sh.getName();
    if (nm.startsWith(propellantId + ' ') || nm === propellantId) {
      return jsonResponse({ exists: true, conflictType: 'ID' });
    }
  }

  // Check master log for UID
  if (uniqueUid) {
    const master = ss.getSheetByName(MASTER_SHEET_NAME);
    if (master) {
      const mData = master.getDataRange().getValues();
      for (let i = 1; i < mData.length; i++) {
        if (String(mData[i][1]) === uniqueUid) {
          return jsonResponse({ exists: true, conflictType: 'UID' });
        }
      }
    }
  }

  return jsonResponse({ exists: false, conflictType: null });
}

// ================================================================
//  HELPERS
// ================================================================

/**
 * Edit batch details. Updates BOTH the dedicated data sheet and Master Log.
 */
function handleUpdateDetails(ss, params) {
  const propellantId = (params.propellantId  || '').trim();
  const uniqueUid    = (params.uniqueUid     || '').trim();
  const newName      = (params.propellantName|| '').trim();
  const newRatio     = (params.mixRatio      || '').trim();
  const newCookTime  = (params.cookTimeMinutes|| '').trim();
  const newDesc      = (params.description   || '').trim();

  if (!propellantId) {
    return jsonResponse({ success: false, error: 'propellantId is required.' });
  }
  if (!newName) {
    return jsonResponse({ success: false, error: 'propellantName cannot be empty.' });
  }

  // 1. Update Dedicated Batch Sheet
  const sheet = findSheetByPropellantId(ss, propellantId);
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    if (data.length > 0) {
      const firstCell = String(data[0][0]).trim().toLowerCase();
      if (firstCell === 'parameter / field' || firstCell === 'parameter' || firstCell === 'propellant id') {
        // Vertical Sheet
        for (let i = 1; i < data.length; i++) {
          const key = String(data[i][0]).trim();
          if (key === 'Propellant Name')       sheet.getRange(i + 1, 2).setValue(newName);
          if (key === 'Mix Ratio')             sheet.getRange(i + 1, 2).setValue(newRatio);
          if (key === 'Cook Time (min)')       sheet.getRange(i + 1, 2).setValue(newCookTime);
          if (key === 'Description / Purpose') sheet.getRange(i + 1, 2).setValue(newDesc);
        }
      } else {
        // Horizontal Sheet
        const headers = data[0].map(h => String(h).trim());
        const nCol = headers.indexOf('Propellant Name') + 1;
        const rCol = headers.indexOf('Mix Ratio') + 1;
        const cCol = headers.indexOf('Cook Time (min)') + 1;
        const dCol = headers.indexOf('Description / Purpose') + 1;
        if (nCol > 0) sheet.getRange(2, nCol).setValue(newName);
        if (rCol > 0) sheet.getRange(2, rCol).setValue(newRatio);
        if (cCol > 0) sheet.getRange(2, cCol).setValue(newCookTime);
        if (dCol > 0) sheet.getRange(2, dCol).setValue(newDesc);
      }
    }
  }

  // 2. Update Master Log Sheet
  const master = ss.getSheetByName(MASTER_SHEET_NAME);
  if (master) {
    const mData = master.getDataRange().getValues();
    if (mData.length > 0) {
      const mHeaders = mData[0].map(h => String(h).trim());
      const mNameCol = mHeaders.indexOf('Propellant Name') + 1 || 3;
      const mRatioCol = mHeaders.indexOf('Mix Ratio') + 1 || 6;
      const mCookCol = mHeaders.indexOf('Cook Time (min)') + 1 || 18;
      const mDescCol = mHeaders.indexOf('Description / Purpose') + 1 || 19;

      for (let i = 1; i < mData.length; i++) {
        if (String(mData[i][0]).trim() === propellantId) {
          if (mNameCol > 0)  master.getRange(i + 1, mNameCol).setValue(newName);
          if (mRatioCol > 0) master.getRange(i + 1, mRatioCol).setValue(newRatio);
          if (mCookCol > 0)  master.getRange(i + 1, mCookCol).setValue(newCookTime);
          if (mDescCol > 0)  master.getRange(i + 1, mDescCol).setValue(newDesc);
          break;
        }
      }
    }
  }

  return jsonResponse({
    success: true,
    message: `Details updated for "${propellantId}".`
  });
}

// ── Vertical Data Generator (Key - Value Pairs) ──
function buildVerticalData(p) {
  return [
    ['Propellant ID',          String(p.propellantId     || '')],
    ['Unique UID',             String(p.uniqueUid        || '')],
    ['Propellant Name',        String(p.propellantName   || '')],
    ['Submitted At',           String(p.submittedAt      || '')],
    ['Propellant Type',        String(p.propellantType   || '')],
    ['Mix Ratio',              String(p.mixRatio         || '')],
    ['Chemical 1 Name',        String(p.chem1Name        || '')],
    ['Chemical 1 %',           Number(p.chem1Percent)    || 0],
    ['Chemical 1 Grams (g)',   Number(p.chem1Grams)      || 0],
    ['Chemical 2 Name',        String(p.chem2Name        || '')],
    ['Chemical 2 %',           Number(p.chem2Percent)    || 0],
    ['Chemical 2 Grams (g)',   Number(p.chem2Grams)      || 0],
    ['Has Catalyst',           String(p.hasCatalyst      || 'false')],
    ['Catalyst Name',          String(p.catalystName     || '')],
    ['Catalyst %',             Number(p.catalystPercent) || 0],
    ['Catalyst Grams (g)',     Number(p.catalystGrams)   || 0],
    ['Total Grams (g)',        Number(p.totalGrams)      || 0],
    ['Cook Time (min)',        Number(p.cookTimeMinutes) || 0],
    ['Description / Purpose',  String(p.description      || '')],
    ['Status',                 'Pending'],
    ['Status Description',     ''],
    ['Status Updated At',      '']
  ];
}

function ensureMasterHeaders(ss) {
  const master = getOrCreateMasterSheet(ss);
  const data = master.getDataRange().getValues();

  if (data.length > 0) {
    const firstCell = String(data[0][0]).trim().toLowerCase();
    if (firstCell !== 'propellant id') {
      // Row 1 is data, not header! Insert a clean header row at Row 1
      master.insertRowBefore(1);
      const hRange = master.getRange(1, 1, 1, MASTER_HEADERS.length);
      hRange.setValues([MASTER_HEADERS]);
      styleHeaderRow(hRange);
      master.setFrozenRows(1);
    }
  }

  return master;
}

function getOrCreateMasterSheet(ss) {
  let master = ss.getSheetByName(MASTER_SHEET_NAME);

  if (!master) {
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && defaultSheet.getLastRow() === 0) {
      defaultSheet.setName(MASTER_SHEET_NAME);
      master = defaultSheet;
      ss.setActiveSheet(master);
      ss.moveActiveSheet(1);
    } else {
      master = ss.insertSheet(MASTER_SHEET_NAME, 0);
    }

    const hRange = master.getRange(1, 1, 1, MASTER_HEADERS.length);
    hRange.setValues([MASTER_HEADERS]);
    styleHeaderRow(hRange);
    master.setFrozenRows(1);
    master.setColumnWidths(1, MASTER_HEADERS.length, 160);
  } else {
    // If master log exists with old 7-col layout, upgrade headers
    if (master.getLastColumn() < MASTER_HEADERS.length) {
      const hRange = master.getRange(1, 1, 1, MASTER_HEADERS.length);
      hRange.setValues([MASTER_HEADERS]);
      styleHeaderRow(hRange);
      master.setFrozenRows(1);
      master.setColumnWidths(1, MASTER_HEADERS.length, 160);
    }
  }

  return master;
}

function styleHeaderRow(range) {
  range.setBackground('#4da6ff');  // light blue
  range.setFontColor('#ffffff');   // white text
  range.setFontWeight('bold');
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');
  range.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
