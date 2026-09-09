function pdmscWebLeavePeriodChoices_(){if(typeof pdmscPeriodSeedFromProperty_==='function')pdmscPeriodSeedFromProperty_();return pdmscPeriodRows_().map(x=>({periodId:x.periodId,name:x.name,startDate:pdmscS01DateUi_(x.startDate),endDate:pdmscS01DateUi_(x.endDate),active:!!x.active,lockStatus:x.lockStatus}));}
function pdmscWebLeaveBootstrap(){const p=pdmscGetActivePeriod();return{period:{periodId:p.periodId,months:(p.months||[]).map(k=>({key:k,label:pdmscWebMonthLabel_(k)}))},periods:pdmscWebLeavePeriodChoices_()};}
function pdmscWebLeaveSetPeriod(periodId){pdmscPeriodActivate_(periodId);const p=pdmscGetActivePeriod();pdmscWebCacheClear_(['dashboard','leave','settings','leave-active','settings-tab-period']);if(typeof pdmscWebInvalidateOperationalCaches_==='function')pdmscWebInvalidateOperationalCaches_(p.months||[]);return{ok:true,period:{periodId:p.periodId,months:p.months.map(k=>({key:k,label:pdmscWebMonthLabel_(k)}))},periods:pdmscWebLeavePeriodChoices_()};}
function pdmscWebLeavePreview(text){return pdmscLeavePreviewPaste(text);}
function pdmscWebLeaveCommit(importId,fingerprint){const r=pdmscLeaveCommit(importId,fingerprint),p=pdmscGetActivePeriod();pdmscWebCacheClear_(['leave','leave-active','dashboard'].concat((p.months||[]).map(k=>'statistics-'+k)));if(typeof pdmscWebInvalidateOperationalCaches_==='function')pdmscWebInvalidateOperationalCaches_(p.months||[]);if(typeof pdmscWebInvalidateWarningCaches_==='function')pdmscWebInvalidateWarningCaches_();return r;}
function pdmscWebLeaveActiveDataset_(){const key='leave-active';const cached=pdmscWebCacheGet_(key);if(cached)return cached;const rows=pdmscLeaveListActive_();pdmscWebCachePut_(key,rows,45);return rows;}
function pdmscWebLeaveList(offset,limit){const rows=pdmscWebLeaveActiveDataset_(),start=Math.max(0,Number(offset)||0),n=Math.max(1,Math.min(Number(limit)||200,500));return{total:rows.length,offset:start,limit:n,items:rows.slice(start,start+n)};}


function pdmscWebLeaveListQuery(query){
  query=query||{};
  const all=pdmscWebLeaveActiveDataset_();
  const search=pdmscNormalizeText_(query.search).toLowerCase();
  const leaveType=pdmscNormalizeText_(query.leaveType);
  const department=pdmscNormalizeText_(query.department);
  const dateFrom=pdmscLeaveDate_(query.dateFrom||'');
  const dateTo=pdmscLeaveDate_(query.dateTo||'');
  const sort=pdmscNormalizeText_(query.sort)||'DATE_DESC';
  let pageSize=Number(query.pageSize)||100;
  if([50,100,200].indexOf(pageSize)<0)pageSize=100;

  let rows=all.filter(x=>{
    if(search){
      const hay=(pdmscNormalizeText_(x.empId)+' '+pdmscNormalizeText_(x.name)+' '+pdmscNormalizeText_(x.department)).toLowerCase();
      if(hay.indexOf(search)<0)return false;
    }
    if(leaveType&&pdmscMasterNormalize_(x.leaveType)!==pdmscMasterNormalize_(leaveType))return false;
    if(department&&pdmscNormalizeText_(x.department)!==department)return false;
    const st=pdmscLeaveDate_(x.start),en=pdmscLeaveDate_(x.end)||st;
    if(dateFrom&&en&&pdmscLeaveDay_(en)<pdmscLeaveDay_(dateFrom))return false;
    if(dateTo&&st&&pdmscLeaveDay_(st)>pdmscLeaveDay_(dateTo))return false;
    return true;
  });

  const cmpText=(a,b)=>pdmscNormalizeText_(a).localeCompare(pdmscNormalizeText_(b),'th');
  rows.sort((a,b)=>{
    const ad=pdmscLeaveDate_(a.start),bd=pdmscLeaveDate_(b.start),at=ad?pdmscLeaveDay_(ad):0,bt=bd?pdmscLeaveDay_(bd):0;
    if(sort==='DATE_ASC')return at-bt||cmpText(a.name,b.name);
    if(sort==='NAME_ASC')return cmpText(a.name,b.name)||at-bt;
    if(sort==='TYPE_ASC')return cmpText(a.leaveType,b.leaveType)||at-bt||cmpText(a.name,b.name);
    if(sort==='DEPARTMENT_ASC')return cmpText(a.department,b.department)||cmpText(a.name,b.name)||at-bt;
    return bt-at||cmpText(a.name,b.name);
  });

  const total=rows.length,totalAll=all.length,totalPages=Math.max(1,Math.ceil(total/pageSize));
  let page=Math.max(1,Number(query.page)||1);if(page>totalPages)page=totalPages;
  const start=(page-1)*pageSize;
  const leaveTypes=Array.from(new Set(all.map(x=>pdmscNormalizeText_(x.leaveType)).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'th'));
  const departments=Array.from(new Set(all.map(x=>pdmscNormalizeText_(x.department)).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'th'));
  return {total,totalAll,page,pageSize,totalPages,leaveTypes,departments,items:rows.slice(start,start+pageSize)};
}
