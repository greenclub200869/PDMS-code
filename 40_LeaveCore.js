const PDMSC_LEAVE = Object.freeze({
  RAW_COLS: 12,
  STATUS: Object.freeze({ACTIVE:'ACTIVE',REMOVED:'REMOVED'}),
  CLASS: Object.freeze({
    MATCHED:'MATCHED',NEW:'NEW',CORRECTION:'CORRECTION',MERGED:'MERGED',
    SPLIT:'SPLIT',REMOVED:'REMOVED',REVIEW:'REVIEW',EXCLUDED:'EXCLUDED',INVALID:'INVALID'
  })
});

function pdmscLeaveHash_(value){
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value||''),Utilities.Charset.UTF_8);
  return bytes.map(b=>(b+256)%256).map(b=>('0'+b.toString(16)).slice(-2)).join('');
}

function pdmscLeaveCanonicalYear_(value){
  let y=Number(value);
  if(!Number.isInteger(y))return null;
  if(y>2400)y-=543;
  return y>=2000&&y<=2200?y:null;
}

function pdmscLeaveDate_(value){
  if(value instanceof Date&&!isNaN(value.getTime()))
    return new Date(value.getFullYear(),value.getMonth(),value.getDate());
  const s=pdmscNormalizeText_(value);
  if(!s)return null;
  let m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/);
  if(m){
    const y=pdmscLeaveCanonicalYear_(m[3]),mo=Number(m[2]),d=Number(m[1]);
    if(!y||mo<1||mo>12||d<1||d>31)return null;
    const out=new Date(y,mo-1,d);
    return out.getFullYear()===y&&out.getMonth()===mo-1&&out.getDate()===d?out:null;
  }
  m=s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if(m){
    const y=pdmscLeaveCanonicalYear_(m[1]),mo=Number(m[2]),d=Number(m[3]);
    if(!y||mo<1||mo>12||d<1||d>31)return null;
    const out=new Date(y,mo-1,d);
    return out.getFullYear()===y&&out.getMonth()===mo-1&&out.getDate()===d?out:null;
  }
  return null;
}

function pdmscLeaveDateKey_(d){return Utilities.formatDate(d,PDMSC.TIMEZONE,'yyyyMMdd');}
function pdmscLeaveDateUi_(d){return Utilities.formatDate(d,PDMSC.TIMEZONE,'dd/MM/')+(d.getFullYear()+543);}
function pdmscLeaveDay_(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();}
function pdmscLeaveTypeKey_(v){return pdmscNormalizeText_(v).toLowerCase();}
function pdmscLeaveExactKey_(x){return [x.empId,pdmscLeaveTypeKey_(x.leaveType),pdmscLeaveDateKey_(x.start),pdmscLeaveDateKey_(x.end)].join('|');}
function pdmscLeaveFingerprint_(x){return pdmscLeaveHash_([pdmscLeaveExactKey_(x),Number(x.days)].join('|'));}
function pdmscLeaveIntervalsTouch_(a1,a2,b1,b2){const one=86400000;return pdmscLeaveDay_(a1)<=pdmscLeaveDay_(b2)+one&&pdmscLeaveDay_(b1)<=pdmscLeaveDay_(a2)+one;}
function pdmscLeaveContains_(a1,a2,b1,b2){return pdmscLeaveDay_(a1)<=pdmscLeaveDay_(b1)&&pdmscLeaveDay_(a2)>=pdmscLeaveDay_(b2);}

function pdmscLeavePeriodBounds_(){
  const p=pdmscGetActivePeriod();
  if(!p.months.length)throw new Error('ยังไม่ได้ตั้งรอบ 6 เดือน');
  const first=p.months[0],last=p.months[p.months.length-1];
  return {
    period:p,
    start:new Date(Number(first.slice(0,4)),Number(first.slice(4,6))-1,1),
    end:new Date(Number(last.slice(0,4)),Number(last.slice(4,6)),0)
  };
}

function pdmscLeaveOverlapsPeriod_(x,bounds){
  return pdmscLeaveDay_(x.start)<=pdmscLeaveDay_(bounds.end)&&pdmscLeaveDay_(x.end)>=pdmscLeaveDay_(bounds.start);
}

function pdmscLeavePeriodOwnership_(x,bounds){
  bounds=bounds||pdmscLeavePeriodBounds_();
  const s=pdmscLeaveDay_(x.start),e=pdmscLeaveDay_(x.end),ps=pdmscLeaveDay_(bounds.start),pe=pdmscLeaveDay_(bounds.end);
  if(e<ps)return'OUTSIDE_BEFORE';
  if(s>pe)return'OUTSIDE_AFTER';
  // User contract: any request that crosses the 6M end belongs to the next file in full.
  if(s<=pe&&e>pe)return'CARRY_OUT_EXCLUDED';
  if(s<ps&&e>=ps&&e<=pe)return'CARRY_IN';
  if(s>=ps&&e<=pe)return'IN_PERIOD';
  return'OUTSIDE';
}
function pdmscLeavePeriodCountable_(x,bounds){
  const o=pdmscLeavePeriodOwnership_(x,bounds);
  return o==='IN_PERIOD'||o==='CARRY_IN';
}
function pdmscLeaveCoreCarryInMeta_(x,dateFacts,bounds){
  const ownership=pdmscLeavePeriodOwnership_(x,bounds);
  if(ownership!=='CARRY_IN')return{ownership:ownership,effectiveOccurrenceDateKey:pdmscLeaveDateKey_(x.start),carryInExtraDays:0};
  const inPeriod=(dateFacts.rows||[]).filter(r=>pdmscLeaveDay_(r.date)>=pdmscLeaveDay_(bounds.start)&&pdmscLeaveDay_(r.date)<=pdmscLeaveDay_(bounds.end));
  const first=inPeriod.length?inPeriod[0].date:bounds.start;
  let extra=0;
  if(dateFacts.allocation&&dateFacts.allocation.allocatable){
    const visible=inPeriod.reduce((sum,r)=>sum+Number(r.days||0),0);
    extra=Math.max(0,(Number(x.days)||0)-visible);
  }
  return{ownership:ownership,effectiveOccurrenceDateKey:pdmscLeaveDateKey_(first),carryInExtraDays:extra};
}

