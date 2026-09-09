const PDMSC_MASTER = Object.freeze({
  POSITION:Object.freeze({sheet:'MASTER_POSITION',prefix:'POS'}),
  DEPARTMENT:Object.freeze({sheet:'MASTER_DEPARTMENT',prefix:'DEP'}),
  LEAVE_TYPE:Object.freeze({sheet:'MASTER_LEAVE_TYPE',prefix:'LVE'}),
  NAME_PREFIX:Object.freeze({sheet:'MASTER_NAME_PREFIX',prefix:'PRF'})
});
function pdmscMasterSpec_(type){const t=pdmscNormalizeText_(type).toUpperCase(),s=PDMSC_MASTER[t];if(!s)throw new Error('Master type ไม่ถูกต้อง: '+t);return{type:t,sheetName:PDMSC.BACKEND[s.sheet],prefix:s.prefix};}
function pdmscLeaveTypePolicyDefault_(name){const n=pdmscMasterNormalize_(name);return{countOccurrence:true,countDays:true,includeWarningBase:(n.indexOf('ป่วย')>=0||n.indexOf('กิจ')>=0),showSeparateStatistics:true};}
function pdmscMasterPolicyBool_(v,fallback){return(v===''||v===null||v===undefined)?!!fallback:pdmscBool_(v);}
function pdmscMasterRows_(type){const spec=pdmscMasterSpec_(type);return pdmscRows_(spec.sheetName).map((r,i)=>{const base={row:i+2,id:pdmscNormalizeText_(r[0]),name:pdmscNormalizeText_(r[1]),active:pdmscBool_(r[2]),aliases:pdmscNormalizeText_(r[3]),note:pdmscNormalizeText_(r[4]),updatedAt:r[5]||''};if(spec.type==='LEAVE_TYPE'){const d=pdmscLeaveTypePolicyDefault_(base.name);base.countOccurrence=pdmscMasterPolicyBool_(r[6],d.countOccurrence);base.countDays=pdmscMasterPolicyBool_(r[7],d.countDays);base.includeWarningBase=pdmscMasterPolicyBool_(r[8],d.includeWarningBase);base.showSeparateStatistics=pdmscMasterPolicyBool_(r[9],d.showSeparateStatistics);}return base;}).filter(x=>x.id||x.name);}
function pdmscMasterNormalize_(v){return pdmscNormalizeName_(v);}
function pdmscMasterAliasList_(v){const seen=new Set(),out=[];String(v||'').split(/[|,;\n]/).map(pdmscNormalizeText_).filter(Boolean).forEach(x=>{const n=pdmscMasterNormalize_(x);if(n&&!seen.has(n)){seen.add(n);out.push(x)}});return out;}
function pdmscMasterNextId_(type){const spec=pdmscMasterSpec_(type),rows=pdmscMasterRows_(type);let max=0;rows.forEach(x=>{const m=x.id.match(new RegExp('^'+spec.prefix+'(\\d+)$','i'));if(m)max=Math.max(max,Number(m[1]));});return spec.prefix+String(max+1).padStart(3,'0');}
function pdmscMasterList_(type,includeInactive){return pdmscMasterRows_(type).filter(x=>includeInactive||x.active).map(x=>{const out={id:x.id,name:x.name,active:x.active,aliases:x.aliases||'',aliasList:pdmscMasterAliasList_(x.aliases),note:x.note||''};if(String(type||'').toUpperCase()==='LEAVE_TYPE'){out.countOccurrence=!!x.countOccurrence;out.countDays=!!x.countDays;out.includeWarningBase=!!x.includeWarningBase;out.showSeparateStatistics=!!x.showSeparateStatistics;}return out;});}
function pdmscLeaveTypePolicyList_(includeInactive){return pdmscMasterList_('LEAVE_TYPE',!!includeInactive);}
function pdmscLeaveTypePolicyMap_(){const m=new Map();pdmscLeaveTypePolicyList_(true).forEach(x=>{m.set(pdmscMasterNormalize_(x.name),x);(x.aliasList||[]).forEach(a=>m.set(pdmscMasterNormalize_(a),x));});return m;}
function pdmscLeaveTypePolicyFor_(name){const m=pdmscLeaveTypePolicyMap_(),hit=m.get(pdmscMasterNormalize_(name));if(hit)return hit;const d=pdmscLeaveTypePolicyDefault_(name);return{id:'',name:pdmscNormalizeText_(name),active:true,countOccurrence:d.countOccurrence,countDays:d.countDays,includeWarningBase:d.includeWarningBase,showSeparateStatistics:d.showSeparateStatistics,note:'Fallback policy'};}
function pdmscLeaveTypePolicySave_(id,payload){id=pdmscNormalizeText_(id);const x=pdmscMasterRows_('LEAVE_TYPE').find(r=>r.id===id);if(!x)throw new Error('ไม่พบประเภทการลา '+id);payload=payload||{};const lock=LockService.getDocumentLock();lock.waitLock(30000);try{const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.MASTER_LEAVE_TYPE),vals=[payload.countOccurrence!==false,payload.countDays!==false,payload.includeWarningBase===true,payload.showSeparateStatistics!==false];sh.getRange(x.row,7,1,4).setValues([vals]);sh.getRange(x.row,6).setValue(new Date());pdmscWebCacheClear_(['masters','settings','settings-tab-leavepolicy','settings-tab-warning','statistics']);(pdmscGetActivePeriod().months||[]).forEach(m=>pdmscWebCacheClear_(['statistics-'+m]));pdmscLog_('LEAVE_TYPE_POLICY_SAVE','OK',{id,name:x.name,countOccurrence:vals[0],countDays:vals[1],includeWarningBase:vals[2],showSeparateStatistics:vals[3]});return{ok:true,id};}finally{lock.releaseLock();}}
function pdmscMasterResolveContext_(type,includeInactive){const map=new Map(),conflicts=[];pdmscMasterRows_(type).filter(x=>includeInactive||x.active).forEach(x=>{[x.name].concat(pdmscMasterAliasList_(x.aliases)).forEach(v=>{const n=pdmscMasterNormalize_(v);if(!n)return;if(map.has(n)&&map.get(n).id!==x.id)conflicts.push({value:v,a:map.get(n),b:x});else map.set(n,{id:x.id,name:x.name,active:x.active});});});return{map,conflicts};}
function pdmscMasterResolveName_(type,value,requireActive){const n=pdmscMasterNormalize_(value);if(!n)return '';const ctx=pdmscMasterResolveContext_(type,requireActive===false),hit=ctx.map.get(n);return hit&&(!requireActive||hit.active)?hit.name:'';}
function pdmscMasterResolveItem_(type,value,requireActive){
  const token=pdmscNormalizeText_(value);if(!token)return null;const rows=pdmscMasterRows_(type),idHit=rows.find(x=>pdmscNormalizeText_(x.id).toUpperCase()===token.toUpperCase());if(idHit&&(!requireActive||idHit.active))return{id:idHit.id,name:idHit.name,active:idHit.active};
  const ctx=pdmscMasterResolveContext_(type,requireActive===false),hit=ctx.map.get(pdmscMasterNormalize_(token));return hit&&(!requireActive||hit.active)?{id:hit.id,name:hit.name,active:hit.active}:null;
}
function pdmscMasterResolveId_(type,value,requireActive){const x=pdmscMasterResolveItem_(type,value,requireActive);return x?x.id:'';}
function pdmscMasterById_(type,id,requireActive){return pdmscMasterResolveItem_(type,id,requireActive);}
function pdmscMasterMigrateWarningRefs_(type,source,target){
  const t=pdmscNormalizeText_(type).toUpperCase();
  if(t==='DEPARTMENT'&&typeof pdmscSettingsGet_==='function'&&typeof pdmscSettingsUpsert_==='function'){
    const raw=pdmscSettingsGet_('WARNING_EXCLUDED_GROUPS',''),tokens=String(raw||'').split('|').map(pdmscNormalizeText_).filter(Boolean),sourceNames=new Set([source.name].concat(pdmscMasterAliasList_(source.aliases)).map(pdmscMasterNormalize_)),next=[];
    tokens.forEach(v=>{const replace=pdmscNormalizeText_(v).toUpperCase()===pdmscNormalizeText_(source.id).toUpperCase()||sourceNames.has(pdmscMasterNormalize_(v));next.push(replace?target.id:v);});
    const dedup=[...new Set(next.map(pdmscNormalizeText_).filter(Boolean))];if(dedup.join(' | ')!==tokens.join(' | '))pdmscSettingsUpsert_('WARNING_EXCLUDED_GROUPS',dedup.join(' | '),'Master merge migrated Department ID-safe Warning policy');
  }
  if(t==='LEAVE_TYPE'){
    const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.WARNING_RULES);if(sh&&sh.getLastRow()>1){
      const n=sh.getLastRow()-1,vals=sh.getRange(2,1,n,Math.max(16,sh.getLastColumn())).getValues(),srcNames=new Set([source.name].concat(pdmscMasterAliasList_(source.aliases)).map(pdmscMasterNormalize_)),now=new Date();let changed=0;
      vals.forEach(r=>{if(pdmscNormalizeText_(r[2]).toUpperCase()!=='LEAVE')return;let ids=String(r[13]||'').split('|').map(pdmscNormalizeText_).filter(Boolean),names=String(r[3]||'').split('|').map(pdmscNormalizeText_).filter(Boolean),hit=false;ids=ids.map(v=>{if(v.toUpperCase()===source.id.toUpperCase()){hit=true;return target.id;}return v;});names=names.map(v=>{if(srcNames.has(pdmscMasterNormalize_(v))){hit=true;return target.name;}return v;});if(hit){r[13]=[...new Set(ids)].join(' | ');r[3]=[...new Set(names)].join(' | ');r[9]=now;changed++;}});
      if(changed)sh.getRange(2,1,n,Math.max(16,sh.getLastColumn())).setValues(vals);
    }
  }
}

