function pdmscPersonnelBulkActive_(v){
  const s=pdmscNormalizeText_(v).toUpperCase();
  if(s==='TRUE')return true;if(s==='FALSE')return false;return null;
}
function pdmscPersonnelBulkParse_(text){
  const lines=String(text||'').replace(/\r/g,'').split('\n'),rows=[],issues=[];
  lines.forEach((line,i)=>{
    if(!line.trim())return;
    const c=line.split('\t');
    const empId=pdmscNormalizeText_(c[0]).toUpperCase(),fullName=pdmscNormalizeText_(c[1]);
    if(i===0&&/EMP[_ ]?ID/i.test(empId)&&/ชื่อ/.test(fullName))return;
    const position=pdmscNormalizeText_(c[2]),department=pdmscNormalizeText_(c[3]),active=pdmscPersonnelBulkActive_(c[4]);
    const matchRaw=pdmscNormalizeText_(c[5]),matchName=pdmscNormalizeName_(matchRaw||fullName);
    if(!empId||!/^EMP\d+$/i.test(empId)||!fullName||active===null||!matchName){
      issues.push({cls:'INVALID',sourceRow:i+1,empId,fullName,position,department,active:c[4],matchName:matchRaw,reason:'EMP ID / ชื่อ / Active / ชื่อสำหรับจับคู่ไม่ถูกต้อง'});
      return;
    }
    rows.push({sourceRow:i+1,empId,fullName,position,department,active,matchName,matchRaw:matchRaw||fullName});
  });
  return{rows,issues};
}
function pdmscPersonnelBulkPreview_(text){
  const parsed=pdmscPersonnelBulkParse_(text),existing=pdmscPersonnelRows_(),byId=new Map(existing.map(x=>[x.empId.toUpperCase(),x]));
  const positionCtx=pdmscMasterResolveContext_('POSITION',false),departmentCtx=pdmscMasterResolveContext_('DEPARTMENT',false);
  const seenId=new Set(),seenMatch=new Map(),counts={MATCHED:0,NEW:0,UPDATE_EXISTING:0,UNKNOWN_POSITION:0,UNKNOWN_DEPARTMENT:0,CONFLICT:0,INVALID:parsed.issues.length},items=[].concat(parsed.issues);
  parsed.rows.forEach(x=>{
    const pHit=positionCtx.map.get(pdmscMasterNormalize_(x.position));
    if(!pHit||!pHit.active){counts.UNKNOWN_POSITION++;items.push(Object.assign({cls:'UNKNOWN_POSITION',reason:'ตำแหน่งไม่มีใน Master/ชื่อเรียกอื่นที่ Active'},x));return;}
    const dHit=departmentCtx.map.get(pdmscMasterNormalize_(x.department));
    if(!dHit||!dHit.active){counts.UNKNOWN_DEPARTMENT++;items.push(Object.assign({cls:'UNKNOWN_DEPARTMENT',reason:'กลุ่ม/ฝ่ายไม่มีใน Master/ชื่อเรียกอื่นที่ Active'},x));return;}
    x.positionRaw=x.position;x.departmentRaw=x.department;x.position=pHit.name;x.department=dHit.name;
    if(seenId.has(x.empId)){
      counts.CONFLICT++;items.push(Object.assign({cls:'CONFLICT',reason:'EMP ID ซ้ำในข้อมูลที่วาง'},x));return;
    }
    seenId.add(x.empId);
    if(seenMatch.has(x.matchName)&&seenMatch.get(x.matchName)!==x.empId){
      counts.CONFLICT++;items.push(Object.assign({cls:'CONFLICT',reason:'ชื่อสำหรับจับคู่ซ้ำกับ '+seenMatch.get(x.matchName)},x));return;
    }
    seenMatch.set(x.matchName,x.empId);
    const old=byId.get(x.empId);
    const other=existing.find(p=>p.matchName===x.matchName&&p.empId.toUpperCase()!==x.empId);
    if(other){
      counts.CONFLICT++;items.push(Object.assign({cls:'CONFLICT',reason:'ชื่อสำหรับจับคู่ชนกับ '+other.empId+' '+other.fullName},x));return;
    }
    if(!old){
      counts.NEW++;items.push(Object.assign({cls:'NEW',reason:'EMP ID ใหม่'},x));return;
    }
    const same=old.fullName===x.fullName&&old.position===x.position&&old.department===x.department&&old.active===x.active&&old.matchName===x.matchName;
    if(same){
      counts.MATCHED++;items.push(Object.assign({cls:'MATCHED',reason:'ข้อมูลตรงเดิม'},x));return;
    }
    counts.UPDATE_EXISTING++;
    items.push(Object.assign({
      cls:'UPDATE_EXISTING',
      reason:'อัปเดต '+old.fullName+' → '+x.fullName,
      oldFullName:old.fullName,oldPosition:old.position,oldDepartment:old.department,oldActive:old.active,oldMatchName:old.matchName
    },x));
  });
  const blockers=counts.UNKNOWN_POSITION+counts.UNKNOWN_DEPARTMENT+counts.CONFLICT+counts.INVALID;
  const importId='PIMP-'+Utilities.formatDate(new Date(),PDMSC.TIMEZONE,'yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,8);
  const payload={importId,rows:parsed.rows,counts,blockers,at:new Date().toISOString()};
  const fingerprint=pdmscLeaveHash_(JSON.stringify(parsed.rows.map(x=>[x.empId,x.fullName,x.position,x.department,x.active,x.matchName])));
  PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_PERSONNEL_BULK_PREVIEW,JSON.stringify({importId,fingerprint,payload}));
  pdmscLog_('PERSONNEL_BULK_PREVIEW','OK',{importId,counts,blockers});
  return{ok:blockers===0,importId,fingerprint,counts,blockers,items:items.slice(0,400)};
}
function pdmscPersonnelBulkCommit_(importId,fingerprint){
  const props=PropertiesService.getDocumentProperties(),raw=props.getProperty(PDMSC.PROP_PERSONNEL_BULK_PREVIEW);
  if(!raw)throw new Error('ไม่พบ Preview บุคลากรล่าสุด');
  const state=JSON.parse(raw);
  if(state.importId!==importId||state.fingerprint!==fingerprint)throw new Error('Preview บุคลากรไม่ตรงกับรายการล่าสุด');
  const source=state.payload.rows||[];
  const fresh=pdmscPersonnelBulkPreview_(source.map(x=>[x.empId,x.fullName,x.position,x.department,x.active?'TRUE':'FALSE',x.matchName].join('\t')).join('\n'));
  if(fresh.blockers)throw new Error('พบ Master/CONFLICT/INVALID หลังตรวจซ้ำ กรุณา Preview ใหม่');
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.PERSONNEL),existing=pdmscPersonnelRows_(),byId=new Map(existing.map(x=>[x.empId.toUpperCase(),x])),now=new Date();
    const append=[],updatedIds=new Set();
    source.forEach(x=>{
      const old=byId.get(x.empId);
      const vals=[x.empId,x.fullName,x.position,x.department,!!x.active,x.matchName,old?old.createdAt:now,now,old?old.note:''];
      if(old){sh.getRange(old.row,1,1,vals.length).setValues([vals]);updatedIds.add(x.empId);}
      else append.push(vals);
    });
    if(append.length)sh.getRange(sh.getLastRow()+1,1,append.length,append[0].length).setValues(append);

    // Refresh display-only canonical names for EMP-linked Alias/Scope after real-name updates.
    const nameById=new Map(source.map(x=>[x.empId,x.fullName]));
    const aliasSh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.NAME_MAP);
    if(aliasSh&&aliasSh.getLastRow()>1){
      const vals=aliasSh.getRange(2,1,aliasSh.getLastRow()-1,aliasSh.getLastColumn()).getValues(),out=vals.map(r=>{
        const id=pdmscNormalizeText_(r[1]).toUpperCase();if(nameById.has(id))r[2]=nameById.get(id);return r;
      });
      aliasSh.getRange(2,1,out.length,out[0].length).setValues(out);
    }
    const scopeSh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.EXCLUSIONS);
    if(scopeSh&&scopeSh.getLastRow()>1){
      const vals=scopeSh.getRange(2,1,scopeSh.getLastRow()-1,scopeSh.getLastColumn()).getValues(),out=vals.map(r=>{
        const id=pdmscNormalizeText_(r[4]).toUpperCase(),type=pdmscNormalizeText_(r[5]).toUpperCase();
        if(type==='EMP_ID'&&nameById.has(id)){r[0]=nameById.get(id);}
        return r;
      });
      scopeSh.getRange(2,1,out.length,out[0].length).setValues(out);
    }
    let max=0;pdmscPersonnelRows_().forEach(x=>{const m=x.empId.match(/^EMP(\d+)$/i);if(m)max=Math.max(max,Number(m[1]));});
    props.setProperty(PDMSC.PROP_LAST_EMP_NO,String(max));
    props.deleteProperty(PDMSC.PROP_PERSONNEL_BULK_PREVIEW);
    pdmscWebCacheClear_(['personnel','dashboard']);
    pdmscLog_('PERSONNEL_BULK_COMMIT','OK',{count:source.length,newRows:append.length,updated:updatedIds.size});
    return{ok:true,total:source.length,newRows:append.length,updated:updatedIds.size};
  }finally{lock.releaseLock();}
}
