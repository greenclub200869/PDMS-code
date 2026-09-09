function pdmscWebMonthLabel_(monthKey) {
  const k=String(monthKey||'');
  if(!/^\d{6}$/.test(k)) return k;
  const months=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return months[Number(k.slice(4,6))-1]+' '+String(Number(k.slice(0,4))+543);
}
function pdmscWebSafeDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v,PDMSC.TIMEZONE,'yyyy-MM-dd HH:mm:ss');
  return v == null ? '' : String(v);
}
function pdmscWebPeriodView_() {
  const p=pdmscGetActivePeriod();
  return {
    periodId:p.periodId||'',
    months:(p.months||[]).map(k=>({key:k,label:pdmscWebMonthLabel_(k)}))
  };
}
function pdmscWebRouteCatalog_() {
  return [
    {id:'dashboard',label:'ดูภาพรวมระบบ',enabled:true},
    {id:'personnel',label:'จัดการข้อมูลบุคลากร',enabled:true},
    {id:'settings',label:'ตั้งค่าระบบ',enabled:true},
    {id:'leave',label:'นำเข้าและจัดการข้อมูลลา',enabled:true},
    {id:'attendance',label:'นำเข้าและตรวจข้อมูลลงเวลา',enabled:true},
    {id:'review',label:'ตรวจสอบและตัดสินรายการกำกวม',enabled:true},
    {id:'finalevents',label:'ตรวจผลก่อนบันทึกและยกเว้น',enabled:true},
    {id:'statistics',label:'ดูสถิติและรายละเอียด',enabled:true},
    {id:'documents',label:'ตรวจผู้เข้าเกณฑ์และออกหนังสือ',enabled:true},
    {id:'system',label:'ตรวจสุขภาพและกู้คืนระบบ',enabled:true}
  ];
}