function pdmscMasterReferenceCount_(type,name){const n=pdmscMasterNormalize_(name);if(!n)return 0;let count=0;if(type==='POSITION'||type==='DEPARTMENT'){pdmscPersonnelRows_().forEach(x=>{const v=type==='POSITION'?x.position:x.department;if(pdmscMasterNormalize_(v)===n)count++;});}else if(type==='LEAVE_TYPE'&&typeof pdmscLeaveStoreRows_==='function'){pdmscLeaveStoreRows_().forEach(x=>{if(pdmscMasterNormalize_(x.leaveType)===n)count++;});}return count;}
function pdmscMasterAssertNoCollision_(type,id,name,aliases){const rows=pdmscMasterRows_(type),tokens=[name].concat(pdmscMasterAliasList_(aliases));for(const token of tokens){const n=pdmscMasterNormalize_(token);if(!n)continue;for(const x of rows){if(x.id===id)continue;const existing=[x.name].concat(pdmscMasterAliasList_(x.aliases));if(existing.some(a=>pdmscMasterNormalize_(a)===n))throw new Error('ชื่อ/ชื่อเรียกอื่น “'+token+'” ซ้ำกับ '+x.id+' '+x.name);if(type==='NAME_PREFIX'&&typeof pdmscNamePrefixTokenKey_==='function'){const tk=pdmscNamePrefixTokenKey_(token);if(tk&&existing.some(a=>pdmscNamePrefixTokenKey_(a)===tk))throw new Error('รูปแบบคำนำหน้า “'+token+'” เทียบเท่ากับ '+x.id+' '+x.name+' อยู่แล้ว');}}}}
function pdmscMasterSave_(type,payload){payload=payload||{};const spec=pdmscMasterSpec_(type),name=pdmscNormalizeText_(payload.name),aliases=pdmscMasterAliasList_(payload.aliases).join(' | ');if(!name)throw new Error('กรุณากรอกชื่อรายการ');const lock=LockService.getDocumentLock();lock.waitLock(30000);try{const rows=pdmscMasterRows_(type),id=pdmscNormalizeText_(payload.id)||pdmscMasterNextId_(type),old=rows.find(x=>x.id===id);pdmscMasterAssertNoCollision_(type,id,name,aliases);if(old&&pdmscMasterNormalize_(old.name)!==pdmscMasterNormalize_(name)){const refs=pdmscMasterReferenceCount_(spec.type,old.name);if(refs)throw new Error('เปลี่ยนชื่อหลักไม่ได้ เพราะมีข้อมูลอ้างอิง '+refs+' รายการ ให้ใช้ Alias หรือ Merge แทน');}const sh=SpreadsheetApp.getActive().getSheetByName(spec.sheetName),base=[id,name,payload.active===false?false:true,aliases,pdmscNormalizeText_(payload.note),new Date()];let vals=base;if(spec.type==='LEAVE_TYPE'){const d=old||pdmscLeaveTypePolicyDefault_(name);vals=base.concat([payload.countOccurrence===undefined?!!d.countOccurrence:payload.countOccurrence!==false,payload.countDays===undefined?!!d.countDays:payload.countDays!==false,payload.includeWarningBase===undefined?!!d.includeWarningBase:payload.includeWarningBase===true,payload.showSeparateStatistics===undefined?!!d.showSeparateStatistics:payload.showSeparateStatistics!==false]);}if(old)sh.getRange(old.row,1,1,vals.length).setValues([vals]);else sh.appendRow(vals);pdmscWebCacheClear_(['masters','settings','settings-tab-master','settings-tab-leavepolicy','settings-tab-warning','statistics']);if(spec.type==='LEAVE_TYPE')(pdmscGetActivePeriod().months||[]).forEach(m=>pdmscWebCacheClear_(['statistics-'+m]));pdmscLog_('MASTER_SAVE','OK',{type:spec.type,id,name,aliases});return{id,name,active:vals[2],aliases};}finally{lock.releaseLock();}}
function pdmscMasterSetActive_(type,id,active){const spec=pdmscMasterSpec_(type),rows=pdmscMasterRows_(type),x=rows.find(r=>r.id===id);if(!x)throw new Error('ไม่พบรายการ '+id);const sh=SpreadsheetApp.getActive().getSheetByName(spec.sheetName);sh.getRange(x.row,3).setValue(!!active);sh.getRange(x.row,6).setValue(new Date());pdmscWebCacheClear_(['masters','settings','settings-tab-master','settings-tab-leavepolicy','settings-tab-warning','statistics']);if(spec.type==='LEAVE_TYPE')(pdmscGetActivePeriod().months||[]).forEach(m=>pdmscWebCacheClear_(['statistics-'+m]));pdmscLog_('MASTER_ACTIVE','OK',{type:spec.type,id,active:!!active});return{ok:true};}
function pdmscMasterActiveNameSet_(type){return new Set(pdmscMasterRows_(type).filter(x=>x.active).map(x=>pdmscMasterNormalize_(x.name)));}
function pdmscMasterValidateActiveName_(type,name,label){const resolved=pdmscMasterResolveName_(type,name,true);if(!resolved)throw new Error((label||type)+' “'+pdmscNormalizeText_(name)+'” ไม่มีใน Master ที่ Active หรือ Alias ที่กำหนด');return resolved;}
function pdmscLeaveTypeMasterContext_(){const ctx=pdmscMasterResolveContext_('LEAVE_TYPE',false);const map=new Map();ctx.map.forEach((v,k)=>{if(v.active)map.set(k,v.name)});return map;}
function pdmscLeaveTypeResolveMaster_(name){return pdmscMasterResolveName_('LEAVE_TYPE',name,true);}
function pdmscMasterMerge_(type,sourceId,targetId){const spec=pdmscMasterSpec_(type),rows=pdmscMasterRows_(type),source=rows.find(x=>x.id===sourceId),target=rows.find(x=>x.id===targetId);if(!source||!target)throw new Error('ไม่พบ Source/Target Master สำหรับ Merge');if(source.id===target.id)throw new Error('Source และ Target ต้องเป็นคนละรายการ');if(!target.active)throw new Error('Target ต้องเป็นรายการที่ Active');const lock=LockService.getDocumentLock();lock.waitLock(30000);try{const ss=SpreadsheetApp.getActive();let changed=0;if(spec.type==='POSITION'||spec.type==='DEPARTMENT'){const sh=ss.getSheetByName(PDMSC.BACKEND.PERSONNEL);if(sh&&sh.getLastRow()>1){const col=spec.type==='POSITION'?3:4,vals=sh.getRange(2,col,sh.getLastRow()-1,1).getValues();vals.forEach(r=>{if(pdmscMasterNormalize_(r[0])===pdmscMasterNormalize_(source.name)){r[0]=target.name;changed++;}});if(vals.length)sh.getRange(2,col,vals.length,1).setValues(vals);}}else if(spec.type==='LEAVE_TYPE'){const sh=ss.getSheetByName(PDMSC.BACKEND.LEAVE_STORE);if(sh&&sh.getLastRow()>1){const vals=sh.getRange(2,3,sh.getLastRow()-1,1).getValues();vals.forEach(r=>{if(pdmscMasterNormalize_(r[0])===pdmscMasterNormalize_(source.name)){r[0]=target.name;changed++;}});if(vals.length)sh.getRange(2,3,vals.length,1).setValues(vals);}}
    const mergedAliases=pdmscMasterAliasList_([target.aliases,source.name,source.aliases].filter(Boolean).join(' | ')).filter(a=>pdmscMasterNormalize_(a)!==pdmscMasterNormalize_(target.name)).join(' | ');const mergeTokens=[target.name].concat(pdmscMasterAliasList_(mergedAliases));for(const token of mergeTokens){const n=pdmscMasterNormalize_(token);for(const row of rows){if(row.id===target.id||row.id===source.id)continue;if(pdmscMasterNormalize_(row.name)===n||pdmscMasterAliasList_(row.aliases).some(a=>pdmscMasterNormalize_(a)===n))throw new Error('Merge ไม่ได้ เพราะชื่อ/ชื่อเรียกอื่น “'+token+'” ชนกับ '+row.id+' '+row.name);}}pdmscMasterMigrateWarningRefs_(spec.type,source,target);const msh=ss.getSheetByName(spec.sheetName);msh.getRange(target.row,4).setValue(mergedAliases);msh.getRange(target.row,6).setValue(new Date());msh.getRange(source.row,3).setValue(false);msh.getRange(source.row,6).setValue(new Date());pdmscWebCacheClear_(['masters','personnel','settings','leave','settings-tab-warning','statistics','warning-candidates']);pdmscLog_('MASTER_MERGE','OK',{type:spec.type,sourceId,targetId,sourceName:source.name,targetName:target.name,changed});return{ok:true,changed,sourceId,targetId,targetName:target.name};}finally{lock.releaseLock();}}
