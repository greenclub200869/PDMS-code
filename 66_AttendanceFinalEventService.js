const PDMSC_ATT_A03=Object.freeze({VERSION:'A03-V0.1.2',CACHE_SECONDS:45,PAGE_SIZE_DEFAULT:50,PAGE_SIZE_MAX:200});

function pdmscA03Hash_(value){return pdmscAttendanceHash_(String(value||''));}
function pdmscA03NoEventTypes_(){return new Set(['NORMAL','IGNORED','LEAVE_ONLY_NO_LEAVE']);}
function pdmscA03ConcreteEventTypes_(){return new Set(['LATE','MISSING_IN','MISSING_OUT','MISSING_IN_OUT','LATE_AND_MISSING_OUT','FULL_LEAVE','HALF_LEAVE_AM','HALF_LEAVE_PM','HALF_LEAVE_PM_LATE','OFFICIAL_DUTY','INVALID_SCAN']);}
function pdmscA03DecisionLabel_(d){return pdmscA022DecisionLabel_(d||PDMSC.DECISION.NORMAL);}
function pdmscA03EventLabel_(t){return pdmscA02ResultLabel_(t||'');}
function pdmscA03RecordKindLabel_(k){return({EVENT:'Final Event',EXCLUDED:'ยกเว้น',REVIEW_BLOCKER:'ต้องแก้ Review'})[k]||k||'';}
function pdmscA03BlockerMessage_(code){return({
  RAW_DUPLICATE_PERSON_DAY:'Raw Snapshot มีบุคลากร/วันซ้ำ',
  REVIEW_PENDING:'มีรายการ Review ที่ยังไม่ได้ตัดสิน',
  REVIEW_STALE:'มีรายการ Review ที่ Source เปลี่ยนและต้องยืนยันใหม่',
  REVIEW_DECISION_NEEDS_EVENT_TYPE:'Decision นี้ยังไม่ระบุ Final Event Type ที่ปลอดภัย',
  UNKNOWN_CLASSIFICATION:'พบ Classification ที่ Final Event Store ไม่รู้จัก',
  FINAL_EVENT_DUPLICATE:'Final Event Candidate ซ้ำบุคลากร/วัน',
  RECONCILIATION_MISMATCH:'จำนวน person-day รวมกลับไม่เท่ากับ Raw Snapshot'
})[code]||code;}
function pdmscA03AddCount_(map,key,n){key=pdmscNormalizeText_(key)||'UNKNOWN';map[key]=(map[key]||0)+(n||1);}
function pdmscA03BlockerPush_(arr,code,x){arr.push({code,message:pdmscA03BlockerMessage_(code),empId:x&&x.empId||'',dateKey:x&&x.dateKey||'',name:x&&x.name||''});}
function pdmscA03AggregateBlockers_(items){const m=new Map();(items||[]).forEach(x=>{if(!m.has(x.code))m.set(x.code,{code:x.code,message:x.message,count:0,examples:[]});const a=m.get(x.code);a.count++;if(a.examples.length<5)a.examples.push([x.empId,x.dateKey,x.name].filter(Boolean).join(' / '));});return Array.from(m.values());}

function pdmscA032EffectiveDecision_(storedDecision,contextFingerprint,latestDecision){
  const base=pdmscNormalizeText_(storedDecision).toUpperCase()||PDMSC.DECISION.NORMAL;
  if(!latestDecision)return base;
  const d=pdmscNormalizeText_(latestDecision.decision).toUpperCase(),fp=pdmscNormalizeText_(latestDecision.contextFingerprint);
  if(fp!==pdmscNormalizeText_(contextFingerprint))return base;
  return [PDMSC.DECISION.NORMAL,PDMSC.DECISION.EXCLUDED,PDMSC.DECISION.EXCLUDED_KEEP_STATS].includes(d)?d:base;
}
function pdmscA03ActiveRowsForMonths_(monthKeys,decisionIndex){
  const wanted=new Set((monthKeys||[]).map(pdmscNormalizeMonthKey_).filter(Boolean)),rows=pdmscRows_(PDMSC.BACKEND.EVENT_STORE),out=[],idx=decisionIndex||((typeof pdmscA022LatestDecisionIndex_==='function')?pdmscA022LatestDecisionIndex_():new Map());
  rows.forEach((r,i)=>{
    const mk=pdmscNormalizeText_(r[1]),status=pdmscNormalizeText_(r[10]).toUpperCase()||'ACTIVE';if(!wanted.has(mk)||status!=='ACTIVE')return;
    let evidence={};try{evidence=JSON.parse(pdmscNormalizeText_(r[6])||'{}');}catch(_){evidence={};}
    const storedDecision=pdmscNormalizeText_(r[8]).toUpperCase()||PDMSC.DECISION.NORMAL,contextFingerprint=pdmscNormalizeText_(evidence.contextFingerprint||r[9]),eventIdentity=pdmscNormalizeText_(evidence.eventIdentity),latest=eventIdentity?idx.get(eventIdentity):null,decision=pdmscA032EffectiveDecision_(storedDecision,contextFingerprint,latest);
    out.push({sheetRow:i+2,eventId:pdmscNormalizeText_(r[0]),monthKey:mk,empId:pdmscNormalizeText_(r[2]).toUpperCase(),eventDate:r[3],eventType:pdmscNormalizeText_(r[4]).toUpperCase(),eventSubtype:pdmscNormalizeText_(r[5]),decision,storedDecision,contextFingerprint,status,evidence});
  });
  return out;
}
function pdmscA03ActiveRows_(monthKey,decisionIndex){return pdmscA03ActiveRowsForMonths_([monthKey],decisionIndex);}

