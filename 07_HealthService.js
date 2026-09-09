function pdmscHealthSchemaChecks_() {
  const out=[],specs=pdmscSchemaRegistry_(),ss=SpreadsheetApp.getActive();
  Object.keys(specs).forEach(name=>{
    const sh=ss.getSheetByName(name);let ok=!!sh,note='';
    if(ok){const got=sh.getRange(1,1,1,specs[name].length).getDisplayValues()[0];ok=specs[name].every((h,i)=>got[i]===h);if(!ok)note='header/schema ไม่ตรง';}
    else note='ไม่พบ backend';
    out.push({name:name,ok:ok,note:note});
  });
  const p=PropertiesService.getDocumentProperties(),schemaVersion=p.getProperty(PDMSC.PROP_SCHEMA_VERSION)||'';
  if(schemaVersion!==PDMSC.SCHEMA_VERSION)out.push({name:'SCHEMA_VERSION',ok:false,note:schemaVersion||'ว่าง'});
  return {checks:out,schemaVersion:schemaVersion};
}
function pdmscHealthStage_(stage) {
  const s=String(stage||'').toUpperCase();
  if(s==='SCHEMA')return pdmscHealthSchemaChecks_();
  if(s==='PERSONNEL')return {checks:typeof pdmscPersonnelHealthChecks_==='function'?pdmscPersonnelHealthChecks_():[]};
  if(s==='LEAVE')return {checks:typeof pdmscLeaveHealthChecks_==='function'?pdmscLeaveHealthChecks_():[]};
  if(s==='SETTINGS')return {checks:typeof pdmscSettingsHealthChecks_==='function'?pdmscSettingsHealthChecks_():[]};
  if(s==='ATTENDANCE')return {checks:typeof pdmscAttendanceRawHealthChecks_==='function'?pdmscAttendanceRawHealthChecks_():[]};
  throw new Error('ไม่รู้จักขั้นตรวจสุขภาพ: '+stage);
}
function pdmscHealthCheck() {
  const out={ok:true,version:PDMSC.VERSION,checks:[]};
  const stages=['SCHEMA','PERSONNEL','LEAVE','SETTINGS','ATTENDANCE'];
  stages.forEach(stage=>{
    const r=pdmscHealthStage_(stage)||{};
    if(stage==='SCHEMA')out.schemaVersion=r.schemaVersion||'';
    (r.checks||[]).forEach(c=>{out.checks.push(c);if(!c.ok)out.ok=false;});
  });
  return out;
}
function pdmscShowHealthCheck() {
  const r=pdmscHealthCheck();
  const bad=r.checks.filter(x=>!x.ok);
  SpreadsheetApp.getUi().alert(r.ok?'PDMS Continuous — ระบบพร้อม':'PDMS Continuous — ต้องตรวจ', r.ok?('Version '+r.version+'\nBackend/Schema ผ่านทั้งหมด'):bad.map(x=>x.name+': '+x.note).join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
}
