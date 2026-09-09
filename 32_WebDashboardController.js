function pdmscWebDashboardSheetCount_(sheetName) {
  const sh=SpreadsheetApp.getActive().getSheetByName(sheetName);
  return sh?Math.max(0,sh.getLastRow()-1):0;
}
function pdmscWebBootstrap(force) {
  const key='dashboard';
  if(!force){const cached=pdmscWebCacheGet_(key);if(cached)return cached;}
  const period=pdmscWebPeriodView_();
  const openJobs=typeof pdmscGetOpenJobs==='function'?pdmscGetOpenJobs():[];
  const out={
    app:{name:'PDMS Continuous 6M',version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD||'',webUrl:pdmscGetWebAppUrl_()},
    routes:pdmscWebRouteCatalog_(),
    period:period,
    health:{
      ok:true,
      checked:false,
      status:'LIGHT_READY',
      note:'หน้าแรกตรวจเฉพาะความพร้อมเบื้องต้น — ตรวจสุขภาพเต็มรูปแบบได้ที่เมนู “ตรวจสุขภาพและกู้คืนระบบ”',
      failed:[]
    },
    personnel:{
      ok:true,
      checked:false,
      count:pdmscWebDashboardSheetCount_(PDMSC.BACKEND.PERSONNEL),
      aliases:pdmscWebDashboardSheetCount_(PDMSC.BACKEND.NAME_MAP),
      exclusions:pdmscWebDashboardSheetCount_(PDMSC.BACKEND.EXCLUSIONS),
      issues:0
    },
    jobs:{open:openJobs.length,items:openJobs.slice(0,20)}
  };
  pdmscWebCachePut_(key,out,30);
  return out;
}
function pdmscWebDashboardRefresh(force){
  if(force)pdmscWebCacheClear_(['dashboard']);
  const b=pdmscWebBootstrap(!!force);
  return{period:b.period,health:b.health,personnel:b.personnel,jobs:b.jobs,routes:b.routes,app:b.app};
}
