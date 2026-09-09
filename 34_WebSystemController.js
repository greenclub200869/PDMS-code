function pdmscWebSystemHealth() {
  const h=pdmscHealthCheck();
  return {
    ok:h.ok,
    version:h.version,
    schemaVersion:h.schemaVersion||'',
    checks:(h.checks||[]).map(x=>({name:x.name,ok:!!x.ok,note:x.note||''}))
  };
}
function pdmscWebSystemHealthStage(stage) {
  const key=String(stage||'').toUpperCase(),r=pdmscHealthStage_(key)||{},checks=(r.checks||[]).map(x=>({name:x.name,ok:!!x.ok,note:x.note||''}));
  return {stage:key,ok:checks.every(x=>x.ok),schemaVersion:r.schemaVersion||'',checks:checks};
}
function pdmscWebSystemJobs() {
  return typeof pdmscGetOpenJobs==='function' ? pdmscGetOpenJobs() : [];
}
function pdmscWebRecoveryPreview() {
  return typeof pdmscRecoveryPreview_==='function'
    ? pdmscRecoveryPreview_()
    : {openJobs:0,staleJobs:[],migrationPreview:false};
}
function pdmscWebRecoveryRun() {
  if(typeof pdmscRecoverStaleWork_!=='function') throw new Error('Recovery service ยังไม่พร้อม');
  return pdmscRecoverStaleWork_();
}
function pdmscWebAuditRecent(limit) {
  const n=Math.max(1,Math.min(Number(limit)||30,100));
  const rows=pdmscRows_(PDMSC.BACKEND.LOG);
  return rows.slice(Math.max(0,rows.length-n)).reverse().map(r=>({
    timestamp:pdmscWebSafeDate_(r[0]),
    action:String(r[1]||''),
    status:String(r[2]||''),
    actor:String(r[3]||''),
    details:String(r[4]||'')
  }));
}
