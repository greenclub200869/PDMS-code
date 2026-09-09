function pdmscWebAttendanceBootstrap(force){
  const key='attendance-bootstrap';if(!force&&typeof pdmscWebCacheGet_==='function'){const c=pdmscWebCacheGet_(key);if(c)return c;}
  const period=pdmscWebPeriodView_(),out={period:period,months:period.months||[],rawSummaryLoaded:false};
  if(typeof pdmscWebCachePut_==='function')pdmscWebCachePut_(key,out,180);return out;
}
function pdmscWebAttendanceRawSummary(force){
  const key='attendance-raw-summary';if(!force&&typeof pdmscWebCacheGet_==='function'){const c=pdmscWebCacheGet_(key);if(c)return c;}
  const rows=pdmscWebAttendanceRawSummary_();if(typeof pdmscWebCachePut_==='function')pdmscWebCachePut_(key,rows,60);return rows;
}
function pdmscWebAttendanceRawSummary_(){
  const rows=pdmscRows_(PDMSC.BACKEND.RAW_ATTENDANCE),byMonth={};
  rows.forEach(r=>{const k=pdmscNormalizeText_(r[0]);if(!k)return;if(!byMonth[k])byMonth[k]={monthKey:k,rawRows:0,people:new Set(),importId:pdmscNormalizeText_(r[1])};byMonth[k].rawRows++;byMonth[k].people.add(pdmscNormalizeText_(r[2])||pdmscNormalizeName_(r[3]));});
  return Object.keys(byMonth).sort().map(k=>({monthKey:k,label:pdmscWebMonthLabel_(k),rawRows:byMonth[k].rawRows,people:byMonth[k].people.size,importId:byMonth[k].importId}));
}
function pdmscWebAttendancePreview(payload){return pdmscAttendancePublicPreview_(pdmscAttendanceParseSnapshot_(payload||{}));}
function pdmscWebAttendanceCommit(payload,expectedFingerprint){const r=pdmscAttendanceCommitSnapshot_(payload||{},expectedFingerprint||'');if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['attendance-bootstrap','attendance-raw-summary','dashboard','system-bootstrap']);if(typeof pdmscWebInvalidateOperationalCaches_==='function')pdmscWebInvalidateOperationalCaches_([r.monthKey]);return r;}
function pdmscWebAttendanceClassification(payload){return pdmscAttendanceA02Preview_(payload||{});}
function pdmscWebAttendanceMatrixDataset(payload){return pdmscAttendanceA021Dataset_(payload||{});}
