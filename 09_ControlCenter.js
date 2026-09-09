function pdmscOpenControlCenter() {
  const html=HtmlService.createHtmlOutputFromFile('ControlCenter').setWidth(640).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html,'PDMS — ศูนย์ควบคุม');
}
function pdmscControlCenterState() {
  return {version:PDMSC.VERSION,period:pdmscGetActivePeriod(),jobs:pdmscGetOpenJobs(),health:pdmscHealthCheck()};
}
