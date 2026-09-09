function pdmscNormalizeMonthKey_(value) {
  const s = String(value || '').replace(/\D/g,'');
  if (!/^\d{6}$/.test(s)) throw new Error('MonthKey ต้องเป็น YYYYMM');
  const y = Number(s.slice(0,4)), m = Number(s.slice(4,6));
  if (y < 2000 || m < 1 || m > 12) throw new Error('MonthKey ไม่ถูกต้อง: ' + s);
  return s;
}
function pdmscBuildPeriodMonths_(startMonthKey) {
  const k = pdmscNormalizeMonthKey_(startMonthKey);
  const y = Number(k.slice(0,4)), m = Number(k.slice(4,6));
  const out=[];
  for (let i=0;i<PDMSC.PERIOD_MONTHS;i++) {
    const d = new Date(y, m-1+i, 1);
    out.push(Utilities.formatDate(d, PDMSC.TIMEZONE, 'yyyyMM'));
  }
  return out;
}
function pdmscSetActivePeriod(startMonthKey) {
  const months = pdmscBuildPeriodMonths_(startMonthKey);
  const id = months[0] + '-' + months[months.length-1];
  PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_ACTIVE_PERIOD, id);
  pdmscLog_('SET_ACTIVE_PERIOD','OK',{id:id,months:months});
  return {periodId:id, months:months};
}
function pdmscGetActivePeriod() {
  const id = PropertiesService.getDocumentProperties().getProperty(PDMSC.PROP_ACTIVE_PERIOD) || '';
  if (!id) return {periodId:'',months:[]};
  return {periodId:id,months:pdmscBuildPeriodMonths_(id.slice(0,6))};
}