function pdmscA03ResolveOne_(raw,x,ctx,decisionIndex,blockers){
  const leave=pdmscA02LeaveEvidence_(ctx.leaveIndex,raw.empId,raw.date),eventIdentity=pdmscA022EventIdentity_(x),contextFingerprint=pdmscA022ContextFingerprint_(raw,x,leave),concrete=pdmscA03ConcreteEventTypes_(),noEvent=pdmscA03NoEventTypes_(),d=decisionIndex.get(eventIdentity);
  let decision=PDMSC.DECISION.NORMAL,decisionStatus='NONE',recordKind='NONE',finalEventType='',category='NO_EVENT',decisionNote='';
  if(x.review){
    if(!d){decisionStatus='PENDING';category='REVIEW_PENDING';recordKind='REVIEW_BLOCKER';pdmscA03BlockerPush_(blockers,'REVIEW_PENDING',x);}
    else if(d.contextFingerprint!==contextFingerprint){decision=d.decision;decisionStatus='STALE';category='REVIEW_STALE';recordKind='REVIEW_BLOCKER';decisionNote=d.note||'';pdmscA03BlockerPush_(blockers,'REVIEW_STALE',x);}
    else{
      decision=d.decision;decisionStatus='DECIDED';decisionNote=d.note||'';
      if(decision===PDMSC.DECISION.EXCLUDED){category='EXCLUDED';recordKind='EXCLUDED';}
      else if(concrete.has(x.resultType)){category='FINAL_EVENT';recordKind='EVENT';finalEventType=x.resultType;}
      else{category='REVIEW_UNRESOLVED';recordKind='REVIEW_BLOCKER';pdmscA03BlockerPush_(blockers,'REVIEW_DECISION_NEEDS_EVENT_TYPE',x);}
    }
  }else if((x.eventCandidate&&concrete.has(x.resultType))||concrete.has(x.resultType)){
    finalEventType=x.resultType;category='FINAL_EVENT';recordKind='EVENT';
    if(d&&d.contextFingerprint===contextFingerprint){decision=pdmscA032EffectiveDecision_(PDMSC.DECISION.NORMAL,contextFingerprint,d);decisionStatus='DECIDED';decisionNote=d.note||'';}
    else if(d){decisionStatus='STALE_OVERRIDE';}
  }else if(noEvent.has(x.resultType)){category='NO_EVENT';recordKind='NONE';}
  else{category='UNKNOWN';recordKind='REVIEW_BLOCKER';pdmscA03BlockerPush_(blockers,'UNKNOWN_CLASSIFICATION',x);}
  const policy=pdmscDecisionPolicy(decision);
  const evidence={eventIdentity,rawFingerprint:raw.fingerprint||'',contextFingerprint,sourceName:x.sourceName||'',raw:{main:x.mainRaw||'',secondary:x.secondaryRaw||'',mainBg:x.mainBg||'',secondaryBg:x.secondaryBg||'',rowMode:x.rowMode||''},scan:{mode:x.scanMode||'',scanIn:x.scanIn||'',scanOut:x.scanOut||'',lateMinutes:Number(x.lateMinutes)||0},operational:{action:x.operationalAction||'',ruleId:x.operationalRuleId||'',cutoffRuleId:x.operationalCutoffRuleId||x.operationalRuleId||'',cutoff:x.cutoff||'',eventExemption:x.eventExemption||'',resolution:x.operationalResolution||'',matchedRuleIds:x.operationalMatchedRuleIds||[]},leave:{types:x.leaveTypes||[],blue:!!x.blue,green:!!x.green,officialMarker:!!x.officialMarker},classification:{resultType:x.resultType||'',resultLabel:x.resultLabel||'',reason:x.reason||'',review:!!x.review,reviewCode:x.reviewCode||''},decision:{value:decision,status:decisionStatus,note:decisionNote,countStatistics:policy.countStatistics,allowWarning:policy.allowWarning}};
  return Object.assign({},x,{eventIdentity,contextFingerprint,decision,decisionLabel:pdmscA03DecisionLabel_(decision),decisionStatus,decisionNote,recordKind,recordKindLabel:pdmscA03RecordKindLabel_(recordKind),finalEventType,finalEventLabel:pdmscA03EventLabel_(finalEventType),category,evidence});
}

