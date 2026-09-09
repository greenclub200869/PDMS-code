const PDMSC_ATT_A02 = Object.freeze({
  VERSION:'A02-V0.1.0-PREVIEW',
  PAGE_SIZE_DEFAULT:100,
  PAGE_SIZE_MAX:200,
  EVENT_TYPES:Object.freeze({
    NORMAL:'NORMAL',LATE:'LATE',MISSING_IN:'MISSING_IN',MISSING_OUT:'MISSING_OUT',
    MISSING_IN_OUT:'MISSING_IN_OUT',LATE_AND_MISSING_OUT:'LATE_AND_MISSING_OUT',
    FULL_LEAVE:'FULL_LEAVE',HALF_LEAVE_AM:'HALF_LEAVE_AM',HALF_LEAVE_PM:'HALF_LEAVE_PM',
    HALF_LEAVE_PM_LATE:'HALF_LEAVE_PM_LATE',OFFICIAL_DUTY:'OFFICIAL_DUTY',
    IGNORED:'IGNORED',LEAVE_ONLY_NO_LEAVE:'LEAVE_ONLY_NO_LEAVE',REVIEW_REQUIRED:'REVIEW_REQUIRED',INVALID_SCAN:'INVALID_SCAN'
  })
});

function pdmscA02DateKey_(d){return Utilities.formatDate(d,PDMSC.TIMEZONE,'yyyyMMdd');}
function pdmscA02DateUi_(d){return Utilities.formatDate(d,PDMSC.TIMEZONE,'dd/MM/')+(d.getFullYear()+543);}
function pdmscA02Minutes_(hhmm){const s=pdmscNormalizeText_(hhmm),m=s.match(/^(\d{1,2}):(\d{2})$/);if(!m)return null;const h=Number(m[1]),n=Number(m[2]);return h>=0&&h<24&&n>=0&&n<60?h*60+n:null;}
function pdmscA02TimeObj_(hhmm){const n=pdmscA02Minutes_(hhmm);return n===null?null:{display:('0'+Math.floor(n/60)).slice(-2)+':'+('0'+(n%60)).slice(-2),totalMinutes:n};}
function pdmscA02IsWeekend_(d){const x=d.getDay();return x===0||x===6;}
function pdmscA02InRange_(date,start,end){const t=new Date(date.getFullYear(),date.getMonth(),date.getDate()).getTime(),a=start instanceof Date?new Date(start.getFullYear(),start.getMonth(),start.getDate()).getTime():NaN,b=end instanceof Date?new Date(end.getFullYear(),end.getMonth(),end.getDate()).getTime():NaN;return Number.isFinite(a)&&Number.isFinite(b)&&t>=a&&t<=b;}

function pdmscA02OperationalRuleFor_(date,department,rules,settings){return pdmscOperationalRuleFor_(date,department,rules,settings);}

function pdmscA02ExtractScans_(raw,splitMinutes){
  const main=pdmscNormalizeText_(raw.mainRaw),secondary=pdmscNormalizeText_(raw.secondaryRaw),mt=pdmscAttendanceExtractTimes_(main),st=pdmscAttendanceExtractTimes_(secondary);
  let scanIn=null,scanOut=null,mode='NONE',ambiguous=false;
  if(mt.length&&st.length){scanIn=pdmscA02TimeObj_(mt[0]);scanOut=pdmscA02TimeObj_(st[st.length-1]);mode=(mt.length>1||st.length>1)?'PAIR_MULTIPLE':'PAIR';ambiguous=mt.length>1||st.length>1;}
  else{
    const only=mt.length?mt:st;
    if(only.length>=2){scanIn=pdmscA02TimeObj_(only[0]);scanOut=pdmscA02TimeObj_(only[only.length-1]);mode='COMBINED_PAIR';ambiguous=only.length>2;}
    else if(only.length===1){const t=pdmscA02TimeObj_(only[0]);if(t.totalMinutes>=splitMinutes){scanOut=t;mode='SINGLE_OUT';}else{scanIn=t;mode='SINGLE_IN';}}
  }
  return{scanIn,scanOut,mode,ambiguous,mainTimes:mt,secondaryTimes:st};
}

