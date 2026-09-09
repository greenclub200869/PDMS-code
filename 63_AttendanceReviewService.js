const PDMSC_ATT_A022 = Object.freeze({
  VERSION:'A02.2-V0.1.0-REVIEW-CENTER',
  PAGE_SIZE_DEFAULT:50,
  PAGE_SIZE_MAX:200,
  CACHE_SECONDS:180
});

function pdmscA022EventIdentity_(x){return ['ATT',pdmscNormalizeText_(x.monthKey),pdmscNormalizeText_(x.empId).toUpperCase(),pdmscNormalizeText_(x.dateKey)].join('|');}
function pdmscA022ContextFingerprint_(raw,classified,leave){
  const leaveRows=((leave&&leave.records)||[]).map(x=>[x.leaveId,x.leaveType,x.days,x.allocation,pdmscA02DateKey_(x.start),pdmscA02DateKey_(x.end)].join('~')).sort();
  return pdmscAttendanceHash_([
    raw.fingerprint,raw.mainRaw,raw.secondaryRaw,raw.mainBg,raw.secondaryBg,raw.rowMode,
    classified.resultType,classified.reviewCode,classified.reason,classified.operationalAction,classified.operationalRuleId,classified.cutoff,classified.eventExemption,
    leaveRows.join('^')
  ].join('|'));
}
function pdmscA022DecisionLabel_(d){return({NORMAL:'ยืนยัน',EXCLUDED:'ยกเว้น',EXCLUDED_KEEP_STATS:'ยกเว้นแต่เก็บสถิติ',PENDING:'รอตรวจ'})[pdmscNormalizeText_(d).toUpperCase()]||d||'รอตรวจ';}
function pdmscA022StatusLabel_(s){return({PENDING:'รอตรวจ',DECIDED:'ตัดสินแล้ว',STALE:'ต้องยืนยันใหม่'})[s]||s;}
function pdmscA022DecisionRows_(){
  return pdmscRows_(PDMSC.BACKEND.DECISIONS).map((r,i)=>({
    row:i+2,decisionId:pdmscNormalizeText_(r[0]),eventIdentity:pdmscNormalizeText_(r[1]),empId:pdmscNormalizeText_(r[2]).toUpperCase(),eventDate:r[3] instanceof Date?r[3]:pdmscLeaveDate_(r[3]),eventType:pdmscNormalizeText_(r[4]),decision:pdmscNormalizeText_(r[5]).toUpperCase(),contextFingerprint:pdmscNormalizeText_(r[6]),note:pdmscNormalizeText_(r[7]),updatedAt:r[8] instanceof Date?r[8]:pdmscLeaveDate_(r[8]),updatedBy:pdmscNormalizeText_(r[9])
  })).filter(x=>x.eventIdentity&&x.decisionId);
}
function pdmscA022LatestDecisionIndex_(){
  const map=new Map();pdmscA022DecisionRows_().forEach(x=>{const prev=map.get(x.eventIdentity),a=x.updatedAt instanceof Date?x.updatedAt.getTime():0,b=prev&&prev.updatedAt instanceof Date?prev.updatedAt.getTime():0;if(!prev||a>=b)map.set(x.eventIdentity,x);});return map;
}
function pdmscA022BuildContext_(){
  const resolver=pdmscBuildBulkResolverContext_();return{people:new Map(resolver.people.map(p=>[pdmscNormalizeText_(p.empId).toUpperCase(),p])),rules:pdmscOperationalRules_(),settings:pdmscSettingsMap_(),leaveIndex:pdmscA02BuildLeaveIndex_()};
}
function pdmscA022ReviewCandidates_(monthKey,force){
  const key='review-candidates-'+monthKey;if(!force&&typeof pdmscWebCacheGet_==='function'){const c=pdmscWebCacheGet_(key);if(c)return c;}
  const raw=pdmscA02RawRows_(monthKey);if(!raw.length)throw new Error('ยังไม่มี Raw Snapshot เดือน '+monthKey);
  const ctx=pdmscA022BuildContext_(),rows=[];
  raw.forEach(r=>{const x=pdmscA02ClassifyOne_(r,ctx);if(!x.review)return;const leave=pdmscA02LeaveEvidence_(ctx.leaveIndex,r.empId,r.date);x.eventIdentity=pdmscA022EventIdentity_(x);x.contextFingerprint=pdmscA022ContextFingerprint_(r,x,leave);x.rawFingerprint=r.fingerprint||'';rows.push(x);});
  const out={monthKey,rows};if(typeof pdmscWebCachePut_==='function')pdmscWebCachePut_(key,out,PDMSC_ATT_A022.CACHE_SECONDS);return out;
}
function pdmscA022Dataset_(monthKey,force){
  const started=Date.now(),base=pdmscA022ReviewCandidates_(pdmscNormalizeMonthKey_(monthKey),!!force),idx=pdmscA022LatestDecisionIndex_(),rows=base.rows.map(x=>pdmscA022JoinDecision_(x,idx)),byCode={},byStatus={PENDING:0,DECIDED:0,STALE:0};
  rows.forEach(x=>{byCode[x.reviewCode]=(byCode[x.reviewCode]||0)+1;byStatus[x.decisionStatus]=(byStatus[x.decisionStatus]||0)+1;});
  return pdmscWebSafe_({ok:true,version:'A02.2-V0.2.0-FAST-REVIEW',monthKey:base.monthKey,label:pdmscWebMonthLabel_(base.monthKey),summary:{total:rows.length,pending:byStatus.PENDING,decided:byStatus.DECIDED,stale:byStatus.STALE,byCode},filters:{departments:[...new Set(rows.map(x=>x.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th')),reviewCodes:[...new Set(rows.map(x=>x.reviewCode).filter(Boolean))].sort()},rows,serverMs:Date.now()-started});
}
function pdmscA022CandidateByIdentity_(eventIdentity){
  const id=pdmscNormalizeText_(eventIdentity),p=id.split('|');if(p.length!==4||p[0]!=='ATT')throw new Error('Event Identity ไม่ถูกต้อง');
  const monthKey=p[1],empId=p[2],dateKey=p[3],raw=pdmscA02RawRows_(monthKey).find(r=>r.empId===empId&&pdmscA02DateKey_(r.date)===dateKey);if(!raw)throw new Error('ไม่พบ Raw Snapshot ของรายการนี้');
  const ctx=pdmscA022BuildContext_(),x=pdmscA02ClassifyOne_(raw,ctx);if(!x.review)throw new Error('รายการนี้ไม่อยู่ใน Review Queue ปัจจุบัน อาจมีการแก้ Source/กฎแล้ว');
  const leave=pdmscA02LeaveEvidence_(ctx.leaveIndex,raw.empId,raw.date);x.eventIdentity=pdmscA022EventIdentity_(x);x.contextFingerprint=pdmscA022ContextFingerprint_(raw,x,leave);x.rawFingerprint=raw.fingerprint||'';return x;
}
function pdmscA022JoinDecision_(x,index){
  const d=index.get(x.eventIdentity);let status='PENDING';if(d)status=d.contextFingerprint===x.contextFingerprint?'DECIDED':'STALE';
  return Object.assign({},x,{decisionStatus:status,decisionStatusLabel:pdmscA022StatusLabel_(status),decision:d?d.decision:'PENDING',decisionLabel:d?pdmscA022DecisionLabel_(d.decision):'รอตรวจ',decisionNote:d?d.note:'',decisionUpdatedAt:d&&d.updatedAt?pdmscWebSafeDate_(d.updatedAt):'',decisionUpdatedBy:d?d.updatedBy:''});
}
function pdmscA022List_(payload){
  payload=payload||{};const started=Date.now(),monthKey=pdmscNormalizeMonthKey_(payload.monthKey),base=pdmscA022ReviewCandidates_(monthKey,!!payload.force),idx=pdmscA022LatestDecisionIndex_();let all=base.rows.map(x=>pdmscA022JoinDecision_(x,idx));
  const f=payload.filters||{},q=pdmscNormalizeText_(f.search).toLowerCase(),dep=pdmscNormalizeText_(f.department),code=pdmscNormalizeText_(f.reviewCode).toUpperCase(),status=pdmscNormalizeText_(f.status).toUpperCase(),decision=pdmscNormalizeText_(f.decision).toUpperCase(),dateKey=pdmscNormalizeText_(f.dateKey).replace(/-/g,'');
  let rows=all.filter(x=>(!q||(x.empId+' '+x.name+' '+x.sourceName).toLowerCase().includes(q))&&(!dep||x.department===dep)&&(!code||x.reviewCode===code)&&(!status||x.decisionStatus===status)&&(!decision||x.decision===decision)&&(!dateKey||x.dateKey===dateKey));
  const sort=pdmscNormalizeText_(payload.sort||'DATE_NAME'),cmp=(a,b)=>String(a||'').localeCompare(String(b||''),'th');
  rows.sort((a,b)=>sort==='NAME_DATE'?cmp(a.name,b.name)||cmp(a.dateKey,b.dateKey):sort==='DEPARTMENT_NAME'?cmp(a.department,b.department)||cmp(a.name,b.name)||cmp(a.dateKey,b.dateKey):sort==='TYPE_DATE'?cmp(a.reviewCode,b.reviewCode)||cmp(a.dateKey,b.dateKey)||cmp(a.name,b.name):cmp(a.dateKey,b.dateKey)||cmp(a.name,b.name));
  const pageSize=Math.max(25,Math.min(PDMSC_ATT_A022.PAGE_SIZE_MAX,Number(payload.pageSize)||PDMSC_ATT_A022.PAGE_SIZE_DEFAULT)),pages=Math.max(1,Math.ceil(rows.length/pageSize)),page=Math.max(1,Math.min(pages,Number(payload.page)||1)),start=(page-1)*pageSize;
  const byCode={},byStatus={PENDING:0,DECIDED:0,STALE:0};all.forEach(x=>{byCode[x.reviewCode]=(byCode[x.reviewCode]||0)+1;byStatus[x.decisionStatus]=(byStatus[x.decisionStatus]||0)+1;});
  return pdmscWebSafe_({ok:true,version:PDMSC_ATT_A022.VERSION,monthKey,label:pdmscWebMonthLabel_(monthKey),summary:{total:all.length,pending:byStatus.PENDING,decided:byStatus.DECIDED,stale:byStatus.STALE,byCode},filters:{departments:[...new Set(all.map(x=>x.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th')),reviewCodes:[...new Set(all.map(x=>x.reviewCode).filter(Boolean))].sort()},page,pageSize,pages,total:rows.length,rows:rows.slice(start,start+pageSize),serverMs:Date.now()-started});
}
function pdmscA022Detail_(eventIdentity,force){
  const id=pdmscNormalizeText_(eventIdentity);if(!id)throw new Error('ไม่พบ Event Identity');let x=null;
  if(!force){const p=id.split('|'),cached=p.length===4?pdmscA022ReviewCandidates_(p[1],false):null;x=cached&&cached.rows?cached.rows.find(r=>r.eventIdentity===id):null;}
  if(!x)x=pdmscA022CandidateByIdentity_(id);
  const current=pdmscA022JoinDecision_(x,pdmscA022LatestDecisionIndex_()),history=pdmscA022DecisionRows_().filter(d=>d.eventIdentity===id).sort((a,b)=>(b.updatedAt?b.updatedAt.getTime():0)-(a.updatedAt?a.updatedAt.getTime():0)).map(d=>({decisionId:d.decisionId,decision:d.decision,decisionLabel:pdmscA022DecisionLabel_(d.decision),note:d.note,updatedAt:pdmscWebSafeDate_(d.updatedAt),updatedBy:d.updatedBy,contextMatch:d.contextFingerprint===x.contextFingerprint}));
  return pdmscWebSafe_({ok:true,item:current,history});
}
function pdmscA022SaveDecision_(payload){
  payload=payload||{};const id=pdmscNormalizeText_(payload.eventIdentity),expected=pdmscNormalizeText_(payload.contextFingerprint),decision=pdmscNormalizeText_(payload.decision).toUpperCase(),note=pdmscNormalizeText_(payload.note),allowed=[PDMSC.DECISION.NORMAL,PDMSC.DECISION.EXCLUDED,PDMSC.DECISION.EXCLUDED_KEEP_STATS];if(!allowed.includes(decision))throw new Error('Decision ไม่รองรับ');if((decision===PDMSC.DECISION.EXCLUDED||decision===PDMSC.DECISION.EXCLUDED_KEEP_STATS)&&!note)throw new Error('กรุณาระบุเหตุผลสำหรับการยกเว้น');
  const p=id.split('|');if(p.length!==4||p[0]!=='ATT')throw new Error('Event Identity ไม่ถูกต้อง');const x=pdmscA022CandidateByIdentity_(id);if(expected!==x.contextFingerprint)throw new Error('หลักฐาน/กฎของรายการนี้เปลี่ยนแล้ว กรุณาเปิดรายละเอียดใหม่ก่อนตัดสิน');
  const now=new Date(),actor=Session.getActiveUser().getEmail()||'',decisionId=Utilities.getUuid();pdmscAppendRow_(PDMSC.BACKEND.DECISIONS,[decisionId,id,x.empId,new Date(Number(x.dateKey.slice(0,4)),Number(x.dateKey.slice(4,6))-1,Number(x.dateKey.slice(6,8)),12,0,0),x.resultType,decision,x.contextFingerprint,note,now,actor]);
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['review-candidates-'+p[1],'a03-preview-'+p[1],'dashboard']);
  pdmscLog_('ATTENDANCE_REVIEW_DECISION','OK',{decisionId,eventIdentity:id,empId:x.empId,dateKey:x.dateKey,reviewCode:x.reviewCode,decision,note:note});
  return pdmscWebSafe_({ok:true,decisionId,eventIdentity:id,decision,decisionLabel:pdmscA022DecisionLabel_(decision),updatedAt:now,updatedBy:actor});
}
function pdmscAttendanceA022SelfTest_(){
  const a={monthKey:'202604',empId:'EMP1',dateKey:'20260402'},id1=pdmscA022EventIdentity_(a),id2=pdmscA022EventIdentity_(a),raw={fingerprint:'RAW1',mainRaw:'08:32',secondaryRaw:'16:18',mainBg:'#fff',secondaryBg:'#fff',rowMode:'TWO_ROWS'},x={resultType:'REVIEW_REQUIRED',reviewCode:'TEST',reason:'x',operationalAction:'PROCESS',operationalRuleId:'R1',cutoff:'08:31',eventExemption:'NONE'},fp1=pdmscA022ContextFingerprint_(raw,x,{records:[]}),fp2=pdmscA022ContextFingerprint_(Object.assign({},raw,{fingerprint:'RAW2'}),x,{records:[]});
  const tests=[{name:'stable event identity',ok:id1===id2&&id1==='ATT|202604|EMP1|20260402'},{name:'context fingerprint changes when raw changes',ok:fp1!==fp2},{name:'three manual decisions supported',ok:[PDMSC.DECISION.NORMAL,PDMSC.DECISION.EXCLUDED,PDMSC.DECISION.EXCLUDED_KEEP_STATS].every(d=>!!pdmscA022DecisionLabel_(d))},{name:'EXCLUDED_KEEP_STATS policy preserved',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}];return{ok:tests.every(t=>t.ok),tests};
}