function pdmscSeedMasterFromCurrentData_(){
  const pos=new Set(),dep=new Set(),leave=new Set();pdmscPersonnelRows_().forEach(x=>{if(x.position)pos.add(x.position);if(x.department)dep.add(x.department);});
  if(typeof pdmscLeaveStoreRows_==='function')pdmscLeaveStoreRows_().forEach(x=>{if(x.leaveType)leave.add(x.leaveType);});
  const seed=(type,set)=>{const ctx=pdmscMasterResolveContext_(type,true);set.forEach(name=>{if(!ctx.map.has(pdmscMasterNormalize_(name)))pdmscMasterSave_(type,{name,active:true,note:'Seed จาก Current Data'});});};
  seed('POSITION',pos);seed('DEPARTMENT',dep);seed('LEAVE_TYPE',leave);return{positions:pos.size,departments:dep.size,leaveTypes:leave.size};
}
function pdmscLeaveTypePolicySeedDefaults_(){
  const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.MASTER_LEAVE_TYPE);if(!sh||sh.getLastRow()<2)return{updated:0,total:0};
  const n=sh.getLastRow()-1,vals=sh.getRange(2,1,n,10).getValues();let updated=0;
  vals.forEach(r=>{const d=pdmscLeaveTypePolicyDefault_(r[1]);let changed=false;[[6,d.countOccurrence],[7,d.countDays],[8,d.includeWarningBase],[9,d.showSeparateStatistics]].forEach(([i,v])=>{if(r[i]===''||r[i]===null||r[i]===undefined){r[i]=v;changed=true;}});if(changed){r[5]=new Date();updated++;}});
  if(updated)sh.getRange(2,1,n,10).setValues(vals);
  return{updated,total:n};
}