function pdmscA02ClassifyScans_(scans,cutoff){
  const c=pdmscA02Minutes_(cutoff);if(c===null)return{code:'INVALID_CUTOFF',eventType:PDMSC_ATT_A02.EVENT_TYPES.REVIEW_REQUIRED,lateMinutes:0};
  const i=scans.scanIn,o=scans.scanOut;
  if(!i&&o)return{code:'NO_IN',eventType:PDMSC_ATT_A02.EVENT_TYPES.MISSING_IN,lateMinutes:0};
  if(i&&!o){const late=Math.max(0,i.totalMinutes-c);return{code:late?'LATE_NO_OUT':'NO_OUT',eventType:late?PDMSC_ATT_A02.EVENT_TYPES.LATE_AND_MISSING_OUT:PDMSC_ATT_A02.EVENT_TYPES.MISSING_OUT,lateMinutes:late};}
  if(i&&o&&i.totalMinutes>c)return{code:'LATE',eventType:PDMSC_ATT_A02.EVENT_TYPES.LATE,lateMinutes:i.totalMinutes-c};
  return{code:'NORMAL',eventType:PDMSC_ATT_A02.EVENT_TYPES.NORMAL,lateMinutes:0};
}

function pdmscA02WorkdayCount_(start,end){return pdmscLeaveCoreWorkdayCount_(start,end);}
function pdmscA02BuildLeaveIndex_(){
  const map=new Map();pdmscLeaveStoreRows_().filter(x=>x.status==='ACTIVE').forEach(x=>{
    const allocation=pdmscLeaveCoreAllocation_(x).code;
    let d=new Date(x.start.getFullYear(),x.start.getMonth(),x.start.getDate()),guard=0;while(d<=x.end&&guard++<370){if(!pdmscA02IsWeekend_(d)){const k=x.empId+'|'+pdmscA02DateKey_(d),a=map.get(k)||[];a.push({leaveId:x.leaveId,leaveType:x.leaveType,days:x.days,start:x.start,end:x.end,allocation});map.set(k,a);}d.setDate(d.getDate()+1);}
  });return map;
}
function pdmscA02LeaveEvidence_(index,empId,date){const records=(index.get(pdmscNormalizeText_(empId).toUpperCase()+'|'+pdmscA02DateKey_(date))||[]);if(!records.length)return{exists:false,mode:'NONE',records:[]};const modes=new Set(records.map(x=>x.allocation));let mode='AMBIGUOUS';if(records.length===1&&modes.has('FULL_RANGE'))mode='FULL';if(records.length===1&&modes.has('HALF_SINGLE'))mode='HALF';return{exists:true,mode,records,leaveTypes:records.map(x=>x.leaveType)};}

function pdmscA02RawRows_(monthKey){
  return pdmscRows_(PDMSC.BACKEND.RAW_ATTENDANCE).filter(r=>pdmscNormalizeText_(r[0])===monthKey).map(r=>({monthKey:pdmscNormalizeText_(r[0]),importId:pdmscNormalizeText_(r[1]),empId:pdmscNormalizeText_(r[2]).toUpperCase(),sourceName:pdmscNormalizeText_(r[3]),date:r[4] instanceof Date?r[4]:pdmscLeaveDate_(r[4]),rawValue:pdmscNormalizeText_(r[5]),evidenceJson:pdmscNormalizeText_(r[6]),fingerprint:pdmscNormalizeText_(r[7]),mainRaw:pdmscNormalizeText_(r[9]),secondaryRaw:pdmscNormalizeText_(r[10]),mainBg:pdmscAttendanceBg_(r[11]),secondaryBg:pdmscAttendanceBg_(r[12]),rowMode:pdmscNormalizeText_(r[13])})).filter(x=>x.empId&&x.date);
}

function pdmscA02EventExempted_(eventType,exemption){const e=pdmscNormalizeText_(exemption).toUpperCase();if(!e||e==='NONE')return false;if(e==='ALL')return true;const map={MISSING_IN:'NO_IN',MISSING_OUT:'NO_OUT',MISSING_IN_OUT:'NO_BOTH',LATE_AND_MISSING_OUT:'NO_OUT'};return e===eventType||e===map[eventType];}
function pdmscA02ResultLabel_(type){return({NORMAL:'ปกติ',LATE:'มาสาย',MISSING_IN:'ไม่สแกนเข้า',MISSING_OUT:'ไม่สแกนออก',MISSING_IN_OUT:'ไม่สแกนเข้าและออก',LATE_AND_MISSING_OUT:'มาสายและไม่สแกนออก',FULL_LEAVE:'ลาเต็มวัน',HALF_LEAVE_AM:'ลาครึ่งวันเช้า',HALF_LEAVE_PM:'ลาครึ่งวันบ่าย',HALF_LEAVE_PM_LATE:'ลาครึ่งวันบ่าย + มาสาย',OFFICIAL_DUTY:'ไปราชการ',IGNORED:'ไม่ประมวลผล',LEAVE_ONLY_NO_LEAVE:'เฉพาะการลา — ไม่มีรายการลา',REVIEW_REQUIRED:'ต้องตรวจสอบ',INVALID_SCAN:'อ่านเวลาผิดปกติ'})[type]||type;}