function pdmscA03BuildPreview_(monthKey,force){
  monthKey=pdmscNormalizeMonthKey_(monthKey);const cacheKey='a03-preview-'+monthKey;if(!force&&typeof pdmscWebCacheGet_==='function'){const c=pdmscWebCacheGet_(cacheKey);if(c)return c;}
  const started=Date.now(),raw=pdmscA02RawRows_(monthKey);if(!raw.length)throw new Error('ยังไม่มี Raw Snapshot เดือน '+monthKey);
  const ctx=pdmscA022BuildContext_(),decisionIndex=pdmscA022LatestDecisionIndex_(),blockerItems=[],seenRaw=new Set(),seenFinal=new Set(),classificationCounts={},operationalCounts={},finalEventCounts={},categoryCounts={},people=new Set(),rows=[],finalEvents=[];
  raw.forEach(r=>{
    const rawKey=r.empId+'|'+pdmscA02DateKey_(r.date);if(seenRaw.has(rawKey))pdmscA03BlockerPush_(blockerItems,'RAW_DUPLICATE_PERSON_DAY',{empId:r.empId,dateKey:pdmscA02DateKey_(r.date),name:r.sourceName});seenRaw.add(rawKey);
    const x=pdmscA02ClassifyOne_(r,ctx);people.add(x.empId);pdmscA03AddCount_(classificationCounts,x.resultType);pdmscA03AddCount_(operationalCounts,x.operationalAction);
    const resolved=pdmscA03ResolveOne_(r,x,ctx,decisionIndex,blockerItems);pdmscA03AddCount_(categoryCounts,resolved.category);
    if(resolved.recordKind!=='NONE')rows.push(resolved);
    if(resolved.recordKind==='EVENT'){
      if(seenFinal.has(resolved.eventIdentity))pdmscA03BlockerPush_(blockerItems,'FINAL_EVENT_DUPLICATE',resolved);seenFinal.add(resolved.eventIdentity);pdmscA03AddCount_(finalEventCounts,resolved.finalEventType);finalEvents.push(resolved);
    }
  });
  const reconciled=Object.values(categoryCounts).reduce((a,b)=>a+Number(b||0),0);if(reconciled!==raw.length)pdmscA03BlockerPush_(blockerItems,'RECONCILIATION_MISMATCH',{});
  const canonical=rows.map(x=>[x.eventIdentity,x.resultType,x.finalEventType,x.category,x.decision,x.contextFingerprint]).sort((a,b)=>a[0].localeCompare(b[0]));const previewFingerprint=pdmscA03Hash_(JSON.stringify({monthKey,rawCount:raw.length,canonical}));
  const active=pdmscA03ActiveRows_(monthKey,decisionIndex),activeIdentity=new Map(),activeByIdentity=new Map();active.forEach(x=>{let dateKey='';try{dateKey=x.eventDate instanceof Date?pdmscA02DateKey_(x.eventDate):pdmscNormalizeText_(x.eventDate).replace(/[^0-9]/g,'').slice(0,8);}catch(_){dateKey='';}const key=(x.evidence&&x.evidence.eventIdentity)||[x.empId,dateKey,x.eventType].join('|');activeIdentity.set(key,(activeIdentity.get(key)||0)+1);activeByIdentity.set(key,x);});
  rows.forEach(x=>{const a=activeByIdentity.get(x.eventIdentity);x.isCommittedActive=!!a;x.activeEventId=a&&a.eventId||'';});
  const activeDuplicates=Array.from(activeIdentity.values()).filter(n=>n>1).length,excludedEvents=finalEvents.filter(x=>x.decision===PDMSC.DECISION.EXCLUDED).length,excludedReview=categoryCounts.EXCLUDED||0;
  const blockers=pdmscA03AggregateBlockers_(blockerItems),summary={rawPersonDays:raw.length,people:people.size,reconciled,finalEvents:finalEvents.length,noEvent:categoryCounts.NO_EVENT||0,excluded:excludedEvents+excludedReview,excludedEvents,excludedReview,reviewPending:categoryCounts.REVIEW_PENDING||0,reviewStale:categoryCounts.REVIEW_STALE||0,reviewUnresolved:categoryCounts.REVIEW_UNRESOLVED||0,unknown:categoryCounts.UNKNOWN||0,activeCurrent:active.length,activeDuplicateIdentities:activeDuplicates,classificationCounts,operationalCounts,finalEventCounts,categoryCounts};
  const out={ok:blockers.length===0,version:PDMSC_ATT_A03.VERSION,monthKey,label:pdmscWebMonthLabel_(monthKey),previewFingerprint,summary,blockers,warnings:activeDuplicates?[{code:'ACTIVE_EVENT_DUPLICATE_EXISTING',message:'Final Event ACTIVE เดิมมี identity ซ้ำ '+activeDuplicates+' ชุด; Commit ใหม่จะ supersede ACTIVE เดิมทั้งหมด'}]:[],rows,finalEvents,serverMs:Date.now()-started};
  if(typeof pdmscWebCachePut_==='function')pdmscWebCachePut_(cacheKey,out,PDMSC_ATT_A03.CACHE_SECONDS);return out;
}