function pdmscLeaveParsePaste_(text,resolverCtx,leaveMasterCtx){
  resolverCtx=resolverCtx||pdmscBuildBulkResolverContext_();
  leaveMasterCtx=leaveMasterCtx||pdmscLeaveTypeMasterContext_();
  const lines=String(text||'').replace(/\r/g,'').split('\n');
  const rows=[],attention=[];
  lines.forEach((line,idx)=>{
    if(!line.trim())return;
    const c=line.split('\t');
    const name=pdmscNormalizeText_(c[1]),type=pdmscNormalizeText_(c[3]);
    const header=(idx===0)&&(/ชื่อ/.test(name)||/ประเภทการลา/.test(type)||/เริ่มต้น/.test(pdmscNormalizeText_(c[4])));
    if(header)return;
    if(!name&&!type&&!pdmscNormalizeText_(c[4])&&!pdmscNormalizeText_(c[5]))return;
    const start=pdmscLeaveDate_(c[4]),end=pdmscLeaveDate_(c[5])||start,days=Number(String(c[6]||'').replace(',','.'));
    const raw=c.slice(0,PDMSC_LEAVE.RAW_COLS);
    while(raw.length<PDMSC_LEAVE.RAW_COLS)raw.push('');
    if(!name||!type||!start||!end||!Number.isFinite(days)||days<=0||end<start){
      attention.push({cls:'INVALID',sourceRow:idx+1,name,type,start:start?pdmscLeaveDateUi_(start):'',end:end?pdmscLeaveDateUi_(end):'',days:isNaN(days)?'':days,reason:'ชื่อ/ประเภท/วันที่/จำนวนวันไม่ครบหรือไม่ถูกต้อง'});
      return;
    }
    const resolved=pdmscResolvePersonFromContext_(name,resolverCtx,start,end);
    let canonicalLeaveType=leaveMasterCtx.get(pdmscMasterNormalize_(type))||'';
    if(!canonicalLeaveType){
      attention.push({cls:'INVALID',sourceRow:idx+1,name,type,start:pdmscLeaveDateUi_(start),end:pdmscLeaveDateUi_(end),days,reason:'ประเภทการลาไม่มีใน Master ที่ Active'});
      return;
    }
    if(resolved.status==='EXCLUDED_FROM_PROCESSING'){
      attention.push({cls:'EXCLUDED',sourceRow:idx+1,name,type,start:pdmscLeaveDateUi_(start),end:pdmscLeaveDateUi_(end),days,empId:resolved.person&&resolved.person.empId?pdmscNormalizeText_(resolved.person.empId).toUpperCase():'',reason:resolved.reason||'Personnel Scope'});
      return;
    }
    if(resolved.status!=='MATCHED'){
      let resolverReason='จับคู่บุคลากรไม่ได้: '+resolved.status;
      if(resolved.status==='OUT_OF_EMPLOYMENT_PERIOD')resolverReason='อยู่นอกช่วงการจ้างงาน'+(resolved.boundary==='START'?' (ก่อนวันเริ่มงาน)':' (หลังวันสิ้นสุดงาน)');
      if(resolved.status==='EMPLOYMENT_PERIOD_OVERLAP')resolverReason='ช่วงลาคร่อมขอบเขตการจ้างงาน'+(resolved.boundary==='START'?' (วันเริ่มงาน)':' (วันสิ้นสุดงาน)');
      attention.push({cls:'REVIEW',sourceRow:idx+1,name,type,start:pdmscLeaveDateUi_(start),end:pdmscLeaveDateUi_(end),days,reason:resolverReason});
      return;
    }
    rows.push({
      sourceRow:idx+1,raw,name,type:canonicalLeaveType,leaveType:canonicalLeaveType,start,end,days,
      empId:resolved.person.empId,canonicalName:resolved.person.fullName||resolved.person.name||name,
      position:resolved.person.position||'',department:resolved.person.department||''
    });
  });
  return {rows,attention};
}

function pdmscLeaveStoreRows_(){
  return pdmscRows_(PDMSC.BACKEND.LEAVE_STORE).map((r,i)=>({
    row:i+2,leaveId:pdmscNormalizeText_(r[0]),empId:pdmscNormalizeText_(r[1]).toUpperCase(),
    leaveType:pdmscNormalizeText_(r[2]),start:pdmscLeaveDate_(r[3]),end:pdmscLeaveDate_(r[4]),
    days:Number(r[5])||0,sourceFingerprint:pdmscNormalizeText_(r[6]),
    status:pdmscNormalizeText_(r[7]).toUpperCase()||'ACTIVE',updatedAt:r[8]||''
  })).filter(x=>x.leaveId&&x.empId&&x.start&&x.end);
}

