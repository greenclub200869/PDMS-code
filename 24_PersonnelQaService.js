function pdmscPersonnelQaReport_() {
  const people=pdmscPersonnelRows_(), aliases=pdmscNameMapRows_(), scopes=pdmscScopeRows_();
  const issues=[];
  const idSeen=new Map(), nameSeen=new Map();
  people.forEach(p=>{
    if(!p.empId)issues.push({code:'PERSONNEL_MISSING_ID',ref:p.fullName});
    if(!p.fullName)issues.push({code:'PERSONNEL_MISSING_NAME',ref:p.empId});
    if(p.empId){
      if(idSeen.has(p.empId))issues.push({code:'DUPLICATE_EMP_ID',ref:p.empId});
      idSeen.set(p.empId,true);
    }
    if(p.matchName){
      if(nameSeen.has(p.matchName)&&nameSeen.get(p.matchName)!==p.empId)issues.push({code:'DUPLICATE_CANONICAL_NAME',ref:p.fullName});
      nameSeen.set(p.matchName,p.empId);
    }
    if(p.employmentStartDate&&p.employmentEndDate&&p.employmentEndDate<p.employmentStartDate)issues.push({code:'EMPLOYMENT_DATE_RANGE_INVALID',ref:p.empId+' '+p.fullName});
  });
  const aliasSeen=new Map();
  aliases.filter(a=>a.status==='ACTIVE').forEach(a=>{
    if(!idSeen.has(a.empId))issues.push({code:'ALIAS_ORPHAN_EMP_ID',ref:a.sourceName+' → '+a.empId});
    if(aliasSeen.has(a.key)&&aliasSeen.get(a.key)!==a.empId)issues.push({code:'ALIAS_AMBIGUOUS',ref:a.sourceName});
    aliasSeen.set(a.key,a.empId);
  });
  scopes.filter(s=>s.active&&s.scopeType==='EMP_ID').forEach(s=>{
    if(!idSeen.has(s.empId))issues.push({code:'SCOPE_ORPHAN_EMP_ID',ref:s.empId});
  });
  scopes.filter(s=>s.active).forEach(s=>{
    if(['EMP_ID','SOURCE_NAME'].indexOf(s.scopeType)<0)issues.push({code:'INVALID_SCOPE_TYPE',ref:s.scopeType});
  });
  if(typeof pdmscBuildNamePrefixContext_==='function'){const pctx=pdmscBuildNamePrefixContext_();pctx.conflicts.forEach(c=>issues.push({code:'NAME_PREFIX_AMBIGUOUS',ref:c.token+' ('+c.a+' / '+c.b+')'}));}
  return {ok:issues.length===0,counts:{personnel:people.length,aliases:aliases.length,scopeExclusions:scopes.length},issues:issues};
}
function pdmscPersonnelHealthChecks_() {
  const q=pdmscPersonnelQaReport_();
  const counts={};
  q.issues.forEach(i=>counts[i.code]=(counts[i.code]||0)+1);
  const keys=['DUPLICATE_EMP_ID','PERSONNEL_MISSING_ID','ALIAS_AMBIGUOUS','ALIAS_ORPHAN_EMP_ID','SCOPE_ORPHAN_EMP_ID','INVALID_SCOPE_TYPE','NAME_PREFIX_AMBIGUOUS','EMPLOYMENT_DATE_RANGE_INVALID'];
  return keys.map(k=>({name:'PERSONNEL_'+k,ok:!counts[k],note:counts[k]?String(counts[k])+' รายการ':''}));
}
function pdmscShowPersonnelQa() {
  const q=pdmscPersonnelQaReport_();
  const lines=[
    'บุคลากร '+q.counts.personnel+' | Alias '+q.counts.aliases+' | ไม่ประมวลผล '+q.counts.scopeExclusions,
    q.ok?'ไม่พบปัญหา':'พบปัญหา '+q.issues.length+' รายการ'
  ];
  q.issues.slice(0,20).forEach(x=>lines.push('• '+x.code+' — '+x.ref));
  SpreadsheetApp.getUi().alert('PDMS — ตรวจสอบบุคลากร',lines.join('\n'),SpreadsheetApp.getUi().ButtonSet.OK);
  return q;
}
