function pdmscExtractSpreadsheetId_(value) {
  const s=pdmscNormalizeText_(value);
  const m=s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m?m[1]:s;
}
function pdmscOldSheet_(ss,names) {
  for(let i=0;i<names.length;i++){const sh=ss.getSheetByName(names[i]);if(sh)return sh;}
  return null;
}
function pdmscReadOldPersonnelMigration_(sourceIdOrUrl) {
  const id=pdmscExtractSpreadsheetId_(sourceIdOrUrl);
  if(!id)throw new Error('กรุณาวางลิงก์หรือ Spreadsheet ID ของ PDMS เดิม');
  const ss=SpreadsheetApp.openById(id);
  const master=pdmscOldSheet_(ss,['10_มาสเตอร์รายชื่อครู','10_จัดการรายชื่อครู']);
  const aliases=pdmscOldSheet_(ss,['13_Aliasชื่อ','13_จับคู่ชื่อ']);
  const exclusions=pdmscOldSheet_(ss,['14_รายชื่อยกเว้น','14_กำหนดรายชื่อยกเว้น']);
  if(!master)throw new Error('ไม่พบหน้า Master เดิม (10_มาสเตอร์รายชื่อครู / 10_จัดการรายชื่อครู)');

  const personnel=[],maps=[],scopes=[],review=[];
  const mv=master.getDataRange().getValues();
  for(let i=0;i<mv.length;i++){
    const r=mv[i], emp=pdmscNormalizeText_(r[0]).toUpperCase(), name=pdmscNormalizeText_(r[1]);
    if(!emp||!name||!/^EMP\d+$/i.test(emp))continue;
    personnel.push({empId:emp,fullName:name,position:pdmscNormalizeText_(r[2]),department:pdmscNormalizeText_(r[3]),
      active:r[4]===''?true:pdmscBool_(r[4]),note:'MIGRATED_OLD_PDMS'});
  }
  if(aliases){
    const av=aliases.getDataRange().getValues();
    for(let i=1;i<av.length;i++){
      const raw=pdmscNormalizeText_(av[i][0]), emp=pdmscNormalizeText_(av[i][5]).toUpperCase();
      if(!raw)continue;
      let resolved=emp;
      if(!resolved){
        const target=pdmscNormalizeName_(av[i][1]);
        const p=personnel.find(x=>pdmscNormalizeName_(x.fullName)===target);
        resolved=p?p.empId:'';
      }
      if(resolved)maps.push({sourceName:raw,empId:resolved,note:'MIGRATED_OLD_PDMS',sourceType:'OLD_PDMS'});
      else review.push({type:'ALIAS_UNRESOLVED',row:i+1,value:raw});
    }
  }
  if(exclusions){
    const ev=exclusions.getDataRange().getValues();
    for(let i=1;i<ev.length;i++){
      const name=pdmscNormalizeText_(ev[i][0]);
      if(!name||!pdmscBool_(ev[i][2]))continue;
      scopes.push({scopeType:'SOURCE_NAME',sourceName:name,reason:pdmscNormalizeText_(ev[i][1])||'นำเข้าจาก PDMS เดิม',
        note:'MIGRATED_OLD_PDMS'});
    }
  }
  return {sourceId:id,sourceName:ss.getName(),personnel:personnel,maps:maps,scopes:scopes,review:review};
}
function pdmscMigrationFingerprint_(data) {
  const stable=JSON.stringify({
    sourceId:data.sourceId,
    personnel:data.personnel.map(x=>[x.empId,x.fullName,x.position,x.department,x.active]),
    maps:data.maps.map(x=>[pdmscNormalizeName_(x.sourceName),x.empId]),
    scopes:data.scopes.map(x=>[x.scopeType,pdmscNormalizeName_(x.sourceName||''),x.empId||''])
  });
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,stable,Utilities.Charset.UTF_8);
  return bytes.map(b=>(b+256)%256).map(b=>('0'+b.toString(16)).slice(-2)).join('');
}
function pdmscPreviewOldPersonnelMigration(sourceIdOrUrl) {
  const data=pdmscReadOldPersonnelMigration_(sourceIdOrUrl);
  const current=pdmscPersonnelRows_(), currentAlias=pdmscNameMapRows_();
  const currentById=new Map(current.map(x=>[x.empId,x]));
  const aliasOwner=new Map();
  currentAlias.filter(x=>x.status==='ACTIVE').forEach(x=>aliasOwner.set(x.key,x.empId));

  const readyPersonnel=[],readyMaps=[],review=data.review.slice();
  data.personnel.forEach(p=>{
    const cur=currentById.get(p.empId);
    if(!cur)readyPersonnel.push(p);
    else if(pdmscNormalizeName_(cur.fullName)!==pdmscNormalizeName_(p.fullName))
      review.push({type:'EMP_ID_NAME_CONFLICT',value:p.empId+' | '+p.fullName+' <> '+cur.fullName});
  });
  data.maps.forEach(a=>{
    const key=pdmscNormalizeName_(a.sourceName), owner=aliasOwner.get(key);
    if(owner&&owner!==a.empId)review.push({type:'ALIAS_CONFLICT',value:a.sourceName+' → '+a.empId+' แต่ปัจจุบัน → '+owner});
    else if(!owner)readyMaps.push(a);
  });

  const preview={
    sourceId:data.sourceId,sourceName:data.sourceName,
    counts:{
      sourcePersonnel:data.personnel.length,readyPersonnel:readyPersonnel.length,
      sourceAliases:data.maps.length,readyAliases:readyMaps.length,
      sourceExclusions:data.scopes.length,review:review.length
    },
    readyPersonnel:readyPersonnel,readyMaps:readyMaps,readyScopes:data.scopes,review:review
  };
  preview.fingerprint=pdmscMigrationFingerprint_({
    sourceId:preview.sourceId,personnel:preview.readyPersonnel,maps:preview.readyMaps,scopes:preview.readyScopes
  });
  PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_PHASE1_MIGRATION_PREVIEW,JSON.stringify({
    sourceId:preview.sourceId,fingerprint:preview.fingerprint,at:new Date().toISOString()
  }));
  pdmscLog_('PERSONNEL_MIGRATION_DRY_RUN','OK',{sourceId:preview.sourceId,counts:preview.counts,fingerprint:preview.fingerprint});
  return preview;
}
function pdmscCommitOldPersonnelMigration(sourceIdOrUrl, expectedFingerprint) {
  const preview=pdmscPreviewOldPersonnelMigration(sourceIdOrUrl);
  const saved=PropertiesService.getDocumentProperties().getProperty(PDMSC.PROP_PHASE1_MIGRATION_PREVIEW);
  const state=saved?JSON.parse(saved):{};
  if(expectedFingerprint && preview.fingerprint!==expectedFingerprint)
    throw new Error('ข้อมูลต้นทางเปลี่ยนจากตอน Dry Run กรุณาตรวจสอบใหม่');
  if(state.sourceId!==preview.sourceId||state.fingerprint!==preview.fingerprint)
    throw new Error('Dry Run ไม่ตรงกับข้อมูลปัจจุบัน กรุณา Preview ใหม่');

  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    preview.readyPersonnel.forEach(p=>pdmscWritePersonnelUnlocked_(Object.assign({},p,{mode:'CREATE'}),'CREATE'));
    preview.readyMaps.forEach(a=>pdmscWriteAliasUnlocked_(a));
    preview.readyScopes.forEach(s=>pdmscWriteScopeExclusionUnlocked_(s));
    PropertiesService.getDocumentProperties().deleteProperty(PDMSC.PROP_PHASE1_MIGRATION_PREVIEW);
    pdmscLog_('PERSONNEL_MIGRATION_COMMIT','OK',{sourceId:preview.sourceId,counts:preview.counts,fingerprint:preview.fingerprint});
    return {ok:true,counts:preview.counts,review:preview.review,fingerprint:preview.fingerprint};
  } finally {lock.releaseLock();}
}