function pdmscLeaveRelationComponents_(sources,existing){
  const sAdj=sources.map(()=>[]),eAdj=existing.map(()=>[]);
  sources.forEach((s,si)=>existing.forEach((e,ei)=>{if(pdmscLeaveIntervalsTouch_(s.start,s.end,e.start,e.end)){sAdj[si].push(ei);eAdj[ei].push(si);}}));
  const seenS=new Set(),seenE=new Set(),out=[];
  sources.forEach((_s,root)=>{
    if(seenS.has(root))return;
    const comp={sourceIndexes:[],existingIndexes:[]},q=[root];seenS.add(root);
    while(q.length){
      const si=q.shift();comp.sourceIndexes.push(si);
      sAdj[si].forEach(ei=>{
        if(!seenE.has(ei)){seenE.add(ei);comp.existingIndexes.push(ei);}
        eAdj[ei].forEach(ns=>{if(!seenS.has(ns)){seenS.add(ns);q.push(ns);}});
      });
    }
    out.push(comp);
  });
  return out;
}

function pdmscLeaveReconcile_(incoming,existing,nameById){
  const counts={MATCHED:0,NEW:0,CORRECTION:0,MERGED:0,SPLIT:0,REMOVED:0,REVIEW:0,EXCLUDED:0,INVALID:0};
  const items=[],matchedExisting=new Set(),relatedExisting=new Set();
  const sourceGroups=new Map(),existingGroups=new Map();

  incoming.forEach(x=>{
    const k=x.empId+'|'+pdmscLeaveTypeKey_(x.leaveType);
    if(!sourceGroups.has(k))sourceGroups.set(k,[]);
    sourceGroups.get(k).push(x);
  });
  existing.filter(x=>x.status==='ACTIVE').forEach(x=>{
    const k=x.empId+'|'+pdmscLeaveTypeKey_(x.leaveType);
    if(!existingGroups.has(k))existingGroups.set(k,[]);
    existingGroups.get(k).push(x);
  });

  sourceGroups.forEach((src,groupKey)=>{
    const old=(existingGroups.get(groupKey)||[]).slice();
    const duplicate=new Map();
    src.forEach(x=>{const k=pdmscLeaveExactKey_(x);if(!duplicate.has(k))duplicate.set(k,[]);duplicate.get(k).push(x);});
    const dupSet=new Set();duplicate.forEach(arr=>{if(arr.length>1)arr.forEach(x=>dupSet.add(x));});

    const remainingSrc=[],usedOld=new Set();
    src.forEach(x=>{
      if(dupSet.has(x)){
        counts.REVIEW++;items.push(pdmscLeavePreviewItem_(x,'REVIEW','พบช่วงลาเดียวกันซ้ำในข้อมูลต้นทาง'));
        return;
      }
      const ei=old.findIndex((e,i)=>!usedOld.has(i)&&pdmscLeaveExactKey_(e)===pdmscLeaveExactKey_(x)&&Math.abs(e.days-x.days)<0.000001);
      if(ei>=0){
        usedOld.add(ei);matchedExisting.add(old[ei].leaveId);
        counts.MATCHED++;items.push(pdmscLeavePreviewItem_(x,'MATCHED','ข้อมูลตรงเดิม'));
      }else remainingSrc.push(x);
    });
    const remainingOld=old.filter((e,i)=>!usedOld.has(i));
    const comps=pdmscLeaveRelationComponents_(remainingSrc,remainingOld);
    comps.forEach(comp=>{
      const ss=comp.sourceIndexes.map(i=>remainingSrc[i]),es=comp.existingIndexes.map(i=>remainingOld[i]);
      let cls='REVIEW',reason='';
      if(es.length===0){cls='NEW';reason='ไม่พบรายการเดิมที่สัมพันธ์กัน';}
      else if(ss.length===1&&es.length===1){cls='CORRECTION';reason='มีรายการเดิมช่วงใกล้เคียง/ทับซ้อน';}
      else if(ss.length===1&&es.length>1&&es.every(e=>pdmscLeaveContains_(ss[0].start,ss[0].end,e.start,e.end))){cls='MERGED';reason='หลายรายการเดิมรวมเป็นช่วงใหม่เดียว';}
      else if(ss.length>1&&es.length===1&&ss.every(x=>pdmscLeaveContains_(es[0].start,es[0].end,x.start,x.end))){cls='SPLIT';reason='รายการเดิมถูกแบ่งเป็นหลายช่วง';}
      else {cls='REVIEW';reason='ความสัมพันธ์หลายต่อหลายหรือทับซ้อนไม่ชัดเจน';}
      ss.forEach(x=>{counts[cls]++;items.push(pdmscLeavePreviewItem_(x,cls,reason));});
      es.forEach(e=>relatedExisting.add(e.leaveId));
    });
  });

  existing.filter(x=>x.status==='ACTIVE').forEach(e=>{
    if(matchedExisting.has(e.leaveId)||relatedExisting.has(e.leaveId))return;
    counts.REMOVED++;
    items.push({
      cls:'REMOVED',empId:e.empId,name:pdmscLeavePersonName_(e.empId,nameById),leaveType:e.leaveType,
      start:pdmscLeaveDateUi_(e.start),end:pdmscLeaveDateUi_(e.end),days:e.days,
      sourceRow:'',reason:'ไม่พบใน Snapshot ใหม่',leaveId:e.leaveId
    });
  });

  return {counts,items};
}