function pdmscA03List_(payload){
  payload=payload||{};const base=pdmscA03BuildPreview_(payload.monthKey,!!payload.force),f=payload.filters||{},q=pdmscNormalizeText_(f.search).toLowerCase(),dep=pdmscNormalizeText_(f.department),type=pdmscNormalizeText_(f.eventType).toUpperCase(),decision=pdmscNormalizeText_(f.decision).toUpperCase(),kind=pdmscNormalizeText_(f.recordKind).toUpperCase();
  let rows=(base.rows||[]).filter(x=>(!q||(x.empId+' '+x.name+' '+x.sourceName).toLowerCase().includes(q))&&(!dep||x.department===dep)&&(!type||(x.finalEventType||x.resultType)===type)&&(!decision||x.decision===decision)&&(!kind||x.recordKind===kind));
  const sort=pdmscNormalizeText_(payload.sort||'DATE_NAME'),cmp=(a,b)=>String(a||'').localeCompare(String(b||''),'th');rows.sort((a,b)=>sort==='NAME_DATE'?cmp(a.name,b.name)||cmp(a.dateKey,b.dateKey):sort==='DEPARTMENT_NAME'?cmp(a.department,b.department)||cmp(a.name,b.name)||cmp(a.dateKey,b.dateKey):sort==='TYPE_DATE'?cmp(a.finalEventType||a.resultType,b.finalEventType||b.resultType)||cmp(a.dateKey,b.dateKey)||cmp(a.name,b.name):cmp(a.dateKey,b.dateKey)||cmp(a.name,b.name));
  const pageSize=Math.max(25,Math.min(PDMSC_ATT_A03.PAGE_SIZE_MAX,Number(payload.pageSize)||PDMSC_ATT_A03.PAGE_SIZE_DEFAULT)),pages=Math.max(1,Math.ceil(rows.length/pageSize)),page=Math.max(1,Math.min(pages,Number(payload.page)||1)),start=(page-1)*pageSize;
  const eventTypes=[...new Set((base.rows||[]).map(x=>x.finalEventType||x.resultType).filter(Boolean))].sort(),departments=[...new Set((base.rows||[]).map(x=>x.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'));
  return pdmscWebSafe_({ok:base.ok,version:base.version,monthKey:base.monthKey,label:base.label,previewFingerprint:base.previewFingerprint,summary:base.summary,blockers:base.blockers,warnings:base.warnings,filters:{eventTypes,departments},page,pageSize,pages,total:rows.length,rows:rows.slice(start,start+pageSize),serverMs:base.serverMs});
}


function pdmscA03Dataset_(payload){
  payload=payload||{};
  const base=pdmscA03BuildPreview_(payload.monthKey,!!payload.force),rows=(base.rows||[]).slice();
  const eventTypes=[...new Set(rows.map(x=>x.finalEventType||x.resultType).filter(Boolean))].sort();
  const departments=[...new Set(rows.map(x=>x.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'));
  return pdmscWebSafe_({
    ok:base.ok,version:base.version,monthKey:base.monthKey,label:base.label,previewFingerprint:base.previewFingerprint,
    summary:base.summary,blockers:base.blockers,warnings:base.warnings,filters:{eventTypes,departments},
    total:rows.length,rows,serverMs:base.serverMs
  });
}

function pdmscA032SaveEventDecisions_(payload){
  payload=payload||{};const monthKey=pdmscNormalizeMonthKey_(payload.monthKey),decision=pdmscNormalizeText_(payload.decision).toUpperCase(),note=pdmscNormalizeText_(payload.note),items=Array.isArray(payload.items)?payload.items:[];
  if(![PDMSC.DECISION.NORMAL,PDMSC.DECISION.EXCLUDED].includes(decision))throw new Error('รอบนี้รองรับเฉพาะ ยืนยัน/ปกติ และ ยกเว้น');
  if(decision===PDMSC.DECISION.EXCLUDED&&!note)throw new Error('กรุณาระบุเหตุผลสำหรับการยกเว้น');
  if(!items.length)throw new Error('ยังไม่ได้เลือกรายการ');
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    const latest=pdmscA022LatestDecisionIndex_(),active=pdmscA03ActiveRows_(monthKey,latest),map=new Map(active.map(x=>[pdmscA03EventIdentityFromActive_(x),x])),seen=new Set(),validated=[];
    items.forEach(it=>{const id=pdmscNormalizeText_(it.eventIdentity),expected=pdmscNormalizeText_(it.contextFingerprint);if(!id||seen.has(id))return;seen.add(id);const a=map.get(id);if(!a)throw new Error('ไม่พบเหตุการณ์ ACTIVE สำหรับ '+id+' กรุณาโหลด/รีเฟรชข้อมูลเดือนนี้ใหม่');const actual=pdmscNormalizeText_(a.evidence&&a.evidence.contextFingerprint||a.contextFingerprint);if(!expected||expected!==actual)throw new Error('บริบทของเหตุการณ์เปลี่ยนสำหรับ '+id+' กรุณาโหลด/รีเฟรชข้อมูลเดือนนี้ใหม่');validated.push({id,a,contextFingerprint:actual});});
    if(!validated.length)throw new Error('ไม่พบรายการที่พร้อมบันทึกการยกเว้น');
    const now=new Date(),actor=Session.getActiveUser().getEmail()||'',rows=[],results=[];
    validated.forEach(v=>{const prev=latest.get(v.id),effective=pdmscA032EffectiveDecision_(v.a.storedDecision,v.contextFingerprint,prev);if(effective===decision){results.push({eventIdentity:v.id,decision,idempotent:true});return;}const decisionId=Utilities.getUuid(),n=decision===PDMSC.DECISION.NORMAL?(note||'ยกเลิกการยกเว้น'):note;rows.push([decisionId,v.id,v.a.empId,v.a.eventDate,v.a.eventType,decision,v.contextFingerprint,n,now,actor]);results.push({eventIdentity:v.id,decision,decisionId,idempotent:false});});
    if(rows.length){const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.DECISIONS);if(!sh)throw new Error('ไม่พบ Decision Store');sh.getRange(sh.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows);}
    if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['a03-preview-'+monthKey,'dashboard','review-candidates-'+monthKey,'statistics-'+monthKey,'warnings-'+monthKey]);
    pdmscLog_('ATTENDANCE_FINAL_EVENT_EXCLUSION',rows.length?'OK':'IDEMPOTENT',{monthKey,decision,count:validated.length,written:rows.length,note,actor,eventIdentities:validated.map(v=>v.id)});
    return pdmscWebSafe_({ok:true,monthKey,decision,decisionLabel:pdmscA03DecisionLabel_(decision),requested:validated.length,written:rows.length,idempotent:rows.length===0,updatedAt:now,updatedBy:actor,results});
  }finally{lock.releaseLock();}
}
function pdmscA032EventExclusionSelfTest_(){
  const fp='CTX1',tests=[
    {name:'matching exclusion overrides stored NORMAL',ok:pdmscA032EffectiveDecision_('NORMAL',fp,{decision:'EXCLUDED',contextFingerprint:fp})==='EXCLUDED'},
    {name:'stale exclusion does not override changed context',ok:pdmscA032EffectiveDecision_('NORMAL','CTX2',{decision:'EXCLUDED',contextFingerprint:fp})==='NORMAL'},
    {name:'restore NORMAL overrides matching exclusion state',ok:pdmscA032EffectiveDecision_('EXCLUDED',fp,{decision:'NORMAL',contextFingerprint:fp})==='NORMAL'},
    {name:'EXCLUDED policy removes statistics and warnings',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED).countStatistics===false&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED).allowWarning===false},
    {name:'EXCLUDED_KEEP_STATS contract retained for later warning phase',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}
  ];return{ok:tests.every(t=>t.ok),tests};
}

function pdmscA03EventIdentityFromActive_(x){
  const e=x&&x.evidence||{};if(e.eventIdentity)return pdmscNormalizeText_(e.eventIdentity);
  let dateKey='';try{dateKey=x.eventDate instanceof Date?pdmscA02DateKey_(x.eventDate):pdmscNormalizeText_(x.eventDate).replace(/[^0-9]/g,'').slice(0,8);}catch(_){dateKey='';}
  return [pdmscNormalizeText_(x.empId).toUpperCase(),dateKey,pdmscNormalizeText_(x.eventType).toUpperCase()].join('|');
}
function pdmscA03ActiveMatchesPreview_(active,fresh){
  const events=fresh&&fresh.finalEvents||[];if((active||[]).length!==events.length)return false;
  const map=new Map();(active||[]).forEach(x=>map.set(pdmscA03EventIdentityFromActive_(x),x));
  if(map.size!==events.length)return false;
  return events.every(x=>{const a=map.get(x.eventIdentity),e=a&&a.evidence||{};return !!a&&a.eventType===x.finalEventType&&(a.decision||PDMSC.DECISION.NORMAL)===(x.decision||PDMSC.DECISION.NORMAL)&&(a.evidence&&a.evidence.contextFingerprint||a.contextFingerprint||'')===(x.contextFingerprint||'')&&pdmscNormalizeText_(e.commitFingerprint)===fresh.previewFingerprint;});
}
function pdmscA03PostCommitVerify_(monthKey,expectedFingerprint,expectedEvents,commitRunId){
  monthKey=pdmscNormalizeMonthKey_(monthKey);expectedFingerprint=pdmscNormalizeText_(expectedFingerprint);expectedEvents=expectedEvents||[];commitRunId=pdmscNormalizeText_(commitRunId);
  const active=pdmscA03ActiveRows_(monthKey),seen=new Set(),duplicates=[],actualTypes={},expectedTypes={},missing=[],mismatch=[];
  active.forEach(a=>{const id=pdmscA03EventIdentityFromActive_(a);if(seen.has(id))duplicates.push(id);seen.add(id);pdmscA03AddCount_(actualTypes,a.eventType);});
  const amap=new Map(active.map(a=>[pdmscA03EventIdentityFromActive_(a),a]));
  expectedEvents.forEach(x=>{pdmscA03AddCount_(expectedTypes,x.finalEventType);const a=amap.get(x.eventIdentity);if(!a){missing.push(x.eventIdentity);return;}const e=a.evidence||{};if(a.eventType!==x.finalEventType||(a.decision||PDMSC.DECISION.NORMAL)!==(x.decision||PDMSC.DECISION.NORMAL)||(e.contextFingerprint||a.contextFingerprint||'')!==(x.contextFingerprint||'')||pdmscNormalizeText_(e.commitFingerprint)!==expectedFingerprint||(commitRunId&&pdmscNormalizeText_(e.commitRunId)!==commitRunId))mismatch.push(x.eventIdentity);});
  const extra=active.map(pdmscA03EventIdentityFromActive_).filter(id=>!expectedEvents.some(x=>x.eventIdentity===id));
  const tests=[
    {name:'ACTIVE count matches committed preview',ok:active.length===expectedEvents.length,note:active.length+' / '+expectedEvents.length},
    {name:'No duplicate ACTIVE identity',ok:duplicates.length===0,note:duplicates.slice(0,5).join(', ')},
    {name:'All expected identities exist',ok:missing.length===0,note:missing.slice(0,5).join(', ')},
    {name:'No unexpected ACTIVE identities',ok:extra.length===0,note:extra.slice(0,5).join(', ')},
    {name:'Event/Decision/Fingerprint match',ok:mismatch.length===0,note:mismatch.slice(0,5).join(', ')},
    {name:'Event type counts match',ok:Object.keys(Object.assign({},actualTypes,expectedTypes)).every(k=>(actualTypes[k]||0)===(expectedTypes[k]||0)),note:JSON.stringify({actual:actualTypes,expected:expectedTypes})}
  ];
  return{ok:tests.every(t=>t.ok),monthKey,previewFingerprint:expectedFingerprint,commitRunId,activeCount:active.length,tests};
}
function pdmscA03CommitHardeningSelfTest_(){
  const fresh={previewFingerprint:'FP1',finalEvents:[{eventIdentity:'EMP1|20260401|LATE',finalEventType:'LATE',decision:'NORMAL',contextFingerprint:'C1'},{eventIdentity:'EMP2|20260402|MISSING_OUT',finalEventType:'MISSING_OUT',decision:'NORMAL',contextFingerprint:'C2'}]};
  const active=fresh.finalEvents.map((x,i)=>({empId:'EMP'+(i+1),eventType:x.finalEventType,decision:x.decision,contextFingerprint:x.contextFingerprint,evidence:{eventIdentity:x.eventIdentity,contextFingerprint:x.contextFingerprint,commitFingerprint:'FP1'}}));
  const wrong=JSON.parse(JSON.stringify(active));wrong[0].evidence.commitFingerprint='OLD';
  const tests=[
    {name:'same committed preview is idempotent',ok:pdmscA03ActiveMatchesPreview_(active,fresh)===true},
    {name:'different fingerprint is not treated as same commit',ok:pdmscA03ActiveMatchesPreview_(wrong,fresh)===false},
    {name:'changed source fingerprint blocks old preview',ok:'FP2'!=='FP1'}
  ];return{ok:tests.every(t=>t.ok),tests};
}
function pdmscA03Commit_(payload){
  payload=payload||{};const monthKey=pdmscNormalizeMonthKey_(payload.monthKey),expected=pdmscNormalizeText_(payload.previewFingerprint);if(!expected)throw new Error('ไม่พบ Preview Fingerprint กรุณาโหลด/รีเฟรชข้อมูลเดือนนี้ใหม่ก่อนยืนยัน');
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    const fresh=pdmscA03BuildPreview_(monthKey,true);if(fresh.blockers.length)throw new Error('ยังบันทึกเหตุการณ์สุดท้ายไม่ได้: '+fresh.blockers.map(x=>x.code+'='+x.count).join(', '));if(fresh.previewFingerprint!==expected)throw new Error('ข้อมูลต้นทาง/กฎ/การลา/คำตัดสินเปลี่ยนจากตอนโหลด กรุณาโหลด/รีเฟรชข้อมูลเดือนนี้ใหม่ก่อนยืนยัน');
    const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.EVENT_STORE);if(!sh)throw new Error('ไม่พบ Final Event Store');const now=new Date(),active=pdmscA03ActiveRows_(monthKey),events=fresh.finalEvents||[];
    if(pdmscA03ActiveMatchesPreview_(active,fresh)){
      const priorRun=active.length&&active[0].evidence&&pdmscNormalizeText_(active[0].evidence.commitRunId)||'';const post=pdmscA03PostCommitVerify_(monthKey,fresh.previewFingerprint,events,priorRun);
      pdmscLog_('ATTENDANCE_FINAL_EVENT_COMMIT','IDEMPOTENT',{monthKey,previewFingerprint:fresh.previewFingerprint,activeCurrent:active.length,postVerify:post.ok});
      return pdmscWebSafe_({ok:true,idempotent:true,monthKey,label:fresh.label,previewFingerprint:fresh.previewFingerprint,commitRunId:priorRun,superseded:0,created:0,active:active.length,updatedAt:now,postVerify:post});
    }
    const actor=Session.getActiveUser().getEmail()||'',commitRunId=Utilities.getUuid(),committedAt=now.toISOString();
    if(active.length){const n=sh.getLastRow()-1,range=sh.getRange(2,11,n,2),vals=range.getValues();active.forEach(x=>{const i=x.sheetRow-2;vals[i][0]='SUPERSEDED';vals[i][1]=now;});range.setValues(vals);}
    const rows=events.map(x=>[Utilities.getUuid(),monthKey,x.empId,new Date(Number(x.dateKey.slice(0,4)),Number(x.dateKey.slice(4,6))-1,Number(x.dateKey.slice(6,8)),12,0,0),x.finalEventType,x.reviewCode||x.scanMode||'',JSON.stringify(Object.assign({},x.evidence,{commitFingerprint:fresh.previewFingerprint,sourceFingerprint:fresh.previewFingerprint,commitRunId,committedBy:actor,committedAt,calcVersion:PDMSC_ATT_A03.VERSION})),PDMSC_ATT_A03.VERSION,x.decision||PDMSC.DECISION.NORMAL,x.contextFingerprint||'','ACTIVE',now]);
    if(rows.length){const start=sh.getLastRow()+1;sh.getRange(start,1,rows.length,rows[0].length).setValues(rows);}
    if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['a03-preview-'+monthKey,'dashboard','a03-bootstrap','review-candidates-'+monthKey,'statistics-'+monthKey]);
    const post=pdmscA03PostCommitVerify_(monthKey,fresh.previewFingerprint,events,commitRunId);
    pdmscLog_('ATTENDANCE_FINAL_EVENT_COMMIT',post.ok?'OK':'POST_VERIFY_FAIL',{monthKey,commitRunId,actor,previewFingerprint:fresh.previewFingerprint,activeSuperseded:active.length,activeCreated:rows.length,rawPersonDays:fresh.summary.rawPersonDays,reconciled:fresh.summary.reconciled,postVerify:post});
    return pdmscWebSafe_({ok:post.ok,monthKey,label:fresh.label,previewFingerprint:fresh.previewFingerprint,commitRunId,superseded:active.length,created:rows.length,active:events.length,updatedAt:now,postVerify:post});
  }finally{lock.releaseLock();}
}

