function pdmscWebFinalEventBootstrap(force){
  const key='a03-bootstrap';if(!force&&typeof pdmscWebCacheGet_==='function'){const c=pdmscWebCacheGet_(key);if(c)return c;}
  const period=pdmscWebPeriodView_(),out={months:period.months||[],rawSummary:[],monthSource:'ACTIVE_PERIOD'};if(typeof pdmscWebCachePut_==='function')pdmscWebCachePut_(key,out,60);return out;
}
function pdmscWebFinalEventPreview(payload){return pdmscA03List_(payload||{});}
function pdmscWebFinalEventDataset(payload){return pdmscA03Dataset_(payload||{});}
function pdmscWebFinalEventCommit(payload){const r=pdmscA03Commit_(payload||{});if(typeof pdmscWebInvalidateWarningCaches_==='function')pdmscWebInvalidateWarningCaches_();return r;}
function pdmscWebFinalEventSaveDecisions(payload){const r=pdmscA032SaveEventDecisions_(payload||{});if(typeof pdmscWebInvalidateWarningCaches_==='function')pdmscWebInvalidateWarningCaches_();return r;}

function pdmscWebFinalEventPostCommitVerify(payload){payload=payload||{};const fresh=pdmscA03BuildPreview_(payload.monthKey,false);return pdmscA03PostCommitVerify_(payload.monthKey,payload.previewFingerprint||fresh.previewFingerprint,fresh.finalEvents||[],payload.commitRunId||'');}