function pdmscLeavePersonName_(empId,nameById){const id=pdmscNormalizeText_(empId).toUpperCase();return(nameById&&nameById.get(id))||id;}

function pdmscLeavePreviewItem_(x,cls,reason){
  return {cls,empId:x.empId,name:x.canonicalName,department:x.department||'',leaveType:x.leaveType,start:pdmscLeaveDateUi_(x.start),end:pdmscLeaveDateUi_(x.end),days:x.days,sourceRow:x.sourceRow,reason};
}

function pdmscLeaveStageRaw_(importId,rows){
  const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.RAW_LEAVE);
  if(sh.getLastRow()>1){
    const vals=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
    const keep=vals.filter(r=>pdmscNormalizeText_(r[0])!==importId);
    sh.getRange(2,1,sh.getLastRow()-1,sh.getMaxColumns()).clearContent();
    if(keep.length)sh.getRange(2,1,keep.length,keep[0].length).setValues(keep);
  }
  const now=new Date();
  const out=rows.map(x=>[
    importId,x.sourceRow,JSON.stringify({
      raw:x.raw,name:x.name,leaveType:x.leaveType,
      start:pdmscLeaveDateKey_(x.start),end:pdmscLeaveDateKey_(x.end),
      days:x.days,empId:x.empId,canonicalName:x.canonicalName,position:x.position,department:x.department||''
    }),pdmscLeaveFingerprint_(x),now
  ]);
  if(out.length)sh.getRange(sh.getLastRow()+1,1,out.length,out[0].length).setValues(out);
}

function pdmscLeaveReadStage_(importId){
  return pdmscRows_(PDMSC.BACKEND.RAW_LEAVE).filter(r=>pdmscNormalizeText_(r[0])===importId).map(r=>{
    const p=JSON.parse(String(r[2]||'{}'));
    const parseKey=k=>new Date(Number(k.slice(0,4)),Number(k.slice(4,6))-1,Number(k.slice(6,8)));
    return {
      sourceRow:Number(r[1])||0,raw:p.raw||[],name:p.name||'',leaveType:p.leaveType||'',
      type:p.leaveType||'',start:parseKey(p.start),end:parseKey(p.end),days:Number(p.days)||0,
      empId:p.empId||'',canonicalName:p.canonicalName||'',position:p.position||'',department:p.department||''
    };
  });
}

function pdmscLeavePreviewPaste(text){
  const bounds=pdmscLeavePeriodBounds_(),resolverCtx=pdmscBuildBulkResolverContext_(),leaveMasterCtx=pdmscLeaveTypeMasterContext_(),parsed=pdmscLeaveParsePaste_(text,resolverCtx,leaveMasterCtx),nameById=new Map(resolverCtx.people.map(p=>[p.empId.toUpperCase(),p.fullName]));
  const inside=[],outside=[];
  parsed.rows.forEach(x=>(pdmscLeaveOverlapsPeriod_(x,bounds)?inside:outside).push(x));
  const existing=pdmscLeaveStoreRows_().filter(x=>x.status==='ACTIVE'&&pdmscLeaveOverlapsPeriod_(x,bounds));
  const excludedEmpIds=new Set(parsed.attention.filter(a=>a.cls==='EXCLUDED'&&a.empId).map(a=>a.empId));
  const rec=pdmscLeaveReconcile_(inside,existing.filter(x=>!excludedEmpIds.has(x.empId)),nameById);
  parsed.attention.forEach(a=>{
    if(a.cls==='EXCLUDED')rec.counts.EXCLUDED++;else if(a.cls==='INVALID')rec.counts.INVALID++;else rec.counts.REVIEW++;
    rec.items.push(a);
  });
  const departmentById=new Map(resolverCtx.people.map(p=>[pdmscNormalizeText_(p.empId).toUpperCase(),p.department||'']));
  rec.items.forEach(x=>{if(!x.department&&x.empId)x.department=departmentById.get(pdmscNormalizeText_(x.empId).toUpperCase())||'';});
  const blockers=rec.counts.REVIEW+rec.counts.INVALID;
  const importId='LIMP-'+Utilities.formatDate(new Date(),PDMSC.TIMEZONE,'yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,8);
  pdmscLeaveStageRaw_(importId,inside);
  const fingerprint=pdmscLeaveHash_(JSON.stringify({
    importId,period:bounds.period.periodId,
    rows:inside.map(x=>[x.empId,pdmscLeaveTypeKey_(x.leaveType),pdmscLeaveDateKey_(x.start),pdmscLeaveDateKey_(x.end),x.days]),
    counts:rec.counts
  }));
  PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_LEAVE_PREVIEW,JSON.stringify({importId,fingerprint,periodId:bounds.period.periodId,excludedEmpIds:Array.from(excludedEmpIds),at:new Date().toISOString()}));
  pdmscLog_('LEAVE_PREVIEW','OK',{importId,periodId:bounds.period.periodId,counts:rec.counts,outside:outside.length,blockers});
  // UX contract: รายการที่ต้องสนใจต้องขึ้นก่อน NEW/MATCHED เสมอ แม้ Preview จะถูกจำกัดจำนวนแถว
  const previewPriority={INVALID:10,REVIEW:20,CORRECTION:30,REMOVED:40,MERGED:50,SPLIT:60,EXCLUDED:70,NEW:80,MATCHED:90};
  rec.items.sort((a,b)=>(previewPriority[a.cls]||999)-(previewPriority[b.cls]||999)||Number(a.sourceRow||999999)-Number(b.sourceRow||999999));
  return {
    ok:blockers===0,importId,fingerprint,period:bounds.period,
    counts:rec.counts,outsidePeriod:outside.length,blockers,
    items:rec.items.slice(0,300)
  };
}