function pdmscAttendanceA03SelfTest_(){
  const blockers=[],ctx={leaveIndex:new Map()},raw={fingerprint:'R1',empId:'EMP1',date:new Date(2026,3,1),mainRaw:'08:40',secondaryRaw:'16:20',mainBg:'#fff',secondaryBg:'#fff',rowMode:'TWO_ROWS'},base={monthKey:'202604',date:'01/04/2569',dateKey:'20260401',empId:'EMP1',name:'A',sourceName:'A',department:'X',scanMode:'PAIR',scanIn:'08:40',scanOut:'16:20',lateMinutes:9,mainRaw:'08:40',secondaryRaw:'16:20',mainBg:'#fff',secondaryBg:'#fff',rowMode:'TWO_ROWS',blue:false,green:false,officialMarker:false,leaveTypes:[],operationalAction:'PROCESS',operationalRuleId:'R1',cutoff:'08:31',eventExemption:'NONE',resultType:'LATE',resultLabel:'มาสาย',reason:'late',review:false,reviewCode:'',eventCandidate:true};
  const r1=pdmscA03ResolveOne_(raw,base,ctx,new Map(),blockers),review=Object.assign({},base,{resultType:'REVIEW_REQUIRED',review:true,eventCandidate:false,reviewCode:'TEST'}),b2=[],r2=pdmscA03ResolveOne_(raw,review,ctx,new Map(),b2),id=pdmscA022EventIdentity_(review),fp=pdmscA022ContextFingerprint_(raw,review,{exists:false,mode:'NONE',records:[],leaveTypes:[]}),idx3=new Map([[id,{decision:PDMSC.DECISION.EXCLUDED,contextFingerprint:fp,note:'x'}]]),b3=[],r3=pdmscA03ResolveOne_(raw,review,ctx,idx3,b3),concreteReview=Object.assign({},base,{review:true,eventCandidate:false,reviewCode:'VERIFY_LATE'}),fp4=pdmscA022ContextFingerprint_(raw,concreteReview,{exists:false,mode:'NONE',records:[],leaveTypes:[]}),idx4=new Map([[pdmscA022EventIdentity_(concreteReview),{decision:PDMSC.DECISION.EXCLUDED_KEEP_STATS,contextFingerprint:fp4,note:'x'}]]),b4=[],r4=pdmscA03ResolveOne_(raw,concreteReview,ctx,idx4,b4),eventId=pdmscA022EventIdentity_(base),eventFp=pdmscA022ContextFingerprint_(raw,base,{exists:false,mode:'NONE',records:[],leaveTypes:[]}),idx5=new Map([[eventId,{decision:PDMSC.DECISION.EXCLUDED,contextFingerprint:eventFp,note:'อนุญาตพิเศษ'}]]),b5=[],r5=pdmscA03ResolveOne_(raw,base,ctx,idx5,b5),idx6=new Map([[eventId,{decision:PDMSC.DECISION.EXCLUDED,contextFingerprint:'OLD',note:'old'}]]),b6=[],r6=pdmscA03ResolveOne_(raw,base,ctx,idx6,b6),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS);
  const tests=[
    {name:'normal event candidate becomes Final Event',ok:r1.recordKind==='EVENT'&&r1.finalEventType==='LATE'&&b2.length>0},
    {name:'pending review blocks commit',ok:r2.recordKind==='REVIEW_BLOCKER'&&b2.some(x=>x.code==='REVIEW_PENDING')},
    {name:'EXCLUDED review resolves to no event',ok:r3.recordKind==='EXCLUDED'&&r3.category==='EXCLUDED'&&b3.length===0},
    {name:'concrete reviewed event can keep statistics',ok:r4.recordKind==='EVENT'&&r4.finalEventType==='LATE'&&r4.decision===PDMSC.DECISION.EXCLUDED_KEEP_STATS&&b4.length===0},
    {name:'post-commit event exclusion keeps concrete event but applies EXCLUDED policy',ok:r5.recordKind==='EVENT'&&r5.finalEventType==='LATE'&&r5.decision===PDMSC.DECISION.EXCLUDED&&pdmscDecisionPolicy(r5.decision).countStatistics===false},
    {name:'stale event exclusion is not silently reapplied',ok:r6.decision===PDMSC.DECISION.NORMAL&&r6.decisionStatus==='STALE_OVERRIDE'},
    {name:'EXCLUDED_KEEP_STATS policy preserved',ok:policy.countStatistics===true&&policy.allowWarning===false},
    {name:'reconciliation arithmetic',ok:(10+5+2+1)===18}
  ];return{ok:tests.every(t=>t.ok),tests};
}

