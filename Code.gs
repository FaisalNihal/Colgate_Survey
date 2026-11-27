// REPLACE WITH YOUR GOOGLE DRIVE FOLDER ID
const DRIVE_FOLDER_ID = '1A2B3C4D5E6F7G8H9I0J';

// Helper: Ensures Google Sheet Date objects or strings always format cleanly as YYYY-MM-DD
function formatSheetDate(val) {
  if (!val) return '';
  const tz = Session.getScriptTimeZone() || 'GMT+6';
  if (val instanceof Date) {
    return Utilities.formatDate(val, tz, 'yyyy-MM-dd');
  }
  const s = String(val).trim().replace(/^'/, '');
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10);
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, tz, 'yyyy-MM-dd');
  }
  return s;
}

// Helper: Case-insensitive flexible sheet lookup
function findSheetByNames(ss, candidates) {
  const sheets = ss.getSheets();
  for (let i = 0; i < candidates.length; i++) {
    const target = candidates[i].toLowerCase();
    for (let j = 0; j < sheets.length; j++) {
      const name = sheets[j].getName().trim().toLowerCase();
      if (name === target || name.indexOf(target) !== -1) {
        return sheets[j];
      }
    }
  }
  return null;
}

// 1. RECEIVES SURVEYS & GPS PINGS FROM THE APP
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const now = new Date();
    const dateStr = Utilities.formatDate(now, 'GMT+6', 'yyyy-MM-dd');
    const timeStr = Utilities.formatDate(now, 'GMT+6', 'hh:mm:ss a');

    if (payload.action === 'log_gps') {
      const routeSheet = ss.getSheetByName('Route_Logs');
      routeSheet.appendRow([
        'LOG-' + now.getTime(),
        payload.internId,
        "'" + dateStr,
        timeStr,
        payload.lat,
        payload.lng
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === 'save_catalog') {
      let catSheet = findSheetByNames(ss, [
        'catalog',
        'company & brand',
        'company and brand',
        'brand',
        'companies'
      ]);
      if (!catSheet) {
        catSheet = ss.insertSheet('Catalog');
      }
      catSheet.clearContents();
      const catalogRows = [['Category', 'Company_Name', 'Brand_Name']];
      const catalogObj = payload.catalog || {};
      ['toothpaste', 'toothbrush', 'mouthwash'].forEach(function (catKey) {
        const compMap = catalogObj[catKey] || {};
        Object.keys(compMap).forEach(function (compName) {
          const brands = compMap[compName] || [];
          if (brands.length === 0) {
            catalogRows.push([catKey, compName, '']);
          } else {
            brands.forEach(function (bName) {
              catalogRows.push([catKey, compName, bName]);
            });
          }
        });
      });
      catSheet.getRange(1, 1, catalogRows.length, 3).setValues(catalogRows);

      let skuSheet = findSheetByNames(ss, [
        'sku_ranges',
        'sku size range',
        'sku range',
        'sku'
      ]);
      if (!skuSheet) {
        skuSheet = ss.insertSheet('SKU_Ranges');
      }
      skuSheet.clearContents();
      const skuRows = [['SKU_Size_Range']];
      (payload.skuRanges || []).forEach(function (r) {
        if (String(r || '').trim()) {
          skuRows.push([String(r).trim()]);
        }
      });
      skuSheet.getRange(1, 1, skuRows.length, 1).setValues(skuRows);

      return ContentService.createTextOutput(
        JSON.stringify({
          status: 'success',
          catalogSheetName: catSheet.getName(),
          skuSheetName: skuSheet.getName()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Default action: submit_survey
    const outlet = payload.outlet || {};
    const products = payload.products || {};
    const outletId = 'OUT-' + now.getTime();
    let photoUrl = '';

    if (outlet.photoDataUrl && DRIVE_FOLDER_ID && DRIVE_FOLDER_ID !== '1A2B3C4D5E6F7G8H9I0J') {
      try {
        const parts = String(outlet.photoDataUrl).split(',');
        const base64Data = parts.length > 1 ? parts[1] : parts[0];
        const mimeMatch = parts[0].match(/data:(.*?);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const decoded = Utilities.base64Decode(base64Data);
        const blob = Utilities.newBlob(
          decoded,
          mimeType,
          outletId + '_' + (payload.internId || 'intern') + '.jpg'
        );
        const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        photoUrl = file.getUrl();
      } catch (photoErr) {
        photoUrl = '';
      }
    }

    const outletsSheet = ss.getSheetByName('Outlets');
    outletsSheet.appendRow([
      outletId,
      payload.internId,
      outlet.name,
      outlet.type,
      outlet.mobile || '',
      outlet.address || '',
      outlet.lat || '',
      outlet.lng || '',
      "'" + dateStr,
      timeStr,
      photoUrl,
      outlet.locationName || ''
    ]);

    if (outlet.lat && outlet.lng) {
      const routeSheet = ss.getSheetByName('Route_Logs');
      routeSheet.appendRow([
        'LOG-' + now.getTime(),
        payload.internId,
        "'" + dateStr,
        timeStr,
        outlet.lat,
        outlet.lng
      ]);
    }

    const productsSheet = ss.getSheetByName('Products');
    ['toothpaste', 'toothbrush', 'mouthwash'].forEach(cat => {
      const items = products[cat] || [];
      items.forEach(item => {
        if (item.company) {
          productsSheet.appendRow([
            'PRD-' + Math.floor(Math.random() * 10000000),
            outletId,
            cat,
            item.company,
            (item.brands || []).join(', '),
            (item.skus || []).join(', '),
            item.totalQty || 0
          ]);
        }
      });
    });

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', outletId: outletId, date: dateStr, time: timeStr })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. HANDLES LOGIN VERIFICATION, ADMIN DASHBOARD, COVERAGE & ROUTE MAP
function doGet(e) {
  const type = e.parameter.type || 'route';
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (type === 'login') {
    const username = String(e.parameter.username || '').trim().toLowerCase();
    const password = String(e.parameter.password || '').trim();
    const usersSheet = ss.getSheetByName('Users');
    const data = usersSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const rowUser = String(data[i][0] || '').trim().toLowerCase();
      const rowFullName = String(data[i][1] || '').trim();
      const rowType = String(data[i][2] || 'intern').trim().toLowerCase();
      const rowPass = String(data[i][3] || '').trim();
      const rowStatus = String(data[i][4] || 'Active').trim().toLowerCase();

      if (rowUser === username && rowPass === password) {
        if (rowStatus !== 'active') {
          return ContentService.createTextOutput(
            JSON.stringify({ valid: false, message: 'This account is inactive. Contact Admin.' })
          ).setMimeType(ContentService.MimeType.JSON);
        }
        return ContentService.createTextOutput(
          JSON.stringify({
            valid: true,
            username: String(data[i][0]).trim(),
            fullName: rowFullName,
            userType: rowType
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({ valid: false, message: 'Invalid username or password.' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (type === 'catalog') {
    const catalog = { toothpaste: {}, toothbrush: {}, mouthwash: {} };
    let hasSheetCatalog = false;
    let catalogSheetName = '';

    // Automatically finds your Company & Brand tab regardless of exact name
    const catSheet = findSheetByNames(ss, [
      'catalog',
      'company & brand',
      'company and brand',
      'brand',
      'companies'
    ]);

    if (catSheet) {
      catalogSheetName = catSheet.getName();
      const catData = catSheet.getDataRange().getValues();
      if (catData.length > 1) {
        const headers = catData[0].map(h => String(h || '').trim().toLowerCase());
        const catCol = headers.findIndex(h => h.indexOf('category') !== -1 || h.indexOf('type') !== -1);
        const compCol = headers.findIndex(h => h.indexOf('company') !== -1);
        const brandCol = headers.findIndex(h => h.indexOf('brand') !== -1);

        const tpCol = headers.findIndex(h => h.indexOf('toothpaste') !== -1);
        const tbCol = headers.findIndex(h => h.indexOf('toothbrush') !== -1);
        const mwCol = headers.findIndex(h => h.indexOf('mouthwash') !== -1);

        const addBrand = (catKey, company, brandText) => {
          if (!company || !catalog[catKey]) return;
          if (!catalog[catKey][company]) catalog[catKey][company] = [];
          String(brandText || '')
            .split(/[,;\n]+/)
            .map(b => b.trim())
            .filter(Boolean)
            .forEach(b => {
              if (catalog[catKey][company].indexOf(b) === -1) {
                catalog[catKey][company].push(b);
              }
            });
          hasSheetCatalog = true;
        };

        for (let i = 1; i < catData.length; i++) {
          const row = catData[i];
          if (tpCol !== -1 || tbCol !== -1 || mwCol !== -1) {
            const company = String(row[compCol !== -1 ? compCol : 0] || '').trim();
            if (!company) continue;
            if (tpCol !== -1 && String(row[tpCol] || '').trim()) addBrand('toothpaste', company, row[tpCol]);
            if (tbCol !== -1 && String(row[tbCol] || '').trim()) addBrand('toothbrush', company, row[tbCol]);
            if (mwCol !== -1 && String(row[mwCol] || '').trim()) addBrand('mouthwash', company, row[mwCol]);
          } else if (catCol !== -1) {
            const rawCat = String(row[catCol] || '').trim().toLowerCase();
            const company = String(row[compCol !== -1 ? compCol : 1] || '').trim();
            const brand = String(row[brandCol !== -1 ? brandCol : 2] || '').trim();
            if (!company) continue;
            if (rawCat.indexOf('paste') !== -1) {
              addBrand('toothpaste', company, brand);
            } else if (rawCat.indexOf('brush') !== -1) {
              addBrand('toothbrush', company, brand);
            } else if (rawCat.indexOf('wash') !== -1) {
              addBrand('mouthwash', company, brand);
            } else {
              addBrand('toothpaste', company, brand);
              addBrand('toothbrush', company, brand);
              addBrand('mouthwash', company, brand);
            }
          } else {
            const company = String(row[compCol !== -1 ? compCol : 0] || '').trim();
            const brand = String(row[brandCol !== -1 ? brandCol : 1] || '').trim();
            if (!company) continue;
            addBrand('toothpaste', company, brand);
            addBrand('toothbrush', company, brand);
            addBrand('mouthwash', company, brand);
          }
        }
      }
    }

    const skuRanges = [];
    let hasSheetSku = false;
    let skuSheetName = '';

    const skuSheet = findSheetByNames(ss, [
      'sku_ranges',
      'sku size range',
      'sku range',
      'sku'
    ]);

    if (skuSheet) {
      skuSheetName = skuSheet.getName();
      const skuData = skuSheet.getDataRange().getValues();
      for (let i = 1; i < skuData.length; i++) {
        const range = String(skuData[i][0] || '').trim();
        if (range && skuRanges.indexOf(range) === -1) {
          skuRanges.push(range);
          hasSheetSku = true;
        }
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        catalog: catalog,
        skuRanges: skuRanges,
        hasSheetCatalog: hasSheetCatalog,
        hasSheetSku: hasSheetSku,
        catalogSheetName: catalogSheetName,
        skuSheetName: skuSheetName
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (type === 'admin_data') {
    const outletsData = ss.getSheetByName('Outlets').getDataRange().getValues();
    const outlets = [];
    for (let i = 1; i < outletsData.length; i++) {
      if (!outletsData[i][0]) continue;
      outlets.push({
        outletId: String(outletsData[i][0]).trim(),
        internId: String(outletsData[i][1]).trim(),
        outletName: String(outletsData[i][2]).trim(),
        outletType: String(outletsData[i][3]).trim(),
        mobile: String(outletsData[i][4] || '').trim(),
        address: String(outletsData[i][5] || '').trim(),
        lat: parseFloat(outletsData[i][6]) || null,
        lng: parseFloat(outletsData[i][7]) || null,
        date: formatSheetDate(outletsData[i][8]),
        time: String(outletsData[i][9] || '').trim(),
        photoUrl: String(outletsData[i][10] || '').trim(),
        locationName: String(outletsData[i][11] || '').trim()
      });
    }

    const usersData = ss.getSheetByName('Users').getDataRange().getValues();
    const users = [];
    for (let i = 1; i < usersData.length; i++) {
      if (usersData[i][0]) {
        users.push({
          username: String(usersData[i][0]).trim(),
          fullName: String(usersData[i][1] || '').trim(),
          userType: String(usersData[i][2] || 'intern').trim(),
          password: String(usersData[i][3] || '').trim(),
          status: String(usersData[i][4] || 'Active').trim()
        });
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({ outlets: outlets.reverse(), users: users })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (type === 'coverage') {
    const internId = String(e.parameter.internId || '').trim().toLowerCase();
    const targetDate = formatSheetDate(e.parameter.date || '');
    const outletsData = ss.getSheetByName('Outlets').getDataRange().getValues();
    const covered = [];

    for (let i = 1; i < outletsData.length; i++) {
      const rowIntern = String(outletsData[i][1] || '').trim().toLowerCase();
      const rowDate = formatSheetDate(outletsData[i][8]);
      if (rowIntern === internId && (!targetDate || rowDate === targetDate)) {
        covered.push({
          outletId: String(outletsData[i][0]).trim(),
          internId: String(outletsData[i][1]).trim(),
          outletName: String(outletsData[i][2]).trim(),
          outletType: String(outletsData[i][3]).trim(),
          mobile: String(outletsData[i][4] || '').trim(),
          address: String(outletsData[i][5] || '').trim(),
          lat: parseFloat(outletsData[i][6]) || null,
          lng: parseFloat(outletsData[i][7]) || null,
          date: rowDate,
          time: String(outletsData[i][9] || '').trim(),
          photoUrl: String(outletsData[i][10] || '').trim(),
          locationName: String(outletsData[i][11] || '').trim()
        });
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({ outlets: covered.reverse() })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Daily route points (merges Route_Logs + Outlets coordinates for the intern & date)
  const internId = String(e.parameter.internId || '').trim().toLowerCase();
  const targetDate = formatSheetDate(e.parameter.date || '');
  const points = [];
  const seenKeys = {};
  const availableDatesMap = {};

  const routeSheet = ss.getSheetByName('Route_Logs');
  if (routeSheet) {
    const routeData = routeSheet.getDataRange().getValues();
    for (let i = 1; i < routeData.length; i++) {
      const rowIntern = String(routeData[i][1] || '').trim().toLowerCase();
      const rowDate = formatSheetDate(routeData[i][2]);
      const lat = parseFloat(routeData[i][4]);
      const lng = parseFloat(routeData[i][5]);
      if (rowIntern === internId && !isNaN(lat) && !isNaN(lng)) {
        if (rowDate) availableDatesMap[rowDate] = true;
        if (!targetDate || rowDate === targetDate) {
          const timeVal = String(routeData[i][3] || '').trim();
          const key = `${lat.toFixed(5)}_${lng.toFixed(5)}_${timeVal}`;
          if (!seenKeys[key]) {
            seenKeys[key] = true;
            points.push({ time: timeVal, lat: lat, lng: lng });
          }
        }
      }
    }
  }

  const outletsSheet = ss.getSheetByName('Outlets');
  if (outletsSheet) {
    const outletsData = outletsSheet.getDataRange().getValues();
    for (let i = 1; i < outletsData.length; i++) {
      const rowIntern = String(outletsData[i][1] || '').trim().toLowerCase();
      const rowDate = formatSheetDate(outletsData[i][8]);
      const lat = parseFloat(outletsData[i][6]);
      const lng = parseFloat(outletsData[i][7]);
      if (rowIntern === internId && !isNaN(lat) && !isNaN(lng)) {
        if (rowDate) availableDatesMap[rowDate] = true;
        if (!targetDate || rowDate === targetDate) {
          const timeVal = String(outletsData[i][9] || '').trim();
          const key = `${lat.toFixed(5)}_${lng.toFixed(5)}_${timeVal}`;
          if (!seenKeys[key]) {
            seenKeys[key] = true;
            points.push({
              time: timeVal,
              label: String(outletsData[i][2] || '').trim(),
              lat: lat,
              lng: lng
            });
          }
        }
      }
    }
  }

  const availableDates = Object.keys(availableDatesMap).sort().reverse();

  return ContentService.createTextOutput(
    JSON.stringify({ points: points, availableDates: availableDates })
  ).setMimeType(ContentService.MimeType.JSON);
}