function pdmscLeaveCommit(importId,expectedFingerprint){
  const props=PropertiesService.getDocumentProperties(),raw=props.getProperty(PDMSC.PROP_LEAVE_PREVIEW);
  if(!raw)throw new Error('ไม่พบ Preview ล่าสุด กรุณากดตรวจสอบใหม่');
  const state=JSON.parse(raw);
  if(state.importId!==importId||state.fingerprint!==expectedFingerprint)throw new Error('Preview ไม่ตรงกับรายการล่าสุด กรุณาตรวจสอบใหม่');
  const bounds=pdmscLeavePeriodBounds_();
  if(state.periodId!==bounds.period.periodId)throw new Error('รอบ 6 เดือนเปลี่ยนหลัง Preview กรุณาตรวจสอบใหม่');

  const incoming=pdmscLeaveReadStage_(importId);
  const resolverCtx=pdmscBuildBulkResolverContext_(),nameById=new Map(resolverCtx.people.map(p=>[p.empId.toUpperCase(),p.fullName]));
  incoming.forEach(x=>{
    const person=resolverCtx.byId.get(pdmscNormalizeText_(x.empId).toUpperCase());if(!person)throw new Error('ไม่พบบุคลากร '+x.empId+' หลัง Preview กรุณาตรวจสอบใหม่');
    const d=pdmscPersonnelEmploymentDecision_(person,x.start,x.end);if(d.status!=='MATCHED')throw new Error('สถานะช่วงการจ้างงานของ '+person.fullName+' เปลี่ยนหลัง Preview: '+d.status+' กรุณาตรวจสอบใหม่');
  });
  const excludedEmpIds=new Set((state.excludedEmpIds||[]).map(x=>pdmscNormalizeText_(x).toUpperCase()).filter(Boolean));
  const existing=pdmscLeaveStoreRows_().filter(x=>x.status==='ACTIVE'&&pdmscLeaveOverlapsPeriod_(x,bounds)&&!excludedEmpIds.has(x.empId));
  const rec=pdmscLeaveReconcile_(incoming,existing,nameById);
  if(rec.counts.REVIEW||rec.counts.INVALID)throw new Error('ยังมี REVIEW/INVALID จึง Commit ไม่ได้');

  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.LEAVE_STORE),now=new Date();
    const incomingFp=new Set(incoming.map(pdmscLeaveFingerprint_));
    if(sh.getLastRow()>1){
      const vals=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
      let changed=false;
      vals.forEach(r=>{
        const empId=pdmscNormalizeText_(r[1]).toUpperCase(),start=pdmscLeaveDate_(r[3]),end=pdmscLeaveDate_(r[4]);
        const fp=pdmscNormalizeText_(r[6]),status=pdmscNormalizeText_(r[7]).toUpperCase();
        const inSelectedPeriod=start&&end&&pdmscLeaveOverlapsPeriod_({start:start,end:end},bounds);
        if(status==='ACTIVE'&&inSelectedPeriod&&!excludedEmpIds.has(empId)&&!incomingFp.has(fp)){r[7]=PDMSC_LEAVE.STATUS.REMOVED;r[8]=now;changed=true;}
      });
      if(changed)sh.getRange(2,1,vals.length,vals[0].length).setValues(vals);
    }
    const existingFp=new Set(existing.map(x=>x.sourceFingerprint)),append=[];
    incoming.forEach(x=>{
      const fp=pdmscLeaveFingerprint_(x);
      if(existingFp.has(fp))return;
      const id='LV-'+fp.slice(0,20).toUpperCase();
      append.push([id,x.empId,x.leaveType,x.start,x.end,x.days,fp,PDMSC_LEAVE.STATUS.ACTIVE,now]);
    });
    if(append.length)sh.getRange(sh.getLastRow()+1,1,append.length,append[0].length).setValues(append);
    const added=append.length;

    props.deleteProperty(PDMSC.PROP_LEAVE_PREVIEW);
    pdmscLog_('LEAVE_COMMIT','OK',{importId,periodId:bounds.period.periodId,counts:rec.counts,added});
    return {ok:true,counts:rec.counts,added,active:incoming.length};
  } finally {lock.releaseLock();}
}

function pdmscLeaveListActive_(){
  const bounds=pdmscLeavePeriodBounds_(),ctx=pdmscBuildBulkResolverContext_(),nameById=new Map(ctx.people.map(p=>[p.empId.toUpperCase(),p.fullName])),departmentById=new Map(ctx.people.map(p=>[p.empId.toUpperCase(),p.department||'']));
  return pdmscLeaveStoreRows_().filter(x=>x.status==='ACTIVE'&&pdmscLeaveOverlapsPeriod_(x,bounds)).sort((a,b)=>a.start-b.start).map(x=>({
    leaveId:x.leaveId,empId:x.empId,name:pdmscLeavePersonName_(x.empId,nameById),department:departmentById.get(x.empId)||'',leaveType:x.leaveType,
    start:pdmscLeaveDateUi_(x.start),end:pdmscLeaveDateUi_(x.end),days:x.days,status:x.status
  }));
}