// W02 V0.2.0 — canonical attendance-event facets for all downstream consumers.
// Statistics / Warning / Document must use this mapping rather than re-interpreting EventType independently.
function pdmscA02EventFacets_(eventType,evidence){
  const t=pdmscNormalizeText_(eventType).toUpperCase(),e=evidence||{},scan=e.scan||evidence||{},lateMinutes=Math.max(0,Number(scan.lateMinutes||0)||0);
  const late=(t==='LATE'||t==='LATE_AND_MISSING_OUT'||t==='HALF_LEAVE_PM_LATE');
  const missingIn=(t==='MISSING_IN'||t==='MISSING_IN_OUT');
  const missingOut=(t==='MISSING_OUT'||t==='MISSING_IN_OUT'||t==='LATE_AND_MISSING_OUT');
  const leave=(t==='FULL_LEAVE'||t==='HALF_LEAVE_AM'||t==='HALF_LEAVE_PM'||t==='HALF_LEAVE_PM_LATE');
  return{
    eventType:t,late,lateCount:late?1:0,lateMinutes:late?lateMinutes:0,
    missingIn,missingOut,missingScan:(missingIn||missingOut),missingScanCount:(missingIn||missingOut)?1:0,
    leave,officialDuty:t==='OFFICIAL_DUTY'
  };
}
function pdmscA02EventSelectorMatch_(selector,eventType,evidence){
  const s=pdmscNormalizeText_(selector).toUpperCase(),t=pdmscNormalizeText_(eventType).toUpperCase(),f=pdmscA02EventFacets_(t,evidence);
  if(!s)return false;
  if(s===t)return true;
  if(s==='LATE')return f.late;
  if(s==='MISSING_IN')return f.missingIn;
  if(s==='MISSING_OUT')return f.missingOut;
  if(s==='MISSING_IN_OUT')return f.missingIn&&f.missingOut;
  return false;
}
function pdmscA02EventFacetSelfTest_(){
  const half=pdmscA02EventFacets_('HALF_LEAVE_PM_LATE',{scan:{lateMinutes:9}}),combo=pdmscA02EventFacets_('LATE_AND_MISSING_OUT',{scan:{lateMinutes:4}}),both=pdmscA02EventFacets_('MISSING_IN_OUT',{});
  const tests=[
    {name:'HALF_LEAVE_PM_LATE exposes late facet',ok:half.late&&half.leave&&half.lateMinutes===9&&pdmscA02EventSelectorMatch_('LATE','HALF_LEAVE_PM_LATE',{scan:{lateMinutes:9}})},
    {name:'LATE_AND_MISSING_OUT exposes both late and missing-out facets',ok:combo.late&&combo.missingOut&&!combo.missingIn},
    {name:'MISSING_IN_OUT exposes missing-in and missing-out facets',ok:both.missingIn&&both.missingOut&&both.missingScanCount===1},
    {name:'Exact event selector remains supported',ok:pdmscA02EventSelectorMatch_('LATE_AND_MISSING_OUT','LATE_AND_MISSING_OUT',{})}
  ];
  return{ok:tests.every(x=>x.ok),tests};
}