function pdmscNamePrefixSeedDefaults_(){
  const seeds=[
    {name:'นาย',aliases:'',note:'คำนำหน้าทั่วไป — ไม่ใช้คำย่อกำกวม เช่น น.'},
    {name:'นาง',aliases:'',note:'คำนำหน้าทั่วไป'},
    {name:'นางสาว',aliases:'น.ส. | น.ส | นส. | นส',note:'รองรับชื่อเต็มและคำย่อที่พบบ่อย'},
    {name:'ว่าที่ร้อยตรีหญิง',aliases:'ว่าที่ ร.ต.หญิง | ว่าที่ ร.ต หญิง | ว่าที่ร.ต.หญิง | ว่าที่ร.ต หญิง | ว่าที่ ร.ต. หญิง | ว่าที่ร.ต. หญิง',note:'จับคู่รูปแบบเต็ม/ย่อ โดยไม่ตัดคำว่า หญิง'},
    {name:'ว่าที่ร้อยตรี',aliases:'ว่าที่ ร.ต. | ว่าที่ ร.ต | ว่าที่ร.ต. | ว่าที่ร.ต',note:'จับคู่รูปแบบเต็ม/ย่อ'},
    {name:'ร้อยตรี',aliases:'ร.ต. | ร.ต',note:'ยศทหาร'},
    {name:'ร้อยโท',aliases:'ร.ท. | ร.ท',note:'ยศทหาร'},
    {name:'ร้อยเอก',aliases:'ร.อ. | ร.อ',note:'ยศทหาร'},
    {name:'พันตรี',aliases:'พ.ต. | พ.ต',note:'ยศทหาร'},
    {name:'พันโท',aliases:'พ.ท. | พ.ท',note:'ยศทหาร'},
    {name:'พันเอก',aliases:'พ.อ. | พ.อ',note:'ยศทหาร'},
    {name:'จ่าสิบตรี',aliases:'จ.ส.ต. | จ.ส.ต',note:'ยศทหาร'},
    {name:'จ่าสิบโท',aliases:'จ.ส.ท. | จ.ส.ท',note:'ยศทหาร'},
    {name:'จ่าสิบเอก',aliases:'จ.ส.อ. | จ.ส.อ',note:'ยศทหาร'},
    {name:'ผู้ช่วยศาสตราจารย์',aliases:'ผศ. | ผศ',note:'ตำแหน่งทางวิชาการเมื่ออยู่หน้าชื่อ'},
    {name:'รองศาสตราจารย์',aliases:'รศ. | รศ',note:'ตำแหน่งทางวิชาการเมื่ออยู่หน้าชื่อ'}
  ];
  const rows=pdmscMasterRows_('NAME_PREFIX'),seen=new Set(),created=[],now=new Date();
  rows.forEach(x=>[x.name].concat(pdmscMasterAliasList_(x.aliases)).forEach(t=>seen.add(pdmscMasterNormalize_(t))));
  let max=0;rows.forEach(x=>{const m=x.id.match(/^PRF(\d+)$/i);if(m)max=Math.max(max,Number(m[1]));});
  const append=[];
  seeds.forEach(x=>{
    const tokens=[x.name].concat(pdmscMasterAliasList_(x.aliases)),norms=tokens.map(pdmscMasterNormalize_).filter(Boolean);
    if(norms.some(n=>seen.has(n)))return;
    norms.forEach(n=>seen.add(n));max++;const id='PRF'+String(max).padStart(3,'0');append.push([id,x.name,true,pdmscMasterAliasList_(x.aliases).join(' | '),x.note,now]);created.push(id);
  });
  const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.MASTER_NAME_PREFIX);if(append.length)sh.getRange(sh.getLastRow()+1,1,append.length,append[0].length).setValues(append);
  pdmscWebCacheClear_(['masters','settings','personnel','leave']);
  return{ok:true,created:created,total:rows.length+append.length};
}