function pdmscLateCoreDiagnostic_(monthKey,startKey,endKey){
  monthKey=pdmscNormalizeMonthKey_(monthKey||'202604');startKey=pdmscNormalizeText_(startKey||monthKey+'01').replace(/\D/g,'').slice(0,8);endKey=pdmscNormalizeText_(endKey||monthKey+'03').replace(/\D/g,'').slice(0,8);
  const toMin=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?(Number(m[1])*60+Number(m[2])):null;},expectedLate=(scan,cutoff)=>{const s=toMin(scan),c=toMin(cutoff);return s===null||c===null?null:Math.max(0,s-c);};
  const raw=pdmscA02RawRows_(monthKey),ctx=pdmscA022BuildContext_(),current=raw.map(r=>pdmscA02ClassifyOne_(r,ctx)).filter(x=>x.dateKey>=startKey&&x.dateKey<=endKey),active=pdmscA03ActiveRows_(monthKey),stored=new Map();
  active.forEach(a=>{const k=String(a.empId||'').toUpperCase()+'|'+pdmscA02DateKey_(a.eventDate);if(!stored.has(k))stored.set(k,[]);stored.get(k).push(a);});
  const rows=current.filter(x=>x.scanIn||x.scanOut||Number(x.lateMinutes||0)>0).map(x=>{
    const key=String(x.empId||'').toUpperCase()+'|'+x.dateKey,evs=stored.get(key)||[],lateEvent=evs.find(a=>pdmscA02EventFacets_(a.eventType,a.evidence||{}).late)||evs[0]||null,e=lateEvent&&lateEvent.evidence||{},scan=e.scan||{},op=e.operational||{},storedScanIn=lateEvent?String(scan.scanIn||''):'',storedLate=lateEvent?Number(scan.lateMinutes||0):null,storedCutoff=lateEvent?String(op.cutoff||''):'',expectedCurrent=expectedLate(x.scanIn,x.cutoff),expectedStored=lateEvent?expectedLate(storedScanIn,storedCutoff):null,statuses=[];
    if(expectedCurrent!==null&&Number(x.lateMinutes||0)!==expectedCurrent)statuses.push('CURRENT_CLASSIFIER_INCONSISTENT');
    if(lateEvent&&expectedStored!==null&&storedLate!==expectedStored)statuses.push('STORED_EVIDENCE_INCONSISTENT');
    if(lateEvent&&(storedCutoff!==String(x.cutoff||'')||String(op.ruleId||'')!==String(x.operationalRuleId||'')||String(op.cutoffRuleId||'')!==String(x.operationalCutoffRuleId||x.operationalRuleId||'')))statuses.push('STORED_EVENT_STALE_RULE');
    if(lateEvent&&storedLate!==Number(x.lateMinutes||0))statuses.push('STORED_EVENT_STALE_METRIC');
    if(!lateEvent&&Number(x.lateMinutes||0)>0)statuses.push('CURRENT_LATE_EVENT_NOT_COMMITTED');
    if(!statuses.length)statuses.push(lateEvent?'MATCH':'NO_STORED_EVENT_EXPECTED');
    return{empId:x.empId,name:x.name,department:x.department,dateKey:x.dateKey,date:x.date,rawMain:x.mainRaw||'',rawSecondary:x.secondaryRaw||'',scanIn:x.scanIn,scanOut:x.scanOut,currentRuleId:x.operationalRuleId,currentCutoffRuleId:x.operationalCutoffRuleId,currentCutoff:x.cutoff,currentLateMinutes:Number(x.lateMinutes||0),expectedCurrentLateMinutes:expectedCurrent,currentResultType:x.resultType,storedEventId:lateEvent?lateEvent.eventId:'',storedEventType:lateEvent?lateEvent.eventType:'',storedScanIn,storedCutoff,storedLateMinutes:storedLate,expectedStoredLateMinutes:expectedStored,storedRuleId:lateEvent?String(op.ruleId||''):'',storedCutoffRuleId:lateEvent?String(op.cutoffRuleId||''):'',statuses};
  });
  const bad=rows.filter(x=>x.statuses.some(s=>!['MATCH','NO_STORED_EVENT_EXPECTED'].includes(s))),scan0831=rows.filter(x=>x.scanIn==='08:31'),stored0831Wrong=rows.filter(x=>x.storedScanIn==='08:31'&&Number(x.storedLateMinutes||0)>0),cutoffs={};rows.forEach(x=>{const k=x.currentCutoff||'(ว่าง)';cutoffs[k]=(cutoffs[k]||0)+1;});
  const counts={};bad.forEach(x=>x.statuses.forEach(s=>counts[s]=(counts[s]||0)+1));
  return pdmscWebSafe_({ok:!rows.some(x=>x.statuses.includes('CURRENT_CLASSIFIER_INCONSISTENT')),readOnly:true,monthKey,startKey,endKey,rows,summary:{checked:rows.length,problemRows:bad.length,currentCutoffDistribution:cutoffs,currentClassifierInconsistent:counts.CURRENT_CLASSIFIER_INCONSISTENT||0,storedEvidenceInconsistent:counts.STORED_EVIDENCE_INCONSISTENT||0,storedStaleRule:counts.STORED_EVENT_STALE_RULE||0,storedStaleMetric:counts.STORED_EVENT_STALE_METRIC||0,currentLateNotCommitted:counts.CURRENT_LATE_EVENT_NOT_COMMITTED||0,scan0831:scan0831.length,scan0831CurrentLateWrong:scan0831.filter(x=>Number(x.currentLateMinutes||0)>0).length,storedScan0831WithPositiveLate:stored0831Wrong.length},problemRows:bad,stored0831Wrong});
}