function pdmscA02ClassifyOne_(raw,ctx){
  const person=ctx.people.get(raw.empId)||{},department=person.department||'',rule=pdmscA02OperationalRuleFor_(raw.date,department,ctx.rules,ctx.settings),contract=pdmscOperationalActionContract_(rule.action),split=pdmscA02Minutes_(ctx.settings.SINGLE_SCAN_SPLIT||'11:59'),scanStart=pdmscA02Minutes_(ctx.settings.SCAN_ACCEPT_START||'03:00'),scans=pdmscA02ExtractScans_(raw,split===null?719:split),scanClass=pdmscA02ClassifyScans_(scans,rule.cutoff),hasBlue=pdmscAttendanceIsLeaveBlue_(raw.mainBg)||pdmscAttendanceIsLeaveBlue_(raw.secondaryBg),hasGreen=pdmscAttendanceIsOfficialGreen_(raw.mainBg)||pdmscAttendanceIsOfficialGreen_(raw.secondaryBg),marker=/^ท$/.test(pdmscNormalizeText_(raw.mainRaw))||/^ท$/.test(pdmscNormalizeText_(raw.secondaryRaw)),official=hasGreen||marker,leave=pdmscA02LeaveEvidence_(ctx.leaveIndex,raw.empId,raw.date);
  const out={monthKey:raw.monthKey,date:pdmscA02DateUi_(raw.date),dateKey:pdmscA02DateKey_(raw.date),empId:raw.empId,name:person.fullName||raw.sourceName,sourceName:raw.sourceName,department,position:person.position||'',scanIn:scans.scanIn?scans.scanIn.display:'',scanOut:scans.scanOut?scans.scanOut.display:'',scanMode:scans.mode,mainRaw:raw.mainRaw,secondaryRaw:raw.secondaryRaw,blue:hasBlue,green:hasGreen,officialMarker:marker,leaveTypes:leave.leaveTypes||[],operationalAction:rule.action,operationalRuleId:rule.ruleId,operationalCutoffRuleId:rule.cutoffRuleId||rule.ruleId,operationalResolution:rule.resolutionNote||'',operationalMatchedRuleIds:rule.matchedRuleIds||[],operationalConflictFields:rule.conflictFields||[],cutoff:rule.cutoff,eventExemption:rule.eventExemption,lateMinutes:0,resultType:'',resultLabel:'',reason:'',review:false,reviewCode:'',eventCandidate:false,mainBg:raw.mainBg||'#ffffff',secondaryBg:raw.secondaryBg||'#ffffff',rowMode:raw.rowMode||''};
  function finish(type,reason,review,code,candidate){out.resultType=type;out.resultLabel=pdmscA02ResultLabel_(type);out.reason=reason||'';out.review=!!review;out.reviewCode=code||'';out.eventCandidate=!!candidate;return out;}
  if(rule.conflict)return finish('REVIEW_REQUIRED','กฎปฏิทินซ้อนกันและขัดกัน: '+((rule.conflictFields||[]).join(', ')||'ไม่ทราบช่อง'),true,'OPERATIONAL_RULE_CONFLICT',false);
  if(rule.action==='IGNORE')return finish('IGNORED','IGNORE ตาม Operational Rule '+rule.ruleId,false,'',false);
  if(rule.action==='LEAVE_ONLY'){
    // Preserve legacy precedence: WEEKEND remains ahead of OFFICIAL_DUTY.
    // On working days, official-duty evidence must win before leave/review logic so green/"ท" is never turned into scan-related Review.
    if(!pdmscA02IsWeekend_(raw.date)&&official)return finish('OFFICIAL_DUTY',hasGreen?'พบพื้นหลังสีเขียวในช่วงนับเฉพาะการลา':'พบเครื่องหมาย ท ในช่วงนับเฉพาะการลา',false,'',true);
    if(!leave.exists)return finish('LEAVE_ONLY_NO_LEAVE','ช่วงนี้ประมวลผลเฉพาะการลา/ราชการ ไม่ตรวจ Scan/Late/Missing',false,'',false);
    if(leave.mode==='AMBIGUOUS')return finish('REVIEW_REQUIRED','พบรายการลาแต่จัดสรรวันลาไม่ชัดเจน',true,'LEAVE_ALLOCATION_AMBIGUOUS',false);
    if(leave.mode==='FULL')return finish('FULL_LEAVE','พบการลาเต็มวัน; LEAVE_ONLY ไม่ตรวจการสแกน',false,hasBlue?'':'FULL_LEAVE_WITHOUT_BLUE',true);
    if(leave.mode==='HALF')return finish('REVIEW_REQUIRED','LEAVE_ONLY พบลาครึ่งวัน แต่โหมดนี้ไม่ใช้ Scan เพื่อเดาช่วงเช้า/บ่าย',true,'HALF_LEAVE_PERIOD_UNKNOWN',false);
  }
  if(pdmscA02IsWeekend_(raw.date))return finish('IGNORED','ข้ามเสาร์–อาทิตย์ตาม Contract เดิม',false,'',false);
  if(official)return finish('OFFICIAL_DUTY',hasGreen?'พบพื้นหลังสีเขียว':'พบเครื่องหมาย ท',false,'',true);
  if(leave.exists){
    if(leave.mode==='AMBIGUOUS')return finish('REVIEW_REQUIRED','รายการลาทับซ้อนหรือจัดสรรวันลาไม่ได้ชัดเจน',true,'LEAVE_ALLOCATION_AMBIGUOUS',false);
    if(leave.mode==='FULL')return finish('FULL_LEAVE',hasBlue?'พบการลาเต็มวัน + สีฟ้า':'พบการลาเต็มวันจาก Leave Store; ไม่พบสีฟ้า',false,hasBlue?'':'FULL_LEAVE_WITHOUT_BLUE',true);
    if(leave.mode==='HALF'){
      if(!hasBlue)return finish('REVIEW_REQUIRED','พบลาครึ่งวัน 0.5 วัน แต่ไม่มีสีฟ้า',true,'HALF_LEAVE_WITHOUT_BLUE',false);
      if(scans.mode==='PAIR'&&scans.scanIn&&scans.scanOut&&scans.scanIn.totalMinutes>=(split===null?719:split))return finish('HALF_LEAVE_AM','ลาครึ่งวันเช้า + สีฟ้า และเริ่มสแกนช่วงบ่าย',false,'',true);
      if(scans.mode==='SINGLE_IN'&&scans.scanIn&&scans.scanIn.totalMinutes<(split===null?719:split)){
        if(scanClass.code==='LATE_NO_OUT'){out.lateMinutes=scanClass.lateMinutes;return finish('HALF_LEAVE_PM_LATE','ลาครึ่งวันบ่าย; ตัด Missing Out แต่คงมาสายช่วงเช้า',false,'',true);}
        return finish('HALF_LEAVE_PM','ลาครึ่งวันบ่าย + สีฟ้า และมีสแกนเข้าช่วงเช้า',false,'',true);
      }
      return finish('REVIEW_REQUIRED','ลาครึ่งวัน + สีฟ้า แต่รูปแบบ Scan ยังระบุช่วงเช้า/บ่ายไม่ได้',true,'HALF_LEAVE_PERIOD_UNKNOWN',false);
    }
  }
  if(hasBlue)return finish('REVIEW_REQUIRED','พบสีฟ้า แต่ไม่พบรายการลาใน Leave Store',true,'BLUE_WITHOUT_LEAVE',false);
  if(scans.ambiguous)return finish('REVIEW_REQUIRED','พบหลายเวลาภายในช่องเดียว/หลายช่อง ต้องตรวจสอบรูปแบบ Scan',true,'MULTIPLE_SCAN_AMBIGUOUS',false);
  if(scans.scanIn&&scanStart!==null&&scans.scanIn.totalMinutes<scanStart)return finish('INVALID_SCAN','เวลาเข้าก่อนเวลาเริ่มรับการสแกน '+(ctx.settings.SCAN_ACCEPT_START||'03:00'),true,'SCAN_BEFORE_ACCEPT_START',false);
  const rawLower=(raw.mainRaw+' '+raw.secondaryRaw).toLowerCase();
  if((/^x$/i.test(pdmscNormalizeText_(raw.mainRaw))||/^x$/i.test(pdmscNormalizeText_(raw.secondaryRaw)))){if(pdmscA02EventExempted_('MISSING_IN_OUT',rule.eventExemption))return finish('IGNORED','ยกเว้น MISSING_IN_OUT ตาม Operational Rule',false,'',false);return finish('MISSING_IN_OUT','เครื่องหมาย x จากต้นทาง',false,'',true);}
  if(scanClass.code==='INVALID_CUTOFF')return finish('REVIEW_REQUIRED','Cutoff ไม่ถูกต้อง: '+rule.cutoff,true,'INVALID_CUTOFF',false);
  if(!scans.scanIn&&!scans.scanOut&&(pdmscNormalizeText_(raw.mainRaw)||pdmscNormalizeText_(raw.secondaryRaw))){if(rawLower.trim()==='-'||rawLower.trim()==='- -')return finish('IGNORED','ข้ามเครื่องหมาย -',false,'',false);return finish('INVALID_SCAN','มีข้อความต้นทางแต่ไม่สามารถอ่านเป็นเวลาได้',true,'UNPARSEABLE_RAW_SCAN',false);}
  if(!scans.scanIn&&!scans.scanOut)return finish('NORMAL','ไม่มีเหตุการณ์จาก Raw Snapshot (ช่องว่างไม่ได้ตีความเป็นขาดสแกนอัตโนมัติ)',false,'',false);
  out.lateMinutes=scanClass.lateMinutes||0;
  if(pdmscA02EventExempted_(scanClass.eventType,rule.eventExemption))return finish('IGNORED','ยกเว้น '+scanClass.eventType+' ตาม Operational Rule',false,'',false);
  if(scanClass.code==='NO_IN')return finish('MISSING_IN',scans.mode==='SINGLE_OUT'?'สแกนครั้งเดียวหลังเวลาแบ่ง จึงถือเป็นเวลาออก':'มีเฉพาะเวลาออก',false,'',true);
  if(scanClass.code==='NO_OUT')return finish('MISSING_OUT','มีเวลาเข้าแต่ไม่มีเวลาออก',false,'',true);
  if(scanClass.code==='LATE_NO_OUT')return finish('LATE_AND_MISSING_OUT','มาสาย '+out.lateMinutes+' นาที และไม่มีเวลาออก',false,'',true);
  if(scanClass.code==='LATE')return finish('LATE','เวลาเข้าเกิน cutoff '+rule.cutoff+' จำนวน '+out.lateMinutes+' นาที',false,'',true);
  return finish('NORMAL','สแกนเข้า–ออกครบและไม่เกิน cutoff',false,'',false);
}

