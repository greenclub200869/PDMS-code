function pdmscResetProfile_() {
  const B=PDMSC.BACKEND;
  return {
    NEW_PERIOD: [B.RAW_LEAVE,B.LEAVE_STORE,B.RAW_ATTENDANCE,B.EVENT_STORE,B.DECISIONS,B.DOC_HISTORY,B.MONTHLY_DOC_HISTORY,B.JOBS,B.LOG],
    FACTORY: Object.keys(pdmscSchemaRegistry_())
  };
}
function pdmscClearSheetData_(name) {
  const sh=SpreadsheetApp.getActive().getSheetByName(name);
  if(sh && sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,sh.getMaxColumns()).clearContent().clearDataValidations().clearFormat();
}
function pdmscStartNewPeriod() {
  const ui=SpreadsheetApp.getUi();
  const r=ui.alert('เริ่มรอบใหม่','ล้างข้อมูลปฏิบัติงาน/เหตุการณ์/การตัดสิน/ประวัติเอกสารของรอบเดิมทั้งหมด แต่คงบุคลากร Mapping รายชื่อยกเว้น และกฎระบบไว้\n\nยืนยันหรือไม่?',ui.ButtonSet.YES_NO);
  if(r!==ui.Button.YES)return;
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscResetProfile_().NEW_PERIOD.forEach(pdmscClearSheetData_);
    PropertiesService.getDocumentProperties().deleteProperty(PDMSC.PROP_ACTIVE_PERIOD);
    PropertiesService.getDocumentProperties().deleteProperty(PDMSC.PROP_LEAVE_PREVIEW);
    PropertiesService.getDocumentProperties().deleteProperty(PDMSC.PROP_PERSONNEL_BULK_PREVIEW);
    if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['attendance-bootstrap','leave-active','dashboard','system-bootstrap']);
    pdmscLog_('RESET_NEW_PERIOD','OK',{});
    ui.alert('เริ่มรอบใหม่เรียบร้อย','ระบบพร้อมรับข้อมูลรอบใหม่ โดยยังเก็บค่าตั้งค่าหลักไว้',ui.ButtonSet.OK);
  }finally{lock.releaseLock();}
}
function pdmscFactoryReset() {
  const ui=SpreadsheetApp.getUi();
  const first=ui.alert('Factory Reset ทั้งระบบ','คำสั่งนี้ล้างข้อมูลและการตั้งค่าทั้งหมดของ PDMS Continuous ให้เหลือโครงระบบเปล่า\n\nต้องการดำเนินการต่อหรือไม่?',ui.ButtonSet.YES_NO);
  if(first!==ui.Button.YES)return;
  const phrase=ui.prompt('ยืนยัน Factory Reset','พิมพ์ RESET PDMS เพื่อยืนยัน',ui.ButtonSet.OK_CANCEL);
  if(phrase.getSelectedButton()!==ui.Button.OK || phrase.getResponseText().trim()!=='RESET PDMS'){ui.alert('ยกเลิก Factory Reset');return;}
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscResetProfile_().FACTORY.forEach(pdmscClearSheetData_);
    const p=PropertiesService.getDocumentProperties();
    const installId=p.getProperty(PDMSC.PROP_INSTALL_ID)||Utilities.getUuid();
    p.deleteAllProperties();
    p.setProperties({[PDMSC.PROP_INSTALL_ID]:installId,[PDMSC.PROP_SCHEMA_VERSION]:PDMSC.SCHEMA_VERSION});
    if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['attendance-bootstrap','leave-active','dashboard','system-bootstrap','personnel-bootstrap','settings']);
    pdmscLog_('FACTORY_RESET','OK',{});
    ui.alert('Factory Reset เรียบร้อย','โครงระบบและฟังก์ชันยังอยู่ครบ พร้อมรับข้อมูลเหมือนไฟล์ใหม่',ui.ButtonSet.OK);
  }finally{lock.releaseLock();}
}
