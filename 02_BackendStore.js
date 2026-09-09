function pdmscGetOrCreateBackendSheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getMaxColumns() < headers.length) sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');
  if (!sh.isSheetHidden()) sh.hideSheet();
  return sh;
}
function pdmscEnsureBackend_() {
  const specs = pdmscSchemaRegistry_();
  Object.keys(specs).forEach(name => pdmscGetOrCreateBackendSheet_(name, specs[name]));
}
function pdmscAppendRow_(sheetName, row) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh) throw new Error('ไม่พบ backend: ' + sheetName);
  sh.appendRow(row);
}
function pdmscRows_(sheetName) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
}