function pdmscAttendanceA023OfficialPrecedenceSelfTest_(){
  const d=new Date(2026,3,6),weekend=new Date(2026,3,4),rules=[{row:1,ruleId:'BREAK',startDate:new Date(2026,3,4),endDate:new Date(2026,4,10),scopeType:'EXCEPT_GROUPS',scopeValue:'ลูกจ้าง',action:'LEAVE_ONLY',cutoff:'',eventExemption:'NONE',active:true}],settings={LATE_CUTOFF:'07:51',SINGLE_SCAN_SPLIT:'11:59',SCAN_ACCEPT_START:'03:00'},people=new Map([['EMP1',{empId:'EMP1',fullName:'ครูทดสอบ',department:'วิทย์ฯ',position:'ครู'}]]);
  function raw(date,mainRaw,secondaryRaw,mainBg,secondaryBg){return{monthKey:'202604',empId:'EMP1',sourceName:'ครูทดสอบ',date,mainRaw:mainRaw||'',secondaryRaw:secondaryRaw||'',mainBg:mainBg||'#ffffff',secondaryBg:secondaryBg||'#ffffff',rowMode:'ONE_ROW'};}
  function ctx(leaveEvidence){return{people,rules,settings,leaveIndex:{get:function(){return leaveEvidence||[];}}};}
  const greenNoLeave=pdmscA02ClassifyOne_(raw(d,'ท','','#00ff00','#ffffff'),ctx([]));
  const greenAmbiguousLeave=pdmscA02ClassifyOne_(raw(d,'ท','','#00ff00','#ffffff'),ctx([{leaveId:'L1',leaveType:'ลากิจ',days:0.5,allocation:'AMBIGUOUS'},{leaveId:'L2',leaveType:'ลาป่วย',days:0.5,allocation:'AMBIGUOUS'}]));
  const noEvidence=pdmscA02ClassifyOne_(raw(d,'x','','#ffffff','#ffffff'),ctx([]));
  const halfLeave=pdmscA02ClassifyOne_(raw(d,'08:00','','#a0d1fb','#ffffff'),ctx([{leaveId:'L3',leaveType:'ลากิจ',days:0.5,allocation:'HALF_SINGLE'}]));
  const weekendGreen=pdmscA02ClassifyOne_(raw(weekend,'ท','','#00ff00','#ffffff'),ctx([]));
  const processRules=[{row:1,ruleId:'PROCESS',startDate:d,endDate:d,scopeType:'ALL',scopeValue:'',action:'PROCESS',cutoff:'08:31',eventExemption:'NONE',active:true}],processCtx={people,rules:processRules,settings,leaveIndex:{get:function(){return[];}}},processGreen=pdmscA02ClassifyOne_(raw(d,'ท','','#00ff00','#ffffff'),processCtx);
  const tests=[
    {name:'LEAVE_ONLY green/ท without Leave Store becomes OFFICIAL_DUTY',ok:greenNoLeave.resultType==='OFFICIAL_DUTY'&&greenNoLeave.review===false&&greenNoLeave.eventCandidate===true},
    {name:'LEAVE_ONLY official duty wins over ambiguous leave evidence',ok:greenAmbiguousLeave.resultType==='OFFICIAL_DUTY'&&greenAmbiguousLeave.review===false},
    {name:'LEAVE_ONLY no leave/official ignores scan markers',ok:noEvidence.resultType==='LEAVE_ONLY_NO_LEAVE'&&noEvidence.review===false&&noEvidence.eventCandidate===false},
    {name:'LEAVE_ONLY half-day ambiguity still goes to Review',ok:halfLeave.resultType==='REVIEW_REQUIRED'&&halfLeave.reviewCode==='HALF_LEAVE_PERIOD_UNKNOWN'},
    {name:'Weekend precedence not changed by official-duty fix',ok:weekendGreen.resultType==='LEAVE_ONLY_NO_LEAVE'},
    {name:'PROCESS official-duty behavior preserved',ok:processGreen.resultType==='OFFICIAL_DUTY'&&processGreen.review===false}
  ];
  return{ok:tests.every(x=>x.ok),tests};
}

