function pdmscWebCache_(){return CacheService.getScriptCache();}
function pdmscWebCacheKey_(name){return 'PDMSC_WEB_'+String(name||'').toUpperCase();}
function pdmscWebCacheGet_(name){try{const raw=pdmscWebCache_().get(pdmscWebCacheKey_(name));return raw?JSON.parse(raw):null;}catch(e){return null;}}
function pdmscWebCachePut_(name,value,seconds){try{pdmscWebCache_().put(pdmscWebCacheKey_(name),JSON.stringify(pdmscWebSafe_(value)),Math.max(5,Math.min(Number(seconds)||30,300)));}catch(e){}return value;}
function pdmscWebCacheClear_(names){(Array.isArray(names)?names:[names]).filter(Boolean).forEach(n=>{try{pdmscWebCache_().remove(pdmscWebCacheKey_(n));}catch(e){}});}
function pdmscWebShellBootstrap(){return{app:{name:'PDMS Continuous 6M',version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD||'',webUrl:pdmscGetWebAppUrl_()},routes:pdmscWebRouteCatalog_(),period:pdmscWebPeriodView_()};}
function pdmscWebSystemBootstrap(force){return {lightweight:true,healthLoaded:false,recoveryLoaded:false,jobsLoaded:false,auditLoaded:false};}

function pdmscWebPersonnelDirectory_(){
  const key='personnel-directory';
  const cached=pdmscWebCacheGet_(key);if(cached)return cached;
  const rows=pdmscPersonnelRows_().map(x=>({empId:x.empId,fullName:x.fullName,position:x.position,department:x.department,active:!!x.active}));
  pdmscWebCachePut_(key,rows,60);return rows;
}
function pdmscWebPersonnelDirectoryMap_(){
  const out={};pdmscWebPersonnelDirectory_().forEach(x=>out[x.empId]=x);return out;
}
function pdmscWebInvalidatePersonnelCaches_(){const names=['personnel-directory','personnel-bootstrap','personnel-masters','alias-list-all','scope-list-all','personnel-qa','dashboard','leave-active'];try{(pdmscGetActivePeriod().months||[]).forEach(k=>names.push('statistics-'+k));}catch(_e){}pdmscWebCacheClear_(names);}
function pdmscWebInvalidateOperationalCaches_(monthKeys){const names=['attendance-bootstrap','attendance-raw-summary','review-bootstrap','a03-bootstrap','dashboard'];(monthKeys||[]).forEach(k=>{names.push('review-candidates-'+k);names.push('a03-preview-'+k);});pdmscWebCacheClear_(names);}
function pdmscWebInvalidateAliasCaches_(){pdmscWebCacheClear_(['alias-list-all','personnel-qa','personnel-bootstrap','dashboard']);}
function pdmscWebInvalidateScopeCaches_(){pdmscWebCacheClear_(['scope-list-all','personnel-qa','dashboard']);}
function pdmscWebRouteCacheSeconds_(route){const r=String(route||'').toLowerCase();return r==='system'?20:r==='dashboard'?30:r==='finalevents'||r==='attendance'||r==='review'||r==='personnel'||r==='statistics'?180:60;}

function pdmscWebInvalidateWarningCaches_(){const names=['warning-candidates'];try{(pdmscGetActivePeriod().months||[]).forEach(k=>{names.push('warning-candidates-'+k);names.push('warning-candidates-v020-'+k);});}catch(_e){}pdmscWebCacheClear_(names);}
