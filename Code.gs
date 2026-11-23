// REPLACE WITH YOUR GOOGLE DRIVE FOLDER ID
const DRIVE_FOLDER_ID = '1A2B3C4D5E6F7G8H9I0J';

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
        dateStr,
        timeStr,
        payload.lat,
        payload.lng
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const outlet = payload.outlet;
    const products = payload.products;
    const outletId = 'OUT-' + now.getTime();

    let photoUrl = '';
    if (outlet.photoDataUrl) {
      const base64Data = outlet.photoDataUrl.split(',')[1];
      const blob = Utilities.newBlob(
        Utilities.base64Decode(base64Data),
        'image/jpeg',
        `${outletId}_${payload.internId}.jpg`
      );
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      photoUrl = file.getUrl();
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
      dateStr,
      timeStr,
      photoUrl
    ]);

    if (outlet.lat && outlet.lng) {
      const routeSheet = ss.getSheetByName('Route_Logs');
      routeSheet.appendRow([
        'LOG-' + now.getTime(),
        payload.internId,
        dateStr,
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
    const catSheet = ss.getSheetByName('Catalog');
    if (catSheet) {
      const catData = catSheet.getDataRange().getValues();
      for (let i = 1; i < catData.length; i++) {
        const category = String(catData[i][0] || '').trim().toLowerCase();
        const company = String(catData[i][1] || '').trim();
        const brand = String(catData[i][2] || '').trim();
        if (catalog[category] && company) {
          if (!catalog[category][company]) catalog[category][company] = [];
          if (brand && catalog[category][company].indexOf(brand) === -1) {
            catalog[category][company].push(brand);
          }
        }
      }
    }

    const skuRanges = [];
    const skuSheet = ss.getSheetByName('SKU_Ranges');
    if (skuSheet) {
      const skuData = skuSheet.getDataRange().getValues();
      for (let i = 1; i < skuData.length; i++) {
        const range = String(skuData[i][0] || '').trim();
        if (range) skuRanges.push(range);
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({ catalog: catalog, skuRanges: skuRanges })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (type === 'admin_data') {
    const outletsData = ss.getSheetByName('Outlets').getDataRange().getValues();
    const outlets = [];
    for (let i = 1; i < outletsData.length; i++) {
      outlets.push({
        outletId: String(outletsData[i][0]),
        internId: String(outletsData[i][1]),
        outletName: String(outletsData[i][2]),
        outletType: String(outletsData[i][3]),
        address: String(outletsData[i][5]),
        lat: parseFloat(outletsData[i][6]) || null,
        lng: parseFloat(outletsData[i][7]) || null,
        date: String(outletsData[i][8]),
        time: String(outletsData[i][9]),
        photoUrl: String(outletsData[i][10])
      });
    }

    const usersData = ss.getSheetByName('Users').getDataRange().getValues();
    const users = [];
    for (let i = 1; i < usersData.length; i++) {
      if (usersData[i][0]) {
        users.push({
          username: String(usersData[i][0]),
          fullName: String(usersData[i][1]),
          userType: String(usersData[i][2]),
          password: String(usersData[i][3]),
          status: String(usersData[i][4] || 'Active')
        });
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({ outlets: outlets.reverse(), users: users })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (type === 'coverage') {
    const internId = e.parameter.internId;
    const targetDate = e.parameter.date;
    const outletsData = ss.getSheetByName('Outlets').getDataRange().getValues();
    const covered = [];

    for (let i = 1; i < outletsData.length; i++) {
      const rowIntern = String(outletsData[i][1]);
      const rowDate = String(outletsData[i][8]);
      if (rowIntern === internId && (!targetDate || rowDate.includes(targetDate))) {
        covered.push({
          outletId: outletsData[i][0],
          outletName: outletsData[i][2],
          outletType: outletsData[i][3],
          address: outletsData[i][5],
          date: rowDate,
          time: String(outletsData[i][9])
        });
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({ count: covered.length, outlets: covered.reverse() })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const internId = e.parameter.internId;
  const targetDate = e.parameter.date;
  const routeData = ss.getSheetByName('Route_Logs').getDataRange().getValues();
  const points = [];

  for (let i = 1; i < routeData.length; i++) {
    const rowIntern = String(routeData[i][1]);
    const rowDate = String(routeData[i][2]);
    if (rowIntern === internId && (!targetDate || rowDate.includes(targetDate))) {
      points.push({
        time: String(routeData[i][3]),
        lat: parseFloat(routeData[i][4]),
        lng: parseFloat(routeData[i][5])
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ points: points }))
    .setMimeType(ContentService.MimeType.JSON);
}