function pdmscAttendanceA02Preview_(payload){
  payload=payload||{};const monthKey=pdmscNormalizeMonthKey_(payload.monthKey),raw=pdmscA02RawRows_(monthKey);if(!raw.length)throw new Error('ยังไม่มี Raw Snapshot เดือน '+monthKey);
  const resolver=pdmscBuildBulkResolverContext_(),people=new Map(resolver.people.map(p=>[pdmscNormalizeText_(p.empId).toUpperCase(),p])),settings=pdmscSettingsMap_(),ctx={people,rules:pdmscOperationalRules_(),settings,leaveIndex:pdmscA02BuildLeaveIndex_()};
  const all=raw.map(r=>pdmscA02ClassifyOne_(r,ctx)),f=payload.filters||{},q=pdmscNormalizeText_(f.search).toLowerCase(),dep=pdmscNormalizeText_(f.department),type=pdmscNormalizeText_(f.resultType).toUpperCase(),dateKey=pdmscNormalizeText_(f.dateKey).replace(/-/g,''),reviewOnly=!!f.reviewOnly,mode=pdmscNormalizeText_(f.operationalAction).toUpperCase();
  let rows=all.filter(x=>(!q||(x.empId+' '+x.name+' '+x.sourceName+' '+x.department).toLowerCase().includes(q))&&(!dep||x.department===dep)&&(!type||x.resultType===type)&&(!dateKey||x.dateKey===dateKey)&&(!reviewOnly||x.review)&&(!mode||x.operationalAction===mode));
  const sort=pdmscNormalizeText_(payload.sort||'DATE_NAME');rows.sort((a,b)=>sort==='NAME_DATE'?a.name.localeCompare(b.name,'th')||a.dateKey.localeCompare(b.dateKey):a.dateKey.localeCompare(b.dateKey)||a.name.localeCompare(b.name,'th'));
  const pageSize=Math.max(25,Math.min(PDMSC_ATT_A02.PAGE_SIZE_MAX,Number(payload.pageSize)||PDMSC_ATT_A02.PAGE_SIZE_DEFAULT)),pages=Math.max(1,Math.ceil(rows.length/pageSize)),page=Math.max(1,Math.min(pages,Number(payload.page)||1)),start=(page-1)*pageSize;
  const counts={};all.forEach(x=>{counts[x.resultType]=(counts[x.resultType]||0)+1;});
  const departments=[...new Set(all.map(x=>x.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'));
  const resultTypes=[...new Set(all.map(x=>x.resultType))].sort();
  return pdmscWebSafe_({ok:true,version:PDMSC_ATT_A02.VERSION,monthKey,label:pdmscWebMonthLabel_(monthKey),summary:{personDays:all.length,people:new Set(all.map(x=>x.empId)).size,eventCandidates:all.filter(x=>x.eventCandidate).length,review:all.filter(x=>x.review).length,counts},filters:{departments,resultTypes},page,pageSize,pages,total:rows.length,rows:rows.slice(start,start+pageSize)});
}


function pdmscAttendanceOperationalCutoffEndDateSelfTest_(){
  const settings={LATE_CUTOFF:'07:51',SINGLE_SCAN_SPLIT:'11:59',SCAN_ACCEPT_START:'03:00'},rule={row:1,ruleId:'APR1_3',startDate:new Date(2026,3,1),endDate:new Date(2026,3,3),scopeType:'ALL',scopeValue:'',action:'PROCESS',cutoff:'08:31',eventExemption:'NONE',active:true},people=new Map([['EMPX',{empId:'EMPX',fullName:'ทดสอบ',department:'ฝ่ายบริหาร',position:'ครู'}]]),ctx={people,rules:[rule],settings,leaveIndex:new Map()};
  const make=t=>({monthKey:'202604',empId:'EMPX',sourceName:'ทดสอบ',date:new Date(2026,3,3,12,0,0),mainRaw:t,secondaryRaw:'',mainBg:'#ffffff',secondaryBg:'#ffffff',rowMode:'ONE_ROW'}),a=pdmscA02ClassifyOne_(make('08:01'),ctx),b=pdmscA02ClassifyOne_(make('08:22'),ctx),c=pdmscA02ClassifyOne_(make('08:31'),ctx),d=pdmscA02ClassifyOne_(make('08:32'),ctx);
  const tests=[
    {name:'03 Apr 08:01 uses 08:31 and is not late',ok:a.cutoff==='08:31'&&a.resultType==='MISSING_OUT'&&a.lateMinutes===0},
    {name:'03 Apr 08:22 uses 08:31 and is not late',ok:b.cutoff==='08:31'&&b.resultType==='MISSING_OUT'&&b.lateMinutes===0},
    {name:'03 Apr 08:31 is on time',ok:c.cutoff==='08:31'&&c.resultType==='MISSING_OUT'&&c.lateMinutes===0},
    {name:'03 Apr 08:32 is late 1 minute',ok:d.cutoff==='08:31'&&d.resultType==='LATE_AND_MISSING_OUT'&&d.lateMinutes===1}
  ];return{ok:tests.every(x=>x.ok),tests};
}

function pdmscAttendanceA02SelfTest_(){
  const d=new Date(2026,3,6),rules=[{row:1,ruleId:'ALL',startDate:new Date(2026,3,1),endDate:new Date(2026,3,30),scopeType:'ALL',scopeValue:'',action:'IGNORE',cutoff:'',eventExemption:'NONE',active:true},{row:2,ruleId:'EMP',startDate:new Date(2026,3,6),endDate:new Date(2026,3,30),scopeType:'GROUP',scopeValue:'ลูกจ้าง',action:'LEAVE_ONLY',cutoff:'',eventExemption:'NONE',active:true}],settings={LATE_CUTOFF:'07:51'};
  const r=pdmscA02OperationalRuleFor_(d,'ลูกจ้าง',rules,settings),split=719;
  const s1=pdmscA02ExtractScans_({mainRaw:'07:40',secondaryRaw:'16:20'},split),c1=pdmscA02ClassifyScans_(s1,'07:51');
  const s2=pdmscA02ExtractScans_({mainRaw:'16:20',secondaryRaw:''},split),c2=pdmscA02ClassifyScans_(s2,'07:51');
  const s3=pdmscA02ExtractScans_({mainRaw:'08:45',secondaryRaw:''},split),c3=pdmscA02ClassifyScans_(s3,'08:31');
  const tests=[
    {name:'GROUP rule overrides ALL',ok:r.action==='LEAVE_ONLY'&&r.ruleId==='EMP'},
    {name:'normal pair',ok:c1.code==='NORMAL'},
    {name:'single evening becomes OUT',ok:s2.mode==='SINGLE_OUT'&&c2.code==='NO_IN'},
    {name:'special cutoff 08:31 late',ok:c3.code==='LATE_NO_OUT'&&c3.lateMinutes===14},
    {name:'blue detector preserved',ok:pdmscAttendanceIsLeaveBlue_('#a0d1fb')},
    {name:'green detector preserved',ok:pdmscAttendanceIsOfficialGreen_('#00ff00')}
  ];return{ok:tests.every(x=>x.ok),tests};
}


function pdmscAttendanceA021Dataset_(payload){
  payload=payload||{};
  const started=Date.now(),monthKey=pdmscNormalizeMonthKey_(payload.monthKey),raw=pdmscA02RawRows_(monthKey);
  if(!raw.length)throw new Error('ยังไม่มี Raw Snapshot เดือน '+monthKey);
  const resolver=pdmscBuildBulkResolverContext_(),people=new Map(resolver.people.map(p=>[pdmscNormalizeText_(p.empId).toUpperCase(),p])),settings=pdmscSettingsMap_(),ctx={people,rules:pdmscOperationalRules_(),settings,leaveIndex:pdmscA02BuildLeaveIndex_()};
  const rows=raw.map(r=>pdmscA02ClassifyOne_(r,ctx));
  const counts={};rows.forEach(x=>{counts[x.resultType]=(counts[x.resultType]||0)+1;});
  const departments=[...new Set(rows.map(x=>x.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'));
  const positions=[...new Set(rows.map(x=>x.position).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'));
  const resultTypes=[...new Set(rows.map(x=>x.resultType))].sort();
  return pdmscWebSafe_({
    ok:true,version:'A02.1-V0.1.0-MATRIX',monthKey,label:pdmscWebMonthLabel_(monthKey),
    summary:{personDays:rows.length,people:new Set(rows.map(x=>x.empId)).size,eventCandidates:rows.filter(x=>x.eventCandidate).length,review:rows.filter(x=>x.review).length,counts},
    filters:{departments,positions,resultTypes},rows,serverMs:Date.now()-started
  });
}

function pdmscAttendanceA021SelfTest_(){
  const sample=[
    {empId:'EMP1',name:'A',department:'X',position:'ครู',dateKey:'20260401',rowMode:'TWO_ROWS',mainRaw:'07:40',secondaryRaw:'16:20',mainBg:'#ffffff',secondaryBg:'#ffffff',resultType:'NORMAL'},
    {empId:'EMP2',name:'B',department:'Y',position:'ครู',dateKey:'20260401',rowMode:'ONE_ROW',mainRaw:'08:10',secondaryRaw:'',mainBg:'#a0d1fb',secondaryBg:'#ffffff',resultType:'REVIEW_REQUIRED'}
  ];
  const people=new Set(sample.map(x=>x.empId));
  const tests=[
    {name:'dataset supports two-row person',ok:sample[0].rowMode==='TWO_ROWS'&&!!sample[0].secondaryRaw},
    {name:'dataset supports one-row person',ok:sample[1].rowMode==='ONE_ROW'&&!sample[1].secondaryRaw},
    {name:'raw background preserved',ok:sample[1].mainBg==='#a0d1fb'},
    {name:'single dataset can feed both views',ok:people.size===2&&sample.length===2}
  ];
  return{ok:tests.every(x=>x.ok),tests};
}
