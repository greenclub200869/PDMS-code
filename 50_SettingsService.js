const PDMSC_SETTINGS = Object.freeze({
  KEYS: Object.freeze({
    SCHOOL_NAME:'SCHOOL_NAME', PREPARED_BY:'PREPARED_BY', DIRECTOR_NAME:'DIRECTOR_NAME',
    HR_DEPUTY_NAME:'HR_DEPUTY_NAME', ASSISTANT_DIRECTOR_NAME:'ASSISTANT_DIRECTOR_NAME',
    LATE_CUTOFF:'LATE_CUTOFF', SCAN_ACCEPT_START:'SCAN_ACCEPT_START', SINGLE_SCAN_SPLIT:'SINGLE_SCAN_SPLIT',
    WARNING_ENABLED:'WARNING_ENABLED', WARNING_WEEK_START:'WARNING_WEEK_START', WARNING_WEEK_END:'WARNING_WEEK_END', WARNING_EXCLUDED_GROUPS:'WARNING_EXCLUDED_GROUPS',
    TIME_RULE_VERSION:'TIME_RULE_VERSION', WARNING_RULE_VERSION:'WARNING_RULE_VERSION',
    DOC_TEMPLATE_MONTHLY_COVER:'DOC_TEMPLATE_MONTHLY_COVER', DOC_TEMPLATE_WARNING_LEAVE_COVER:'DOC_TEMPLATE_WARNING_LEAVE_COVER', DOC_TEMPLATE_WARNING_LATE_COVER:'DOC_TEMPLATE_WARNING_LATE_COVER',
    DOC_TEMPLATE_WARNING_LEAVE_PERSON:'DOC_TEMPLATE_WARNING_LEAVE_PERSON', DOC_TEMPLATE_WARNING_LATE_PERSON:'DOC_TEMPLATE_WARNING_LATE_PERSON', DOC_TEMPLATE_WARNING_LEAVE_ATTACHMENT:'DOC_TEMPLATE_WARNING_LEAVE_ATTACHMENT', DOC_TEMPLATE_WARNING_LATE_ATTACHMENT:'DOC_TEMPLATE_WARNING_LATE_ATTACHMENT',
    DOC_OUTPUT_FOLDER_ID:'DOC_OUTPUT_FOLDER_ID', DOC_STYLE_PROFILE_NAME:'DOC_STYLE_PROFILE_NAME', DOC_STYLE_FONT_FAMILY:'DOC_STYLE_FONT_FAMILY', DOC_STYLE_FONT_SIZE:'DOC_STYLE_FONT_SIZE', DOC_STYLE_LINE_SPACING:'DOC_STYLE_LINE_SPACING', DOC_STYLE_TAB_POINTS:'DOC_STYLE_TAB_POINTS', DOC_STYLE_REVISION:'DOC_STYLE_REVISION'
  }),
  DEFAULTS: Object.freeze({
    LATE_CUTOFF:'07:51', SCAN_ACCEPT_START:'03:00', SINGLE_SCAN_SPLIT:'12:00',
    WARNING_ENABLED:'FALSE', WARNING_WEEK_START:'จันทร์', WARNING_WEEK_END:'ศุกร์', WARNING_EXCLUDED_GROUPS:'',
    TIME_RULE_VERSION:'1', WARNING_RULE_VERSION:'1',
    DOC_TEMPLATE_MONTHLY_COVER:'1QKyDOzsuo-d8vOJZJ2tdOB3gFCDMeF2bNLyQ3Ubd3AA', DOC_TEMPLATE_WARNING_LEAVE_COVER:'1Nks7GAphvAqGPJdUJccff9stRXtiO13Bzbbd-2JNKTA', DOC_TEMPLATE_WARNING_LATE_COVER:'1gUSdQpcCuCUu6L0_wjdQxBr0H7f7k34uyY4AtWoixL0',
    DOC_TEMPLATE_WARNING_LEAVE_PERSON:'1x4WQAaZduw2CI7il1N3KdRCX2aHqyHnOWP5fJm6NWsE', DOC_TEMPLATE_WARNING_LATE_PERSON:'16oXdrfY6BPcwNvQGp9MkXcAdiu6vPWF9yIjtIDrXIPI', DOC_TEMPLATE_WARNING_LEAVE_ATTACHMENT:'1RmLOqqBtWOE4tDC7OhXfUe3AVxYDrXQ3zEWlWJcNe3I', DOC_TEMPLATE_WARNING_LATE_ATTACHMENT:'1ecfpQOoZrCOd9dOSssb8t4PhPDBE20YUguxhgrqzs1o',
    DOC_OUTPUT_FOLDER_ID:'', DOC_STYLE_PROFILE_NAME:'ค่าเริ่มต้น', DOC_STYLE_FONT_FAMILY:'TH SarabunPSK', DOC_STYLE_FONT_SIZE:'16', DOC_STYLE_LINE_SPACING:'0.90', DOC_STYLE_TAB_POINTS:'36', DOC_STYLE_REVISION:'1'
  })
});