function pdmscLeaveHealthChecks_(){
  const rows=pdmscLeaveStoreRows_(),active=rows.filter(x=>x.status==='ACTIVE'),seen=new Set(),dups=[];
  active.forEach(x=>{const fp=x.sourceFingerprint||pdmscLeaveFingerprint_(x);if(seen.has(fp))dups.push(fp);seen.add(fp);});
  return [{name:'LEAVE_ACTIVE_DUPLICATE',ok:dups.length===0,note:dups.length?('ซ้ำ '+dups.length):''}];
}


// S01 V0.2 — canonical leave facts for downstream consumers.
// Statistics and Attendance Classification must consume these helpers rather than re-implement leave allocation.
function pdmscLeaveCoreWorkdayCount_(start,end){
  let n=0,d=new Date(start.getFullYear(),start.getMonth(),start.getDate()),guard=0;
  while(d<=end&&guard++<370){if(d.getDay()!==0&&d.getDay()!==6)n++;d.setDate(d.getDate()+1);}return n;
}
function pdmscLeaveCoreAllocation_(x){
  const workdays=pdmscLeaveCoreWorkdayCount_(x.start,x.end),same=pdmscLeaveDateKey_(x.start)===pdmscLeaveDateKey_(x.end),days=Number(x.days)||0;
  if(same&&Math.abs(days-0.5)<0.000001)return{code:'HALF_SINGLE',workdays,allocatable:true};
  if(Math.abs(days-workdays)<0.000001)return{code:'FULL_RANGE',workdays,allocatable:true};
  if(same&&days>0)return{code:'SINGLE_DAY',workdays,allocatable:true};
  return{code:'AMBIGUOUS',workdays,allocatable:false};
}
function pdmscLeaveCoreDateFacts_(x){
  const alloc=pdmscLeaveCoreAllocation_(x),rows=[],same=pdmscLeaveDateKey_(x.start)===pdmscLeaveDateKey_(x.end);
  if(same){rows.push({date:new Date(x.start.getFullYear(),x.start.getMonth(),x.start.getDate()),days:Number(x.days)||0,allocation:alloc.code});return{allocation:alloc,rows};}
  let d=new Date(x.start.getFullYear(),x.start.getMonth(),x.start.getDate()),guard=0;
  while(d<=x.end&&guard++<370){if(d.getDay()!==0&&d.getDay()!==6){rows.push({date:new Date(d),days:alloc.code==='FULL_RANGE'?1:null,allocation:alloc.code});}d.setDate(d.getDate()+1);}
  return{allocation:alloc,rows};
}
function pdmscLeaveCoreSourcePayloadByFingerprint_(){
  const map=new Map();
  pdmscRows_(PDMSC.BACKEND.RAW_LEAVE).forEach(r=>{
    const fp=pdmscNormalizeText_(r[3]);if(!fp)return;
    let payload={};try{payload=JSON.parse(String(r[2]||'{}'));}catch(e){}
    const at=r[4] instanceof Date?r[4].getTime():0,old=map.get(fp);
    if(!old||at>=old.at)map.set(fp,{at,payload});
  });return map;
}
function pdmscLeaveCoreSourceNote_(payload){
  const raw=(payload&&payload.raw)||[];
  const extra=raw.slice(7).map(pdmscNormalizeText_).filter(Boolean);
  return extra.join(' | ');
}
function pdmscLeaveCoreFactsForMonths_(monthKeys){
  const keys=[...new Set((monthKeys||[]).map(pdmscNormalizeMonthKey_).filter(Boolean))],out={};keys.forEach(k=>out[k]=[]);if(!keys.length)return out;
  const bounds={};keys.forEach(k=>{const y=Number(k.slice(0,4)),m=Number(k.slice(4,6));bounds[k]={start:new Date(y,m-1,1),end:new Date(y,m,0)};});
  const periodBounds=pdmscLeavePeriodBounds_(),firstPeriodMonth=periodBounds.period.months[0]||'';
  const sourceMap=pdmscLeaveCoreSourcePayloadByFingerprint_(),active=pdmscLeaveStoreRows_().filter(x=>x.status==='ACTIVE'&&pdmscLeavePeriodCountable_(x,periodBounds));
  active.forEach(x=>{
    const dateFacts=pdmscLeaveCoreDateFacts_(x),payload=(sourceMap.get(x.sourceFingerprint)||{}).payload||{},periodMeta=pdmscLeaveCoreCarryInMeta_(x,dateFacts,periodBounds);
    keys.forEach(k=>{
      const b=bounds[k];if(pdmscLeaveDay_(x.end)<pdmscLeaveDay_(b.start)||pdmscLeaveDay_(x.start)>pdmscLeaveDay_(b.end))return;
      const monthRows=dateFacts.rows.filter(r=>r.date>=b.start&&r.date<=b.end&&pdmscLeaveDay_(r.date)>=pdmscLeaveDay_(periodBounds.start)&&pdmscLeaveDay_(r.date)<=pdmscLeaveDay_(periodBounds.end)),dateRows=monthRows.map(r=>({date:new Date(r.date),dateKey:pdmscLeaveDateKey_(r.date),days:r.days===null?null:Number(r.days||0),allocation:r.allocation}));
      let monthDays=null;if(dateFacts.allocation.allocatable){monthDays=monthRows.reduce((sum,r)=>sum+Number(r.days||0),0);if(periodMeta.ownership==='CARRY_IN'&&k===firstPeriodMonth)monthDays+=Number(periodMeta.carryInExtraDays||0);}else if(x.start>=b.start&&x.end<=b.end)monthDays=Number(x.days)||0;
      const requestCount=(periodMeta.effectiveOccurrenceDateKey>=pdmscLeaveDateKey_(b.start)&&periodMeta.effectiveOccurrenceDateKey<=pdmscLeaveDateKey_(b.end))?1:0;
      out[k].push({leaveId:x.leaveId,empId:x.empId,leaveType:x.leaveType,start:x.start,end:x.end,days:Number(x.days)||0,monthDays,requestCount,allocation:dateFacts.allocation.code,allocationNeedsReview:monthDays===null,sourceFingerprint:x.sourceFingerprint,sourceNote:pdmscLeaveCoreSourceNote_(payload),sourceRaw:(payload.raw||[]),dateRows,periodOwnership:periodMeta.ownership,effectiveOccurrenceDateKey:periodMeta.effectiveOccurrenceDateKey,carryInExtraDays:(periodMeta.ownership==='CARRY_IN'&&k===firstPeriodMonth)?Number(periodMeta.carryInExtraDays||0):0});
    });
  });
  return out;
}
function pdmscLeaveCoreMonthFacts_(monthKey){const k=pdmscNormalizeMonthKey_(monthKey),b=pdmscLeaveCoreFactsForMonths_([k]);return b[k]||[];}
function pdmscLeaveCoreIsLeaveEventType_(eventType){return ['FULL_LEAVE','HALF_LEAVE_AM','HALF_LEAVE_PM','HALF_LEAVE_PM_LATE'].includes(pdmscNormalizeText_(eventType).toUpperCase());}
function pdmscLeaveCoreEventDecisionMapForMonths_(monthKeys,activeEvents){
  let events=activeEvents;
  if(!events){if(typeof pdmscA03ActiveRowsForMonths_!=='function')throw new Error('Final Event bulk reader ไม่พร้อมสำหรับ Leave Core');events=pdmscA03ActiveRowsForMonths_(monthKeys);}
  const map=new Map();
  (events||[]).forEach(e=>{const k=pdmscNormalizeText_(e.empId).toUpperCase()+'|'+pdmscLeaveCoreDateKeySafe_(e.eventDate),old=map.get(k);if(!k.endsWith('|')&&(!old||pdmscLeaveCoreIsLeaveEventType_(e.eventType)||e.eventType==='OFFICIAL_DUTY'))map.set(k,{decision:e.decision||PDMSC.DECISION.NORMAL,eventType:e.eventType||'',evidence:e.evidence||{}});});return map;
}
function pdmscLeaveCoreDateKeySafe_(v){if(v instanceof Date&&!isNaN(v.getTime()))return pdmscLeaveDateKey_(v);const d=pdmscLeaveDate_(v);return d?pdmscLeaveDateKey_(d):'';}
function pdmscLeaveCoreEffectiveFactsForMonths_(monthKeys,activeEvents){
  const keys=[...new Set((monthKeys||[]).map(pdmscNormalizeMonthKey_).filter(Boolean))],base=pdmscLeaveCoreFactsForMonths_(keys),dmap=pdmscLeaveCoreEventDecisionMapForMonths_(keys,activeEvents),out={};
  keys.forEach(k=>{out[k]=(base[k]||[]).map(x=>{
    const rows=(x.dateRows||[]).map(r=>{const hit=dmap.get(pdmscNormalizeText_(x.empId).toUpperCase()+'|'+r.dateKey);let stats=true,warning=true,decision=PDMSC.DECISION.NORMAL,eventType='';if(hit){decision=hit.decision||PDMSC.DECISION.NORMAL;eventType=hit.eventType||'';const finalSaysLeave=pdmscLeaveCoreIsLeaveEventType_(eventType);if(!finalSaysLeave){stats=false;warning=false;}else{const pol=pdmscDecisionPolicy(decision);stats=!!pol.countStatistics;warning=!!pol.allowWarning;}}return Object.assign({},r,{decision,eventType,countStatistics:stats,allowWarning:warning});});
    const anyStats=rows.some(r=>r.countStatistics),anyWarning=rows.some(r=>r.allowWarning),statsRequestCount=x.requestCount&&anyStats?1:0,warningRequestCount=x.requestCount&&anyWarning?1:0;
    let statsMonthDays=x.monthDays,warningMonthDays=x.monthDays,needsReview=!!x.allocationNeedsReview;
    if(!needsReview){
      const anchorKey=x.effectiveOccurrenceDateKey||pdmscLeaveDateKey_(x.start),anchor=rows.find(r=>r.dateKey===anchorKey),extra=Number(x.carryInExtraDays||0);
      statsMonthDays=rows.filter(r=>r.countStatistics).reduce((a,r)=>a+Number(r.days||0),0)+((anchor&&anchor.countStatistics)?extra:0);
      warningMonthDays=rows.filter(r=>r.allowWarning).reduce((a,r)=>a+Number(r.days||0),0)+((anchor&&anchor.allowWarning)?extra:0);
    }else if(rows.some(r=>!r.countStatistics||!r.allowWarning)){statsMonthDays=null;warningMonthDays=null;needsReview=true;}
    return Object.assign({},x,{dateRows:rows,statsRequestCount,statsMonthDays,warningRequestCount,warningMonthDays,effectiveAllocationNeedsReview:needsReview});
  });});return out;
}
function pdmscLeaveCoreEffectiveMonthFacts_(monthKey,activeEvents){const k=pdmscNormalizeMonthKey_(monthKey),x=pdmscLeaveCoreEffectiveFactsForMonths_([k],activeEvents);return x[k]||[];}

