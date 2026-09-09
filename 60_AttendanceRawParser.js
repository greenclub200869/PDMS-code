const PDMSC_ATT_A01 = Object.freeze({
  VERSION:'A01-V0.1.2',
  MAX_ROWS:1000,
  MAX_COLS:100,
  MIN_DAY_COLUMNS:20,
  PREVIEW_LIMIT:250
});

function pdmscAttendanceHash_(value){
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value||''),Utilities.Charset.UTF_8);
  return bytes.map(b=>(b+256).toString(16).slice(-2)).join('');
}
function pdmscAttendanceBg_(v){
  let s=pdmscNormalizeText_(v).toLowerCase();
  if(!s||s==='transparent'||s==='white'||s==='#fff'||s==='#ffffff'||s==='rgb(255, 255, 255)'||s==='rgba(0, 0, 0, 0)')return'#ffffff';
  const named={lime:'#00ff00',green:'#008000',blue:'#0000ff',aqua:'#00ffff',cyan:'#00ffff',red:'#ff0000',yellow:'#ffff00',pink:'#ffc0cb',lightblue:'#add8e6',skyblue:'#87ceeb',black:'#000000'};
  if(named[s])return named[s];
  const rgb=s.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?/i);
  if(rgb){if(rgb[4]!==undefined&&Number(rgb[4])===0)return'#ffffff';return'#'+[rgb[1],rgb[2],rgb[3]].map(n=>('0'+Number(n).toString(16)).slice(-2)).join('');}
  const h=s.match(/#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/i);if(h){let x=h[1];if(x.length===3)x=x.split('').map(z=>z+z).join('');if(x.length===8&&x.slice(6)==='00')return'#ffffff';return'#'+x.slice(0,6);}
  return s;
}
function pdmscAttendanceBgMeaningful_(v){return pdmscAttendanceBg_(v)!=='#ffffff';}
function pdmscAttendanceCellText_(v){return v==null?'':String(v).replace(/\u00a0/g,' ').trim();}
function pdmscAttendanceRowHasDayEvidence_(row,bgRow,dayCols){
  return (dayCols||[]).some(d=>pdmscAttendanceCellText_(row[d.col])!==''||pdmscAttendanceBgMeaningful_((bgRow||[])[d.col]));
}
function pdmscAttendanceRowHasAnyText_(row){return (row||[]).some(v=>pdmscAttendanceCellText_(v)!=='');}
function pdmscAttendanceMonthRange_(monthKey){
  const k=pdmscNormalizeMonthKey_(monthKey),y=Number(k.slice(0,4)),m=Number(k.slice(4,6));
  return{start:new Date(y,m-1,1,12,0,0),end:new Date(y,m,0,12,0,0),days:new Date(y,m,0).getDate()};
}
function pdmscAttendanceParseDayHeader_(value,daysInMonth){
  const s=pdmscAttendanceCellText_(value),maxDay=Number(daysInMonth)||31;
  if(!s)return 0;
  if(/^\d{1,2}$/.test(s)){const d=Number(s);return d>=1&&d<=maxDay?d:0;}
  // Explicit date-like header, e.g. 1/4 or 01-04-2569.
  const dm=s.match(/^(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?/);
  if(dm){const d=Number(dm[1]);return d>=1&&d<=maxDay?d:0;}
  // Real PDMS source uses weekday + day, e.g. พ.1, พฤ.2, ศ.30.
  // Only the final 1-2 digit token is treated as the day so text before it is harmless.
  const tail=s.match(/(?:^|[^0-9])(\d{1,2})\s*$/);
  if(tail){const d=Number(tail[1]);return d>=1&&d<=maxDay?d:0;}
  return 0;
}
function pdmscAttendanceHexRgb_(background){
  const s=pdmscAttendanceBg_(background).replace('#','');
  if(!/^[0-9a-f]{6}$/i.test(s))return null;
  return{r:parseInt(s.slice(0,2),16),g:parseInt(s.slice(2,4),16),b:parseInt(s.slice(4,6),16)};
}
function pdmscAttendanceIsLeaveBlue_(background){
  const x=pdmscAttendanceHexRgb_(background);if(!x)return false;
  // Contract carried from the locked legacy attendance evidence detector:
  // accepts Student Care blue and nearby light-blue exports, rejects green/pink/white.
  return x.b>=190&&x.g>=160&&x.b>=x.g+10&&x.b>=x.r+25&&x.g>=x.r+8;
}
function pdmscAttendanceIsOfficialGreen_(background){
  const x=pdmscAttendanceHexRgb_(background);if(!x)return false;
  // Raw evidence grouping only; final official-duty decision is deferred to A02.
  return x.g>=150&&x.g>=x.r+35&&x.g>=x.b+20;
}
function pdmscAttendanceHeaderKey_(v){return pdmscNormalizeText_(v).toLowerCase().replace(/[\s._\-\/\\()\[\]{}:]+/g,'');}
function pdmscAttendanceFindHeader_(values,monthKey){
  const range=pdmscAttendanceMonthRange_(monthKey),nameKeys=['ชื่อ','ชื่อสกุล','ชื่อ-สกุล','ชื่อและนามสกุล','ชื่อ-นามสกุล','ชื่อบุคลากร','ชื่อครู'].map(pdmscAttendanceHeaderKey_),seqKeys=['ลำดับ','ลําดับ','เลขที่','ที่'].map(pdmscAttendanceHeaderKey_),posKeys=['ตำแหน่ง','ตําแหน่ง','position'].map(pdmscAttendanceHeaderKey_);
  let best=null;
  for(let r=0;r<Math.min(values.length,80);r++){
    const row=values[r]||[],keys=row.map(pdmscAttendanceHeaderKey_);
    let nameCol=keys.findIndex(k=>nameKeys.includes(k));
    if(nameCol<0)continue;
    const seqCol=keys.findIndex(k=>seqKeys.includes(k)),posCol=keys.findIndex(k=>posKeys.includes(k));
    const days=[],seen=new Set(),dups=[];
    for(let c=0;c<row.length;c++){
      if(c===nameCol||c===seqCol||c===posCol)continue;
      const d=pdmscAttendanceParseDayHeader_(row[c],range.days);if(!d)continue;
      if(seen.has(d))dups.push(d);else{seen.add(d);days.push({day:d,col:c});}
    }
    const score=days.length*10+(seqCol>=0?5:0)+(posCol>=0?5:0);
    if(!best||score>best.score)best={row:r,nameCol:nameCol,seqCol:seqCol,posCol:posCol,dayCols:days.sort((a,b)=>a.day-b.day),duplicateDays:dups,score:score};
  }
  return best;
}
function pdmscAttendanceMergeSpansAt_(merges,row,col){
  return (merges||[]).filter(m=>Number(m.row)===row&&Number(m.col)===col).map(m=>Number(m.rowSpan)||1);
}
function pdmscAttendanceIdentityMergeSpan_(merges,row,header){
  const cols=[header.seqCol,header.nameCol,header.posCol].filter(c=>c>=0),spans=[];
  cols.forEach(c=>{const a=pdmscAttendanceMergeSpansAt_(merges,row,c);if(a.length)spans.push(Math.max.apply(null,a));});
  if(!spans.length)return{span:1,partial:false};
  return{span:Math.max.apply(null,spans),partial:spans.some(s=>s!==spans[0])||spans.length!==cols.length};
}
function pdmscAttendanceExtractTimes_(text){
  const s=pdmscAttendanceCellText_(text),out=[];let m;
  const re=/(?:^|\D)([01]?\d|2[0-3])[:.]([0-5]\d)(?:\D|$)/g;
  while((m=re.exec(s))!==null)out.push(('0'+m[1]).slice(-2)+':'+m[2]);
  return out;
}
function pdmscAttendanceResolveIdentity_(name,ctx,monthRange){
  const r=pdmscResolvePersonFromContext_(name,ctx,monthRange.start,monthRange.end);
  return r||{status:'UNMAPPED',raw:name};
}
function pdmscAttendanceParserInput_(payload){
  payload=payload||{};
  const monthKey=pdmscNormalizeMonthKey_(payload.monthKey),rows=Array.isArray(payload.values)?payload.values:[],bgs=Array.isArray(payload.backgrounds)?payload.backgrounds:[],rawAnchors=Array.isArray(payload.colorAnchors)?payload.colorAnchors:[],merges=Array.isArray(payload.merges)?payload.merges:[];
  if(!rows.length)throw new Error('ยังไม่มีข้อมูลลงเวลาที่วาง');
  if(rows.length>PDMSC_ATT_A01.MAX_ROWS)throw new Error('ข้อมูลมีแถวมากเกิน '+PDMSC_ATT_A01.MAX_ROWS+' แถว');
  const width=Math.max.apply(null,rows.map(r=>Array.isArray(r)?r.length:0).concat([0]));
  if(width>PDMSC_ATT_A01.MAX_COLS)throw new Error('ข้อมูลมีคอลัมน์มากเกิน '+PDMSC_ATT_A01.MAX_COLS+' คอลัมน์');
  const values=rows.map(r=>{const a=Array.isArray(r)?r.slice(0,width):[];while(a.length<width)a.push('');return a.map(pdmscAttendanceCellText_);});
  const backgrounds=values.map((r,i)=>r.map((_,c)=>pdmscAttendanceBg_((bgs[i]||[])[c])));
  const colorAnchors=values.map((r,i)=>r.map((_,c)=>rawAnchors.length?((rawAnchors[i]||[])[c]===true):true));
  return{monthKey,values,backgrounds,colorAnchors,merges,width,hasRichHtml:payload.hasRichHtml!==false};
}
function pdmscAttendanceParseSnapshot_(payload){
  const input=pdmscAttendanceParserInput_(payload),range=pdmscAttendanceMonthRange_(input.monthKey),header=pdmscAttendanceFindHeader_(input.values,input.monthKey),blockers=[],warnings=[],issues=[],people=[],ctx=pdmscBuildBulkResolverContext_();
  if(!input.hasRichHtml)blockers.push({code:'COLOR_EVIDENCE_UNAVAILABLE',message:'ข้อมูลที่วางไม่มีรูปแบบ Rich HTML จึงไม่สามารถยืนยันสีพื้นหลังได้ กรุณาคัดลอกจาก Google Sheets/Excel แล้ววางใหม่'});
  if(!header)blockers.push({code:'HEADER_NOT_FOUND',message:'ไม่พบ Header ที่มีคอลัมน์ชื่อและวันของเดือน'});
  if(blockers.length)return pdmscAttendancePreviewResult_(input,header,people,issues,blockers,warnings);
  if(header.dayCols.length<PDMSC_ATT_A01.MIN_DAY_COLUMNS)blockers.push({code:'DAY_COLUMNS_TOO_FEW',message:'พบคอลัมน์วันเพียง '+header.dayCols.length+' คอลัมน์'});
  if(header.duplicateDays.length)blockers.push({code:'DUPLICATE_DAY_HEADER',message:'พบวันซ้ำใน Header: '+header.duplicateDays.join(', ')});
  const daysPresent=new Set(header.dayCols.map(x=>x.day)),missing=[];for(let d=1;d<=range.days;d++)if(!daysPresent.has(d))missing.push(d);
  if(missing.length)blockers.push({code:'MISSING_DAY_HEADER',message:'Header ขาดวัน: '+missing.join(', ')});
  let current=null,ignoredRows=0;
  function closeCurrent(){if(!current)return;current.rowMode=current.secondaryRow!=null?'TWO_ROWS':(current.combinedDays>0?'ONE_ROW_COMBINED':'ONE_ROW');people.push(current);current=null;}
  for(let r=header.row+1;r<input.values.length;r++){
    const row=input.values[r],bg=input.backgrounds[r],name=pdmscAttendanceCellText_(row[header.nameCol]),seq=header.seqCol>=0?pdmscAttendanceCellText_(row[header.seqCol]):'',pos=header.posCol>=0?pdmscAttendanceCellText_(row[header.posCol]):'',dayEvidence=pdmscAttendanceRowHasDayEvidence_(row,bg,header.dayCols),anyText=pdmscAttendanceRowHasAnyText_(row),resolution=name?pdmscAttendanceResolveIdentity_(name,ctx,range):null;
    const known=!!(resolution&&resolution.person),excluded=!!(resolution&&resolution.status==='EXCLUDED_FROM_PROCESSING'),identity=!!name&&(known||excluded||!!seq||!!pos||dayEvidence);
    if(identity){
      closeCurrent();
      const merge=pdmscAttendanceIdentityMergeSpan_(input.merges,r,header);
      const person=resolution&&resolution.person?resolution.person:null,status=resolution?resolution.status:'UNMAPPED';
      current={sourceName:name,empId:person?person.empId:'',canonicalName:person?person.fullName:'',department:person?person.department:'',position:person?person.position:pos,resolverStatus:status,resolverMethod:resolution&&resolution.method?resolution.method:'',mainRow:r,secondaryRow:null,mergeSpan:merge.span,mergePartial:merge.partial,combinedDays:0,main:row,secondary:null,mainBg:bg,secondaryBg:null,mainAnchor:input.colorAnchors[r]||[],secondaryAnchor:null,issues:[]};
      if(merge.partial){warnings.push({code:'IDENTITY_MERGE_PARTIAL',row:r+1,message:'แถว '+(r+1)+' มี merge ของข้อมูลตัวตนไม่ครบทุกคอลัมน์ ระบบใช้ Identity Boundary เป็นหลัก'});current.issues.push('IDENTITY_MERGE_PARTIAL');}
      if(status==='UNMAPPED'||status==='AMBIGUOUS'||status==='EMPTY'){const it={code:'PERSON_'+status,row:r+1,message:'จับคู่บุคลากรไม่ได้: '+name+' ('+status+')'};blockers.push(it);current.issues.push(it.code);}
      if(status==='INACTIVE')warnings.push({code:'PERSON_INACTIVE',row:r+1,message:name+' เป็น INACTIVE และไม่มีช่วงการจ้างงานที่ยืนยันได้'});
      if(merge.span>2){const it={code:'PERSON_ROW_SPAN_INVALID',row:r+1,message:'ข้อมูลตัวตนของ '+name+' merge มากกว่า 2 แถว'};blockers.push(it);current.issues.push(it.code);}
      if(merge.span===2){
        const nr=r+1;
        if(nr<input.values.length){const nname=pdmscAttendanceCellText_(input.values[nr][header.nameCol]);if(nname){const it={code:'IDENTITY_MERGE_BOUNDARY_MISMATCH',row:nr+1,message:'Merge ของ '+name+' ข้ามไปยังแถวที่มีชื่อ '+nname};blockers.push(it);current.issues.push(it.code);}else{current.secondaryRow=nr;current.secondary=input.values[nr];current.secondaryBg=input.backgrounds[nr];current.secondaryAnchor=input.colorAnchors[nr]||[];r=nr;}}
      }
      header.dayCols.forEach(d=>{if(pdmscAttendanceExtractTimes_(row[d.col]).length>=2)current.combinedDays++;});
      continue;
    }
    if(dayEvidence){
      if(!current){const it={code:'ORPHAN_SCAN_ROW',row:r+1,message:'พบข้อมูลเวลา/สีที่ไม่มีบุคลากรเจ้าของในแถว '+(r+1)};blockers.push(it);issues.push(it);continue;}
      if(current.secondaryRow!=null){const it={code:'PERSON_ROW_SPAN_INVALID',row:r+1,message:'พบแถวข้อมูลมากกว่า 2 แถวต่อบุคลากร '+current.sourceName};blockers.push(it);current.issues.push(it.code);closeCurrent();continue;}
      current.secondaryRow=r;current.secondary=row;current.secondaryBg=bg;current.secondaryAnchor=input.colorAnchors[r]||[];continue;
    }
    if(anyText){warnings.push({code:'NON_PERSON_ROW_IGNORED',row:r+1,message:'ข้ามแถวข้อความที่ไม่ใช่บุคลากร: '+row.filter(Boolean).slice(0,3).join(' | ')});}
    ignoredRows++;closeCurrent();
  }
  closeCurrent();
  if(!people.length)blockers.push({code:'NO_PERSON_FOUND',message:'ไม่พบบุคลากรในข้อมูลที่วาง'});
  const dupEmp=new Map();people.forEach(p=>{if(!p.empId)return;dupEmp.set(p.empId,(dupEmp.get(p.empId)||0)+1);});
  [...dupEmp.entries()].filter(x=>x[1]>1).forEach(x=>blockers.push({code:'DUPLICATE_PERSON_BLOCK',message:'พบ '+x[0]+' มากกว่า 1 block ใน Snapshot'}));
  return pdmscAttendancePreviewResult_(input,header,people,issues,blockers,warnings,ignoredRows);
}
function pdmscAttendancePreviewResult_(input,header,people,issues,blockers,warnings,ignoredRows){
  const modes={ONE_ROW:0,TWO_ROWS:0,ONE_ROW_COMBINED:0};let coloredCells=0,blueCells=0,greenCells=0,otherColoredCells=0,mergedShadowColored=0,greenMarkerCells=0;
  const diag=new Map(),allDiag=new Map();
  function addDiag(map,color,sample){if(!pdmscAttendanceBgMeaningful_(color))return;const k=pdmscAttendanceBg_(color),x=map.get(k)||{color:k,count:0,samples:[]};x.count++;if(sample&&x.samples.length<5)x.samples.push(sample);map.set(k,x);}
  function countBg(v,isAnchor,sample,text){
    if(!pdmscAttendanceBgMeaningful_(v))return;
    if(isAnchor===false){mergedShadowColored++;return;}
    coloredCells++;addDiag(diag,v,sample);
    if(pdmscAttendanceCellText_(text)==='ท')greenMarkerCells++;
    if(pdmscAttendanceIsLeaveBlue_(v))blueCells++;
    else if(pdmscAttendanceIsOfficialGreen_(v))greenCells++;
    else otherColoredCells++;
  }
  if(header&&header.dayCols){for(let r=header.row+1;r<input.values.length;r++)header.dayCols.forEach(d=>{if((input.colorAnchors[r]||[])[d.col]!==false)addDiag(allDiag,(input.backgrounds[r]||[])[d.col],'แถว '+(r+1)+' / วัน '+d.day);});}
  (people||[]).forEach(p=>{modes[p.rowMode]=(modes[p.rowMode]||0)+1;const h=header&&header.dayCols?header.dayCols:[];h.forEach(d=>{countBg((p.mainBg||[])[d.col],(p.mainAnchor||[])[d.col],p.sourceName+' / วัน '+d.day,(p.main||[])[d.col]);if(p.secondaryBg)countBg(p.secondaryBg[d.col],(p.secondaryAnchor||[])[d.col],p.sourceName+' / วัน '+d.day+' (แถว 2)',(p.secondary||[])[d.col]);});});
  if(input.hasRichHtml&&greenMarkerCells>0&&greenCells===0&&!blockers.some(x=>x.code==='GREEN_COLOR_CAPTURE_MISSING'))blockers.push({code:'GREEN_COLOR_CAPTURE_MISSING',message:'พบเครื่องหมาย “ท” '+greenMarkerCells+' ช่อง แต่ไม่พบสีเขียวจาก Clipboard จึงยังยืนยัน Raw Snapshot ไม่ได้'});
  const colorDiagnostics=[...diag.values()].sort((a,b)=>b.count-a.count).slice(0,12).map(x=>({color:x.color,count:x.count,classification:pdmscAttendanceIsLeaveBlue_(x.color)?'BLUE':(pdmscAttendanceIsOfficialGreen_(x.color)?'GREEN':'OTHER'),samples:x.samples}));
  const sourceColorDiagnostics=[...allDiag.values()].sort((a,b)=>b.count-a.count).slice(0,12).map(x=>({color:x.color,count:x.count,classification:pdmscAttendanceIsLeaveBlue_(x.color)?'BLUE':(pdmscAttendanceIsOfficialGreen_(x.color)?'GREEN':'OTHER'),samples:x.samples}));
  const canonical={monthKey:input.monthKey,rich:input.hasRichHtml,header:header?{row:header.row,nameCol:header.nameCol,seqCol:header.seqCol,posCol:header.posCol,dayCols:header.dayCols}:null,people:(people||[]).map(p=>({empId:p.empId,sourceName:p.sourceName,canonicalName:p.canonicalName,department:p.department,rowMode:p.rowMode,mainRow:p.mainRow,secondaryRow:p.secondaryRow,resolverStatus:p.resolverStatus,issues:p.issues||[]}))};
  const fingerprint=pdmscAttendanceHash_(JSON.stringify(canonical));
  return{ok:!(blockers||[]).length,version:PDMSC_ATT_A01.VERSION,monthKey:input.monthKey,fingerprint:fingerprint,summary:{people:(people||[]).length,twoRows:modes.TWO_ROWS||0,oneRow:modes.ONE_ROW||0,combined:modes.ONE_ROW_COMBINED||0,coloredCells:coloredCells,blueCells:blueCells,greenCells:greenCells,otherColoredCells:otherColoredCells,mergedShadowColored:mergedShadowColored,greenMarkerCells:greenMarkerCells,ignoredRows:ignoredRows||0,blockers:(blockers||[]).length,warnings:(warnings||[]).length},colorDiagnostics:colorDiagnostics,sourceColorDiagnostics:sourceColorDiagnostics,header:header?{pastedRow:header.row+1,dayCount:header.dayCols.length,nameColumn:header.nameCol+1,sequenceColumn:header.seqCol+1,positionColumn:header.posCol+1}:null,people:(people||[]).slice(0,PDMSC_ATT_A01.PREVIEW_LIMIT).map(p=>({empId:p.empId,sourceName:p.sourceName,canonicalName:p.canonicalName,department:p.department,rowMode:p.rowMode,sourceRows:p.secondaryRow!=null?[(p.mainRow+1),(p.secondaryRow+1)]:[(p.mainRow+1)],resolverStatus:p.resolverStatus,issues:p.issues||[]})),blockers:blockers||[],warnings:warnings||[],_parsedPeople:people||[],_headerInternal:header,_inputInternal:input};
}
function pdmscAttendancePublicPreview_(parsed){
  const x=Object.assign({},parsed);delete x._parsedPeople;delete x._headerInternal;delete x._inputInternal;return x;
}
function pdmscAttendanceRawRowsForCommit_(parsed){
  const input=parsed._inputInternal,header=parsed._headerInternal,range=pdmscAttendanceMonthRange_(input.monthKey),out=[],importId=Utilities.getUuid(),now=new Date();
  parsed._parsedPeople.forEach(p=>{
    if(!p.empId&&p.resolverStatus!=='EXCLUDED_FROM_PROCESSING')return;
    for(let day=1;day<=range.days;day++){
      const dcol=(header.dayCols.find(x=>x.day===day)||{}).col;if(typeof dcol!=='number')continue;
      const main=pdmscAttendanceCellText_(p.main[dcol]),secondary=p.secondary?pdmscAttendanceCellText_(p.secondary[dcol]):'',mbg=pdmscAttendanceBg_(p.mainBg[dcol]),sbg=p.secondaryBg?pdmscAttendanceBg_(p.secondaryBg[dcol]):'#ffffff';
      const date=new Date(Number(input.monthKey.slice(0,4)),Number(input.monthKey.slice(4,6))-1,day,12,0,0),evidence={main:main,secondary:secondary,mainBackground:mbg,secondaryBackground:sbg,mainSourceRow:p.mainRow+1,secondarySourceRow:p.secondaryRow!=null?p.secondaryRow+1:null,rowMode:p.rowMode};
      const fp=pdmscAttendanceHash_([input.monthKey,p.empId||p.sourceName,day,JSON.stringify(evidence)].join('|'));
      out.push([input.monthKey,importId,p.empId||'',p.sourceName,date,[main,secondary].filter(Boolean).join(' | '),JSON.stringify(evidence),fp,now,main,secondary,mbg,sbg,p.rowMode,JSON.stringify(evidence.mainSourceRow&&evidence.secondarySourceRow?[evidence.mainSourceRow,evidence.secondarySourceRow]:[evidence.mainSourceRow]),p.resolverMethod||'',JSON.stringify(p.issues||[])]);
    }
  });
  return{importId:importId,rows:out};
}
function pdmscAttendanceMonthHasEvents_(monthKey){return pdmscRows_(PDMSC.BACKEND.EVENT_STORE).some(r=>pdmscNormalizeText_(r[1])===monthKey);}
function pdmscAttendanceReplaceRawMonth_(monthKey,rows){
  const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.RAW_ATTENDANCE);if(!sh)throw new Error('ไม่พบ Attendance Raw backend');
  if(pdmscAttendanceMonthHasEvents_(monthKey))throw new Error('เดือนนี้มี Event ที่ประมวลผลแล้ว จึงยังไม่อนุญาตให้แทน Raw Snapshot ใน A01');
  const existing=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues():[],keep=existing.filter(r=>pdmscNormalizeText_(r[0])!==monthKey);
  if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,sh.getMaxColumns()).clearContent();
  const all=keep.concat(rows);if(all.length)sh.getRange(2,1,all.length,pdmscSchemaRegistry_()[PDMSC.BACKEND.RAW_ATTENDANCE].length).setValues(all.map(r=>{const a=r.slice();while(a.length<pdmscSchemaRegistry_()[PDMSC.BACKEND.RAW_ATTENDANCE].length)a.push('');return a;}));
  return{previousRows:existing.length-keep.length,activeRows:rows.length};
}
function pdmscAttendanceCommitSnapshot_(payload,expectedFingerprint){
  const lock=LockService.getDocumentLock();lock.waitLock(30000);try{
    const parsed=pdmscAttendanceParseSnapshot_(payload);if(!parsed.ok)throw new Error('ยังยืนยันไม่ได้: '+parsed.blockers.map(x=>x.message).slice(0,5).join(' | '));
    if(pdmscNormalizeText_(expectedFingerprint)!==parsed.fingerprint)throw new Error('Snapshot เปลี่ยนจากตอน Preview กรุณากดตรวจสอบใหม่ก่อนยืนยัน');
    const built=pdmscAttendanceRawRowsForCommit_(parsed),replace=pdmscAttendanceReplaceRawMonth_(parsed.monthKey,built.rows);
    pdmscLog_('ATTENDANCE_RAW_SNAPSHOT_COMMIT','OK',{monthKey:parsed.monthKey,importId:built.importId,people:parsed.summary.people,rawRows:built.rows.length,replaced:replace.previousRows,parserVersion:PDMSC_ATT_A01.VERSION});
    return{ok:true,monthKey:parsed.monthKey,importId:built.importId,people:parsed.summary.people,rawRows:built.rows.length,replacedRows:replace.previousRows};
  }finally{lock.releaseLock();}
}
function pdmscAttendanceRawHealthChecks_(){
  const rows=pdmscRows_(PDMSC.BACKEND.RAW_ATTENDANCE),seen=new Set(),dups=0;rows.forEach(r=>{const k=[pdmscNormalizeText_(r[0]),pdmscNormalizeText_(r[2])||pdmscNormalizeName_(r[3]),pdmscWebSafeDate_(r[4])].join('|');if(seen.has(k))dups++;else seen.add(k);});
  return[{name:'Attendance Raw duplicate person-day',ok:dups===0,note:dups?('ซ้ำ '+dups+' รายการ'):''}];
}
function pdmscAttendanceA01SelfTest_(){
  const month='202604',days=Array.from({length:30},(_,i)=>String(i+1));
  function baseRows(spans){const rows=[['ลำดับ','ชื่อ-นามสกุล','ตำแหน่ง'].concat(days)],bgs=[new Array(33).fill('#ffffff')],merges=[];let row=1;spans.forEach((span,i)=>{const main=[String(i+1),'บุคลากรทดสอบ '+(i+1),'ครู'].concat(new Array(30).fill(''));rows.push(main);bgs.push(new Array(33).fill('#ffffff'));if(span===2){merges.push({row:row,col:0,rowSpan:2,colSpan:1},{row:row,col:1,rowSpan:2,colSpan:1},{row:row,col:2,rowSpan:2,colSpan:1});rows.push(new Array(33).fill(''));bgs.push(new Array(33).fill('#ffffff'));row+=2;}else row++;});return{monthKey:month,values:rows,backgrounds:bgs,merges:merges,hasRichHtml:true};}
  const fakeCtx={prefixCtx:{variants:[]},scopeSource:new Map(),scopeSourcePrefix:new Map(),scopeEmp:new Map(),aliasConflicts:new Set(),aliases:new Map(),exact:new Map(),compact:new Map(),ambiguousCompact:new Set(),prefixAliasConflicts:new Set(),prefixAliases:new Map(),ambiguousPrefix:new Set(),prefixPeople:new Map(),byId:new Map()};
  // Pure structural helper below avoids dependence on live personnel for row-boundary verification.
  function structural(payload){const input=pdmscAttendanceParserInput_(payload),h=pdmscAttendanceFindHeader_(input.values,input.monthKey),ranges=[];let current=null;for(let r=h.row+1;r<input.values.length;r++){const name=input.values[r][h.nameCol],ev=pdmscAttendanceRowHasDayEvidence_(input.values[r],input.backgrounds[r],h.dayCols),merge=pdmscAttendanceIdentityMergeSpan_(input.merges,r,h);if(name){if(current)ranges.push(current);current={row:r,span:1};if(merge.span===2){current.span=2;r++;ranges.push(current);current=null;}}else if(ev&&current){current.span=2;ranges.push(current);current=null;}else if(!ev&&current){ranges.push(current);current=null;}}if(current)ranges.push(current);return ranges.map(x=>x.span);}
  const t1=structural(baseRows([1,1])).join(',')==='1,1',t2=structural(baseRows([1,2])).join(',')==='1,2',t3=structural(baseRows([2,1])).join(',')==='2,1',t4=structural(baseRows([2,2])).join(',')==='2,2';
  const p=baseRows([1,1]);p.values[1][3]='07:45';p.values[2][3]='07:50';const t5=structural(p).join(',')==='1,1';
  const realHeader=['ลำดับ','ชื่อ-นามสกุล','ตำแหน่ง'].concat(['พ.1','พฤ.2','ศ.3','ส.4','อา.5','จ.6','อ.7','พ.8','พฤ.9','ศ.10','ส.11','อา.12','จ.13','อ.14','พ.15','พฤ.16','ศ.17','ส.18','อา.19','จ.20','อ.21','พ.22','พฤ.23','ศ.24','ส.25','อา.26','จ.27','อ.28','พ.29','พฤ.30']);
  const rh=pdmscAttendanceFindHeader_([realHeader],month),t6=!!rh&&rh.dayCols.length===30&&rh.dayCols[0].day===1&&rh.dayCols[29].day===30;
  const t7=pdmscAttendanceIsLeaveBlue_('#a0d1fb')&&!pdmscAttendanceIsLeaveBlue_('#00ff00')&&!pdmscAttendanceIsLeaveBlue_('#ffa39e');
  const t8=pdmscAttendanceIsOfficialGreen_('#00ff00')&&pdmscAttendanceIsOfficialGreen_('#b7e1cd')&&pdmscAttendanceIsOfficialGreen_('lime')&&!pdmscAttendanceIsOfficialGreen_('#ffffff');
  const merged=baseRows([2]);merged.backgrounds[1][3]='#a0d1fb';merged.backgrounds[2][3]='#a0d1fb';merged.colorAnchors=merged.values.map(r=>r.map(()=>true));merged.colorAnchors[2][3]=false;const mi=pdmscAttendanceParserInput_(merged),t9=mi.colorAnchors[1][3]===true&&mi.colorAnchors[2][3]===false;
  const tests=[['1→1',t1],['1→2',t2],['2→1',t3],['2→2',t4],['next person boundary',t5],['real weekday header พ.1…พฤ.30',t6],['leave blue evidence',t7],['official green evidence + CSS lime',t8],['merged color anchor preserved',t9]].map(x=>({name:x[0],ok:x[1]}));
  return{ok:tests.every(x=>x.ok),tests:tests};
}
