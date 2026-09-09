function pdmscNameMapRows_(){return pdmscRows_(PDMSC.BACKEND.NAME_MAP).map((r,i)=>({row:i+2,sourceName:pdmscNormalizeText_(r[0]),empId:pdmscNormalizeText_(r[1]).toUpperCase(),canonicalName:pdmscNormalizeText_(r[2]),status:pdmscNormalizeText_(r[3]).toUpperCase()||'ACTIVE',note:pdmscNormalizeText_(r[4]),updatedAt:r[5]||'',sourceType:pdmscNormalizeText_(r[6])||'MANUAL',key:pdmscNormalizeName_(r[0]),compact:pdmscCompactName_(r[0])})).filter(x=>x.sourceName||x.empId);}
function pdmscAliasUi_(x){return{row:x.row,sourceName:x.sourceName,empId:x.empId,canonicalName:x.canonicalName,status:x.status,note:x.note,sourceType:x.sourceType,updatedAt:pdmscUiScalar_(x.updatedAt)};}
function pdmscNamePrefixTokenKey_(v){return pdmscNormalizeName_(v).replace(/[.\-_/\\()[\]{}'"“”‘’:;,]/g,'').replace(/\s+/g,'').trim();}
function pdmscBuildNamePrefixContext_(){
  const rows=(typeof pdmscMasterRows_==='function'?pdmscMasterRows_('NAME_PREFIX'):[]).filter(x=>x.active),variants=[],tokenOwner=new Map(),conflicts=[];
  rows.forEach(x=>{
    const canonicalToken=pdmscNamePrefixTokenKey_(x.name);
    [x.name].concat(pdmscMasterAliasList_(x.aliases)).forEach(v=>{
      const token=pdmscNamePrefixTokenKey_(v);if(!token)return;
      if(tokenOwner.has(token)&&tokenOwner.get(token)!==x.id){conflicts.push({token:token,a:tokenOwner.get(token),b:x.id,value:v});return;}
      tokenOwner.set(token,x.id);variants.push({id:x.id,canonical:x.name,canonicalToken:canonicalToken,variant:v,token:token});
    });
  });
  variants.sort((a,b)=>b.token.length-a.token.length||b.variant.length-a.variant.length);
  return{rows:rows,variants:variants,conflicts:conflicts};
}
function pdmscNamePrefixCanonicalKey_(value,prefixCtx){
  const compact=pdmscCompactName_(value);if(!compact)return'';
  const ctx=prefixCtx||pdmscBuildNamePrefixContext_();
  for(const v of ctx.variants){
    if(compact.indexOf(v.token)!==0)continue;
    const rest=compact.slice(v.token.length);if(!rest)continue;
    return v.canonicalToken+'|'+rest;
  }
  return'';
}
function pdmscBuildPersonnelIndex_(){
  const people=pdmscPersonnelRows_(),byId=new Map(),exact=new Map(),compact=new Map(),ambiguousCompact=new Set(),prefixCtx=pdmscBuildNamePrefixContext_(),prefixPeople=new Map(),ambiguousPrefix=new Set();
  people.forEach(p=>{
    if(!p.empId)return;byId.set(p.empId.toUpperCase(),p);if(p.matchName)exact.set(p.matchName,p);
    const c=pdmscCompactName_(p.matchName);if(c){if(compact.has(c)&&compact.get(c).empId!==p.empId)ambiguousCompact.add(c);else compact.set(c,p);}
    const pk=pdmscNamePrefixCanonicalKey_(p.matchName,prefixCtx);if(pk){if(prefixPeople.has(pk)&&prefixPeople.get(pk).empId!==p.empId)ambiguousPrefix.add(pk);else prefixPeople.set(pk,p);}
  });
  const aliases=new Map(),aliasConflicts=new Set(),prefixAliases=new Map(),prefixAliasConflicts=new Set();
  pdmscNameMapRows_().filter(a=>a.status==='ACTIVE').forEach(a=>{
    if(!a.key||!a.empId)return;if(aliases.has(a.key)&&aliases.get(a.key)!==a.empId)aliasConflicts.add(a.key);else aliases.set(a.key,a.empId);
    const pk=pdmscNamePrefixCanonicalKey_(a.sourceName,prefixCtx);if(pk){if(prefixAliases.has(pk)&&prefixAliases.get(pk)!==a.empId)prefixAliasConflicts.add(pk);else prefixAliases.set(pk,a.empId);}
  });
  return{people,byId,exact,compact,ambiguousCompact,aliases,aliasConflicts,prefixCtx,prefixPeople,ambiguousPrefix,prefixAliases,prefixAliasConflicts};
}
function pdmscBuildBulkResolverContext_(){
  const idx=pdmscBuildPersonnelIndex_();
  const scopeRows=pdmscScopeRows_().filter(x=>x.active);
  const scopeEmp=new Map(),scopeSource=new Map(),scopeSourcePrefix=new Map();
  scopeRows.forEach(x=>{
    if(x.scopeType==='EMP_ID'&&x.empId)scopeEmp.set(x.empId,{reason:x.reason||x.note||''});
    if(x.scopeType==='SOURCE_NAME'&&x.matchName){
      scopeSource.set(x.matchName,{reason:x.reason||x.note||''});
      const pk=pdmscNamePrefixCanonicalKey_(x.displayName||x.matchName,idx.prefixCtx);if(pk&&!scopeSourcePrefix.has(pk))scopeSourcePrefix.set(pk,{reason:x.reason||x.note||'',displayName:x.displayName||x.matchName});
    }
  });
  return Object.assign(idx,{scopeEmp,scopeSource,scopeSourcePrefix});
}
function pdmscPersonnelEmploymentDecision_(person,eventStart,eventEnd){
  const start=eventStart?pdmscPersonnelDate_(eventStart):null,end=eventEnd?pdmscPersonnelDate_(eventEnd):start;
  const empStart=person&&person.employmentStartDate?pdmscPersonnelDate_(person.employmentStartDate):null,empEnd=person&&person.employmentEndDate?pdmscPersonnelDate_(person.employmentEndDate):null;
  if(!start||!end)return person&&person.active?{status:'MATCHED'}:{status:'INACTIVE'};
  if(empStart&&end<empStart)return{status:'OUT_OF_EMPLOYMENT_PERIOD',boundary:'START'};
  if(empEnd&&start>empEnd)return{status:'OUT_OF_EMPLOYMENT_PERIOD',boundary:'END'};
  if(empStart&&start<empStart&&end>=empStart)return{status:'EMPLOYMENT_PERIOD_OVERLAP',boundary:'START'};
  if(empEnd&&start<=empEnd&&end>empEnd)return{status:'EMPLOYMENT_PERIOD_OVERLAP',boundary:'END'};
  if(!person.active&&!empEnd)return{status:'INACTIVE'};
  return{status:'MATCHED'};
}
function pdmscResolvePersonFromContext_(rawName,ctx,eventStart,eventEnd){
  const raw=pdmscNormalizeText_(rawName),normalized=pdmscNormalizeName_(raw),compact=pdmscCompactName_(raw),prefixKey=pdmscNamePrefixCanonicalKey_(raw,ctx.prefixCtx);
  if(!raw)return{status:'EMPTY',raw:rawName||''};
  const sourceScope=ctx.scopeSource.get(normalized);if(sourceScope)return{status:'EXCLUDED_FROM_PROCESSING',raw:raw,reason:sourceScope.reason||'',method:'SOURCE_SCOPE'};
  const sourcePrefixScope=prefixKey&&ctx.scopeSourcePrefix?ctx.scopeSourcePrefix.get(prefixKey):null;if(sourcePrefixScope)return{status:'EXCLUDED_FROM_PROCESSING',raw:raw,reason:sourcePrefixScope.reason||'',method:'SOURCE_SCOPE_PREFIX'};
  if(ctx.aliasConflicts.has(normalized))return{status:'AMBIGUOUS',raw,normalized,reason:'ALIAS_CONFLICT'};
  const aliasId=ctx.aliases.get(normalized);let person=null,method='';
  if(aliasId){person=ctx.byId.get(aliasId);method='ALIAS';}
  if(!person){person=ctx.exact.get(normalized);if(person)method='EXACT';}
  if(!person&&compact&&!ctx.ambiguousCompact.has(compact)){person=ctx.compact.get(compact);if(person)method='COMPACT';}
  if(!person&&ctx.ambiguousCompact.has(compact))return{status:'AMBIGUOUS',raw,normalized,reason:'COMPACT_CONFLICT'};
  if(!person&&prefixKey){
    if(ctx.prefixAliasConflicts.has(prefixKey))return{status:'AMBIGUOUS',raw,normalized,prefixKey,reason:'PREFIX_ALIAS_CONFLICT'};
    const pAliasId=ctx.prefixAliases.get(prefixKey);if(pAliasId){person=ctx.byId.get(pAliasId);method='PREFIX_ALIAS';}
  }
  if(!person&&prefixKey){
    if(ctx.ambiguousPrefix.has(prefixKey))return{status:'AMBIGUOUS',raw,normalized,prefixKey,reason:'PREFIX_CONFLICT'};
    person=ctx.prefixPeople.get(prefixKey);if(person)method='PREFIX';
  }
  if(!person)return{status:'UNMAPPED',raw,normalized,compact,prefixKey};
  const empScope=ctx.scopeEmp.get(person.empId.toUpperCase());if(empScope)return{status:'EXCLUDED_FROM_PROCESSING',person,method,reason:empScope.reason||''};
  const employment=pdmscPersonnelEmploymentDecision_(person,eventStart,eventEnd);
  if(employment.status!=='MATCHED')return{status:employment.status,person,method,prefixKey,boundary:employment.boundary||''};
  return{status:'MATCHED',person,method,prefixKey};
}
function pdmscResolvePerson(rawName){return pdmscResolvePersonFromContext_(rawName,pdmscBuildBulkResolverContext_());}
function pdmscListAliases(empId){const id=pdmscNormalizeText_(empId).toUpperCase();return pdmscNameMapRows_().filter(x=>!id||x.empId===id).map(pdmscAliasUi_);}
function pdmscWriteAliasUnlocked_(payload){payload=payload||{};const sourceName=pdmscNormalizeText_(payload.sourceName),empId=pdmscNormalizeText_(payload.empId).toUpperCase();if(!sourceName)throw new Error('กรุณากรอกชื่อจากแหล่งข้อมูล');const person=pdmscGetPersonnel(empId),key=pdmscNormalizeName_(sourceName),rows=pdmscNameMapRows_(),conflict=rows.find(x=>x.status==='ACTIVE'&&x.key===key&&x.empId!==empId);if(conflict)throw new Error('ชื่อ Alias นี้ถูกผูกกับ '+conflict.empId+' อยู่แล้ว');const same=rows.find(x=>x.key===key&&x.empId===empId),sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.NAME_MAP),row=[sourceName,empId,person.fullName,'ACTIVE',pdmscNormalizeText_(payload.note),new Date(),pdmscNormalizeText_(payload.sourceType)||'MANUAL'];if(same)sh.getRange(same.row,1,1,row.length).setValues([row]);else sh.appendRow(row);pdmscLog_('ALIAS_SAVE','OK',{sourceName,empId});return{ok:true,sourceName,empId};}
function pdmscSaveAlias(payload){const lock=LockService.getDocumentLock();lock.waitLock(30000);try{return pdmscWriteAliasUnlocked_(payload);}finally{lock.releaseLock();}}
function pdmscSetAliasActive(sourceName,empId,active){const lock=LockService.getDocumentLock();lock.waitLock(30000);try{const key=pdmscNormalizeName_(sourceName),id=pdmscNormalizeText_(empId).toUpperCase(),a=pdmscNameMapRows_().find(x=>x.key===key&&x.empId===id);if(!a)throw new Error('ไม่พบ Alias');const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.NAME_MAP);sh.getRange(a.row,4).setValue(active?'ACTIVE':'INACTIVE');sh.getRange(a.row,6).setValue(new Date());pdmscLog_('ALIAS_ACTIVE','OK',{sourceName:a.sourceName,empId:id,active:!!active});return{ok:true};}finally{lock.releaseLock();}}