function pdmscLeaveCoreSelfTest_(){
  const a={start:new Date(2026,3,1),end:new Date(2026,3,1),days:0.5},b={start:new Date(2026,3,1),end:new Date(2026,3,3),days:3},c={start:new Date(2026,3,1),end:new Date(2026,3,3),days:1.5},pb={start:new Date(2026,3,1),end:new Date(2026,8,30),period:{months:['202604','202605','202606','202607','202608','202609']}};
  const carryIn={start:new Date(2026,2,31),end:new Date(2026,3,1),days:2},carryOut={start:new Date(2026,8,30),end:new Date(2026,9,1),days:2},insideEnd={start:new Date(2026,8,30),end:new Date(2026,8,30),days:1};
  const meta=pdmscLeaveCoreCarryInMeta_(carryIn,pdmscLeaveCoreDateFacts_(carryIn),pb);
  const tests=[
    {name:'half-day single allocation',ok:pdmscLeaveCoreAllocation_(a).code==='HALF_SINGLE'},
    {name:'full-range allocation',ok:pdmscLeaveCoreAllocation_(b).code==='FULL_RANGE'},
    {name:'ambiguous multi-day allocation stays explicit',ok:pdmscLeaveCoreAllocation_(c).code==='AMBIGUOUS'},
    {name:'carry-in request belongs to current period',ok:pdmscLeavePeriodOwnership_(carryIn,pb)==='CARRY_IN'&&meta.effectiveOccurrenceDateKey==='20260401'&&meta.carryInExtraDays===1},
    {name:'carry-out request is excluded in full',ok:pdmscLeavePeriodOwnership_(carryOut,pb)==='CARRY_OUT_EXCLUDED'&&!pdmscLeavePeriodCountable_(carryOut,pb)},
    {name:'period-end single-day leave remains countable',ok:pdmscLeavePeriodOwnership_(insideEnd,pb)==='IN_PERIOD'&&pdmscLeavePeriodCountable_(insideEnd,pb)}
  ];return{ok:tests.every(t=>t.ok),tests};
}


