function doGet(e) {
  const t = HtmlService.createTemplateFromFile('WebApp');
  t.initialRoute = (e && e.parameter && e.parameter.page) ? String(e.parameter.page) : 'dashboard';
  return t.evaluate()
    .setTitle('PDMS Continuous 6M')
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}
function pdmscInclude_(fileName){return HtmlService.createHtmlOutputFromFile(fileName).getContent();}
function pdmscNormalizeWebAppUrl_(value){
  const s=String(value||'').trim();
  if(!s)return '';
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:[?#].*)?$/.test(s))
    throw new Error('URL ไม่ใช่ Google Apps Script Web App แบบ /exec');
  return s.replace(/[?#].*$/,'');
}
function pdmscGetBoundWebAppUrl_(){return String(PropertiesService.getDocumentProperties().getProperty(PDMSC.PROP_WEB_APP_URL)||'').trim();}
function pdmscSetBoundWebAppUrl(url){
  const clean=pdmscNormalizeWebAppUrl_(url);
  PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_WEB_APP_URL,clean);
  if(typeof pdmscEnsurePage00Launcher_==='function')pdmscEnsurePage00Launcher_();
  pdmscLog_('WEB_APP_URL_BIND','OK',{url:clean});
  return{ok:true,url:clean};
}

function pdmscEnsurePage00Launcher_(){
  const ss=SpreadsheetApp.getActive();
  const name='00_หน้าหลัก';
  let sh=ss.getSheetByName(name);
  if(!sh)sh=ss.insertSheet(name,0);
  try{if(sh.isSheetHidden())sh.showSheet();}catch(_e){}
  if(ss.getSheets()[0].getSheetId()!==sh.getSheetId()){
    try{ss.setActiveSheet(sh);ss.moveActiveSheet(1);}catch(_e){}
  }
  if(sh.getMaxColumns()<6)sh.insertColumnsAfter(sh.getMaxColumns(),6-sh.getMaxColumns());
  sh.getRange('A1:F1').clearContent().clearFormat();
  sh.getRange('A1').setValue('PDMS Continuous 6M — จุดเปิดระบบ').setFontWeight('bold').setFontSize(14);
  sh.getRange('B1').setValue('เปิด PDMS Web App').setFontWeight('bold');
  const url=pdmscGetBoundWebAppUrl_();
  const c=sh.getRange('C1');
  c.clearContent();
  if(url){
    const rt=SpreadsheetApp.newRichTextValue().setText(url).setLinkUrl(url).build();
    c.setRichTextValue(rt).setFontColor('#1155cc').setFontLine('underline');
  }else c.setValue('(ยังไม่ได้ตั้งค่า Web App URL)');
  sh.getRange('D1').setValue('ใช้ลิงก์แถวนี้เป็นจุดเปิดระบบหลัก').setFontColor('#5f6368');
  sh.setFrozenRows(1);
  sh.setColumnWidth(1,235);sh.setColumnWidth(2,150);sh.setColumnWidth(3,420);sh.setColumnWidth(4,260);
  sh.getRange('A1:F1').setBackground('#e8f0fe').setVerticalAlignment('middle');
  sh.setRowHeight(1,34);
  return{name,url};
}

function pdmscClearBoundWebAppUrl(){
  PropertiesService.getDocumentProperties().deleteProperty(PDMSC.PROP_WEB_APP_URL);
  if(typeof pdmscEnsurePage00Launcher_==='function')pdmscEnsurePage00Launcher_();
  pdmscLog_('WEB_APP_URL_CLEAR','OK',{});
  return{ok:true};
}
function pdmscGetWebAppUrl_(){return pdmscGetBoundWebAppUrl_();}
function pdmscOpenWebAppFromSheet(){
  const url=pdmscGetBoundWebAppUrl_();
  if(!url){pdmscShowWebAppUrlSetupDialog();return;}
  pdmscShowWebAppLaunchDialog_(url);
}
function pdmscShowWebAppLaunchDialog_(url){
  const safe=String(url||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const html=HtmlService.createHtmlOutput(
    '<!doctype html><html><head><base target="_blank"><style>'+
    'body{font-family:Arial,sans-serif;padding:18px;color:#202124}.btn{display:inline-block;background:#1a73e8;color:white;text-decoration:none;padding:11px 16px;border-radius:8px;font-weight:700}.url{margin-top:12px;padding:10px;background:#f1f3f4;border-radius:8px;font-size:12px;word-break:break-all}.note{font-size:12px;color:#5f6368;margin-top:10px}</style></head><body>'+
    '<h3>PDMS Continuous 6M</h3><p>กดปุ่มเพื่อเปิด Web App ที่ผูกกับไฟล์นี้</p>'+
    '<a class="btn" href="'+safe+'">เปิด PDMS Web App</a><div class="url">'+safe+'</div>'+
    '<div class="note">หาก URL นี้ไม่ถูกต้อง ให้ใช้เมนู PDMS → ตั้งค่า Web App URL</div></body></html>'
  ).setWidth(560).setHeight(270);
  SpreadsheetApp.getUi().showModelessDialog(html,'เปิด PDMS Web App');
}
function pdmscShowWebAppUrlSetupDialog(){
  const t=HtmlService.createTemplateFromFile('WebAppUrlSetup');
  t.currentUrl=pdmscGetBoundWebAppUrl_();
  SpreadsheetApp.getUi().showModalDialog(t.evaluate().setWidth(620).setHeight(360),'ตั้งค่า Web App URL');
}
function pdmscShowWebAppDeploymentInfo(){
  const bound=pdmscGetBoundWebAppUrl_(),runtime=ScriptApp.getService().getUrl()||'';
  const text='URL ที่ PDMS ใช้เปิดจาก Google Sheet:\n'+(bound||'(ยังไม่ได้ตั้งค่า)')+
    '\n\nURL ที่ Apps Script runtime รายงาน:\n'+(runtime||'(ไม่พบ)')+
    '\n\nหมายเหตุ: PDMS จะยึด URL ที่ผู้ใช้ตั้งค่าเป็น Source of Truth';
  SpreadsheetApp.getUi().alert('PDMS Web App — URL Binding',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{boundUrl:bound,runtimeUrl:runtime};
}