function pdmscTimeHHmm_(value,displayValue){
  const pad=n=>String(n).padStart(2,'0');
  const parseText=v=>{const s=pdmscNormalizeText_(v),m=s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);if(!m)return '';const h=Number(m[1]),mi=Number(m[2]);return h>=0&&h<=23&&mi>=0&&mi<=59?pad(h)+':'+pad(mi):'';};
  const shown=parseText(displayValue);if(shown)return shown;
  const direct=parseText(value);if(direct)return direct;
  if(typeof value==='number'&&Number.isFinite(value)){const f=((value%1)+1)%1,total=Math.round(f*1440)%1440;return pad(Math.floor(total/60))+':'+pad(total%60);}
  if(value instanceof Date&&!isNaN(value.getTime()))return pad(value.getHours())+':'+pad(value.getMinutes());
  return '';
}
function pdmscTimeSettingKey_(key){return ['LATE_CUTOFF','SCAN_ACCEPT_START','SINGLE_SCAN_SPLIT'].includes(pdmscNormalizeText_(key).toUpperCase());}
function pdmscSettingsRows_(){
  const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.CONFIG);if(!sh||sh.getLastRow()<2)return[];
  const range=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()),raw=range.getValues(),display=range.getDisplayValues();
  return raw.map((r,i)=>({row:i+2,key:pdmscNormalizeText_(r[0]),value:r[1],displayValue:(display[i]||[])[1]||'',updatedAt:r[2]||'',note:pdmscNormalizeText_(r[3])})).filter(x=>x.key);
}
function pdmscSettingsValueForUi_(row){if(!row)return'';return pdmscTimeSettingKey_(row.key)?pdmscTimeHHmm_(row.value,row.displayValue):pdmscUiScalar_(row.value);}
function pdmscSettingsGet_(key,fallback){
  const k=pdmscNormalizeText_(key).toUpperCase(),x=pdmscSettingsRows_().find(r=>r.key.toUpperCase()===k),v=x?pdmscSettingsValueForUi_(x):'';
  return v!==''?v:(fallback==null?'':fallback);
}
function pdmscSettingsMap_(){
  const out={};pdmscSettingsRows_().forEach(x=>out[x.key]=pdmscSettingsValueForUi_(x));
  Object.keys(PDMSC_SETTINGS.DEFAULTS).forEach(k=>{if(out[k]==null||out[k]==='')out[k]=PDMSC_SETTINGS.DEFAULTS[k];});
  return out;
}
function pdmscSettingsValidateTime_(value,label){
  const s=pdmscTimeHHmm_(value);if(!s)throw new Error((label||'เวลา')+' ต้องเป็น HH:mm');return s;
}
function pdmscSettingsUpsert_(key,value,note){
  const k=pdmscNormalizeText_(key).toUpperCase();if(!Object.values(PDMSC_SETTINGS.KEYS).includes(k))throw new Error('Setting key ไม่รองรับ: '+k);
  const rows=pdmscSettingsRows_(),old=rows.find(x=>x.key.toUpperCase()===k),sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.CONFIG),now=new Date(),row=old?old.row:sh.getLastRow()+1;
  const canonical=pdmscTimeSettingKey_(k)?pdmscSettingsValidateTime_(value,k):value,vals=[k,canonical,now,pdmscNormalizeText_(note)];
  if(pdmscTimeSettingKey_(k))sh.getRange(row,2).setNumberFormat('@');
  sh.getRange(row,1,1,4).setValues([vals]);
}
function pdmscSaveGeneralSettings_(payload){
  payload=payload||{};const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    const timeKeys=['LATE_CUTOFF','SCAN_ACCEPT_START','SINGLE_SCAN_SPLIT'];
    Object.values(PDMSC_SETTINGS.KEYS).forEach(k=>{
      if(!(k in payload))return;let v=payload[k];
      if(timeKeys.includes(k))v=pdmscSettingsValidateTime_(v,k);
      if(k==='WARNING_ENABLED')v=payload[k]===true?'TRUE':'FALSE';
      if(k==='TIME_RULE_VERSION'||k==='WARNING_RULE_VERSION'){v=pdmscNormalizeText_(v);if(v&&!/^\d+$/.test(v))throw new Error(k+' ต้องเป็นตัวเลข');}
      pdmscSettingsUpsert_(k,pdmscNormalizeText_(v),'S01 Web Settings');
    });
    pdmscLog_('SETTINGS_SAVE','OK',{keys:Object.keys(payload)});return pdmscSettingsMap_();
  }finally{lock.releaseLock();}
}
function pdmscSeedSettingsDefaults_(){
  const map=pdmscSettingsMap_();Object.keys(PDMSC_SETTINGS.DEFAULTS).forEach(k=>{if(!pdmscSettingsRows_().some(x=>x.key===k))pdmscSettingsUpsert_(k,PDMSC_SETTINGS.DEFAULTS[k],'S01 default');});return map;
}
function pdmscSettingsHealthChecks_(){
  const checks=[];
  ['POSITION','DEPARTMENT','LEAVE_TYPE'].forEach(type=>{
    const rows=pdmscMasterRows_(type),seen=new Set(),dup=[];rows.forEach(x=>{const n=pdmscMasterNormalize_(x.name);if(n&&seen.has(n))dup.push(x.name);seen.add(n);});
    checks.push({name:'MASTER_'+type+'_DUPLICATE',ok:dup.length===0,note:dup.length?dup.join(', '):''});
  });
  const periods=pdmscPeriodRows_?pdmscPeriodRows_():[];let overlap=false;
  for(let i=0;i<periods.length;i++)for(let j=i+1;j<periods.length;j++){const a=periods[i],b=periods[j];if(pdmscS01Date_(a.startDate)<=pdmscS01Date_(b.endDate)&&pdmscS01Date_(a.endDate)>=pdmscS01Date_(b.startDate))overlap=true;}
  checks.push({name:'PERIOD_OVERLAP',ok:!overlap,note:overlap?'พบ Period ทับซ้อน':''});
  return checks;
}