// S01 V0.2.5 — single Source of Truth for leave records eligible for future Warning.
// Warning/Document modules must consume these helpers instead of re-filtering all leave themselves.
// Checkbox meanings are deliberately orthogonal:
// - countOccurrence: contributes occurrence count
// - countDays: contributes leave-day count
// - includeWarningBase: eligibility gate for Warning/Document leave base
// - showSeparateStatistics: presentation only; MUST NOT alter Warning eligibility/counts
function pdmscLeaveCorePolicyFlags_(policy){
  policy=policy||{};
  return{
    countOccurrence:policy.countOccurrence!==false,
    countDays:policy.countDays!==false,
    includeWarningBase:policy.includeWarningBase===true,
    showSeparateStatistics:policy.showSeparateStatistics!==false
  };
}
function pdmscLeaveCoreWarningContribution_(policy,requestCount,monthDays,allocationNeedsReview){
  const f=pdmscLeaveCorePolicyFlags_(policy),eligible=f.includeWarningBase;
  return{
    eligible:eligible,
    requests:eligible&&f.countOccurrence?Number(requestCount||0):0,
    days:eligible&&f.countDays&&monthDays!==null&&monthDays!==undefined?Number(monthDays||0):0,
    needsReview:eligible&&!!allocationNeedsReview,
    showSeparateStatistics:f.showSeparateStatistics
  };
}
function pdmscLeaveCoreCountsTowardWarning_(leaveType){
  return pdmscLeaveCorePolicyFlags_(pdmscLeaveTypePolicyFor_(leaveType)).includeWarningBase;
}
function pdmscLeaveCoreWarningBaseFromEffectiveFacts_(facts){return (facts||[]).filter(x=>pdmscLeaveCoreCountsTowardWarning_(x.leaveType));}
function pdmscLeaveCoreWarningBaseSummaryFromEffectiveFacts_(facts,monthKey){
  const eligible=pdmscLeaveCoreWarningBaseFromEffectiveFacts_(facts),byType={};let requests=0,days=0,needsReview=0;
  eligible.forEach(x=>{const p=pdmscLeaveTypePolicyFor_(x.leaveType),c=pdmscLeaveCoreWarningContribution_(p,x.warningRequestCount,x.warningMonthDays,x.effectiveAllocationNeedsReview),k=pdmscMasterNormalize_(x.leaveType);requests+=c.requests;days+=c.days;if(c.needsReview)needsReview++;if(!byType[k])byType[k]={name:x.leaveType,requests:0,days:0};byType[k].requests+=c.requests;byType[k].days+=c.days;});
  return{monthKey:pdmscNormalizeMonthKey_(monthKey),requests,days,needsReview,byType,facts:eligible};
}
function pdmscLeaveCoreWarningBaseMonthFacts_(monthKey,activeEvents){return pdmscLeaveCoreWarningBaseFromEffectiveFacts_(pdmscLeaveCoreEffectiveMonthFacts_(monthKey,activeEvents));}
function pdmscLeaveCoreWarningBaseMonthSummary_(monthKey,activeEvents){return pdmscLeaveCoreWarningBaseSummaryFromEffectiveFacts_(pdmscLeaveCoreEffectiveMonthFacts_(monthKey,activeEvents),monthKey);}
