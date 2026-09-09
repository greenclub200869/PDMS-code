function pdmscOpenPersonnelCenter(){const html=HtmlService.createHtmlOutputFromFile('PersonnelCenter').setWidth(980).setHeight(720);SpreadsheetApp.getUi().showModelessDialog(html,'PDMS — บุคลากรและการจับคู่');}
function pdmscPersonnelCenterBootstrap(){return{version:PDMSC.VERSION,personnel:pdmscGetPersonnelList('',true)};}
function pdmscPersonnelCenterState(){return{version:PDMSC.VERSION,personnel:pdmscGetPersonnelList('',true),aliases:pdmscListAliases(''),scopes:pdmscListScopeExclusions(),qa:pdmscPersonnelQaReport_()};}
function pdmscPersonnelCenterPeople(){return pdmscGetPersonnelList('',true);}
function pdmscPersonnelCenterAliases(){return pdmscListAliases('');}
function pdmscPersonnelCenterScopes(){return pdmscListScopeExclusions();}
function pdmscPersonnelCenterQa(){return pdmscPersonnelQaReport_();}
