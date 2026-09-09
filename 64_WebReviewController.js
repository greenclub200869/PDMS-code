function pdmscWebReviewBootstrap(force){
  const key='review-bootstrap';if(!force&&typeof pdmscWebCacheGet_==='function'){const c=pdmscWebCacheGet_(key);if(c)return c;}
  const period=pdmscWebPeriodView_(),out={months:period.months||[],rawSummary:[],monthSource:'ACTIVE_PERIOD'};if(typeof pdmscWebCachePut_==='function')pdmscWebCachePut_(key,out,60);return out;
}
function pdmscWebReviewDataset(monthKey,force){return pdmscA022Dataset_(monthKey,!!force);}
function pdmscWebReviewList(payload){return pdmscA022List_(payload||{});}
function pdmscWebReviewDetail(eventIdentity,force){return pdmscA022Detail_(eventIdentity,!!force);}
function pdmscWebReviewSaveDecision(payload){const r=pdmscA022SaveDecision_(payload||{});if(typeof pdmscWebInvalidateWarningCaches_==='function')pdmscWebInvalidateWarningCaches_();return r;}
