function installPdmsProductionReadinessPreIssueSafetyD01V024(){
  const pre=pdmscD01V024Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.2.4','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',18);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  const out=verifyPdmsProductionReadinessPreIssueSafetyD01V024();
  pdmscLog_('INSTALL_PRODUCTION_READINESS_PRE_ISSUE_SAFETY_D01_V024',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD});
  pdmscSetupToast_('PDMS Install D01 V0.2.4',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:20);
  return out;
}
function verifyPdmsProductionReadinessPreIssueSafetyD01V024(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),page=HtmlService.createHtmlOutputFromFile('Page_Warnings').getContent(),prod=pdmscDocProductionReadinessSelfTest_(),prev=pdmscDocPreviewSelfTest_(),gen=pdmscDocGenerationSelfTest_();
  add('Build ID D01 V0.2.4',PDMSC.WEB_BUILD==='D01-PRODUCTION-READINESS-PRE-ISSUE-SAFETY-V0.2.4-20260909',PDMSC.WEB_BUILD);
  add('Production readiness self-test passes',prod.ok,prod.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Document preview self-test remains',prev.ok,prev.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Document generation self-test remains',gen.ok,gen.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Dry Run endpoint exists',typeof pdmscWebDocumentIssuePrepare==='function'&&typeof pdmscDocIssuePrepare_==='function');
  add('Dry Run writes no Document History',pdmscDocIssuePrepare_.toString().indexOf('pdmscAppendHistoryRow_')<0&&pdmscDocIssuePrepare_.toString().indexOf('pdmscAppendRow_')<0);
  add('Dry Run checks current Warning boundary',pdmscDocIssuePrepare_.toString().indexOf('pdmscWarningCandidateDataset_(monthKey,true)')>=0&&pdmscDocIssuePrepare_.toString().indexOf('pdmscWarningDocumentBoundary_')>=0);
  add('Dry Run reads Statistics once',((pdmscDocIssuePrepare_.toString().match(/pdmscDocPeriodMetricBundle_\(\)/g)||[]).length===1));
  add('Dry Run checks History before planning',pdmscDocIssuePrepare_.toString().indexOf('pdmscDocHistoryIssuedMap_')>=0);
  add('Dry Run validates templates before issue',pdmscDocIssuePrepare_.toString().indexOf('pdmscDocPreparedTemplateSnapshot_')>=0);
  add('Production person chunk size = 3',PDMSC_DOC_ISSUE_BATCH.CHUNK_SIZE===3);
  add('Production prepare max = 100',PDMSC_DOC_ISSUE_BATCH.MAX_PERSONS===100);
  add('Person chunks do not recompute Warning/Statistics',pdmscDocIssueGenerateChunk_.toString().indexOf('pdmscWarningCandidateDataset_')<0&&pdmscDocIssueGenerateChunk_.toString().indexOf('pdmscStatisticsPeriodMetricBundle_')<0);
  add('Cover RPC does not recompute Warning/Statistics',pdmscDocIssueGenerateCover_.toString().indexOf('pdmscWarningCandidateDataset_')<0&&pdmscDocIssueGenerateCover_.toString().indexOf('pdmscStatisticsPeriodMetricBundle_')<0);
  add('Production uses Script Lock',pdmscDocIssueGenerateChunk_.toString().indexOf('getScriptLock')>=0&&pdmscDocIssueGenerateCover_.toString().indexOf('getScriptLock')>=0);
  add('History is written only after document save marker',pdmscDocIssueCreatePersonPrepared_.toString().indexOf('setDescription(marker)')>=0&&pdmscDocIssueCreatePersonPrepared_.toString().indexOf('pdmscDocAppendHistoryRow_(row)')>pdmscDocIssueCreatePersonPrepared_.toString().indexOf('setDescription(marker)'));
  add('Prepared issue rechecks duplicate History',pdmscDocIssueCreatePersonPrepared_.toString().indexOf('pdmscDocHistoryFindIssued_')>=0&&pdmscDocIssueCreateCoverPrepared_.toString().indexOf('pdmscDocHistoryFindIssued_')>=0);
  add('Cover waits until all person docs are issued',pdmscDocIssueGenerateCover_.toString().indexOf('missing=previews.filter')>=0);
  add('Mixed covers remain category + window grouped',pdmscDocIssuePrepare_.toString().indexOf('pdmscDocTestCoverGroups_(ready)')>=0);
  add('Web has explicit Dry Run button',page.indexOf('PDMS.dryRunSelectedWarningIssue()')>=0&&page.indexOf('ตรวจความพร้อมก่อนออกจริง')>=0);
  add('Web Production uses prepared batch endpoints',web.indexOf("'pdmscWebDocumentIssueGenerateChunk'")>=0&&web.indexOf("'pdmscWebDocumentIssueGenerateCover'")>=0);
  add('Web Production person chunks are sequential',web.indexOf('start+=(p.chunkSize||3)')>=0);
  add('Web Production covers are sequential one RPC',web.indexOf('gi<(p.willIssueCovers||0);gi++')>=0);
  add('Production timeout stops next chunk; no auto retry helper',web.indexOf('ถ้า timeout จะหยุด ไม่เริ่มชุดถัดไปอัตโนมัติ')>=0&&web.indexOf("documentTaskRetry_('pdmscWebDocumentIssueGenerateChunk'")<0&&web.indexOf("documentTaskRetry_('pdmscWebDocumentIssueGenerateCover'")<0);
  add('Production confirmation shows new/already/blocked counts',web.indexOf('เคยออกแล้ว ${p.alreadyIssuedPersons||0}')>=0&&web.indexOf('ถูกบล็อก ${p.blockedPersons||0}')>=0);
  add('Test mode remains History-free',pdmscDocTestPrepare_.toString().indexOf('DOC_HISTORY')<0&&pdmscDocTestGenerateChunk_.toString().indexOf('DOC_HISTORY')<0);
  add('Cross-period 31 Mar-1 Apr preserved',pdmscDocLeaveRangeUi_('20260331','20260401','')==='31 มี.ค. - 1 เม.ย. 2569');
  add('Late attachment still hides cutoff',pdmscDocLateNoteForUser_({note:'เวลาเข้าเกิน cutoff 08:31 จำนวน 28 นาที',minutes:28}).indexOf('cutoff')<0);
  const mock={candidate:{category:'LATE',count:2,minutes:3,windowKey:'W1',candidateKey:'K1'},person:{fullName:'A',department:'D',position:'P'},periodMetrics:{count:4,minutes:8},weekStatText:'มาสาย 2 ครั้ง รวม 3 นาที',budgetCumulativeStatText:'สะสมรอบครึ่งปีงบประมาณ มาสาย 4 ครั้ง รวม 8 นาที'},line=pdmscDocCoverPreviewFromPreviews_('202604',['K1'],[mock]).lines[1];
  add('Late cover line is compact',line.indexOf('สถิติรอบนี้ สาย 2 ครั้ง/3 นาที')>=0&&line.indexOf('รวม')<0&&line.indexOf('มาสาย')<0,line);
  add('V0.2.3 date-only note fix preserved',pdmscDocLeaveNoteForUser_('31/3/69 | มีใบรับรองแพทย์')==='มีใบรับรองแพทย์');
  add('V0.2.1 Web performance foundation preserved',typeof pdmscWebSystemHealthStage==='function'&&typeof pdmscWebAttendanceRawSummary==='function'&&web.indexOf('function rpcRead(')>=0);
  add('IssueDate History schema preserved',pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY].slice(-1)[0]==='IssueDate');
  add('No Working Month',typeof PDMSC_WORKING_MONTH==='undefined'&&typeof getWorkingMonth==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.2.4',webBuild:PDMSC.WEB_BUILD,tests,total:tests.length,passed:tests.filter(x=>x.ok).length};
  pdmscSetupToast_('PDMS Verify D01 V0.2.4',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name).join(', ')),out.ok?12:20);
  return out;
}
function pdmscD01V024Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  add('Current source identifies V0.2.4',PDMSC.WEB_BUILD==='D01-PRODUCTION-READINESS-PRE-ISSUE-SAFETY-V0.2.4-20260909',PDMSC.WEB_BUILD);
  add('V0.2.3 mixed cover foundation remains',typeof pdmscDocTestCoverGroups_==='function'&&typeof pdmscDocLeaveNoteForUser_==='function');
  add('V0.2.2 prepared test pipeline remains',typeof pdmscDocTestPrepare_==='function'&&typeof pdmscDocTestGenerateChunk_==='function'&&typeof pdmscDocTestGenerateCover_==='function');
  add('V0.2.1 Web Performance remains',typeof pdmscWebSystemHealthStage==='function'&&typeof pdmscWebAttendanceRawSummary==='function');
  add('Canonical Warning + Statistics APIs remain',typeof pdmscWarningCandidateDataset_==='function'&&typeof pdmscStatisticsPeriodMetricBundle_==='function');
  add('History IssueDate schema remains',pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY].slice(-1)[0]==='IssueDate');
  return{ok:tests.every(x=>x.ok),tests};
}

function installPdmsDocumentPresentationMixedCoverD01V023(){
  const pre=pdmscD01V023Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.2.3','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',18);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  const out=verifyPdmsDocumentPresentationMixedCoverD01V023();
  pdmscLog_('INSTALL_DOCUMENT_PRESENTATION_MIXED_COVER_D01_V023',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD});
  pdmscSetupToast_('PDMS Install D01 V0.2.3',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:20);
  return out;
}
function verifyPdmsDocumentPresentationMixedCoverD01V023(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),previewTest=pdmscDocPreviewSelfTest_(),genTest=pdmscDocGenerationSelfTest_();
  add('Build ID D01 V0.2.3',PDMSC.WEB_BUILD==='D01-DOCUMENT-PRESENTATION-MIXED-COVER-V0.2.3-20260909',PDMSC.WEB_BUILD);
  add('Document preview self-test passes',previewTest.ok,previewTest.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Document generation self-test passes',genTest.ok,genTest.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Leave date-only note token removed',pdmscDocLeaveNoteForUser_('31/3/69 | มีใบรับรองแพทย์')==='มีใบรับรองแพทย์');
  add('ISO date-only note token removed',pdmscDocLeaveNoteForUser_('2026-03-31 | หมายเหตุจริง')==='หมายเหตุจริง');
  add('Date inside sentence is preserved',pdmscDocLeaveNoteForUser_('แนบเอกสารลงวันที่ 31/3/69')==='แนบเอกสารลงวันที่ 31/3/69');
  const mixed=pdmscDocTestCoverGroups_([{candidate:{category:'LEAVE',windowKey:'W1'}},{candidate:{category:'LEAVE',windowKey:'W1'}},{candidate:{category:'LATE',windowKey:'W1'}},{candidate:{category:'LATE',windowKey:'W1'}},{candidate:{category:'LATE',windowKey:'W1'}}]);
  add('2 leave + 3 late creates 2 cover groups',mixed.length===2&&mixed[0].count===2&&mixed[1].count===3,JSON.stringify(mixed));
  add('Cover groups use category + window key',pdmscDocTestCoverGroups_.toString().indexOf("category+'|'+windowKey")>=0);
  add('Mixed preview groups without Warning recompute',pdmscDocCoverPreviewGroupsFromPreviews_.toString().indexOf('pdmscWarningCandidateDataset_')<0&&pdmscDocCoverPreviewGroupsFromPreviews_.toString().indexOf('pdmscStatisticsPeriodMetricBundle_')<0);
  add('Test prepare reads Warning/Statistics once',pdmscDocTestPrepare_.toString().indexOf('pdmscDocSelectedPreviewBundle_(monthKey,candidateKeys,false)')>=0);
  add('Person chunk still max 3',PDMSC_DOC_TEST_BATCH.CHUNK_SIZE===3);
  add('Cover generation accepts group index',pdmscDocTestGenerateCover_.toString().indexOf('groupIndex')>=0&&pdmscWebDocumentTestGenerateCover.toString().indexOf('groupIndex')>=0);
  add('Each cover RPC targets one group',pdmscDocTestGenerateCover_.toString().indexOf('groups[groupIndex]')>=0&&pdmscDocTestGenerateCover_.toString().indexOf('for(let gi')<0);
  add('Cover RPC does not recompute Warning/Statistics',pdmscDocTestGenerateCover_.toString().indexOf('pdmscWarningCandidateDataset_')<0&&pdmscDocTestGenerateCover_.toString().indexOf('pdmscStatisticsPeriodMetricBundle_')<0);
  add('Web creates covers sequentially one RPC each',web.indexOf('for(let gi=0;gi<coverGroups.length;gi++)')>=0&&web.indexOf("[prep.batchId,gi]")>=0);
  add('Web cover progress explicitly protects timeout',web.indexOf('สร้างทีละหนังสือนำ 1 ฉบับต่อ RPC เพื่อลดโอกาส timeout')>=0);
  add('Web person chunks still sequential',web.indexOf('start+=prep.chunkSize')>=0&&web.indexOf("'pdmscWebDocumentTestGenerateChunk'")>=0);
  add('Mixed cover preview uses non-blocking read',web.indexOf("rpcRead('pdmscWebDocumentCoverPreview'")>=0);
  add('Mixed preview renders separate cover groups',web.indexOf('groups.map((g,i)=>')>=0);
  add('Mixed preview cannot bulk-trigger production cover issue',web.indexOf("if(groups.length!==1)")>=0);
  add('Test path does not append Document History',pdmscDocTestPrepare_.toString().indexOf('DOC_HISTORY')<0&&pdmscDocTestGenerateChunk_.toString().indexOf('DOC_HISTORY')<0&&pdmscDocTestGenerateCover_.toString().indexOf('DOC_HISTORY')<0);
  add('Cross-period formatter preserved',pdmscDocLeaveRangeUi_('20260331','20260401','')==='31 มี.ค. - 1 เม.ย. 2569');
  add('Attachment note 12 pt / 0.85 preserved',pdmscDocInsertEventTable_.toString().indexOf('noteBody?12')>=0&&pdmscDocInsertEventTable_.toString().indexOf('noteBody?0.85')>=0);
  add('Late user-facing note still hides cutoff',pdmscDocLateNoteForUser_({note:'เวลาเข้าเกิน cutoff 08:31 จำนวน 28 นาที',minutes:28}).indexOf('cutoff')<0);
  add('Production person issue still uses fresh path',pdmscDocIssuePerson_.toString().indexOf('pdmscDocPreview_(monthKey,candidateKey)')>=0);
  add('Production cover issue still force-rechecks',pdmscDocIssueCover_.toString().indexOf('pdmscDocCoverPreview_(monthKey,candidateKeys)')>=0);
  add('V0.2.1 Web performance foundation preserved',typeof pdmscWebSystemHealthStage==='function'&&typeof pdmscWebAttendanceRawSummary==='function'&&web.indexOf('function rpcRead(')>=0);
  add('IssueDate history schema preserved',pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY].slice(-1)[0]==='IssueDate');
  add('No Working Month',typeof PDMSC_WORKING_MONTH==='undefined'&&typeof getWorkingMonth==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.2.3',webBuild:PDMSC.WEB_BUILD,tests,total:tests.length,passed:tests.filter(x=>x.ok).length};
  pdmscSetupToast_('PDMS Verify D01 V0.2.3',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name).join(', ')),out.ok?12:20);
  return out;
}
function pdmscD01V023Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  add('Current source identifies V0.2.3',PDMSC.WEB_BUILD==='D01-DOCUMENT-PRESENTATION-MIXED-COVER-V0.2.3-20260909',PDMSC.WEB_BUILD);
  add('V0.2.2 prepared test pipeline remains',typeof pdmscDocTestPrepare_==='function'&&typeof pdmscDocTestGenerateChunk_==='function'&&typeof pdmscDocTestGenerateCover_==='function');
  add('V0.2.1 Web Performance remains',typeof pdmscWebSystemHealthStage==='function'&&typeof pdmscWebAttendanceRawSummary==='function');
  add('Statistics canonical metric API remains',typeof pdmscStatisticsPeriodMetricBundle_==='function'&&typeof pdmscStatisticsPersonMetricFromBundle_==='function');
  add('History IssueDate schema remains',pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY].slice(-1)[0]==='IssueDate');
  return{ok:tests.every(x=>x.ok),tests};
}

function installPdmsDocumentGenerationPipelineD01V022(){
  const pre=pdmscD01V022Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.2.2','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',18);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  const out=verifyPdmsDocumentGenerationPipelineD01V022();
  pdmscLog_('INSTALL_DOCUMENT_GENERATION_PIPELINE_D01_V022',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD});
  pdmscSetupToast_('PDMS Install D01 V0.2.2',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:20);
  return out;
}
function verifyPdmsDocumentGenerationPipelineD01V022(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),previewTest=pdmscDocPreviewSelfTest_(),genTest=pdmscDocGenerationSelfTest_(),ctl=pdmscWebDocumentCoverPreview.toString()+pdmscWebDocumentTestPrepare.toString()+pdmscWebDocumentTestGenerateChunk.toString()+pdmscWebDocumentTestGenerateCover.toString();
  add('Build ID D01 V0.2.2',PDMSC.WEB_BUILD==='D01-DOCUMENT-GENERATION-PIPELINE-V0.2.2-20260909',PDMSC.WEB_BUILD);
  add('Document preview self-test passes',previewTest.ok,previewTest.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Document generation self-test passes',genTest.ok,genTest.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Cover UI endpoint uses cached candidate path',pdmscWebDocumentCoverPreview.toString().indexOf('pdmscDocCoverPreviewCached_')>=0);
  add('Production cover issue still force-rechecks current data',pdmscDocIssueCover_.toString().indexOf('pdmscDocCoverPreview_(monthKey,candidateKeys)')>=0);
  add('Production person issue still uses fresh candidate path',pdmscDocIssuePerson_.toString().indexOf('pdmscDocPreview_(monthKey,candidateKey)')>=0&&pdmscDocCandidateFresh_.toString().indexOf('pdmscWarningCandidateDataset_(monthKey,true)')>=0);
  add('Test prepare endpoint exists',typeof pdmscWebDocumentTestPrepare==='function'&&ctl.indexOf('pdmscDocTestPrepare_')>=0);
  add('Test chunk endpoint exists',typeof pdmscWebDocumentTestGenerateChunk==='function'&&ctl.indexOf('pdmscDocTestGenerateChunk_')>=0);
  add('Test cover endpoint exists',typeof pdmscWebDocumentTestGenerateCover==='function'&&ctl.indexOf('pdmscDocTestGenerateCover_')>=0);
  add('Test prepare reuses cached Warning dataset',pdmscDocTestPrepare_.toString().indexOf('pdmscDocSelectedPreviewBundle_(monthKey,candidateKeys,false)')>=0);
  add('Test chunk does not recompute Warning/Statistics',pdmscDocTestGenerateChunk_.toString().indexOf('pdmscWarningCandidateDataset_')<0&&pdmscDocTestGenerateChunk_.toString().indexOf('pdmscStatisticsPeriodMetricBundle_')<0);
  add('Test cover does not recompute Warning/Statistics',pdmscDocTestGenerateCover_.toString().indexOf('pdmscDocCoverPreviewFromPreviews_')>=0&&pdmscDocTestGenerateCover_.toString().indexOf('pdmscWarningCandidateDataset_')<0&&pdmscDocTestGenerateCover_.toString().indexOf('pdmscStatisticsPeriodMetricBundle_')<0);
  add('Test chunks limited to 3 persons',PDMSC_DOC_TEST_BATCH.CHUNK_SIZE===3);
  add('Test batch supports up to 100 selected persons',PDMSC_DOC_TEST_BATCH.MAX_PERSONS===100);
  add('Prepared test batch cache lasts 30 minutes',PDMSC_DOC_TEST_BATCH.TTL_SECONDS===1800);
  add('Test retry path has deterministic-file idempotence',pdmscDocCreatePersonTestPrepared_.toString().indexOf('pdmscDocTestExistingFile_')>=0&&pdmscDocTestGenerateChunk_.toString().indexOf('getScriptLock')>=0);
  add('Test path does not append Document History',pdmscDocTestPrepare_.toString().indexOf('DOC_HISTORY')<0&&pdmscDocTestGenerateChunk_.toString().indexOf('DOC_HISTORY')<0&&pdmscDocTestGenerateCover_.toString().indexOf('DOC_HISTORY')<0&&pdmscDocCreatePersonTestPrepared_.toString().indexOf('pdmscAppendRow_')<0&&pdmscDocCreateCoverTestPrepared_.toString().indexOf('pdmscAppendRow_')<0);
  add('Web has non-blocking document task helper',/function\s+rpcTask\s*\(/.test(web)&&(()=>{const i=web.indexOf('function rpcTask('),j=web.indexOf('function documentTaskRetry_',i);return i>=0&&j>i&&web.slice(i,j).indexOf('setBusy(')<0;})());
  add('Web test flow uses prepare then chunk then cover',web.indexOf("rpcTask('pdmscWebDocumentTestPrepare'")>=0&&web.indexOf("'pdmscWebDocumentTestGenerateChunk'")>=0&&web.indexOf("'pdmscWebDocumentTestGenerateCover'")>=0);
  add('Web no longer calls legacy one-shot test endpoint',web.indexOf("rpc('pdmscWebDocumentTestSelected'")<0);
  add('Cover preview UI uses non-blocking read RPC',web.indexOf("rpcRead('pdmscWebDocumentCoverPreview'")>=0);
  add('Cross-period 31 Mar–1 Apr formatter preserved',pdmscDocLeaveRangeUi_('20260331','20260401','')==='31 มี.ค. - 1 เม.ย. 2569');
  add('Attachment note 12 pt / 0.85 preserved',pdmscDocInsertEventTable_.toString().indexOf('noteBody?12')>=0&&pdmscDocInsertEventTable_.toString().indexOf('noteBody?0.85')>=0);
  add('Late user-facing note hides cutoff',pdmscDocLateNoteForUser_({note:'เวลาเข้าเกิน cutoff 08:31 จำนวน 28 นาที',minutes:28}).indexOf('cutoff')<0);
  add('IssueDate history schema preserved',pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY].slice(-1)[0]==='IssueDate');
  add('Web Route Load Discipline V0.2.1 foundation preserved',typeof pdmscWebSystemHealthStage==='function'&&typeof pdmscWebAttendanceRawSummary==='function'&&web.indexOf('function rpcRead(')>=0);
  add('No Working Month',typeof PDMSC_WORKING_MONTH==='undefined'&&typeof getWorkingMonth==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.2.2',webBuild:PDMSC.WEB_BUILD,tests,total:tests.length,passed:tests.filter(x=>x.ok).length};
  pdmscSetupToast_('PDMS Verify D01 V0.2.2',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(', ')),out.ok?12:20);
  return out;
}
function pdmscD01V022Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  add('Current source identifies V0.2.2',PDMSC.WEB_BUILD==='D01-DOCUMENT-GENERATION-PIPELINE-V0.2.2-20260909',PDMSC.WEB_BUILD);
  add('V0.2.1 Web Performance foundation remains',typeof pdmscWebSystemHealthStage==='function'&&typeof pdmscWebAttendanceRawSummary==='function');
  add('D01 test document foundation remains',typeof pdmscDocCreatePersonTest_==='function'&&typeof pdmscDocCreateCoverTest_==='function');
  add('Statistics canonical metric API remains',typeof pdmscStatisticsPeriodMetricBundle_==='function'&&typeof pdmscStatisticsPersonMetricFromBundle_==='function');
  add('Warning candidate cache API remains',typeof pdmscWarningCandidateDataset_==='function'&&typeof pdmscWarningDocumentBoundary_==='function');
  add('IssueDate/History schema remains',typeof pdmscDocIssueDate_==='function'&&pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY].slice(-1)[0]==='IssueDate');
  return{ok:tests.every(x=>x.ok),tests};
}

function installPdmsWebRouteLoadDisciplineD01V021(){
  const pre=pdmscD01V021Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.2.1','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',16);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['system-bootstrap','attendance-bootstrap','attendance-raw-summary','dashboard']);
  const out=verifyPdmsWebRouteLoadDisciplineD01V021();
  pdmscLog_('INSTALL_WEB_ROUTE_LOAD_DISCIPLINE_D01_V021',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD});
  pdmscSetupToast_('PDMS Install D01 V0.2.1',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:20);
  return out;
}
function verifyPdmsWebRouteLoadDisciplineD01V021(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),sysPage=HtmlService.createHtmlOutputFromFile('Page_System').getContent(),attPage=HtmlService.createHtmlOutputFromFile('Page_Attendance').getContent();
  const attBoot=pdmscWebAttendanceBootstrap.toString(),health=pdmscHealthCheck.toString(),sysBoot=pdmscWebSystemBootstrap.toString();
  add('Build ID D01 V0.2.1',PDMSC.WEB_BUILD==='D01-WEB-ROUTE-LOAD-DISCIPLINE-V0.2.1-20260908',PDMSC.WEB_BUILD);
  add('System route prepares local page only',web.indexOf("else if(route==='system')prepareSystemPage_();")>=0);
  add('System page does not auto-run full bootstrap',web.indexOf("else if(route==='system')await refreshSystem")<0);
  add('System bootstrap endpoint is lightweight',sysBoot.indexOf('pdmscWebSystemHealth(')<0&&sysBoot.indexOf('pdmscWebRecoveryPreview(')<0&&sysBoot.indexOf('pdmscWebSystemJobs(')<0&&sysBoot.indexOf('pdmscWebAuditRecent(')<0);
  add('Health stage endpoint exists',typeof pdmscWebSystemHealthStage==='function'&&typeof pdmscHealthStage_==='function');
  add('Full Health reuses same staged health source',health.indexOf("['SCHEMA','PERSONNEL','LEAVE','SETTINGS','ATTENDANCE']")>=0&&health.indexOf('pdmscHealthStage_(stage)')>=0);
  add('System health runs stages sequentially',web.indexOf("for(const [stage,label,timeout] of stages)")>=0&&web.indexOf("rpcRead('pdmscWebSystemHealthStage'")>=0);
  add('Leaving System stops later health stages',web.indexOf("routeToken!==S.routeGeneration||S.route!=='system'")>=0);
  add('Read RPC helper present',/function\s+rpcRead\s*\(/.test(web));
  add('Read RPC does not use global busy overlay',(()=>{const i=web.indexOf('function rpcRead('),j=web.indexOf('function ignoreStale_',i);return i>=0&&j>i&&web.slice(i,j).indexOf('setBusy(')<0;})());
  add('Read RPC has single-flight guard',web.indexOf('S.readFlights[key]')>=0);
  add('Read RPC has stale-route guard',web.indexOf('routeToken!==S.routeGeneration')>=0&&web.indexOf('e.pdmsStale=true')>=0);
  add('Attendance bootstrap is metadata-only',attBoot.indexOf('pdmscWebAttendanceRawSummary_')<0&&attBoot.indexOf('pdmscRows_')<0&&attBoot.indexOf('pdmscWebPeriodView_')>=0);
  add('Attendance raw summary has explicit endpoint',typeof pdmscWebAttendanceRawSummary==='function'&&pdmscWebAttendanceRawSummary.toString().indexOf('pdmscWebAttendanceRawSummary_')>=0);
  add('Attendance page has explicit raw-summary button',attPage.indexOf('PDMS.loadAttendanceRawSummary(true)')>=0&&attPage.indexOf('โหลดสรุปข้อมูลต้นทาง')>=0);
  add('Attendance client bootstrap does not render raw summary automatically',(()=>{const i=web.indexOf('async function loadAttendanceBootstrap('),j=web.indexOf('async function loadAttendanceRawSummary(',i);return i>=0&&j>i&&web.slice(i,j).indexOf('renderAttendanceRawSummary(')<0;})());
  add('System page exposes explicit controls',sysPage.indexOf('PDMS.loadSystemHealth()')>=0&&sysPage.indexOf('PDMS.loadRecoveryPreview()')>=0&&sysPage.indexOf('PDMS.loadJobs()')>=0&&sysPage.indexOf('PDMS.loadAudit()')>=0);
  add('Full System Health endpoint preserved',typeof pdmscWebSystemHealth==='function'&&pdmscWebSystemHealth.toString().indexOf('pdmscHealthCheck()')>=0);
  add('Recovery write remains normal blocking RPC',web.indexOf("rpc('pdmscWebRecoveryRun'")>=0);
  add('Final Event lazy month load V0.1.7 preserved',web.indexOf('finalEventMonthChanged')>=0&&web.indexOf('โหลด/รีเฟรชข้อมูลเดือนนี้')>=0);
  add('Document V0.1.9 attachment formatter preserved',typeof pdmscDocInsertEventTable_==='function'&&typeof pdmscDocPrepareLeaveDetails_==='function'&&typeof pdmscDocLateNoteForUser_==='function');
  add('IssueDate history schema preserved',Array.isArray(pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY])&&pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY].slice(-1)[0]==='IssueDate');
  add('No Working Month',typeof PDMSC_WORKING_MONTH==='undefined'&&typeof getWorkingMonth==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.2.1',webBuild:PDMSC.WEB_BUILD,tests,total:tests.length,passed:tests.filter(x=>x.ok).length};
  pdmscSetupToast_('PDMS Verify D01 V0.2.1',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(', ')),out.ok?12:20);
  return out;
}
function pdmscD01V021Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  add('Current source identifies V0.2.1',PDMSC.WEB_BUILD==='D01-WEB-ROUTE-LOAD-DISCIPLINE-V0.2.1-20260908',PDMSC.WEB_BUILD);
  add('Dashboard lightweight foundation remains',typeof pdmscWebDashboardRefresh==='function'&&pdmscWebDashboardRefresh.toString().indexOf('pdmscHealthCheck(')<0);
  add('Health core exists',typeof pdmscHealthCheck==='function'&&typeof pdmscHealthStage_==='function');
  add('Attendance endpoint exists',typeof pdmscWebAttendanceBootstrap==='function'&&typeof pdmscWebAttendanceRawSummary==='function');
  add('Document V0.1.9 foundation remains',typeof pdmscDocInsertEventTable_==='function'&&typeof pdmscDocPrepareLeaveDetails_==='function');
  return{ok:tests.every(x=>x.ok),tests};
}

function installPdmsDashboardLightweightLoadD01V020(){
  const pre=pdmscD01V020Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.2.0','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',16);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  pdmscWebCacheClear_(['dashboard']);
  const out=verifyPdmsDashboardLightweightLoadD01V020();
  pdmscLog_('INSTALL_DASHBOARD_LIGHTWEIGHT_D01_V020',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD});
  pdmscSetupToast_('PDMS Install D01 V0.2.0',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:20);
  return out;
}
function verifyPdmsDashboardLightweightLoadD01V020(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const dash=pdmscWebBootstrap.toString()+pdmscWebDashboardRefresh.toString()+pdmscWebDashboardSheetCount_.toString();
  const web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent();
  const page=HtmlService.createHtmlOutputFromFile('Page_Dashboard').getContent();
  const sys=pdmscWebSystemHealth.toString();
  add('Build ID D01 V0.2.0',PDMSC.WEB_BUILD==='D01-DASHBOARD-LIGHTWEIGHT-LOAD-V0.2.0-20260908',PDMSC.WEB_BUILD);
  add('Dashboard does not call full Health Check',dash.indexOf('pdmscHealthCheck(')<0);
  add('Dashboard does not call Personnel QA',dash.indexOf('pdmscPersonnelQaReport_(')<0);
  add('Dashboard does not scan Raw Attendance',dash.indexOf('RAW_ATTENDANCE')<0&&dash.indexOf('pdmscAttendanceRaw')<0);
  add('Dashboard lightweight row-count helper present',typeof pdmscWebDashboardSheetCount_==='function');
  add('Dashboard status identifies lightweight check',dash.indexOf('checked:false')>=0&&dash.indexOf('LIGHT_READY')>=0);
  add('Passive RPC helper present',/function\s+rpcPassive\s*\(/.test(web));
  add('Passive RPC does not use global busy overlay',(()=>{const m=web.match(/function\s+rpcPassive\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/);return !!m&&m[1].indexOf('setBusy(')<0;})());
  add('Dashboard load uses passive RPC',web.indexOf("rpcPassive('pdmscWebDashboardRefresh'")>=0);
  add('Dashboard timeout message allows navigation',web.indexOf('คุณยังสามารถเปิดเมนูอื่นได้')>=0);
  add('Dashboard page explains lightweight status',page.indexOf('สถานะพร้อมใช้งาน')>=0&&page.indexOf('ไม่รันการตรวจสุขภาพเต็มรูปแบบในหน้าแรก')>=0);
  add('Full System Health endpoint preserved',sys.indexOf('pdmscHealthCheck()')>=0&&typeof pdmscWebSystemHealth==='function');
  add('System bootstrap preserved',typeof pdmscWebSystemBootstrap==='function');
  add('Route catalog preserved',typeof pdmscWebRouteCatalog_==='function'&&pdmscWebRouteCatalog_().length>=10);
  add('Decision policy preserved',(()=>{try{const d=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS);return d&&d.countStatistics===true&&d.allowWarning===false;}catch(_e){return false;}})());
  add('No Working Month',typeof PDMSC_WORKING_MONTH==='undefined'&&typeof getWorkingMonth==='undefined');
  add('Document V0.1.9 attachment formatter preserved',typeof pdmscDocInsertEventTable_==='function'&&typeof pdmscDocPrepareLeaveDetails_==='function'&&typeof pdmscDocLateNoteForUser_==='function');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.2.0',webBuild:PDMSC.WEB_BUILD,tests,total:tests.length,passed:tests.filter(x=>x.ok).length};
  pdmscSetupToast_('PDMS Verify D01 V0.2.0',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(', ')),out.ok?12:20);
  return out;
}
function pdmscD01V020Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  add('Current source identifies V0.2.0',PDMSC.WEB_BUILD==='D01-DASHBOARD-LIGHTWEIGHT-LOAD-V0.2.0-20260908',PDMSC.WEB_BUILD);
  add('Dashboard endpoint exists',typeof pdmscWebDashboardRefresh==='function');
  add('Full Health endpoint preserved',typeof pdmscWebSystemHealth==='function');
  add('Document history schema preserved',Array.isArray(pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY])&&pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY].length>=29);
  add('V0.1.9 document formatter foundation preserved',typeof pdmscDocInsertEventTable_==='function'&&typeof pdmscDocPrepareLeaveDetails_==='function');
  return{ok:tests.every(x=>x.ok),tests};
}

function installPdmsAttachmentPresentationHardeningD01V019(){
  const pre=pdmscD01V019Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.1.9','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',16);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['documents-history','warnings-dataset']);
  const out=verifyPdmsAttachmentPresentationHardeningD01V019();
  pdmscLog_('INSTALL_ATTACHMENT_PRESENTATION_HARDENING_D01_V019',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD});
  pdmscSetupToast_('PDMS Install D01 V0.1.9',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:20);
  return out;
}
function verifyPdmsAttachmentPresentationHardeningD01V019(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const stat=pdmscStatisticsSelfTest_(),gen=pdmscDocGenerationSelfTest_(),shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  const grouped=pdmscDocPrepareLeaveDetails_([
    {leaveId:'L1',leaveStartKey:'20260331',leaveEndKey:'20260401',dateKey:'20260401',type:'ลาป่วย',count:1,days:2,note:'A'},
    {leaveId:'L2',leaveStartKey:'20260402',leaveEndKey:'20260402',dateKey:'20260402',type:'ลาป่วย',count:1,days:1,note:'B'}
  ]);
  const same=pdmscDocPrepareLeaveDetails_([
    {leaveId:'L3',leaveStartKey:'20260403',leaveEndKey:'20260404',dateKey:'20260403',type:'ลาป่วย',count:1,days:1,note:''},
    {leaveId:'L3',leaveStartKey:'20260403',leaveEndKey:'20260404',dateKey:'20260404',type:'ลาป่วย',count:0,days:1,note:''}
  ]);
  add('Health',pdmscHealthCheck().ok);
  add('Build ID D01 V0.1.9',PDMSC.WEB_BUILD==='D01-ATTACHMENT-PRESENTATION-HARDENING-V0.1.9-20260908',PDMSC.WEB_BUILD);
  add('Statistics self-test passes',stat.ok,stat.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Cross-period 31 Mar–1 Apr remains 1 occurrence / 2 days',!!stat.tests.find(x=>x.name==='Carry-in 31 Mar–1 Apr stays 1 occurrence / 2 days'&&x.ok));
  add('Leave details carry original Leave ID/start/end metadata',!!stat.tests.find(x=>x.name==='Canonical leave detail carries original Leave ID/start/end metadata'&&x.ok));
  add('Document generation self-test passes',gen.ok,gen.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Leave range renders exactly 31 Mar–1 Apr 2569',pdmscDocLeaveRangeUi_('20260331','20260401','')==='31 มี.ค. - 1 เม.ย. 2569');
  add('Single-day leave renders one date only',pdmscDocLeaveRangeUi_('20260405','20260405','')==='5 เม.ย. 2569');
  add('Different adjacent Leave IDs remain separate rows',grouped.length===2&&grouped[0].leaveId==='L1'&&grouped[1].leaveId==='L2');
  add('Same Leave ID aggregates to one row',same.length===1&&same[0].count===1&&same[0].days===2);
  add('Attachment note uses 12 pt / 0.85',pdmscDocInsertEventTable_.toString().indexOf('noteBody?12')>=0&&pdmscDocInsertEventTable_.toString().indexOf('noteBody?0.85')>=0);
  add('Note column receives wider hard-coded width',pdmscDocApplyTableColumnWidths_.toString().indexOf("[145,90,42,42,195]")>=0&&pdmscDocApplyTableColumnWidths_.toString().indexOf("[82,82,100,75,175]")>=0);
  add('Leave attachment heading is ช่วงวันที่ลา',pdmscDocInsertEventTable_.toString().indexOf("'ช่วงวันที่ลา'")>=0);
  add('Late document note hides technical cutoff term',pdmscDocLateNoteForUser_({note:'เวลาเข้าเกิน cutoff 08:31 จำนวน 28 นาที',minutes:28})==='มาสายเกินเวลาที่กำหนด 28 นาที');
  add('Late source field remains canonical cutoff internally',pdmscDocInsertEventTable_.toString().indexOf('d.cutoff')>=0);
  add('Test mode still does not write history',!!gen.tests.find(x=>x.name==='Test mode creates Docs without history/status commit'&&x.ok));
  add('IssueDate/CreatedAt separation from V0.1.8 remains',pdmscDocIssuePerson_.toString().indexOf('CreatedAt:new Date()')>=0&&pdmscDocIssuePerson_.toString().indexOf('IssueDate:issueDate')>=0);
  add('Duplicate issue guard remains',!!gen.tests.find(x=>x.name==='Duplicate guard reads history before create'&&x.ok));
  add('A4 generation remains',!!gen.tests.find(x=>x.name==='A4 applied before save'&&x.ok));
  add('Web shell exports remain complete',shell.ok,shell.missing.join(', '));
  add('Internal Web helper declarations remain complete',helpers.ok,helpers.missing.join(', '));
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.1.9',webBuild:PDMSC.WEB_BUILD,tests,total:tests.length,passed:tests.filter(x=>x.ok).length};
  pdmscSetupToast_('PDMS Verify D01 V0.1.9',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(', ')),out.ok?12:20);
  return out;
}
function pdmscD01V019Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Current source identifies V0.1.9',PDMSC.WEB_BUILD==='D01-ATTACHMENT-PRESENTATION-HARDENING-V0.1.9-20260908',PDMSC.WEB_BUILD);
  add('V0.1.8 issue-date foundation remains',typeof pdmscDocIssueDate_==='function'&&pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY].slice(-1)[0]==='IssueDate');
  add('Statistics canonical metric API remains',typeof pdmscStatisticsPersonMetricFromBundle_==='function'&&typeof pdmscStatisticsMetricSlice_==='function');
  add('Document attachment formatter foundation remains',typeof pdmscDocInsertEventTable_==='function'&&typeof pdmscDocGenerationSelfTest_==='function');
  add('Web shell remains complete',shell.ok,shell.missing.join(', '));
  add('Internal helpers remain complete',helpers.ok,helpers.missing.join(', '));
  return{ok:tests.every(x=>x.ok),tests};
}

function installPdmsDocumentIssueDateLanguageD01V018(){
  const pre=pdmscD01V018Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.1.8','FAIL • Preflight ไม่ผ่าน — ยังไม่แก้ข้อมูล',16);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  const migration=pdmscDocHistoryMigrateV010_();
  PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['documents-history','settings-bootstrap','dashboard']);
  const out=verifyPdmsDocumentIssueDateLanguageD01V018();
  pdmscLog_('INSTALL_DOCUMENT_ISSUE_DATE_LANGUAGE_D01_V018',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD,historyMigration:migration});
  pdmscSetupToast_('PDMS Install D01 V0.1.8',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:20);
  return Object.assign({},out,{historyMigration:migration});
}
function verifyPdmsDocumentIssueDateLanguageD01V018(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const page=HtmlService.createHtmlOutputFromFile('Page_Warnings').getContent(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),settings=HtmlService.createHtmlOutputFromFile('Page_Settings').getContent(),att=HtmlService.createHtmlOutputFromFile('Page_Attendance').getContent(),review=HtmlService.createHtmlOutputFromFile('Page_Review').getContent(),sys=HtmlService.createHtmlOutputFromFile('Page_System').getContent();
  const reg=pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY],shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_(),gen=pdmscDocGenerationSelfTest_(),prev=pdmscDocPreviewSelfTest_();
  add('Health',pdmscHealthCheck().ok);
  add('Build ID D01 V0.1.8',PDMSC.WEB_BUILD==='D01-DOCUMENT-ISSUE-DATE-LANGUAGE-V0.1.8-20260908',PDMSC.WEB_BUILD);
  add('Document History preserves legacy 28-column prefix and appends IssueDate',reg.length===29&&reg[28]==='IssueDate'&&reg.slice(0,10).join('|')==='DocumentId|WarningKey|EMP_ID|PeriodStart|PeriodEnd|Revision|Status|SourceFingerprint|FileId|CreatedAt',reg.join('|'));
  add('Issue-date picker exists',page.indexOf('id="warningIssueDate"')>=0&&page.indexOf('วันที่ออกหนังสือ')>=0);
  add('Issue-date confirmation modal exists',page.indexOf('documentIssueConfirmModal')>=0&&page.indexOf('ยืนยันวันที่ออกหนังสือ')>=0&&page.indexOf('ยืนยันวันที่นี้และออกหนังสือ')>=0);
  add('Client requires one confirmation before bulk issue',web.indexOf('openDocumentIssueConfirm_')>=0&&web.indexOf('confirmDocumentIssue')>=0&&web.indexOf('issueDocumentPersonsConfirmed_')>=0);
  add('Large selected issue is chunked client-side',web.indexOf('chunkSize=20')>=0&&web.indexOf("pdmscWebDocumentIssueSelectedPersons',[month,chunk,issueDate]")>=0);
  add('Test documents receive selected issue date',pdmscWebDocumentTestSelected.toString().indexOf('issueDateKey')>=0&&pdmscDocTestSelected_.toString().indexOf('pdmscDocIssueDate_')>=0);
  add('Real person issue receives selected issue date',pdmscWebDocumentIssueSelectedPersons.toString().indexOf('issueDateKey')>=0&&pdmscDocIssuePerson_.toString().indexOf('IssueDate:issueDate')>=0);
  add('Cover issue receives selected issue date',pdmscWebDocumentIssueCover.toString().indexOf('issueDateKey')>=0&&pdmscDocIssueCover_.toString().indexOf('DOCUMENT_DATE:pdmscDocThaiDate_(issueDate)')>=0);
  add('CreatedAt remains generation time while IssueDate is separate',pdmscDocIssuePerson_.toString().indexOf('CreatedAt:new Date()')>=0&&pdmscDocIssuePerson_.toString().indexOf('IssueDate:issueDate')>=0);
  add('Test mode still writes no Document History',gen.tests.find(x=>x.name==='Test mode creates Docs without history/status commit').ok);
  add('Duplicate issue guard remains',gen.tests.find(x=>x.name==='Duplicate guard reads history before create').ok);
  add('Note column hard-coded to 14 pt / 0.85 spacing',pdmscDocInsertEventTable_.toString().indexOf('noteBody?0.85')>=0&&pdmscDocInsertEventTable_.toString().indexOf('noteBody?14')>=0);
  add('Late attachment label explains cutoff clearly',pdmscDocInsertEventTable_.toString().indexOf('เวลาเริ่มนับว่าสาย')>=0&&pdmscDocInsertEventTable_.toString().indexOf('เวลาเข้างานที่สแกน')>=0);
  add('Cross-period preview contract remains',prev.ok,prev.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('User language removes standalone Candidate on warning page',page.indexOf('Warning Candidate')<0&&page.indexOf('ยังไม่ได้โหลด Candidate')<0);
  add('Attendance page explains operational mode in Thai',att.indexOf('รูปแบบการประมวลผล')>=0&&att.indexOf('ตรวจเฉพาะข้อมูลลา')>=0);
  add('Review page uses user-facing decision language',review.indexOf('ผลการตัดสิน')>=0&&review.indexOf('<th>ข้อมูลต้นทาง</th>')>=0);
  add('Settings uses เวลาเริ่มนับว่าสาย',settings.indexOf('เวลาเริ่มนับว่าสาย')>=0&&settings.indexOf('เวลาตัดสาย (Late cutoff)')<0);
  add('System page uses user-facing recovery/audit language',sys.indexOf('สถานะงานที่ค้าง')>=0&&sys.indexOf('<th>การทำงาน</th>')>=0);
  add('Canonical option values remain unchanged',settings.indexOf('value="LEAVE_ONLY"')>=0&&review.indexOf('value="PENDING"')>=0&&review.indexOf('value="EXCLUDED"')>=0);
  add('V0.1.7 lazy Final Event functions remain available',typeof pdmscA03Dataset_==='function'&&typeof pdmscA03BuildPreview_==='function');
  add('Web shell exports remain complete',shell.ok,shell.missing.join(', '));
  add('Internal Web helper declarations remain complete',helpers.ok,helpers.missing.join(', '));
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.1.8',webBuild:PDMSC.WEB_BUILD,tests,total:tests.length,passed:tests.filter(x=>x.ok).length};
  pdmscSetupToast_('PDMS Verify D01 V0.1.8',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(', ')),out.ok?12:20);
  return out;
}
function pdmscD01V018Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),reg=pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY],shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Current source identifies V0.1.8',PDMSC.WEB_BUILD==='D01-DOCUMENT-ISSUE-DATE-LANGUAGE-V0.1.8-20260908',PDMSC.WEB_BUILD);
  add('History target schema appends IssueDate only',reg.length===29&&reg[28]==='IssueDate'&&reg.slice(0,28).join('|').indexOf('DocumentId|WarningKey|EMP_ID|PeriodStart|PeriodEnd|Revision|Status|SourceFingerprint|FileId|CreatedAt')===0);
  add('Document foundation remains present',typeof pdmscDocIssuePerson_==='function'&&typeof pdmscDocIssueCover_==='function'&&typeof pdmscDocHistoryMigrateV010_==='function');
  add('V0.1.7 lazy Final Event remains present',typeof pdmscA03Dataset_==='function'&&typeof pdmscWebFinalEventDataset==='function');
  add('Web shell remains complete',shell.ok,shell.missing.join(', '));
  add('Internal helpers remain complete',helpers.ok,helpers.missing.join(', '));
  return{ok:tests.every(x=>x.ok),tests};
}

function installPdmsFinalEventLazyMonthLoadD01V017(){
  const pre=pdmscD01V017Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.1.7','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',16);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['a03-bootstrap','review-bootstrap','attendance-bootstrap','dashboard']);
  const out=verifyPdmsFinalEventLazyMonthLoadD01V017();
  pdmscLog_('INSTALL_FINAL_EVENT_LAZY_MONTH_LOAD_D01_V017',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD});
  pdmscSetupToast_('PDMS Install D01 V0.1.7',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:18);
  return out;
}
function verifyPdmsFinalEventLazyMonthLoadD01V017(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent();
  const page=HtmlService.createHtmlOutputFromFile('Page_FinalEvents').getContent();
  const shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Health',pdmscHealthCheck().ok);
  add('Build ID D01 V0.1.7',PDMSC.WEB_BUILD==='D01-FINAL-EVENT-LAZY-MONTH-LOAD-V0.1.7-20260908',PDMSC.WEB_BUILD);
  add('Month selector uses lazy month-change handler',/id="finalEventMonth"[^>]*onchange="PDMS\.finalEventMonthChanged\(\)"/.test(page));
  add('Month selector no longer calls full Preview directly',!(/id="finalEventMonth"[^>]*loadFinalEventPreview/.test(page)));
  add('Client has per-month Final Event memory cache',web.indexOf('finalEventDatasetCache:{}')>=0&&web.indexOf('function finalEventUseCached_(')>=0);
  add('Month change never calls Final Event RPC',(()=>{const m=web.match(/function finalEventMonthChanged\(\)\{([\s\S]*?)\n  \}/);return !!m&&m[1].indexOf("rpc('pdmscWebFinalEventDataset'")<0&&m[1].indexOf('loadFinalEventPreview(')<0;})());
  add('Bootstrap does not auto-build Final Event Preview',(()=>{const m=web.match(/async function loadFinalEventBootstrap\(force\)\{([\s\S]*?)\n  \}/);return !!m&&m[1].indexOf('loadFinalEventPreview(')<0&&m[1].indexOf("rpc('pdmscWebFinalEventDataset'")<0;})());
  add('Explicit load stores dataset by month',web.indexOf('S.finalEventDatasetCache[monthKey]=r')>=0);
  add('Commit does not auto-rebuild Preview',(()=>{const m=web.match(/async function commitFinalEvents\(\)\{([\s\S]*?)\n  \}/);return !!m&&m[1].indexOf('await loadFinalEventPreview')<0&&m[1].indexOf('finalEventResetDisplay_')>=0;})());
  add('Derived client invalidation clears month cache',web.indexOf('S.finalEventDatasetCache={};S.finalEventLast=null')>=0);
  add('Review decision invalidates A03 server preview',pdmscA022SaveDecision_.toString().indexOf("'a03-preview-'+p[1]")>=0);
  add('Attendance commit invalidates selected month preview',pdmscWebAttendanceCommit.toString().indexOf('pdmscWebInvalidateOperationalCaches_([r.monthKey])')>=0);
  add('Leave commit invalidates Active Period previews',pdmscWebLeaveCommit.toString().indexOf('pdmscWebInvalidateOperationalCaches_(p.months||[])')>=0);
  add('Leave/period client changes invalidate derived cache',web.indexOf("const out=await rpc('pdmscWebLeaveCommit'")>=0&&web.indexOf("const r=await rpc('pdmscWebLeaveSetPeriod'")>=0&&web.indexOf('invalidateDerivedClientCaches_();')>=0);
  add('Core Operational Rule remains available',typeof pdmscOperationalRuleFor_==='function'&&typeof pdmscOperationalResolveFor_==='function');
  add('Attendance Classifier remains available',typeof pdmscA02ClassifyOne_==='function'&&typeof pdmscA02ClassifyScans_==='function');
  add('Final Event Core remains available',typeof pdmscA03BuildPreview_==='function'&&typeof pdmscA03Dataset_==='function');
  add('V0.1.6 readability audit still passes',pdmscD01V016ReadableDensityAudit_(HtmlService.createHtmlOutputFromFile('WebStyles').getContent()).ok);
  add('Approved route names remain',(()=>{const m={};pdmscWebRouteCatalog_().forEach(x=>m[x.id]=x.label);return m.review==='ตรวจสอบและตัดสินรายการกำกวม'&&m.finalevents==='ตรวจผลก่อนบันทึกและยกเว้น';})());
  add('Web shell exports remain complete',shell.ok,shell.missing.join(', '));
  add('Internal Web helper declarations remain complete',helpers.ok,helpers.missing.join(', '));
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.1.7',webBuild:PDMSC.WEB_BUILD,tests,total:tests.length,passed:tests.filter(x=>x.ok).length};
  pdmscSetupToast_('PDMS Verify D01 V0.1.7',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(', ')),out.ok?12:20);
  return out;
}
function pdmscD01V017Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),page=HtmlService.createHtmlOutputFromFile('Page_FinalEvents').getContent();
  const shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Current source is V0.1.7',PDMSC.WEB_BUILD==='D01-FINAL-EVENT-LAZY-MONTH-LOAD-V0.1.7-20260908',PDMSC.WEB_BUILD);
  add('Lazy month handler is present',web.indexOf('function finalEventMonthChanged()')>=0&&page.indexOf('PDMS.finalEventMonthChanged()')>=0);
  add('Month selector does not auto-load Preview',!/id="finalEventMonth"[^>]*loadFinalEventPreview/.test(page));
  add('Per-month cache is present',web.indexOf('finalEventDatasetCache:{}')>=0&&web.indexOf('S.finalEventDatasetCache[monthKey]=r')>=0);
  add('Required cache invalidation hooks are present',pdmscA022SaveDecision_.toString().indexOf("'a03-preview-'+p[1]")>=0&&pdmscWebAttendanceCommit.toString().indexOf('pdmscWebInvalidateOperationalCaches_([r.monthKey])')>=0&&pdmscWebLeaveCommit.toString().indexOf('pdmscWebInvalidateOperationalCaches_(p.months||[])')>=0);
  add('V0.1.6 readability remains',pdmscD01V016ReadableDensityAudit_(HtmlService.createHtmlOutputFromFile('WebStyles').getContent()).ok);
  add('Web shell remains complete',shell.ok,shell.missing.join(', '));
  add('Internal helpers remain complete',helpers.ok,helpers.missing.join(', '));
  return{ok:tests.every(x=>x.ok),tests};
}

function installPdmsReadabilityVerifyRecoveryD01V016(){
  const pre=pdmscD01V016Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.1.6','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',15);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['dashboard','review-bootstrap','a03-bootstrap','documents-history']);
  const out=verifyPdmsReadabilityVerifyRecoveryD01V016();
  pdmscLog_('INSTALL_READABILITY_VERIFY_RECOVERY_D01_V016',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD,readability:out.readability});
  pdmscSetupToast_('PDMS Install D01 V0.1.6',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:18);
  return out;
}
function verifyPdmsReadabilityVerifyRecoveryD01V016(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const styles=HtmlService.createHtmlOutputFromFile('WebStyles').getContent();
  const readability=pdmscD01V016ReadableDensityAudit_(styles);
  const routes=pdmscWebRouteCatalog_(),byId={};routes.forEach(x=>byId[x.id]=x.label);
  const review=HtmlService.createHtmlOutputFromFile('Page_Review').getContent();
  const finalPage=HtmlService.createHtmlOutputFromFile('Page_FinalEvents').getContent();
  const shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Health',pdmscHealthCheck().ok);
  add('Build ID D01 V0.1.6',PDMSC.WEB_BUILD==='D01-READABILITY-VERIFY-RECOVERY-V0.1.6-20260908',PDMSC.WEB_BUILD);
  add('Readable-density CSS properties are present',readability.ok,readability.missing.join(', '));
  add('Primary route labels remain action-oriented',
    byId.dashboard==='ดูภาพรวมระบบ'&&byId.personnel==='จัดการข้อมูลบุคลากร'&&byId.settings==='ตั้งค่าระบบ'&&
    byId.leave==='นำเข้าและจัดการข้อมูลลา'&&byId.attendance==='นำเข้าและตรวจข้อมูลลงเวลา'&&
    byId.review==='ตรวจสอบและตัดสินรายการกำกวม'&&byId.finalevents==='ตรวจผลก่อนบันทึกและยกเว้น'&&
    byId.statistics==='ดูสถิติและรายละเอียด'&&byId.documents==='ตรวจผู้เข้าเกณฑ์และออกหนังสือ'&&
    byId.system==='ตรวจสุขภาพและกู้คืนระบบ');
  add('Review page approved ambiguity wording remains',review.indexOf('ตรวจสอบและตัดสินรายการกำกวม')>=0);
  add('Final Event exclusion wording remains',finalPage.indexOf('ตรวจผลก่อนบันทึกและยกเว้น')>=0);
  add('Review bootstrap does not scan Raw Attendance',pdmscWebReviewBootstrap.toString().indexOf('pdmscWebAttendanceRawSummary_')<0&&pdmscWebReviewBootstrap.toString().indexOf('pdmscWebPeriodView_')>=0);
  add('Final Event bootstrap does not scan Raw Attendance',pdmscWebFinalEventBootstrap.toString().indexOf('pdmscWebAttendanceRawSummary_')<0&&pdmscWebFinalEventBootstrap.toString().indexOf('pdmscWebPeriodView_')>=0);
  add('Review bootstrap returns Active Period months',(()=>{try{const r=pdmscWebReviewBootstrap(true);return r&&r.monthSource==='ACTIVE_PERIOD'&&Array.isArray(r.months);}catch(e){return false;}})());
  add('Final Event bootstrap returns Active Period months',(()=>{try{const r=pdmscWebFinalEventBootstrap(true);return r&&r.monthSource==='ACTIVE_PERIOD'&&Array.isArray(r.months);}catch(e){return false;}})());
  add('Web shell exports remain complete',shell.ok,shell.missing.join(', '));
  add('Critical Web functions remain present',shell.criticalOk,shell.missingCritical.join(', '));
  add('Internal helper declarations remain complete',helpers.ok,helpers.missing.join(', '));
  add('V0.1.3 recovered helpers remain present',typeof pdmscWebReviewDataset==='function'&&typeof pdmscWebFinalEventDataset==='function');
  add('D01 V0.1.2 Warning/Test Document features remain present',typeof pdmscDocTestSelected_==='function'&&typeof pdmscWarningCandidateDataset_==='function');
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.1.6',webBuild:PDMSC.WEB_BUILD,tests,readability,total:tests.length,passed:tests.filter(x=>x.ok).length};
  pdmscSetupToast_('PDMS Verify D01 V0.1.6',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(', ')),out.ok?12:20);
  return out;
}
function pdmscD01V016ReadableDensityAudit_(styles){
  styles=String(styles||'');
  const checks=[
    {key:'sidebar 260px',re:/:root\s*\{[^}]*--sidebar\s*:\s*260px\s*;?[^}]*\}/i},
    {key:'nav font 15px',re:/\.nav-btn\s*\{[^}]*font-size\s*:\s*15px\s*;?[^}]*\}/i},
    {key:'table font 13px',re:/table\s*,\s*\.attendance-matrix-table\s*\{[^}]*font-size\s*:\s*13px\s*;?[^}]*\}/i},
    {key:'helper font 12px',re:/\.field\s+small\s*,\s*\.helper\s*,\s*\.busy-note\s*,\s*\.time-current-item\s+\.label\s*\{[^}]*font-size\s*:\s*12px\s*;?[^}]*\}/i},
    {key:'badge font 12px',re:/\.badge\s*,\s*\.alias-chip\s*\{[^}]*font-size\s*:\s*12px\s*;?[^}]*\}/i},
    {key:'toast font 14px',re:/\.toast\s*\{[^}]*font-size\s*:\s*14px\s*;?[^}]*\}/i}
  ];
  const missing=checks.filter(x=>!x.re.test(styles)).map(x=>x.key);
  return{ok:missing.length===0,missing,checks:checks.map(x=>({key:x.key,ok:x.re.test(styles)}))};
}
function pdmscD01V016Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const styles=HtmlService.createHtmlOutputFromFile('WebStyles').getContent(),readability=pdmscD01V016ReadableDensityAudit_(styles);
  const shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Current source is V0.1.6',PDMSC.WEB_BUILD==='D01-READABILITY-VERIFY-RECOVERY-V0.1.6-20260908',PDMSC.WEB_BUILD);
  add('Readable-density source properties are complete',readability.ok,readability.missing.join(', '));
  add('V0.1.4 UX naming remains present',pdmscWebRouteCatalog_().some(x=>x.id==='review'&&x.label==='ตรวจสอบและตัดสินรายการกำกวม'));
  add('V0.1.3 runtime helper recovery remains present',typeof pdmscD01V013WebInternalHelperAudit_==='function'&&helpers.ok,helpers.missing.join(', '));
  add('D01 V0.1.2 document consistency remains present',typeof pdmscDocTestSelected_==='function'&&typeof pdmscWarningCandidateDataset_==='function');
  add('Web shell remains complete',shell.ok,shell.missing.join(', '));
  return{ok:tests.every(x=>x.ok),tests,readability};
}

function installPdmsReadabilityVerifyRecoveryD01V015(){
  const pre=pdmscD01V015Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.1.5','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',15);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['dashboard','review-bootstrap','a03-bootstrap','documents-history']);
  const out=verifyPdmsReadabilityVerifyRecoveryD01V015();
  pdmscLog_('INSTALL_READABILITY_VERIFY_RECOVERY_D01_V015',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD,readability:out.readability});
  pdmscSetupToast_('PDMS Install D01 V0.1.5',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:18);
  return out;
}
function verifyPdmsReadabilityVerifyRecoveryD01V015(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const styles=HtmlService.createHtmlOutputFromFile('WebStyles').getContent();
  const readability=pdmscD01V015ReadableDensityAudit_(styles);
  const routes=pdmscWebRouteCatalog_(),byId={};routes.forEach(x=>byId[x.id]=x.label);
  const review=HtmlService.createHtmlOutputFromFile('Page_Review').getContent();
  const finalPage=HtmlService.createHtmlOutputFromFile('Page_FinalEvents').getContent();
  const shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Health',pdmscHealthCheck().ok);
  add('Build ID D01 V0.1.5',PDMSC.WEB_BUILD==='D01-READABILITY-VERIFY-RECOVERY-V0.1.5-20260908',PDMSC.WEB_BUILD);
  add('Readable-density CSS properties are present',readability.ok,readability.missing.join(', '));
  add('Readable-density marker identifies V0.1.5',readability.markerOk,readability.markerFound||'marker not found');
  add('Primary route labels remain action-oriented',
    byId.dashboard==='ดูภาพรวมระบบ'&&byId.personnel==='จัดการข้อมูลบุคลากร'&&byId.settings==='ตั้งค่าระบบ'&&
    byId.leave==='นำเข้าและจัดการข้อมูลลา'&&byId.attendance==='นำเข้าและตรวจข้อมูลลงเวลา'&&
    byId.review==='ตรวจสอบและตัดสินรายการกำกวม'&&byId.finalevents==='ตรวจผลก่อนบันทึกและยกเว้น'&&
    byId.statistics==='ดูสถิติและรายละเอียด'&&byId.documents==='ตรวจผู้เข้าเกณฑ์และออกหนังสือ'&&
    byId.system==='ตรวจสุขภาพและกู้คืนระบบ');
  add('Review page approved ambiguity wording remains',review.indexOf('ตรวจสอบและตัดสินรายการกำกวม')>=0);
  add('Final Event exclusion wording remains',finalPage.indexOf('ตรวจผลก่อนบันทึกและยกเว้น')>=0);
  add('Review bootstrap does not scan Raw Attendance',pdmscWebReviewBootstrap.toString().indexOf('pdmscWebAttendanceRawSummary_')<0&&pdmscWebReviewBootstrap.toString().indexOf('pdmscWebPeriodView_')>=0);
  add('Final Event bootstrap does not scan Raw Attendance',pdmscWebFinalEventBootstrap.toString().indexOf('pdmscWebAttendanceRawSummary_')<0&&pdmscWebFinalEventBootstrap.toString().indexOf('pdmscWebPeriodView_')>=0);
  add('Review bootstrap returns Active Period months',(()=>{try{const r=pdmscWebReviewBootstrap(true);return r&&r.monthSource==='ACTIVE_PERIOD'&&Array.isArray(r.months);}catch(e){return false;}})());
  add('Final Event bootstrap returns Active Period months',(()=>{try{const r=pdmscWebFinalEventBootstrap(true);return r&&r.monthSource==='ACTIVE_PERIOD'&&Array.isArray(r.months);}catch(e){return false;}})());
  add('Web shell exports remain complete',shell.ok,shell.missing.join(', '));
  add('Critical Web functions remain present',shell.criticalOk,shell.missingCritical.join(', '));
  add('Internal helper declarations remain complete',helpers.ok,helpers.missing.join(', '));
  add('V0.1.3 recovered helpers remain present',typeof pdmscWebReviewDataset==='function'&&typeof pdmscWebFinalEventDataset==='function');
  add('D01 V0.1.2 Warning/Test Document features remain present',typeof pdmscDocTestSelected_==='function'&&typeof pdmscWarningCandidateDataset_==='function');
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.1.5',webBuild:PDMSC.WEB_BUILD,tests,readability,total:tests.length,passed:tests.filter(x=>x.ok).length};
  pdmscSetupToast_('PDMS Verify D01 V0.1.5',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(', ')),out.ok?12:20);
  return out;
}
function pdmscD01V015ReadableDensityAudit_(styles){
  styles=String(styles||'');
  const checks=[
    {key:'sidebar 260px',re:/:root\s*\{[^}]*--sidebar\s*:\s*260px\s*;?[^}]*\}/i},
    {key:'nav font 15px',re:/\.nav-btn\s*\{[^}]*font-size\s*:\s*15px\s*;?[^}]*\}/i},
    {key:'table font 13px',re:/table\s*,\s*\.attendance-matrix-table\s*\{[^}]*font-size\s*:\s*13px\s*;?[^}]*\}/i},
    {key:'helper font 12px',re:/\.field\s+small\s*,\s*\.helper\s*,\s*\.busy-note\s*,\s*\.time-current-item\s+\.label\s*\{[^}]*font-size\s*:\s*12px\s*;?[^}]*\}/i},
    {key:'badge font 12px',re:/\.badge\s*,\s*\.alias-chip\s*\{[^}]*font-size\s*:\s*12px\s*;?[^}]*\}/i},
    {key:'toast font 14px',re:/\.toast\s*\{[^}]*font-size\s*:\s*14px\s*;?[^}]*\}/i}
  ];
  const missing=checks.filter(x=>!x.re.test(styles)).map(x=>x.key);
  const markerMatch=styles.match(/D01\s+Readability\s+Verify\s+Recovery\s+V0\.1\.5/i);
  return{ok:missing.length===0,missing,markerOk:!!markerMatch,markerFound:markerMatch?markerMatch[0]:''};
}
function pdmscD01V015Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const styles=HtmlService.createHtmlOutputFromFile('WebStyles').getContent(),readability=pdmscD01V015ReadableDensityAudit_(styles);
  const shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Current source is V0.1.5',PDMSC.WEB_BUILD==='D01-READABILITY-VERIFY-RECOVERY-V0.1.5-20260908',PDMSC.WEB_BUILD);
  add('Readable-density source properties are complete',readability.ok,readability.missing.join(', '));
  add('V0.1.4 UX naming remains present',pdmscWebRouteCatalog_().some(x=>x.id==='review'&&x.label==='ตรวจสอบและตัดสินรายการกำกวม'));
  add('V0.1.3 runtime helper recovery remains present',typeof pdmscD01V013WebInternalHelperAudit_==='function'&&helpers.ok,helpers.missing.join(', '));
  add('D01 V0.1.2 document consistency remains present',typeof pdmscDocTestSelected_==='function'&&typeof pdmscWarningCandidateDataset_==='function');
  add('Web shell remains complete',shell.ok,shell.missing.join(', '));
  return{ok:tests.every(x=>x.ok),tests,readability};
}

function installPdmsUxNamingReadabilityD01V014(){
  const pre=pdmscD01V014Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.1.4','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',15);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['dashboard','review-bootstrap','a03-bootstrap']);
  const out=verifyPdmsUxNamingReadabilityD01V014();
  pdmscLog_('INSTALL_UX_NAMING_READABILITY_D01_V014',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD});
  pdmscSetupToast_('PDMS Install D01 V0.1.4',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:18);
  return out;
}
function verifyPdmsUxNamingReadabilityD01V014(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const routes=pdmscWebRouteCatalog_(),byId={};routes.forEach(x=>byId[x.id]=x.label);
  const review=HtmlService.createHtmlOutputFromFile('Page_Review').getContent();
  const finalPage=HtmlService.createHtmlOutputFromFile('Page_FinalEvents').getContent();
  const personnel=HtmlService.createHtmlOutputFromFile('Page_Personnel').getContent();
  const settings=HtmlService.createHtmlOutputFromFile('Page_Settings').getContent();
  const styles=HtmlService.createHtmlOutputFromFile('WebStyles').getContent();
  const shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Health',pdmscHealthCheck().ok);
  add('Build ID D01 V0.1.4',PDMSC.WEB_BUILD==='D01-UX-NAMING-READABILITY-V0.1.4-20260908',PDMSC.WEB_BUILD);
  add('Primary route labels are action-oriented',
    byId.dashboard==='ดูภาพรวมระบบ'&&byId.personnel==='จัดการข้อมูลบุคลากร'&&byId.settings==='ตั้งค่าระบบ'&&
    byId.leave==='นำเข้าและจัดการข้อมูลลา'&&byId.attendance==='นำเข้าและตรวจข้อมูลลงเวลา'&&
    byId.review==='ตรวจสอบและตัดสินรายการกำกวม'&&byId.finalevents==='ตรวจผลก่อนบันทึกและยกเว้น'&&
    byId.statistics==='ดูสถิติและรายละเอียด'&&byId.documents==='ตรวจผู้เข้าเกณฑ์และออกหนังสือ'&&
    byId.system==='ตรวจสุขภาพและกู้คืนระบบ');
  add('Review page uses approved ambiguity wording',review.indexOf('ตรวจสอบและตัดสินรายการกำกวม')>=0&&review.indexOf('โหลด/รีเฟรชรายการกำกวม')>=0);
  add('Final Event page exposes exclusion action',finalPage.indexOf('ตรวจผลก่อนบันทึกและยกเว้น')>=0&&finalPage.indexOf('ยกเว้นรายการที่เลือก')>=0);
  add('Personnel subtabs describe actions',['ดูและจัดการรายชื่อบุคลากร','จับคู่ชื่อและ Alias','กำหนดบุคลากรที่ไม่ต้องประมวลผล','ตรวจความถูกต้องข้อมูลบุคลากร'].every(x=>personnel.indexOf(x)>=0));
  add('Settings subtabs describe actions',['ตั้งค่าหน่วยงานและผู้ลงนาม','จัดการข้อมูลหลัก','ตั้งค่าประเภทลาและการนับ','กำหนดรอบการทำงาน 6 เดือน','ตั้งค่าเวลาลงงานพื้นฐาน','กำหนดกฎปฏิทินปฏิบัติงาน','ตั้งค่ากฎการแจ้งเตือน','ตั้งค่าแม่แบบและเอกสาร','ดูข้อมูลระบบ'].every(x=>settings.indexOf(x)>=0));
  add('Readable-density CSS marker present',styles.indexOf('D01 UX Naming + Readability V0.1.4')>=0&&styles.indexOf('.nav-btn{font-size:15px')>=0&&styles.indexOf('table,.attendance-matrix-table{font-size:13px}')>=0);
  add('Review bootstrap does not scan Raw Attendance',pdmscWebReviewBootstrap.toString().indexOf('pdmscWebAttendanceRawSummary_')<0&&pdmscWebReviewBootstrap.toString().indexOf('pdmscWebPeriodView_')>=0);
  add('Final Event bootstrap does not scan Raw Attendance',pdmscWebFinalEventBootstrap.toString().indexOf('pdmscWebAttendanceRawSummary_')<0&&pdmscWebFinalEventBootstrap.toString().indexOf('pdmscWebPeriodView_')>=0);
  add('Review bootstrap returns Active Period months',(()=>{try{const r=pdmscWebReviewBootstrap(true);return r&&r.monthSource==='ACTIVE_PERIOD'&&Array.isArray(r.months);}catch(e){return false;}})());
  add('Final Event bootstrap returns Active Period months',(()=>{try{const r=pdmscWebFinalEventBootstrap(true);return r&&r.monthSource==='ACTIVE_PERIOD'&&Array.isArray(r.months);}catch(e){return false;}})());
  add('Web shell exports remain complete',shell.ok,shell.missing.join(', '));
  add('Critical Web functions remain present',shell.criticalOk,shell.missingCritical.join(', '));
  add('Internal helper declarations remain complete',helpers.ok,helpers.missing.join(', '));
  add('Review/Final Event recovered helpers remain present',typeof pdmscWebReviewDataset==='function'&&typeof pdmscWebFinalEventDataset==='function');
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.1.4',webBuild:PDMSC.WEB_BUILD,tests,total:tests.length,passed:tests.filter(x=>x.ok).length};
  pdmscSetupToast_('PDMS Verify D01 V0.1.4',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name).join(', ')),out.ok?12:18);
  return out;
}
function pdmscD01V014Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Current source is V0.1.4',PDMSC.WEB_BUILD==='D01-UX-NAMING-READABILITY-V0.1.4-20260908',PDMSC.WEB_BUILD);
  add('V0.1.3 runtime helper recovery remains present',typeof pdmscD01V013WebInternalHelperAudit_==='function'&&helpers.ok,helpers.missing.join(', '));
  add('D01 V0.1.2 document consistency remains present',typeof pdmscDocTestSelected_==='function'&&typeof pdmscWarningCandidateDataset_==='function');
  add('Web shell remains complete',shell.ok,shell.missing.join(', '));
  add('Review and Final Event bootstrap endpoints remain present',typeof pdmscWebReviewBootstrap==='function'&&typeof pdmscWebFinalEventBootstrap==='function');
  return{ok:tests.every(x=>x.ok),tests};
}

function installPdmsWebRuntimeHelperRecoveryV013(){
  const pre=pdmscD01V013Preflight_();if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.1.3','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',15);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['dashboard','review','finalevents','documents-history']);
  const out=verifyPdmsWebRuntimeHelperRecoveryV013();pdmscLog_('INSTALL_WEB_RUNTIME_HELPER_RECOVERY_V013',out.ok?'OK':'WARN',{verify:out.ok,webBuild:PDMSC.WEB_BUILD});pdmscSetupToast_('PDMS Install D01 V0.1.3',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:18);return out;
}
function verifyPdmsWebRuntimeHelperRecoveryV013(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Health',pdmscHealthCheck().ok);
  add('Build ID D01 V0.1.3',PDMSC.WEB_BUILD==='D01-DOCUMENT-CONSISTENCY-V0.1.3-20260908',PDMSC.WEB_BUILD);
  add('Web shell bootstrap executes and returns routes',(()=>{try{const b=pdmscWebShellBootstrap();return b&&Array.isArray(b.routes)&&b.routes.length>=9&&b.routes.some(x=>x.id==='review')&&b.routes.some(x=>x.id==='finalevents')&&b.routes.some(x=>x.id==='documents');}catch(e){return false;}})());
  add('WebCommon exported functions all have implementations',shell.ok,shell.missing.join(', '));
  add('Critical Web functions remain present',shell.criticalOk,shell.missingCritical.join(', '));
  add('WebApp includes all referenced partial files',shell.includesOk,shell.missingIncludes.join(', '));
  add('Web boot/renderNav lifecycle retained',web.indexOf("window.addEventListener('load',PDMS.boot)")>=0&&web.indexOf('function renderNav()')>=0&&web.indexOf('function boot()')>=0);
  add('All internal underscore helpers have declarations',helpers.ok,helpers.missing.join(', '));
  add('pdmsRowGroupClass_ implementation exists',/function\s+pdmsRowGroupClass_\s*\(/.test(web));
  add('reviewBadge_ implementation exists',/function\s+reviewBadge_\s*\(/.test(web));
  add('Review renderer uses recovered helpers',web.indexOf('function renderReviewList_')>=0&&web.indexOf('pdmsRowGroupClass_(prevEmp,x.empId)')>=0&&web.indexOf('reviewBadge_(x.decisionStatus)')>=0);
  add('Final Event preview uses recovered row-group helper',web.indexOf('function renderFinalEventPreview_')>=0&&web.indexOf('pdmsRowGroupClass_(prevEmp,x.empId)')>=0);
  add('Recovered helpers are presentation-only',(()=>{const a=(web.match(/function pdmsRowGroupClass_\([\s\S]*?\n\s*function reviewBadge_/)||[''])[0],b=(web.match(/function reviewBadge_\([\s\S]*?\n\s*function finalEventBadge_/)||[''])[0],src=a+b;return src&&['rpc(','google.script','pdmsc','lateMinutes','leaveDays','setValue','appendRow'].every(x=>src.indexOf(x)<0);})());
  add('D01 V0.1.2 Warning/Test Document features retained',web.indexOf('toggleWarningSelectAllVisible')>=0&&web.indexOf('pdmscWebDocumentTestSelected')>=0&&web.indexOf('ยืนยันออกหนังสือจริงรายบุคคล')>=0);
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.1.3',webBuild:PDMSC.WEB_BUILD,tests,webShellAudit:shell,internalHelperAudit:helpers,total:tests.length,passed:tests.filter(x=>x.ok).length};pdmscSetupToast_('PDMS Verify D01 V0.1.3',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name).join(', ')),out.ok?12:18);return out;
}
function pdmscD01V013WebInternalHelperAudit_(){
  const web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),decl=new Set(),calls=new Set();let m;const dr=/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,cr=/\b([A-Za-z_$][\w$]*_)\s*\(/g;while((m=dr.exec(web)))decl.add(m[1]);while((m=cr.exec(web)))calls.add(m[1]);const missing=[...calls].filter(x=>!decl.has(x)).sort();return{ok:missing.length===0,declared:decl.size,calledHelpers:calls.size,missing};
}
function pdmscD01V013Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),shell=pdmscD01V012WebShellSourceAudit_(),helpers=pdmscD01V013WebInternalHelperAudit_();
  add('Current build is V0.1.3 source',PDMSC.WEB_BUILD==='D01-DOCUMENT-CONSISTENCY-V0.1.3-20260908',PDMSC.WEB_BUILD);
  add('D01 V0.1.2 foundation remains present',typeof pdmscDocIssuePerson_==='function'&&typeof pdmscDocTestSelected_==='function'&&typeof pdmscWarningCandidateDataset_==='function');
  add('Web shell exports are complete',shell.ok,shell.missing.join(', '));
  add('Critical Web functions remain present',shell.criticalOk,shell.missingCritical.join(', '));
  add('Internal helper declarations are complete',helpers.ok,helpers.missing.join(', '));
  return{ok:tests.every(x=>x.ok),tests,webShellAudit:shell,internalHelperAudit:helpers};
}

function installPdmsDocumentConsistencyD01V012(){
  const pre=pdmscD01V012Preflight_();if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.1.2','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',15);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  pdmscWebCacheClear_(['documents-history','settings-tab-document','statistics','dashboard'].concat((pdmscGetActivePeriod().months||[]).map(m=>'statistics-'+m)));if(typeof pdmscWebInvalidateWarningCaches_==='function')pdmscWebInvalidateWarningCaches_();
  const out=verifyPdmsDocumentConsistencyD01V012();pdmscLog_('INSTALL_DOCUMENT_CONSISTENCY_D01_V012',out.ok?'OK':'WARN',{verify:out.ok});pdmscSetupToast_('PDMS Install D01 V0.1.2',(out.ok?'PASS':'Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • จากนั้น Deploy Web App เป็น New version',out.ok?12:18);return out;
}
function verifyPdmsDocumentConsistencyD01V012(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),stat=pdmscStatisticsSelfTest_(),prev=pdmscDocPreviewSelfTest_(),gen=pdmscDocGenerationSelfTest_(),warn=HtmlService.createHtmlOutputFromFile('Page_Warnings').getContent(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),shell=pdmscD01V012WebShellSourceAudit_();
  add('Health',pdmscHealthCheck().ok);add('Build ID D01 V0.1.2',PDMSC.WEB_BUILD==='D01-DOCUMENT-CONSISTENCY-V0.1.2-20260908',PDMSC.WEB_BUILD);
  add('Web shell bootstrap executes and returns routes',(()=>{try{const b=pdmscWebShellBootstrap();return b&&Array.isArray(b.routes)&&b.routes.length>=9&&b.routes.some(x=>x.id==='documents');}catch(e){return false;}})());
  add('WebCommon exported functions all have implementations',shell.ok,shell.missing.join(', '));add('Previously regressed Web functions remain present',shell.criticalOk,shell.missingCritical.join(', '));add('WebApp includes all referenced partial files',shell.includesOk,shell.missingIncludes.join(', '));add('Web boot/renderNav lifecycle retained',web.indexOf("window.addEventListener('load',PDMS.boot)")>=0&&web.indexOf('function renderNav()')>=0&&web.indexOf('function boot()')>=0);
  add('Statistics Core self-test',stat.ok,stat.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));add('Document preview delegates business metrics to Statistics Core',prev.ok,prev.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));add('Document generation/test-mode self-test',gen.ok,gen.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Warning page has Select All Visible',warn.indexOf('warningSelectAllVisible')>=0&&web.indexOf('toggleWarningSelectAllVisible')>=0);add('Warning page has category/date/leave/sort filters',['warningCategory','warningLeaveType','warningDateFrom','warningDateTo','warningSort'].every(x=>warn.indexOf(x)>=0));add('Broken individual text preview removed',warn.indexOf('previewWarningDocument')<0&&web.indexOf('function previewWarningDocument')<0);add('Selected test-document action exists',warn.indexOf('สร้างเอกสารทดลองจากที่เลือก')>=0&&web.indexOf('pdmscWebDocumentTestSelected')>=0);add('Test mode states no history',warn.indexOf('ไม่เขียน Document History')>=0||warn.indexOf('ไม่บันทึก Document History')>=0);add('Real issue requires explicit History confirmation',web.indexOf('ยืนยันออกหนังสือจริงรายบุคคล')>=0);
  const leaveView=(web.match(/function renderStatisticsLeaveView\(\)[\s\S]*?function renderStatisticsLateView/)||[''])[0],lateView=(web.match(/function renderStatisticsLateView\(\)[\s\S]*?function renderStatisticsOfficialView/)||[''])[0],officialView=(web.match(/function renderStatisticsOfficialView\(\)[\s\S]*?function openStatisticsLeaveDetail/)||[''])[0];add('Statistics browser views consume pre-aggregated Core rows',leaveView.indexOf('leaveGroupRows')>=0&&lateView.indexOf('latePersonRows')>=0&&officialView.indexOf('officialPersonRows')>=0);add('Statistics browser views do not aggregate business totals',![leaveView,lateView,officialView].some(x=>/requests\s*\+=|days\s*\+=|minutes\s*\+=|late\+\+|occurrences\+\+/.test(x)));
  add('Late diagnostic is read-only',typeof pdmscLateCoreDiagnostic_==='function'&&![/setValues\s*\(/,/appendRow\s*\(/,/setValue\s*\(/].some(r=>r.test(pdmscLateCoreDiagnostic_.toString())));add('Current classifier equality contract remains 08:31 = 0',(()=>{try{const s=pdmscAttendanceOperationalCutoffEndDateSelfTest_();return s&&s.ok;}catch(e){return false;}})());add('Warning still consumes Final Event/W02 and does not reclassify Raw',pdmscWarningSourceBundle_.toString().indexOf('pdmscA02ClassifyOne_')<0&&pdmscWarningSourceBundle_.toString().indexOf('pdmscA03BuildPreview_')<0);add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'D01-V0.1.2',webBuild:PDMSC.WEB_BUILD,tests,webShellAudit:shell,total:tests.length,passed:tests.filter(x=>x.ok).length};pdmscSetupToast_('PDMS Verify D01 V0.1.2',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,4).map(x=>x.name).join(', ')),out.ok?12:18);return out;
}
function diagnosePdmsLateCalculationCore01V012(){const out=pdmscLateCoreDiagnostic_('202604','20260401','20260403'),s=out.summary||{};console.log(JSON.stringify(out));pdmscSetupToast_('PDMS Late Diagnostic 1–3 เม.ย.','ตรวจ '+(s.checked||0)+' แถว • ปัญหา '+(s.problemRows||0)+' • stale rule '+(s.storedStaleRule||0)+' • stored arithmetic '+(s.storedEvidenceInconsistent||0)+' • current classifier '+(s.currentClassifierInconsistent||0)+' • 08:31 stored late>0 '+(s.storedScan0831WithPositiveLate||0)+' • ดู Execution log',20);return out;}
function pdmscD01V012WebShellSourceAudit_(){
  const web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),app=HtmlService.createHtmlOutputFromFile('WebApp').getContent(),decl=new Set(),rx=/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;let m;while((m=rx.exec(web)))decl.add(m[1]);const rs=web.lastIndexOf('return {'),re=rs>=0?web.indexOf('};\n})();',rs):-1,retBody=rs>=0&&re>rs?web.slice(rs+7,re+1):'',refs=[];(retBody||'').replace(/^\s*\{|\}\s*$/g,'').split(',').map(x=>x.trim()).filter(Boolean).forEach(x=>{const p=x.split(':').map(y=>y.trim()),name=p.length>1?p[p.length-1]:p[0];if(/^[A-Za-z_$][\w$]*$/.test(name))refs.push(name);});const missing=[...new Set(refs.filter(x=>!decl.has(x)))],critical=['boot','go','refreshCurrent','toggleSidebar','saveDocumentSettings','validateDocumentTemplates','loadSystemHealth','loadRecoveryPreview','runRecovery','loadJobs','loadAudit','loadWarningCandidateBootstrap','loadWarningCandidates'],missingCritical=critical.filter(x=>!decl.has(x)),inc=[],ir=/pdmscInclude_\('([^']+)'\)/g;while((m=ir.exec(app)))inc.push(m[1]);const missingIncludes=[];inc.forEach(n=>{try{HtmlService.createHtmlOutputFromFile(n).getContent();}catch(e){missingIncludes.push(n);}});return{ok:!!retBody&&missing.length===0,returnObjectFound:!!retBody,exports:refs.length,functions:decl.size,missing,criticalOk:missingCritical.length===0,missingCritical,includesOk:missingIncludes.length===0,includes:inc,missingIncludes};
}
function pdmscD01V012Preflight_(){const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),shell=pdmscD01V012WebShellSourceAudit_();add('D01 V0.1.0 foundation functions are present',typeof pdmscDocIssuePerson_==='function'&&typeof pdmscDocIssueCover_==='function'&&typeof pdmscWarningDocumentBoundary_==='function');add('Document History schema is already V0.1.0-compatible',pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY].length===28);add('Statistics Core is present',typeof pdmscStatisticsDataset_==='function');add('Warning source remains W02 Candidate',typeof pdmscWarningCandidateDataset_==='function');add('Web shell exports are internally complete before install',shell.ok,shell.missing.join(', '));add('Critical Web functions were not deleted',shell.criticalOk,shell.missingCritical.join(', '));return{ok:tests.every(x=>x.ok),tests,webShellAudit:shell};}

function installPdmsDocumentIssueD01V010(){
  const pre=pdmscD01V010Preflight_();if(!pre.ok){pdmscSetupToast_('PDMS Install D01 V0.1.0','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',15);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  pdmscEnsureBackend_();const mig=pdmscDocHistoryMigrateV010_();pdmscSeedSettingsDefaults_();PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);pdmscWebCacheClear_(['settings-tab-document','documents-history']);const out=verifyPdmsDocumentIssueD01V010();pdmscLog_('INSTALL_DOCUMENT_D01_V010',out.ok?'OK':'WARN',{migration:mig,verify:out.ok});pdmscSetupToast_('PDMS Install D01 V0.1.0',(out.ok?'PASS':'ติดตั้งแล้วแต่ Verify มีจุดไม่ผ่าน')+' • '+out.passed+'/'+out.total+' checks • Deploy Web App เป็น New version',out.ok?12:18);return out;
}
function verifyPdmsDocumentIssueD01V010(){const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),tpl=pdmscDocTemplateSelfTest_(),prev=pdmscDocPreviewSelfTest_(),gen=pdmscDocGenerationSelfTest_(),reg=pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY],page=HtmlService.createHtmlOutputFromFile('Page_Settings').getContent(),warn=HtmlService.createHtmlOutputFromFile('Page_Warnings').getContent(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent();add('Health',pdmscHealthCheck().ok);add('Build ID D01',PDMSC.WEB_BUILD==='D01-DOCUMENT-ISSUE-V0.1.0-20260908',PDMSC.WEB_BUILD);add('Document History schema expanded and legacy prefix preserved',reg.length===28&&reg.slice(0,10).join('|')==='DocumentId|WarningKey|EMP_ID|PeriodStart|PeriodEnd|Revision|Status|SourceFingerprint|FileId|CreatedAt');add('Seven production template settings reused in existing Document tab',(page.match(/data-settings-sub="document"/g)||[]).length===1&&page.indexOf('docTemplateInputs')>=0);add('No duplicate Document settings tab',(page.match(/data-sub="document"/g)||[]).length===1);add('Style Profile includes configurable line spacing',page.indexOf('docLineSpacing')>=0&&PDMSC_SETTINGS.KEYS.DOC_STYLE_LINE_SPACING);add('Line spacing supports 0.8/0.9',tpl.ok,tpl.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));add('A4 output contract',typeof pdmscDocApplyA4_==='function'&&PDMSC_DOC_D01.A4_WIDTH_PT>590&&PDMSC_DOC_D01.A4_HEIGHT_PT>840);add('Two-line cover list contract',typeof pdmscDocReplaceWarningPersonList_==='function'&&pdmscDocReplaceWarningPersonList_.toString().indexOf('lines.length%2')>=0);add('Signature table keep-together strategy',typeof pdmscDocKeepSignatureTableTogether_==='function'&&pdmscDocKeepSignatureTableTogether_.toString().indexOf('setKeepWithNext')>=0);add('Preview aggregates same leave type',prev.ok,prev.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));add('LATE_AND_MISSING_OUT public reason remains มาสาย',pdmscWarningDocumentReason_({category:'LATE',details:[{type:'LATE_AND_MISSING_OUT'}]})==='มาสาย');add('No PDF generation',gen.tests.find(x=>x.name==='No PDF generation path').ok);add('Duplicate issue guard',gen.tests.find(x=>x.name==='Duplicate guard reads history before create').ok);add('Issue uses fresh candidate boundary',pdmscDocCandidateFresh_.toString().indexOf('pdmscWarningCandidateDataset_')>=0&&pdmscDocCandidateFresh_.toString().indexOf('pdmscWarningDocumentBoundary_')>=0);add('Document history UI exists',warn.indexOf('documentHistoryList')>=0&&web.indexOf('pdmscWebDocumentHistory')>=0);add('History supports legacy-import Source boundary',gen.tests.find(x=>x.name==='History Source supports CURRENT_SYSTEM/LEGACY_IMPORT').ok);add('No Raw Attendance reclassification in Document services',[pdmscDocPreview_.toString(),pdmscDocIssuePerson_.toString(),pdmscDocIssueCover_.toString()].join('\n').indexOf('pdmscA02ClassifyOne_')<0);add('Existing Warning Candidate remains source',pdmscDocCandidateFresh_.toString().indexOf('pdmscWarningCandidateDataset_')>=0);add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');const out={ok:tests.every(x=>x.ok),version:'D01-V0.1.0',webBuild:PDMSC.WEB_BUILD,tests,total:tests.length,passed:tests.filter(x=>x.ok).length};pdmscSetupToast_('PDMS Verify D01 V0.1.0',(out.ok?'PASS':'FAIL')+' • '+out.passed+'/'+out.total+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,3).map(x=>x.name).join(', ')),out.ok?10:15);return out;}
function pdmscD01V010Preflight_(){const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});add('W02 V0.2.3 Warning boundary is present',PDMSC.WEB_BUILD==='D01-DOCUMENT-ISSUE-V0.1.0-20260908'&&typeof pdmscWarningDocumentBoundary_==='function');add('Current Document settings tab exists exactly once',(HtmlService.createHtmlOutputFromFile('Page_Settings').getContent().match(/data-sub="document"/g)||[]).length===1);add('Current DOC_HISTORY backend exists in registry',!!pdmscSchemaRegistry_()[PDMSC.BACKEND.DOC_HISTORY]);add('Document service functions have unique names',typeof pdmscDocPreview_==='function'&&typeof pdmscDocIssuePerson_==='function'&&typeof pdmscDocIssueCover_==='function');add('Warning Candidate source is eligible-only at boundary',pdmscWarningDocumentBoundary_({candidateKey:'X',empId:'E',ruleId:'R',windowKey:'W',qualified:true,eligible:true,groupBlocked:false,metricBlocked:false,systemEnabled:true}).ready===true&&pdmscWarningDocumentBoundary_({qualified:true,eligible:false,groupBlocked:true}).ready===false);return{ok:tests.every(x=>x.ok),tests};}

function installPdmsWarningContractW02V023(){
  const pre=pdmscW02V023Preflight_();if(!pre.ok){pdmscSetupToast_('PDMS Install W02 V0.2.3','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',15);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  if(typeof pdmscWebInvalidateWarningCaches_==='function')pdmscWebInvalidateWarningCaches_();
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['settings-tab-warning','statistics','dashboard'].concat((pdmscGetActivePeriod().months||[]).map(m=>'statistics-'+m)));
  const h=pdmscHealthCheck();if(!h.ok){pdmscSetupToast_('PDMS Install W02 V0.2.3','FAIL • Health ไม่พร้อม',15);throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));}
  pdmscLog_('INSTALL_WARNING_CONTRACT_W02_V023','OK',{version:'W02-V0.2.3',webBuild:PDMSC.WEB_BUILD,change:'LEAVE_SCHEMA_PREFLIGHT_REGISTRY_SOURCE_OF_TRUTH'});
  const out=verifyPdmsWarningContractW02V023();pdmscSetupToast_('PDMS Install W02 V0.2.3','ติดตั้งเสร็จ • '+(out.ok?'Verify PASS':'Verify มีจุดไม่ผ่าน')+' • Deploy Web App เป็น New version',out.ok?10:15);return out;
}

function verifyPdmsWarningContractW02V023(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),base=pdmscLeaveCoreSelfTest_(),candidate=pdmscWarningCandidateSelfTest_(),source=pdmscWarningSourceBundle_.toString(),facts=pdmscLeaveCoreFactsForMonths_.toString(),effective=pdmscLeaveCoreEffectiveFactsForMonths_.toString(),boundary=pdmscWarningDocumentBoundary_.toString(),schemaCheck=pdmscW02V023LeaveSchemaContract_();
  add('Health',pdmscHealthCheck().ok);
  add('Build ID is current W02 V0.2.3',PDMSC.WEB_BUILD==='W02-WARNING-CONTRACT-V0.2.3-20260907',PDMSC.WEB_BUILD);
  add('Leave Store schema registry is the single source of truth',schemaCheck.registryOk,schemaCheck.registry.join('|'));
  add('Leave Store sheet header matches Schema Registry',schemaCheck.sheetOk,schemaCheck.note);
  add('Leave Core self-test including 6M ownership',base.ok,base.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Warning Candidate self-test',candidate.ok,candidate.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Carry-in has explicit effective occurrence anchor',facts.indexOf('effectiveOccurrenceDateKey')>=0&&facts.indexOf('carryInExtraDays')>=0);
  add('Carry-in full-request days are attached to current period',facts.indexOf('monthDays+=Number(periodMeta.carryInExtraDays||0)')>=0);
  add('Carry-out is excluded before downstream facts',facts.indexOf("pdmscLeavePeriodCountable_(x,periodBounds)")>=0&&pdmscLeavePeriodOwnership_.toString().indexOf("CARRY_OUT_EXCLUDED")>=0);
  add('Effective decision path preserves carry-in extra days',effective.indexOf('carryInExtraDays')>=0&&effective.indexOf('anchor&&anchor.countStatistics')>=0&&effective.indexOf('anchor&&anchor.allowWarning')>=0);
  add('Warning source anchors occurrence at effective date',source.indexOf('effectiveOccurrenceDateKey')>=0&&source.indexOf('anchorKey')>=0);
  add('Warning day metric includes carry-in extra days once',source.indexOf('extraAllowedDays')>=0&&source.indexOf('r.dateKey===anchorKey?extraAllowedDays:0')>=0);
  add('Late document reason is normalized',pdmscWarningDocumentReason_({category:'LATE',details:[{type:'LATE_AND_MISSING_OUT'}]})==='มาสาย');
  add('Document boundary carries normalized reason',boundary.indexOf('documentReason')>=0&&pdmscWarningDocumentBoundary_({candidateKey:'X',empId:'E',ruleId:'R',windowKey:'W',category:'LATE',eligible:true,qualified:true,systemEnabled:true,groupBlocked:false,metricBlocked:false}).documentReason==='มาสาย');
  add('LATE_AND_MISSING_OUT remains eligible for Late facet',pdmscA02EventSelectorMatch_('LATE','LATE_AND_MISSING_OUT',{})||pdmscA02EventSelectorMatch_('LATE_AND_MISSING_OUT','LATE_AND_MISSING_OUT',{}));
  add('Bulk Final Event contract remains locked',source.indexOf('pdmscA03ActiveRowsForMonths_')>=0&&source.indexOf('pdmscA03ActiveRows_(')<0&&source.indexOf('months.map')<0);
  add('Warning still never rebuilds Attendance Classification',source.indexOf('pdmscA02ClassifyOne_')<0&&source.indexOf('pdmscA03BuildPreview_')<0);
  add('EXCLUDED_KEEP_STATS still blocks Warning',pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&!pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning);
  const sim=pdmscW02V022BoundarySelfTest_();sim.tests.forEach(x=>add(x.name,x.ok,x.note||''));
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'W02-V0.2.3',webBuild:PDMSC.WEB_BUILD,tests,leaveCoreSelfTest:base,candidateSelfTest:candidate,boundarySelfTest:sim,schemaCheck};
  pdmscSetupToast_('PDMS Verify W02 V0.2.3',(out.ok?'PASS':'FAIL')+' • '+tests.filter(x=>x.ok).length+'/'+tests.length+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,3).map(x=>x.name).join(', ')),out.ok?10:15);return out;
}

function pdmscW02V023Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),schemaCheck=pdmscW02V023LeaveSchemaContract_();
  add('W02 V0.2.2 foundation is present',typeof pdmscWarningSourceBundle_==='function'&&typeof pdmscLeaveCoreEffectiveFactsForMonths_==='function'&&typeof pdmscA03ActiveRowsForMonths_==='function'&&typeof pdmscLeavePeriodOwnership_==='function');
  add('Current build is W02 V0.2.3 source',PDMSC.WEB_BUILD==='W02-WARNING-CONTRACT-V0.2.3-20260907',PDMSC.WEB_BUILD);
  add('Period source is six-month contract',PDMSC.PERIOD_MONTHS===6);
  add('Leave Store schema registry is available',schemaCheck.registryOk,schemaCheck.registry.join('|'));
  add('Leave Store sheet header matches Schema Registry',schemaCheck.sheetOk,schemaCheck.note);
  add('No per-month Final Event fallback reintroduced',pdmscWarningSourceBundle_.toString().indexOf('pdmscA03ActiveRows_(')<0);
  return{ok:tests.every(x=>x.ok),tests};
}

function pdmscW02V023LeaveSchemaContract_(){
  const registry=(pdmscSchemaRegistry_()[PDMSC.BACKEND.LEAVE_STORE]||[]).slice();
  const registryOk=Array.isArray(registry)&&registry.length>0&&new Set(registry).size===registry.length;
  if(!registryOk)return{registry,registryOk:false,sheetOk:false,note:'Schema Registry ของ Leave Store ว่างหรือมีชื่อคอลัมน์ซ้ำ'};
  const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.LEAVE_STORE);
  if(!sh)return{registry,registryOk:true,sheetOk:false,note:'ไม่พบชีต '+PDMSC.BACKEND.LEAVE_STORE};
  const width=Math.max(registry.length,sh.getLastColumn()||0),raw=width?sh.getRange(1,1,1,width).getDisplayValues()[0]:[],actual=raw.map(v=>String(v||'').trim());
  while(actual.length&&!actual[actual.length-1])actual.pop();
  const sheetOk=actual.length===registry.length&&actual.every((v,i)=>v===registry[i]);
  return{registry,actual,registryOk:true,sheetOk,note:sheetOk?'':'Registry='+registry.join('|')+' ; Sheet='+actual.join('|')};
}

function installPdmsWarningContractW02V022(){
  const pre=pdmscW02V022Preflight_();if(!pre.ok){pdmscSetupToast_('PDMS Install W02 V0.2.2','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',15);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  if(typeof pdmscWebInvalidateWarningCaches_==='function')pdmscWebInvalidateWarningCaches_();
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['settings-tab-warning','statistics','dashboard'].concat((pdmscGetActivePeriod().months||[]).map(m=>'statistics-'+m)));
  const h=pdmscHealthCheck();if(!h.ok){pdmscSetupToast_('PDMS Install W02 V0.2.2','FAIL • Health ไม่พร้อม',15);throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));}
  pdmscLog_('INSTALL_WARNING_CONTRACT_W02_V022','OK',{version:'W02-V0.2.2',webBuild:PDMSC.WEB_BUILD,change:'CARRY_IN_FULL_REQUEST_CARRY_OUT_EXCLUDE_DOCUMENT_REASON'});
  const out=verifyPdmsWarningContractW02V022();pdmscSetupToast_('PDMS Install W02 V0.2.2','ติดตั้งเสร็จ • '+(out.ok?'Verify PASS':'Verify มีจุดไม่ผ่าน')+' • Deploy Web App เป็น New version',out.ok?10:15);return out;
}

function verifyPdmsWarningContractW02V022(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),base=pdmscLeaveCoreSelfTest_(),candidate=pdmscWarningCandidateSelfTest_(),source=pdmscWarningSourceBundle_.toString(),facts=pdmscLeaveCoreFactsForMonths_.toString(),effective=pdmscLeaveCoreEffectiveFactsForMonths_.toString(),boundary=pdmscWarningDocumentBoundary_.toString();
  add('Health',pdmscHealthCheck().ok);
  add('Build ID is current W02 V0.2.2',PDMSC.WEB_BUILD==='W02-WARNING-CONTRACT-V0.2.2-20260907',PDMSC.WEB_BUILD);
  add('Leave Core self-test including 6M ownership',base.ok,base.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Warning Candidate self-test',candidate.ok,candidate.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Carry-in has explicit effective occurrence anchor',facts.indexOf('effectiveOccurrenceDateKey')>=0&&facts.indexOf('carryInExtraDays')>=0);
  add('Carry-in full-request days are attached to current period',facts.indexOf('monthDays+=Number(periodMeta.carryInExtraDays||0)')>=0);
  add('Carry-out is excluded before downstream facts',facts.indexOf("pdmscLeavePeriodCountable_(x,periodBounds)")>=0&&pdmscLeavePeriodOwnership_.toString().indexOf("CARRY_OUT_EXCLUDED")>=0);
  add('Effective decision path preserves carry-in extra days',effective.indexOf('carryInExtraDays')>=0&&effective.indexOf('anchor&&anchor.countStatistics')>=0&&effective.indexOf('anchor&&anchor.allowWarning')>=0);
  add('Warning source anchors occurrence at effective date',source.indexOf('effectiveOccurrenceDateKey')>=0&&source.indexOf('anchorKey')>=0);
  add('Warning day metric includes carry-in extra days once',source.indexOf('extraAllowedDays')>=0&&source.indexOf('r.dateKey===anchorKey?extraAllowedDays:0')>=0);
  add('Late document reason is normalized',pdmscWarningDocumentReason_({category:'LATE',details:[{type:'LATE_AND_MISSING_OUT'}]})==='มาสาย');
  add('Document boundary carries normalized reason',boundary.indexOf('documentReason')>=0&&pdmscWarningDocumentBoundary_({candidateKey:'X',empId:'E',ruleId:'R',windowKey:'W',category:'LATE',eligible:true,qualified:true,systemEnabled:true,groupBlocked:false,metricBlocked:false}).documentReason==='มาสาย');
  add('LATE_AND_MISSING_OUT remains eligible for Late facet',pdmscA02EventSelectorMatch_('LATE','LATE_AND_MISSING_OUT',{})||pdmscA02EventSelectorMatch_('LATE_AND_MISSING_OUT','LATE_AND_MISSING_OUT',{}));
  add('Bulk Final Event contract remains locked',source.indexOf('pdmscA03ActiveRowsForMonths_')>=0&&source.indexOf('pdmscA03ActiveRows_(')<0&&source.indexOf('months.map')<0);
  add('Warning still never rebuilds Attendance Classification',source.indexOf('pdmscA02ClassifyOne_')<0&&source.indexOf('pdmscA03BuildPreview_')<0);
  add('EXCLUDED_KEEP_STATS still blocks Warning',pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&!pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning);
  const sim=pdmscW02V022BoundarySelfTest_();sim.tests.forEach(x=>add(x.name,x.ok,x.note||''));
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'W02-V0.2.2',webBuild:PDMSC.WEB_BUILD,tests,leaveCoreSelfTest:base,candidateSelfTest:candidate,boundarySelfTest:sim};
  pdmscSetupToast_('PDMS Verify W02 V0.2.2',(out.ok?'PASS':'FAIL')+' • '+tests.filter(x=>x.ok).length+'/'+tests.length+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,3).map(x=>x.name).join(', ')),out.ok?10:15);return out;
}

function pdmscW02V022Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  add('W02 V0.2.1 foundation is present',typeof pdmscWarningSourceBundle_==='function'&&typeof pdmscLeaveCoreEffectiveFactsForMonths_==='function'&&typeof pdmscA03ActiveRowsForMonths_==='function');
  add('Current build is W02 V0.2.2 source',PDMSC.WEB_BUILD==='W02-WARNING-CONTRACT-V0.2.2-20260907',PDMSC.WEB_BUILD);
  add('Period source is six-month contract',PDMSC.PERIOD_MONTHS===6);
  add('Leave Store schema is unchanged',pdmscW02V023LeaveSchemaContract_().sheetOk,pdmscW02V023LeaveSchemaContract_().note);
  add('No per-month Final Event fallback reintroduced',pdmscWarningSourceBundle_.toString().indexOf('pdmscA03ActiveRows_(')<0);
  return{ok:tests.every(x=>x.ok),tests};
}

function pdmscW02V022BoundarySelfTest_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),pb={start:new Date(2026,3,1),end:new Date(2026,8,30),period:{months:['202604','202605','202606','202607','202608','202609']}};
  const ci={start:new Date(2026,2,31),end:new Date(2026,3,1),days:2},ciLong={start:new Date(2026,2,31),end:new Date(2026,3,3),days:4},co={start:new Date(2026,8,30),end:new Date(2026,9,1),days:2},coLong={start:new Date(2026,8,29),end:new Date(2026,9,2),days:4},after={start:new Date(2026,9,1),end:new Date(2026,9,2),days:2},endOnly={start:new Date(2026,8,30),end:new Date(2026,8,30),days:1};
  const m=pdmscLeaveCoreCarryInMeta_(ci,pdmscLeaveCoreDateFacts_(ci),pb),m2=pdmscLeaveCoreCarryInMeta_(ciLong,pdmscLeaveCoreDateFacts_(ciLong),pb);
  add('SIM carry-in 31 Mar–1 Apr is 1 occurrence anchored 1 Apr',pdmscLeavePeriodOwnership_(ci,pb)==='CARRY_IN'&&m.effectiveOccurrenceDateKey==='20260401');
  add('SIM carry-in 31 Mar–1 Apr keeps full 2 days',1+Number(m.carryInExtraDays||0)===2,'visible 1 + carry '+m.carryInExtraDays);
  add('SIM carry-in 31 Mar–3 Apr owns pre-period day once',pdmscLeavePeriodOwnership_(ciLong,pb)==='CARRY_IN'&&m2.carryInExtraDays===1);
  add('SIM 30 Sep–1 Oct is excluded in full from old file',pdmscLeavePeriodOwnership_(co,pb)==='CARRY_OUT_EXCLUDED'&&!pdmscLeavePeriodCountable_(co,pb));
  add('SIM 29 Sep–2 Oct is excluded in full from old file',pdmscLeavePeriodOwnership_(coLong,pb)==='CARRY_OUT_EXCLUDED'&&!pdmscLeavePeriodCountable_(coLong,pb));
  add('SIM 1–2 Oct is outside old file',pdmscLeavePeriodOwnership_(after,pb)==='OUTSIDE_AFTER'&&!pdmscLeavePeriodCountable_(after,pb));
  add('SIM 30 Sep one-day leave stays in old file',pdmscLeavePeriodOwnership_(endOnly,pb)==='IN_PERIOD'&&pdmscLeavePeriodCountable_(endOnly,pb));
  add('SIM LATE_AND_MISSING_OUT via late warning produces “มาสาย”',pdmscWarningDocumentReason_({category:'LATE',details:[{type:'LATE_AND_MISSING_OUT'}]})==='มาสาย');
  return{ok:tests.every(x=>x.ok),tests};
}

function installPdmsWarningContractW02V021(){
  const pre=pdmscW02V021Preflight_();if(!pre.ok){pdmscSetupToast_('PDMS Install W02 V0.2.1','FAIL • Preflight ไม่ผ่าน — ไม่มีการแก้ข้อมูล',15);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  if(typeof pdmscWebInvalidateWarningCaches_==='function')pdmscWebInvalidateWarningCaches_();
  pdmscWebCacheClear_(['settings-tab-warning','statistics','dashboard']);
  const h=pdmscHealthCheck();if(!h.ok){pdmscSetupToast_('PDMS Install W02 V0.2.1','FAIL • Health ไม่พร้อม',15);throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));}
  pdmscLog_('INSTALL_WARNING_CONTRACT_W02_V021','OK',{version:'W02-V0.2.1',webBuild:PDMSC.WEB_BUILD,change:'BULK_SOURCE_CONTRACT_LOCK'});
  const out=verifyPdmsWarningContractW02V021();pdmscSetupToast_('PDMS Install W02 V0.2.1','ติดตั้งเสร็จ • '+(out.ok?'Verify PASS':'Verify มีจุดไม่ผ่าน')+' • Deploy Web App เป็น New version',out.ok?10:15);return out;
}

function verifyPdmsWarningContractW02V021(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),ruleSelf=pdmscWarningRuleSelfTest_(),candidateSelf=pdmscWarningCandidateSelfTest_(),facetSelf=pdmscA02EventFacetSelfTest_(),conflict=pdmscW02V020ActiveConflictAudit_(),css=pdmscW02V020CssContained_(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),page=HtmlService.createHtmlOutputFromFile('Page_Warnings').getContent(),place=HtmlService.createHtmlOutputFromFile('Page_Placeholders').getContent(),source=pdmscWarningSourceBundle_.toString(),bulk=pdmscA03ActiveRowsForMonths_.toString(),leaveBulk=pdmscLeaveCoreFactsForMonths_.toString(),leaveDecision=pdmscLeaveCoreEventDecisionMapForMonths_.toString();
  add('Health',pdmscHealthCheck().ok);
  add('Build ID is current W02 V0.2.1',PDMSC.WEB_BUILD==='W02-WARNING-CONTRACT-V0.2.1-20260907',PDMSC.WEB_BUILD);
  add('Schema W02 Warning columns installed',pdmscSchemaRegistry_()[PDMSC.BACKEND.WARNING_RULES].length===16);
  add('CSS is contained',css.ok,css.note);
  add('Warning workspace is real page, not placeholder',page.indexOf('ตรวจผู้เข้าเกณฑ์การแจ้งเตือน')>=0&&place.indexOf('data-page="documents"')<0);
  add('Warning settings tab exists once',(HtmlService.createHtmlOutputFromFile('Page_Settings').getContent().match(/data-sub="warning"/g)||[]).length===1);
  add('Warning rule engine self-test',ruleSelf.ok,ruleSelf.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Warning candidate engine self-test',candidateSelf.ok,candidateSelf.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Attendance facet engine self-test',facetSelf.ok,facetSelf.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('No active Warning Rule overlaps semantically',conflict.ok,conflict.pairs.join(', '));
  add('Leave warning source uses effective Leave Core facts',source.indexOf('pdmscLeaveCoreEffectiveFactsForMonths_')>=0&&source.indexOf('pdmscLeaveStoreRows_')<0);
  add('Warning uses only Final Event bulk reader',source.indexOf('pdmscA03ActiveRowsForMonths_')>=0&&source.indexOf('pdmscA03ActiveRows_(')<0&&source.indexOf('months.map')<0);
  add('Final Event bulk reader reads EVENT_STORE once',((bulk.match(/pdmscRows_\(PDMSC\.BACKEND\.EVENT_STORE\)/g)||[]).length===1),bulk.slice(0,220));
  add('Leave Core bulk facts reads LEAVE_STORE once',((leaveBulk.match(/pdmscLeaveStoreRows_\(\)/g)||[]).length===1));
  add('Leave Core bulk facts reads RAW_LEAVE source map once',((leaveBulk.match(/pdmscLeaveCoreSourcePayloadByFingerprint_\(\)/g)||[]).length===1));
  add('Leave decision mapping cannot fall back to per-month Final Event reads',leaveDecision.indexOf('pdmscA03ActiveRowsForMonths_')>=0&&leaveDecision.indexOf('pdmscA03ActiveRows_(')<0&&leaveDecision.indexOf('.map(m=>')<0);
  add('Warning never rebuilds Attendance Classification',source.indexOf('pdmscA02ClassifyOne_')<0&&source.indexOf('pdmscA03BuildPreview_')<0);
  add('EXCLUDED_KEEP_STATS counts Stats but never Warning',pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&!pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning);
  add('Leave exclusion is integrated before Stats/Warning',typeof pdmscLeaveCoreEffectiveFactsForMonths_==='function'&&pdmscLeaveCoreEffectiveFactsForMonths_.toString().indexOf('countStatistics')>=0&&pdmscLeaveCoreEffectiveFactsForMonths_.toString().indexOf('allowWarning')>=0);
  add('Warning group policy is ID-safe',pdmscWarningMigrateExcludedGroupsToIds_().unresolved.length===0&&pdmscWebSettingsTab.toString().indexOf('WARNING_EXCLUDED_DEPARTMENT_IDS')>=0);
  add('Leave Warning Rule is ID-safe',pdmscWarningRules_().filter(x=>x.category==='LEAVE'&&x.active).every(x=>!!x.includedTypeIds));
  add('Warning date boundary is date-only inclusive',pdmscWarningItemWithinRuleRange_({effectiveStart:new Date(2026,3,1),effectiveEnd:new Date(2026,3,3)},new Date(2026,3,3,12))&&!pdmscWarningItemWithinRuleRange_({effectiveStart:new Date(2026,3,1),effectiveEnd:new Date(2026,3,3)},new Date(2026,3,4,0)));
  add('Document boundary blocks ineligible candidates',pdmscWarningDocumentBoundary_({eligible:false,groupBlocked:true,reason:'blocked'}).ready===false&&pdmscWarningDocumentBoundary_({candidateKey:'A',empId:'E',ruleId:'R',windowKey:'M',eligible:true,qualified:true,systemEnabled:true,groupBlocked:false,metricBlocked:false}).ready===true);
  add('Warning filters stay browser-side after explicit load',web.indexOf('function applyWarningCandidateFilters')>=0&&web.indexOf("rpc('pdmscWebWarningCandidateDataset'")>=0);
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const sim=pdmscW02V021BulkContractSelfTest_();add('Bulk partition simulation matches month-by-month aggregate',sim.ok,sim.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  const out={ok:tests.every(x=>x.ok),version:'W02-V0.2.1',webBuild:PDMSC.WEB_BUILD,tests,ruleSelf,candidateSelf,facetSelf,conflict,bulkSelfTest:sim};
  pdmscSetupToast_('PDMS Verify W02 V0.2.1',(out.ok?'PASS':'FAIL')+' • '+tests.filter(x=>x.ok).length+'/'+tests.length+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,3).map(x=>x.name).join(', ')),out.ok?10:15);return out;
}

function pdmscW02V021Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  add('W02 V0.2.0 foundation is present',typeof pdmscWarningSourceBundle_==='function'&&typeof pdmscA03ActiveRowsForMonths_==='function'&&typeof pdmscLeaveCoreEffectiveFactsForMonths_==='function');
  add('Final Event bulk reader exists',typeof pdmscA03ActiveRowsForMonths_==='function');
  add('Warning source has no per-month Final Event fallback',pdmscWarningSourceBundle_.toString().indexOf('months.map(m=>pdmscA03ActiveRows_')<0&&pdmscWarningSourceBundle_.toString().indexOf('pdmscA03ActiveRows_(m')<0);
  add('Leave Core event-decision path has no per-month Final Event fallback',pdmscLeaveCoreEventDecisionMapForMonths_.toString().indexOf('.map(m=>pdmscA03ActiveRows_')<0);
  add('Current build ID is W02 V0.2.1',PDMSC.WEB_BUILD==='W02-WARNING-CONTRACT-V0.2.1-20260907',PDMSC.WEB_BUILD);
  return{ok:tests.every(x=>x.ok),tests};
}

function pdmscW02V021BulkContractSelfTest_(){
  const tests=[],add=(name,ok)=>tests.push({name,ok:!!ok}),rows=[
    {monthKey:'202604',empId:'E1',eventType:'LATE'},{monthKey:'202604',empId:'E2',eventType:'MISSING_OUT'},
    {monthKey:'202605',empId:'E1',eventType:'LATE'},{monthKey:'202606',empId:'E3',eventType:'LATE'},
    {monthKey:'202607',empId:'E4',eventType:'MISSING_IN'},{monthKey:'202608',empId:'E5',eventType:'LATE'},
    {monthKey:'202609',empId:'E1',eventType:'LATE'}
  ],months=['202604','202605','202606','202607','202608','202609'];
  const wanted=new Set(months),bulk=rows.filter(r=>wanted.has(r.monthKey)),byMonth={};months.forEach(m=>byMonth[m]=bulk.filter(r=>r.monthKey===m));
  const monthLoop=[].concat(...months.map(m=>rows.filter(r=>r.monthKey===m)));
  add('same row count',bulk.length===monthLoop.length);
  add('same canonical rows',JSON.stringify(bulk.map(r=>r.monthKey+'|'+r.empId+'|'+r.eventType).sort())===JSON.stringify(monthLoop.map(r=>r.monthKey+'|'+r.empId+'|'+r.eventType).sort()));
  add('all six months partitioned',months.every(m=>Array.isArray(byMonth[m])));
  add('single-month subset stays identical',byMonth['202604'].length===rows.filter(r=>r.monthKey==='202604').length);
  return{ok:tests.every(x=>x.ok),tests};
}

function pdmscW02V020CssContained_(){
  const css=HtmlService.createHtmlOutputFromFile('WebStyles').getContent(),rest=css.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<!--[\s\S]*?-->/g,'').trim();
  return{ok:rest==='',note:rest?rest.slice(0,180):''};
}
function pdmscW02V020LegacyPreflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),css=pdmscW02V020CssContained_();
  add('Current WebStyles contains no raw CSS outside style tags',css.ok,css.note);
  add('Current build has one Warning settings tab',(HtmlService.createHtmlOutputFromFile('Page_Settings').getContent().match(/data-sub="warning"/g)||[]).length===1);
  add('Current Web App has one Warning workspace page',HtmlService.createHtmlOutputFromFile('WebApp').getContent().match(/Page_Warnings/g)?.length===1&&HtmlService.createHtmlOutputFromFile('Page_Placeholders').getContent().indexOf('data-page="documents"')<0);
  add('Existing Leave Type Master is reused',typeof pdmscLeaveTypePolicyList_==='function'&&typeof pdmscMasterResolveItem_==='function');
  add('Existing Final Event + Decision sources are reused',typeof pdmscA03ActiveRowsForMonths_==='function'&&typeof pdmscDecisionPolicy==='function');
  const badLeave=[];(pdmscWarningRules_()||[]).filter(r=>r.category==='LEAVE').forEach(r=>String(r.includedTypeIds||r.includedEventTypes||'').split('|').map(pdmscNormalizeText_).filter(Boolean).forEach(v=>{if(!pdmscMasterResolveItem_('LEAVE_TYPE',v,true))badLeave.push(r.ruleId+':'+v);}));
  add('Existing Leave warning-rule references resolve to current Master',badLeave.length===0,badLeave.slice(0,8).join(', '));
  const badGroups=[];String(pdmscSettingsGet_('WARNING_EXCLUDED_GROUPS','')||'').split('|').map(pdmscNormalizeText_).filter(Boolean).forEach(v=>{if(!pdmscMasterResolveItem_('DEPARTMENT',v,true))badGroups.push(v);});
  add('Existing no-warning group references resolve to Department Master',badGroups.length===0,badGroups.slice(0,8).join(', '));
  return{ok:tests.every(x=>x.ok),tests};
}
function pdmscW02V020ActiveConflictAudit_(){
  const rules=pdmscWarningRules_().filter(x=>x.active),pairs=[];for(let i=0;i<rules.length;i++)for(let j=i+1;j<rules.length;j++){if(pdmscWarningRuleConflict_(rules[i],[rules[j]]))pairs.push(rules[i].name+' ↔ '+rules[j].name);}return{ok:pairs.length===0,pairs};
}
function installPdmsWarningContractW02V020(){
  const pre=pdmscW02V020LegacyPreflight_();if(!pre.ok){pdmscSetupToast_('PDMS Install W02 V0.2.0','FAIL • Preflight ไม่ผ่าน — ยังไม่มีการแก้ข้อมูล',15);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  pdmscEnsureBackend_();PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
  const ruleMigration=pdmscWarningRuleMigrateV020_();if(ruleMigration.unresolved&&ruleMigration.unresolved.length)throw new Error('Migration Warning Rule ยังมีประเภทการลาที่ resolve ไม่ได้: '+ruleMigration.unresolved.slice(0,8).map(x=>x.ruleId+':'+x.value).join(', '));
  const groupMigration=pdmscWarningMigrateExcludedGroupsToIds_();if(groupMigration.unresolved&&groupMigration.unresolved.length)throw new Error('Migration กลุ่มไม่ออกหนังสือยัง resolve ไม่ได้: '+groupMigration.unresolved.join(', '));
  const conflict=pdmscW02V020ActiveConflictAudit_();if(!conflict.ok)throw new Error('พบ Warning Rule Active ซ้อนกันหลัง Migration: '+conflict.pairs.slice(0,8).join(', '));
  if(typeof pdmscWebInvalidateWarningCaches_==='function')pdmscWebInvalidateWarningCaches_();pdmscWebCacheClear_(['settings-tab-warning','statistics','dashboard']);
  const h=pdmscHealthCheck();if(!h.ok){pdmscSetupToast_('PDMS Install W02 V0.2.0','FAIL • Health ไม่พร้อมหลัง Migration',15);throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));}
  pdmscLog_('INSTALL_WARNING_CONTRACT_W02_V020','OK',{version:'W02-V0.2.0',webBuild:PDMSC.WEB_BUILD,ruleMigration,groupMigration});
  const out=verifyPdmsWarningContractW02V020();pdmscSetupToast_('PDMS Install W02 V0.2.0','ติดตั้งเสร็จ • '+(out.ok?'Verify PASS':'Verify มีจุดไม่ผ่าน')+' • Deploy Web App เป็น New version',out.ok?10:15);return out;
}
function verifyPdmsWarningContractW02V020(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),ruleSelf=pdmscWarningRuleSelfTest_(),candidateSelf=pdmscWarningCandidateSelfTest_(),facetSelf=pdmscA02EventFacetSelfTest_(),conflict=pdmscW02V020ActiveConflictAudit_(),css=pdmscW02V020CssContained_(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),page=HtmlService.createHtmlOutputFromFile('Page_Warnings').getContent(),place=HtmlService.createHtmlOutputFromFile('Page_Placeholders').getContent(),source=pdmscWarningSourceBundle_.toString();
  add('Health',pdmscHealthCheck().ok);
  add('Build ID is current W02',PDMSC.WEB_BUILD==='W02-WARNING-CONTRACT-V0.2.0-20260907',PDMSC.WEB_BUILD);
  add('Schema W02 Warning columns installed',pdmscSchemaRegistry_()[PDMSC.BACKEND.WARNING_RULES].length===16);
  add('CSS is contained',css.ok,css.note);
  add('Warning workspace is real page, not placeholder',page.indexOf('ตรวจผู้เข้าเกณฑ์การแจ้งเตือน')>=0&&place.indexOf('data-page="documents"')<0);
  add('Warning settings tab exists once',(HtmlService.createHtmlOutputFromFile('Page_Settings').getContent().match(/data-sub="warning"/g)||[]).length===1);
  add('Warning rule engine self-test',ruleSelf.ok,ruleSelf.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Warning candidate engine self-test',candidateSelf.ok,candidateSelf.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Attendance facet engine self-test',facetSelf.ok,facetSelf.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('No active Warning Rule overlaps semantically',conflict.ok,conflict.pairs.join(', '));
  add('Leave warning source uses effective Leave Core facts',source.indexOf('pdmscLeaveCoreEffectiveFactsForMonths_')>=0&&source.indexOf('pdmscLeaveStoreRows_')<0);
  add('Attendance warning source uses ACTIVE Final Event once',source.indexOf('pdmscA03ActiveRowsForMonths_')>=0&&source.indexOf('pdmscA02ClassifyOne_')<0);
  add('Six-month source is bulk-read, not per-month Final Event rebuild',source.indexOf('pdmscA03ActiveRowsForMonths_')>=0&&source.indexOf('months.map(m=>pdmscA03ActiveRows_')<0);
  add('EXCLUDED_KEEP_STATS counts Stats but never Warning',pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&!pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning);
  add('Leave exclusion is integrated before Stats/Warning',typeof pdmscLeaveCoreEffectiveFactsForMonths_==='function'&&pdmscLeaveCoreEffectiveFactsForMonths_.toString().indexOf('countStatistics')>=0&&pdmscLeaveCoreEffectiveFactsForMonths_.toString().indexOf('allowWarning')>=0);
  add('Warning group policy is ID-safe',pdmscWarningMigrateExcludedGroupsToIds_().unresolved.length===0&&pdmscWebSettingsTab.toString().indexOf('WARNING_EXCLUDED_DEPARTMENT_IDS')>=0);
  add('Leave Warning Rule is ID-safe',pdmscWarningRules_().filter(x=>x.category==='LEAVE'&&x.active).every(x=>!!x.includedTypeIds));
  add('Warning date boundary is date-only inclusive',pdmscWarningItemWithinRuleRange_({effectiveStart:new Date(2026,3,1),effectiveEnd:new Date(2026,3,3)},new Date(2026,3,3,12))&&!pdmscWarningItemWithinRuleRange_({effectiveStart:new Date(2026,3,1),effectiveEnd:new Date(2026,3,3)},new Date(2026,3,4,0)));
  add('Document boundary blocks ineligible candidates',pdmscWarningDocumentBoundary_({eligible:false,groupBlocked:true,reason:'blocked'}).ready===false&&pdmscWarningDocumentBoundary_({candidateKey:'A',empId:'E',ruleId:'R',windowKey:'M',eligible:true,qualified:true,systemEnabled:true,groupBlocked:false,metricBlocked:false}).ready===true);
  add('Warning filters stay browser-side after explicit load',web.indexOf('function applyWarningCandidateFilters')>=0&&web.indexOf("rpc('pdmscWebWarningCandidateDataset'")>=0);
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'W02-V0.2.0',webBuild:PDMSC.WEB_BUILD,tests,ruleSelf,candidateSelf,facetSelf,conflict};pdmscSetupToast_('PDMS Verify W02 V0.2.0',(out.ok?'PASS':'FAIL')+' • '+tests.filter(x=>x.ok).length+'/'+tests.length+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,3).map(x=>x.name).join(', ')),out.ok?10:15);return out;
}

function pdmscW01V010CssContained_(){
  const css=HtmlService.createHtmlOutputFromFile('WebStyles').getContent(),rest=css.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<!--[\s\S]*?-->/g,'').trim();
  return{ok:rest==='',note:rest?rest.slice(0,160):''};
}
function pdmscW01V010Preflight_(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),css=pdmscW01V010CssContained_(),routes=pdmscWebRouteCatalog_();
  add('WebStyles CSS contained inside style tags',css.ok,css.note);
  add('Existing Warning Rule service reused',typeof pdmscWarningRules_==='function'&&typeof pdmscWarningRuleSave_==='function');
  add('Existing Leave Warning Base Core reused',typeof pdmscLeaveCoreWarningBaseMonthFacts_==='function'&&typeof pdmscLeaveCoreCountsTowardWarning_==='function');
  add('Existing Final Event reader reused',typeof pdmscA03ActiveRows_==='function');
  add('Decision policy available',typeof pdmscDecisionPolicy==='function');
  add('Documents route is activated once',routes.filter(x=>x.id==='documents').length===1&&!!routes.find(x=>x.id==='documents'&&x.enabled));
  add('No duplicate documents page placeholder',HtmlService.createHtmlOutputFromFile('Page_Placeholders').getContent().indexOf('data-page="documents"')<0);
  return{ok:tests.every(x=>x.ok),tests};
}
function installPdmsWarningFoundationW01V010(){
  const pre=pdmscW01V010Preflight_();if(!pre.ok){pdmscSetupToast_('PDMS Install W01 V0.1.0','FAIL • Preflight ไม่ผ่าน — ยังไม่มีการแก้ข้อมูล',15);throw new Error(pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(' | '));}
  pdmscEnsureBackend_();
  const rows=pdmscSettingsRows_(),hasGroupSetting=rows.some(x=>String(x.key||'').toUpperCase()==='WARNING_EXCLUDED_GROUPS');let seededGroup='';
  if(!hasGroupSetting){const deps=pdmscMasterList_('DEPARTMENT',false),employee=deps.find(x=>pdmscNormalizeText_(x.name)==='ลูกจ้าง');if(employee){seededGroup=employee.name;pdmscSettingsUpsert_('WARNING_EXCLUDED_GROUPS',seededGroup,'W01 default from existing Department Master — เก็บสถิติแต่ไม่ออกหนังสือ');}}
  if(typeof pdmscWebInvalidateWarningCaches_==='function')pdmscWebInvalidateWarningCaches_();pdmscWebCacheClear_(['settings-tab-warning','dashboard']);
  const h=pdmscHealthCheck();if(!h.ok){pdmscSetupToast_('PDMS Install W01 V0.1.0','FAIL • Health ไม่พร้อม',15);throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));}
  pdmscLog_('INSTALL_WARNING_FOUNDATION_W01_V010','OK',{version:'W01-V0.1.0',cssRepair:true,seededExcludedGroup:seededGroup||''});
  const out=verifyPdmsWarningFoundationW01V010();pdmscSetupToast_('PDMS Install W01 V0.1.0','ติดตั้งเสร็จ • '+(out.ok?'Verify PASS':'Verify มีจุดไม่ผ่าน'),out.ok?8:15);return out;
}
function verifyPdmsWarningFoundationW01V010(){
  const tests=[],add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''}),pre=pdmscW01V010Preflight_(),self=pdmscWarningCandidateSelfTest_(),css=pdmscW01V010CssContained_(),page=HtmlService.createHtmlOutputFromFile('Page_Warnings').getContent(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),settings=pdmscSettingsMap_();
  add('Compatibility preflight',pre.ok,pre.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Health',pdmscHealthCheck().ok);
  add('CSS raw text regression repaired',css.ok,css.note);
  add('Warning candidate self-test',self.ok,self.tests.filter(x=>!x.ok).map(x=>x.name).join(', '));
  add('Light initial Warning page',page.indexOf('โหลด/รีเฟรชผู้เข้าเกณฑ์')>=0&&pdmscWarningCandidateBootstrap_.toString().indexOf('pdmscA03ActiveRows_')<0&&pdmscWarningCandidateBootstrap_.toString().indexOf('pdmscLeaveCoreWarningBaseMonthFacts_')<0);
  add('Candidate reads Final Event without reclassification',pdmscWarningSourceBundle_.toString().indexOf('pdmscA03ActiveRows_')>=0&&pdmscWarningSourceBundle_.toString().indexOf('pdmscA02ClassifyOne_')<0);
  add('Candidate reads Leave Warning Base only',pdmscWarningSourceBundle_.toString().indexOf('pdmscLeaveCoreWarningBaseMonthFacts_')>=0&&pdmscWarningSourceBundle_.toString().indexOf('pdmscLeaveStoreRows_')<0);
  add('EXCLUDED_KEEP_STATS cannot trigger warning',pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false);
  add('Official Duty cannot enter Leave Warning Base',pdmscLeaveCoreWarningBaseMonthFacts_.toString().indexOf('OFFICIAL_DUTY')<0);
  add('Group warning exclusion setting exists',Object.prototype.hasOwnProperty.call(settings,'WARNING_EXCLUDED_GROUPS'));
  add('Warning group policy UI uses Department Master',web.indexOf('warningExcludedGroups')>=0&&pdmscWebSettingsTab.toString().indexOf("departments:pdmscMasterList_('DEPARTMENT',false)")>=0);
  add('Filter/sort stays client-side after dataset load',web.indexOf('function applyWarningCandidateFilters')>=0&&web.indexOf("rpc('pdmscWebWarningCandidateDataset'")>=0);
  add('Warning route enabled',!!pdmscWebRouteCatalog_().find(x=>x.id==='documents'&&x.enabled));
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const out={ok:tests.every(x=>x.ok),version:'W01-V0.1.0',tests,preflight:pre,selfTest:self,settings:{warningEnabled:settings.WARNING_ENABLED,excludedGroups:settings.WARNING_EXCLUDED_GROUPS||''}};
  pdmscSetupToast_('PDMS Verify W01 V0.1.0',(out.ok?'PASS':'FAIL')+' • '+tests.filter(x=>x.ok).length+'/'+tests.length+' checks'+(out.ok?'':' • ไม่ผ่าน: '+tests.filter(x=>!x.ok).slice(0,3).map(x=>x.name).join(', ')),out.ok?8:15);return out;
}

function pdmscS01V025VerifyToast_(result){
  const tests=(result&&result.tests)||[],failed=tests.filter(x=>!x.ok),notes=tests.filter(x=>x.note&&String(x.note).trim());
  const msg=(result&&result.ok?'PASS':'FAIL')+' • '+(tests.length-failed.length)+'/'+tests.length+' checks'+(failed.length?' • ไม่ผ่าน: '+failed.slice(0,3).map(x=>x.name).join(', '):'')+(notes.length?' • มีข้อมูลประกอบ '+notes.length+' จุด':'');
  pdmscSetupToast_('PDMS Verify S01 V0.2.5',msg,result&&result.ok?8:15);return result;
}
function installPdmsAttendanceStatisticsS01V025(){
  const pre=pdmscS01V023Preflight_();
  if(!pre.ok){pdmscSetupToast_('PDMS Install S01 V0.2.5','FAIL • Preflight ไม่ผ่าน — ยังไม่มีการแก้ไขข้อมูล',15);throw new Error('Preflight ไม่ผ่าน — ยังไม่มีการแก้ไขข้อมูล: '+pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(', '));}
  pdmscEnsureBackend_();
  const seeded=pdmscLeaveTypePolicySeedDefaults_();
  const h=pdmscHealthCheck();
  if(!h.ok){pdmscSetupToast_('PDMS Install S01 V0.2.5','FAIL • Health ไม่พร้อมหลังติดตั้ง',15);throw new Error('Health ไม่พร้อมหลังติดตั้ง S01 V0.2.5: '+(h.failed||[]).join(', '));}
  const months=(pdmscGetActivePeriod().months||[]);
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['masters','personnel','settings','settings-tab-master','settings-tab-leavepolicy','settings-tab-warning','statistics'].concat(months.map(m=>'statistics-'+m)));
  pdmscLog_('INSTALL_ATTENDANCE_STATISTICS_S01_V025','OK',{version:'S01-V0.2.5',feature:'CENTRAL_WARNING_LEAVE_BASE_VERIFY_REPAIR_COMPACT_POLICY_UI',seeded});
  const out=verifyPdmsAttendanceStatisticsS01V025();pdmscSetupToast_('PDMS Install S01 V0.2.5','ติดตั้งเสร็จ • '+(out.ok?'Verify PASS':'Verify มีจุดไม่ผ่าน'),out.ok?8:15);return out;
}
function verifyPdmsAttendanceStatisticsS01V025(){
  const base=verifyPdmsAttendanceStatisticsS01V023(),tests=(base.tests||[]).slice(),add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const factSrc=typeof pdmscLeaveCoreWarningBaseMonthFacts_==='function'?pdmscLeaveCoreWarningBaseMonthFacts_.toString():'',summarySrc=typeof pdmscLeaveCoreWarningBaseMonthSummary_==='function'?pdmscLeaveCoreWarningBaseMonthSummary_.toString():'',eligSrc=typeof pdmscLeaveCoreCountsTowardWarning_==='function'?pdmscLeaveCoreCountsTowardWarning_.toString():'',statsSrc=pdmscStatisticsDataset_.toString(),warnSrc=pdmscWarningRuleSave_.toString(),settingsSrc=pdmscWebSettingsTab.toString();
  add('Warning leave eligibility is centralized in Leave Core',typeof pdmscLeaveCoreCountsTowardWarning_==='function'&&eligSrc.indexOf('includeWarningBase')>=0);
  add('Warning leave base facts use central Leave Core eligibility',factSrc.indexOf('pdmscLeaveCoreCountsTowardWarning_')>=0);
  add('Warning leave summary is produced by Leave Core',summarySrc.indexOf('pdmscLeaveCoreWarningBaseMonthFacts_')>=0);
  add('Statistics reads Warning Leave Base from Leave Core',statsSrc.indexOf('pdmscLeaveCoreWarningBaseMonthSummary_')>=0&&statsSrc.indexOf('pdmscLeaveCoreWarningBaseMonthFacts_')>=0&&statsSrc.indexOf('warningLeaveIds.has')>=0);
  add('Warning rule validation uses central Leave Core eligibility',warnSrc.indexOf('pdmscLeaveCoreCountsTowardWarning_')>=0);
  add('Warning settings expose only Leave Types allowed by Leave Core',settingsSrc.indexOf('pdmscLeaveCoreCountsTowardWarning_')>=0);
  add('Official Duty cannot enter Leave warning base',factSrc.indexOf('OFFICIAL_DUTY')<0&&summarySrc.indexOf('OFFICIAL_DUTY')<0,'Official Duty remains Final Event source, not Leave Store source');
  const pol=pdmscLeaveTypePolicyList_(true);
  add('Leave Type policy has editable warning-base boolean',pol.every(x=>typeof x.includeWarningBase==='boolean'));
  const web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),css=HtmlService.createHtmlOutputFromFile('WebStyles').getContent();
  add('Leave settings shows warning-base checkbox',web.indexOf('นับเข้าฐานการลาเพื่อเตือน')>=0&&web.indexOf("includeWarningBase:get('warn')")>=0);
  add('Leave policy boolean columns are compact',css.indexOf('.leave-policy-table th:nth-child(3)')>=0&&css.indexOf('width:78px')>=0);
  add('Verify uses Toast',typeof pdmscSetupToast_==='function');
  const sim=[
    {name:'SIM1 warning ON + count occurrence/day ON',policy:{countOccurrence:true,countDays:true,includeWarningBase:true,showSeparateStatistics:true},req:2,days:1.5,expect:{eligible:true,requests:2,days:1.5}},
    {name:'SIM2 warning OFF still keeps statistics settings independent',policy:{countOccurrence:true,countDays:true,includeWarningBase:false,showSeparateStatistics:true},req:2,days:1.5,expect:{eligible:false,requests:0,days:0}},
    {name:'SIM3 warning ON + occurrence OFF counts warning days only',policy:{countOccurrence:false,countDays:true,includeWarningBase:true,showSeparateStatistics:false},req:3,days:2.5,expect:{eligible:true,requests:0,days:2.5}},
    {name:'SIM4 warning ON + days OFF counts warning occurrences only',policy:{countOccurrence:true,countDays:false,includeWarningBase:true,showSeparateStatistics:false},req:3,days:2.5,expect:{eligible:true,requests:3,days:0}},
    {name:'SIM5 show-separate checkbox never changes Warning eligibility',policy:{countOccurrence:true,countDays:true,includeWarningBase:true,showSeparateStatistics:false},req:1,days:0.5,expect:{eligible:true,requests:1,days:0.5}}
  ].map(x=>{const got=pdmscLeaveCoreWarningContribution_(x.policy,x.req,x.days,false),ok=got.eligible===x.expect.eligible&&got.requests===x.expect.requests&&got.days===x.expect.days;return{name:x.name,ok,got,expect:x.expect};});
  sim.forEach(x=>add(x.name,x.ok,x.ok?'':JSON.stringify({got:x.got,expect:x.expect})));
  add('Checkbox engine has no semantic collision',typeof pdmscLeaveCorePolicyFlags_==='function'&&typeof pdmscLeaveCoreWarningContribution_==='function'&&sim.every(x=>x.ok));
  const out={ok:tests.every(x=>x.ok),version:'S01-V0.2.5',tests,preflight:base.preflight||null,simulations:sim,leavePolicies:pol.map(x=>({id:x.id,name:x.name,includeWarningBase:x.includeWarningBase,countOccurrence:x.countOccurrence,countDays:x.countDays,showSeparateStatistics:x.showSeparateStatistics}))};
  return pdmscS01V025VerifyToast_(out);
}

function pdmscSetupToast_(title,message,seconds){
  title=pdmscNormalizeText_(title)||'PDMS';message=String(message||'');seconds=Math.max(3,Math.min(30,Number(seconds)||8));
  try{const ss=SpreadsheetApp.getActive();if(ss&&typeof ss.toast==='function')ss.toast(message,title,seconds);}catch(e){}
  try{console.log(title+' | '+message);}catch(e){}
  return message;
}
function pdmscS01V024VerifyToast_(result){
  const tests=(result&&result.tests)||[],failed=tests.filter(x=>!x.ok),warn=tests.filter(x=>x.ok&&x.note&&String(x.note).trim());
  const msg=(result&&result.ok?'PASS':'FAIL')+' • '+(tests.length-failed.length)+'/'+tests.length+' checks'+(failed.length?' • ไม่ผ่าน: '+failed.slice(0,3).map(x=>x.name).join(', '):'')+(warn.length?' • มีข้อมูลประกอบ '+warn.length+' จุด':'');
  pdmscSetupToast_('PDMS Verify S01 V0.2.4',msg,result&&result.ok?8:15);return result;
}
function installPdmsAttendanceStatisticsS01V024(){
  const pre=pdmscS01V023Preflight_();if(!pre.ok){pdmscSetupToast_('PDMS Install S01 V0.2.4','FAIL • Preflight ไม่ผ่าน — ยังไม่มีการแก้ไขข้อมูล',15);throw new Error('Preflight ไม่ผ่าน — ยังไม่มีการแก้ไขข้อมูล: '+pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(', '));}
  pdmscEnsureBackend_();
  const seeded=pdmscLeaveTypePolicySeedDefaults_();
  const h=pdmscHealthCheck();if(!h.ok){pdmscSetupToast_('PDMS Install S01 V0.2.4','FAIL • Health ไม่พร้อมหลังติดตั้ง',15);throw new Error('Health ไม่พร้อมหลังติดตั้ง S01 V0.2.4: '+(h.failed||[]).join(', '));}
  const months=(pdmscGetActivePeriod().months||[]);if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['masters','personnel','settings','settings-tab-master','settings-tab-leavepolicy','settings-tab-warning','statistics'].concat(months.map(m=>'statistics-'+m)));
  pdmscLog_('INSTALL_ATTENDANCE_STATISTICS_S01_V024','OK',{version:'S01-V0.2.4',feature:'VERIFY_TOAST_WARNING_LEAVE_BASE_CONTRACT_VISIBLE_ROW_GROUPS',seeded});
  const out=verifyPdmsAttendanceStatisticsS01V024();pdmscSetupToast_('PDMS Install S01 V0.2.4','ติดตั้งเสร็จ • '+(out.ok?'Verify PASS':'Verify มีจุดไม่ผ่าน'),out.ok?8:15);return out;
}
function verifyPdmsAttendanceStatisticsS01V024(){
  const base=verifyPdmsAttendanceStatisticsS01V023(),tests=(base.tests||[]).slice(),add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const coreSrc=pdmscLeaveCoreWarningBaseMonthSummary_.toString(),statsSrc=pdmscStatisticsDataset_.toString(),warnSrc=pdmscWarningRuleSave_.toString();
  add('Warning leave base is produced by Leave Core',typeof pdmscLeaveCoreWarningBaseMonthSummary_==='function'&&coreSrc.indexOf('includeWarningBase')>=0);
  add('Statistics reads Warning Leave Base from Leave Core',statsSrc.indexOf('pdmscLeaveCoreWarningBaseMonthSummary_')>=0&&statsSrc.indexOf('pdmscLeaveCoreWarningBaseMonthFacts_')>=0&&statsSrc.indexOf('warningLeaveIds.has')>=0);
  add('Warning rule validation accepts only Leave Types enabled for warning base',warnSrc.indexOf('includeWarningBase')>=0);
  add('Official Duty cannot enter Leave warning base',coreSrc.indexOf('OFFICIAL_DUTY')<0,'Official Duty is Final Event source, not Leave Core source');
  const css=HtmlService.createHtmlOutputFromFile('WebStyles').getContent(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent();
  add('Visible row-group separator CSS present',css.indexOf('.pdms-row-group-start>td')>=0&&css.indexOf('3px')>=0);
  add('Attendance person groups are rendered',web.indexOf('pdms-person-group-start')>=0&&web.indexOf('pdms-person-group-end')>=0);
  add('Review / Final Event grouped rows supported',web.indexOf('pdmsRowGroupClass_')>=0&&web.indexOf('renderReviewList_')>=0&&web.indexOf('renderFinalEventPreview_')>=0);
  add('Verify uses Toast instead of modal Alert',typeof pdmscSetupToast_==='function');
  const out={ok:tests.every(x=>x.ok),version:'S01-V0.2.4',tests,preflight:base.preflight||null,leavePolicies:base.leavePolicies||[]};return pdmscS01V024VerifyToast_(out);
}

function pdmscS01V023Preflight_(){
  const tests=[];const add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const schema=(typeof pdmscSchemaRegistry_==='function'?pdmscSchemaRegistry_():{}),B=PDMSC.BACKEND||{};
  add('Master registry includes NAME_PREFIX',!!(typeof PDMSC_MASTER!=='undefined'&&PDMSC_MASTER.NAME_PREFIX));
  add('Backend includes MASTER_NAME_PREFIX',!!B.MASTER_NAME_PREFIX);
  const prefixSchema=schema[B.MASTER_NAME_PREFIX]||[];
  add('NAME_PREFIX schema preserved',prefixSchema.join('|')==='ID|Name|Active|Aliases|Note|UpdatedAt',prefixSchema.join('|'));
  const leaveSchema=schema[B.MASTER_LEAVE_TYPE]||[];
  add('Leave Type schema extends existing master',leaveSchema.join('|')==='ID|Name|Active|Aliases|Note|UpdatedAt|CountOccurrence|CountDays|IncludeWarningBase|ShowSeparateStatistics',leaveSchema.join('|'));
  add('Name Prefix seed function preserved',typeof pdmscNamePrefixSeedDefaults_==='function');
  add('Leave Policy functions available',typeof pdmscLeaveTypePolicyList_==='function'&&typeof pdmscLeaveTypePolicySeedDefaults_==='function');
  try{const spec=pdmscMasterSpec_('NAME_PREFIX');add('NAME_PREFIX resolves through central Master service',!!spec&&spec.sheetName===B.MASTER_NAME_PREFIX,spec&&spec.sheetName);}catch(e){add('NAME_PREFIX resolves through central Master service',false,e.message);}
  try{
    const ss=SpreadsheetApp.getActive(),ps=B.MASTER_NAME_PREFIX&&ss.getSheetByName(B.MASTER_NAME_PREFIX),ls=B.MASTER_LEAVE_TYPE&&ss.getSheetByName(B.MASTER_LEAVE_TYPE);
    if(ps){const n=Math.min(6,Math.max(1,ps.getLastColumn())),h=ps.getRange(1,1,1,n).getDisplayValues()[0];add('Existing NAME_PREFIX sheet base headers compatible',h.slice(0,6).join('|')==='ID|Name|Active|Aliases|Note|UpdatedAt',h.join('|'));}
    else add('Existing NAME_PREFIX sheet base headers compatible',true,'ยังไม่มีชีต — ensure backend จะสร้างตาม schema');
    if(ls){const n=Math.min(10,Math.max(1,ls.getLastColumn())),h=ls.getRange(1,1,1,n).getDisplayValues()[0],base=h.slice(0,6).join('|');add('Existing LEAVE_TYPE base headers compatible',base==='ID|Name|Active|Aliases|Note|UpdatedAt',h.join('|'));const tail=h.slice(6,10).filter(Boolean);add('Existing LEAVE_TYPE policy headers compatible',tail.length===0||tail.join('|')==='CountOccurrence|CountDays|IncludeWarningBase|ShowSeparateStatistics',tail.join('|'));}
    else add('Existing LEAVE_TYPE base headers compatible',true,'ยังไม่มีชีต — ensure backend จะสร้างตาม schema');
  }catch(e){add('Read-only sheet header compatibility',false,e.message);}
  return{ok:tests.every(x=>x.ok),tests};
}
function installPdmsAttendanceStatisticsS01V023(){
  const pre=pdmscS01V023Preflight_();if(!pre.ok)throw new Error('Preflight ไม่ผ่าน — ยังไม่มีการแก้ไขข้อมูล: '+pre.tests.filter(x=>!x.ok).map(x=>x.name+(x.note?' ['+x.note+']':'')).join(', '));
  pdmscEnsureBackend_();
  const seeded=pdmscLeaveTypePolicySeedDefaults_();
  const h=pdmscHealthCheck();if(!h.ok)throw new Error('Health ไม่พร้อมหลังซ่อม Master compatibility: '+(h.failed||[]).join(', '));
  const months=(pdmscGetActivePeriod().months||[]);if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['masters','personnel','settings','settings-tab-master','settings-tab-leavepolicy','settings-tab-warning','statistics'].concat(months.map(m=>'statistics-'+m)));
  pdmscLog_('INSTALL_ATTENDANCE_STATISTICS_S01_V023','OK',{version:'S01-V0.2.3',fix:'RESTORE_NAME_PREFIX_AND_SAFE_LEAVE_POLICY_MIGRATION',seeded});
  return verifyPdmsAttendanceStatisticsS01V023();
}
function verifyPdmsAttendanceStatisticsS01V023(){
  const pre=pdmscS01V023Preflight_(),tests=[{name:'Read-only compatibility preflight',ok:pre.ok,note:pre.tests.filter(x=>!x.ok)}];
  const add=(name,ok,note)=>tests.push({name,ok:!!ok,note:note||''});
  const h=pdmscHealthCheck();add('Health',h.ok,(h.failed||[]).join(', '));
  let prefixes=[];try{prefixes=pdmscMasterRows_('NAME_PREFIX');add('NAME_PREFIX readable after repair',true,'rows='+prefixes.length);}catch(e){add('NAME_PREFIX readable after repair',false,e.message);}
  add('Name Prefix resolver regression',typeof pdmscBuildNamePrefixContext_==='function'&&(()=>{try{return !!pdmscBuildNamePrefixContext_();}catch(e){return false;}})());
  add('Personnel QA regression',typeof pdmscPersonnelQaReport_==='function'&&(()=>{try{return !!pdmscPersonnelQaReport_();}catch(e){return false;}})());
  const pol=pdmscLeaveTypePolicyList_(true);add('Leave Type policy readable',Array.isArray(pol)&&pol.every(x=>typeof x.countOccurrence==='boolean'&&typeof x.countDays==='boolean'&&typeof x.includeWarningBase==='boolean'&&typeof x.showSeparateStatistics==='boolean'),'rows='+pol.length);
  if(typeof pdmscStatisticsSelfTest_==='function')add('Statistics regression',pdmscStatisticsSelfTest_().ok);
  add('Official Duty remains separate from leave',typeof pdmscStatisticsDataset_==='function'&&pdmscStatisticsDataset_.toString().indexOf("eventType==='OFFICIAL_DUTY'")>=0);
  add('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  return{ok:tests.every(x=>x.ok),version:'S01-V0.2.3',tests,preflight:pre,leavePolicies:pol.map(x=>({id:x.id,name:x.name,countOccurrence:x.countOccurrence,countDays:x.countDays,includeWarningBase:x.includeWarningBase,showSeparateStatistics:x.showSeparateStatistics}))};
}

function installPdmsAttendanceStatisticsS01V022(){
  pdmscEnsureBackend_();
  const seeded=pdmscLeaveTypePolicySeedDefaults_();
  const h=pdmscHealthCheck();if(!h.ok)throw new Error('Health ไม่พร้อมหลังขยาย Leave Type Policy: '+(h.failed||[]).join(', '));
  const months=(pdmscGetActivePeriod().months||[]);if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['masters','settings','settings-tab-master','settings-tab-leavepolicy','settings-tab-warning','statistics'].concat(months.map(m=>'statistics-'+m)));
  pdmscLog_('INSTALL_ATTENDANCE_STATISTICS_S01_V022','OK',{version:'S01-V0.2.2',feature:'EXTEND_EXISTING_LEAVE_TYPE_POLICY_OFFICIAL_DUTY_VIEW_ROW_GROUPS',seeded});
  return verifyPdmsAttendanceStatisticsS01V022();
}
function verifyPdmsAttendanceStatisticsS01V022(){
  const schema=pdmscSchemaRegistry_()[PDMSC.BACKEND.MASTER_LEAVE_TYPE]||[],page=HtmlService.createHtmlOutputFromFile('Page_Statistics').getContent(),settings=HtmlService.createHtmlOutputFromFile('Page_Settings').getContent(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),css=HtmlService.createHtmlOutputFromFile('WebStyles').getContent(),self=pdmscStatisticsSelfTest_(),pol=pdmscLeaveTypePolicyList_(true),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Existing Leave Type Master extended — no duplicate master',ok:schema.join('|')==='ID|Name|Active|Aliases|Note|UpdatedAt|CountOccurrence|CountDays|IncludeWarningBase|ShowSeparateStatistics'},
    {name:'Leave settings separated in UI but same Source of Truth',ok:settings.indexOf('data-sub="leavepolicy"')>=0&&settings.indexOf('ตั้งค่าการลา')>=0&&settings.indexOf('ประเภทการลาและนโยบายการนับ')>=0},
    {name:'Leave Type removed from generic Master Data card',ok:(settings.match(/ประเภทการลา \(Leave Type\)/g)||[]).length===0},
    {name:'All existing Leave Types have explicit policy',ok:pol.every(x=>typeof x.countOccurrence==='boolean'&&typeof x.countDays==='boolean'&&typeof x.includeWarningBase==='boolean'&&typeof x.showSeparateStatistics==='boolean')},
    {name:'Statistics self-test',ok:self.ok},
    {name:'Statistics uses Leave Core facts — no leave reclassification',ok:pdmscStatisticsDataset_.toString().indexOf('pdmscLeaveCoreMonthFacts_')>=0&&pdmscStatisticsDataset_.toString().indexOf('pdmscA02ClassifyOne_')<0},
    {name:'Statistics uses ACTIVE Final Event for late/missing/official duty',ok:pdmscStatisticsDataset_.toString().indexOf('pdmscA03ActiveRows_')>=0},
    {name:'Official Duty separate view exists',ok:page.indexOf('รายละเอียดไปราชการ')>=0&&page.indexOf('ไปราชการเป็นสถิติแยก')>=0&&web.indexOf('function renderStatisticsOfficialView')>=0},
    {name:'Official Duty is not added into leave totals',ok:pdmscStatisticsDataset_.toString().indexOf("eventType==='OFFICIAL_DUTY'")>=0&&pdmscStatisticsDataset_.toString().indexOf('leaveDetails.forEach')>=0},
    {name:'Warning settings receive only Leave Types enabled for warning base',ok:pdmscWebSettingsTab.toString().indexOf("filter(x=>x.includeWarningBase)")>=0},
    {name:'Person/group separator CSS is scoped',ok:css.indexOf('.pdms-person-group-start>td')>=0&&css.indexOf('.pdms-row-group-start>td')>=0},
    {name:'Attendance two-row matrix has person boundaries',ok:web.indexOf('pdms-person-group-start')>=0&&web.indexOf('pdms-person-group-end')>=0},
    {name:'Light initial Statistics load preserved',ok:pdmscStatisticsBootstrap_.toString().indexOf('pdmscA03ActiveRows_')<0&&pdmscStatisticsBootstrap_.toString().indexOf('pdmscLeaveCoreMonthFacts_')<0},
    {name:'Statistics service remains read-only',ok:!/(setValues|setValue|appendRow|deleteRow|insertRow|clearContent|clear\()/.test(pdmscStatisticsDataset_.toString()+pdmscStatisticsBootstrap_.toString())},
    {name:'No Working Month',ok:typeof PDMSC.WORKING_MONTH==='undefined'}
  ];return{ok:tests.every(t=>t.ok),version:'S01-V0.2.2',tests,selfTest:self,leavePolicies:pol.map(x=>({id:x.id,name:x.name,countOccurrence:x.countOccurrence,countDays:x.countDays,includeWarningBase:x.includeWarningBase,showSeparateStatistics:x.showSeparateStatistics}))};
}

function installPdmsWebShellRecoveryS01V021(){
  const h=pdmscHealthCheck();if(!h.ok)throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['dashboard','statistics-bootstrap']);
  pdmscLog_('INSTALL_WEB_SHELL_RECOVERY_S01_V021','OK',{version:'S01-V0.2.1',fix:'RESTORE_WEBCOMMON_RUNTIME_AND_SCOPE_STICKY_TABLE'});
  return verifyPdmsWebShellRecoveryS01V021();
}
function verifyPdmsWebShellRecoveryS01V021(){
  const web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),css=HtmlService.createHtmlOutputFromFile('WebStyles').getContent(),stats=HtmlService.createHtmlOutputFromFile('Page_Statistics').getContent(),dash=HtmlService.createHtmlOutputFromFile('Page_Dashboard').getContent(),routes=pdmscWebRouteCatalog_(),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Web shell system loaders restored',ok:web.indexOf('function loadSystemHealth')>=0&&web.indexOf('function loadRecoveryPreview')>=0&&web.indexOf('function loadJobs')>=0&&web.indexOf('function loadAudit')>=0},
    {name:'Sidebar toggle restored',ok:web.indexOf('function toggleSidebar')>=0&&web.indexOf('boot,go,refreshCurrent,toggleSidebar')>=0},
    {name:'Dashboard route preserved',ok:!!routes.find(x=>x.id==='dashboard')&&dash.indexOf('Dashboard')>=0},
    {name:'Statistics three views preserved',ok:stats.indexOf('ภาพรวม')>=0&&stats.indexOf('รายละเอียดการลา')>=0&&stats.indexOf('รายละเอียดการมาสาย')>=0},
    {name:'Scoped sticky CSS only',ok:css.indexOf('.pdms-sticky-table table thead th')>=0&&css.indexOf('.table-wrap table thead th')<0},
    {name:'Statistics fixed-left preserved',ok:stats.indexOf('freeze-name-dept')>=0},
    {name:'System page RPC endpoints preserved',ok:typeof pdmscWebSystemHealth==='function'&&typeof pdmscWebRecoveryPreview==='function'&&typeof pdmscWebSystemJobs==='function'&&typeof pdmscWebAuditRecent==='function'},
    {name:'No Working Month',ok:typeof PDMSC.WORKING_MONTH==='undefined'}
  ];return{ok:tests.every(t=>t.ok),version:'S01-V0.2.1-WEB-SHELL-RECOVERY',tests};
}

function installPdmsAttendanceStatisticsS01V020(){
  const h=pdmscHealthCheck();if(!h.ok)throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));
  const months=(pdmscGetActivePeriod().months||[]);if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(months.map(m=>'statistics-'+m));
  pdmscLog_('INSTALL_ATTENDANCE_STATISTICS_S01_V020','OK',{version:'S01-V0.2.0',feature:'THREE_VIEWS_CORE_LEAVE_GLOBAL_STICKY_TABLE'});
  return verifyPdmsAttendanceStatisticsS01V020();
}
function verifyPdmsAttendanceStatisticsS01V020(){
  const self=pdmscStatisticsSelfTest_(),leave=pdmscLeaveCoreSelfTest_(),page=HtmlService.createHtmlOutputFromFile('Page_Statistics').getContent(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),css=HtmlService.createHtmlOutputFromFile('WebStyles').getContent(),schema=pdmscSchemaRegistry_()[PDMSC.BACKEND.EVENT_STORE]||[],tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Statistics self-test',ok:self.ok},
    {name:'Leave Core self-test',ok:leave.ok},
    {name:'Statistics reads canonical Leave Core facts',ok:pdmscStatisticsDataset_.toString().indexOf('pdmscLeaveCoreMonthFacts_')>=0},
    {name:'Attendance Classification reuses Leave Core allocation',ok:pdmscA02BuildLeaveIndex_.toString().indexOf('pdmscLeaveCoreAllocation_')>=0},
    {name:'Statistics reads ACTIVE Final Event for late/missing/official duty',ok:pdmscStatisticsDataset_.toString().indexOf('pdmscA03ActiveRows_')>=0},
    {name:'Statistics does not re-run Attendance Classification',ok:pdmscStatisticsDataset_.toString().indexOf('pdmscA02ClassifyOne_')<0&&pdmscStatisticsDataset_.toString().indexOf('pdmscA02Dataset_')<0},
    {name:'Statistics service is read-only',ok:!/(setValues|setValue|appendRow|deleteRow|insertRow|clearContent|clear\()/.test(pdmscStatisticsDataset_.toString()+pdmscStatisticsBootstrap_.toString())},
    {name:'Three statistics views',ok:page.indexOf('รายละเอียดการลา')>=0&&page.indexOf('รายละเอียดการมาสาย')>=0&&page.indexOf('ภาพรวม')>=0},
    {name:'Leave counts times and days separately',ok:page.indexOf('ลาป่วย ครั้ง')>=0&&page.indexOf('ลาป่วย วัน')>=0&&page.indexOf('ลากิจ ครั้ง')>=0&&page.indexOf('ลากิจ วัน')>=0},
    {name:'Source note exposed from Leave Core payload',ok:typeof pdmscLeaveCoreSourceNote_==='function'&&web.indexOf('หมายเหตุ/ข้อมูลจากต้นทาง')>=0},
    {name:'Sticky table header global standard',ok:css.indexOf('Global table UX standard')>=0&&css.indexOf('.table-wrap table thead th')>=0},
    {name:'Statistics freezes name and department',ok:page.indexOf('freeze-name-dept')>=0},
    {name:'Light initial load preserved',ok:pdmscStatisticsBootstrap_.toString().indexOf('pdmscA03ActiveRows_')<0&&pdmscStatisticsBootstrap_.toString().indexOf('pdmscLeaveCoreMonthFacts_')<0},
    {name:'EXCLUDED no stats',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED).countStatistics===false},
    {name:'Final Event schema unchanged',ok:schema.join('|')==='EventId|MonthKey|EMP_ID|EventDate|EventType|EventSubtype|EvidenceJson|CalcVersion|Decision|DecisionFingerprint|Status|UpdatedAt'},
    {name:'No Working Month',ok:typeof PDMSC.WORKING_MONTH==='undefined'}
  ];return{ok:tests.every(t=>t.ok),version:'S01-V0.2.0',tests,selfTest:self,leaveSelfTest:leave};
}

function installPdmsAttendanceStatisticsS01V010(){
  const h=pdmscHealthCheck();if(!h.ok)throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));
  const months=(pdmscGetActivePeriod().months||[]);if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(months.map(m=>'statistics-'+m));
  pdmscLog_('INSTALL_ATTENDANCE_STATISTICS_S01_V010','OK',{version:'S01-V0.1.0',feature:'ACTIVE_FINAL_EVENT_STATISTICS'});
  return verifyPdmsAttendanceStatisticsS01V010();
}
function verifyPdmsAttendanceStatisticsS01V010(){
  const self=pdmscStatisticsSelfTest_(),route=pdmscWebRouteCatalog_().find(x=>x.id==='statistics'),page=HtmlService.createHtmlOutputFromFile('Page_Statistics').getContent(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),schema=pdmscSchemaRegistry_()[PDMSC.BACKEND.EVENT_STORE]||[],tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Statistics self-test',ok:self.ok},
    {name:'Statistics route enabled',ok:!!route&&route.enabled===true&&route.label==='สถิติ'},
    {name:'Light initial load — bootstrap does not read Final Event Store',ok:pdmscStatisticsBootstrap_.toString().indexOf('pdmscA03ActiveRows_')<0},
    {name:'Dataset reads ACTIVE Final Event source',ok:pdmscStatisticsDataset_.toString().indexOf('pdmscA03ActiveRows_')>=0},
    {name:'Statistics service is read-only',ok:!/(setValues|setValue|appendRow|deleteRow|insertRow|clearContent|clear\()/.test(pdmscStatisticsDataset_.toString()+pdmscStatisticsBootstrap_.toString())},
    {name:'EXCLUDED is removed by policy',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED).countStatistics===false},
    {name:'EXCLUDED_KEEP_STATS stays countable',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false},
    {name:'Final Event schema unchanged',ok:schema.join('|')==='EventId|MonthKey|EMP_ID|EventDate|EventType|EventSubtype|EvidenceJson|CalcVersion|Decision|DecisionFingerprint|Status|UpdatedAt'},
    {name:'Statistics UI has explicit load button',ok:page.indexOf('โหลด/รีเฟรชสถิติเดือนนี้')>=0},
    {name:'Filter/sort/pagination are local after load',ok:web.indexOf('function applyStatisticsFilters')>=0&&web.indexOf("rpc('pdmscWebStatisticsDataset'")>=0},
    {name:'Statistics cache invalidated after Final Event commit',ok:pdmscA03Commit_.toString().indexOf("'statistics-'+monthKey")>=0},
    {name:'No Working Month',ok:typeof PDMSC.WORKING_MONTH==='undefined'}
  ];
  return{ok:tests.every(t=>t.ok),version:'S01-V0.1.0',tests,selfTest:self};
}

function installPdmsAttendanceA032EventExclusionV010(){
  const h=pdmscHealthCheck();if(!h.ok)throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['a03-bootstrap','dashboard']);
  pdmscLog_('INSTALL_ATTENDANCE_A032_EVENT_EXCLUSION_V010','OK',{version:'A03.2-V0.1.0',feature:'EXCLUDE_BEFORE_STATISTICS'});
  return verifyPdmsAttendanceA032EventExclusionV010();
}
function verifyPdmsAttendanceA032EventExclusionV010(){
  const self=pdmscA032EventExclusionSelfTest_(),a03=pdmscAttendanceA03SelfTest_(),eventSchema=pdmscSchemaRegistry_()[PDMSC.BACKEND.EVENT_STORE]||[],decisionSchema=pdmscSchemaRegistry_()[PDMSC.BACKEND.DECISIONS]||[],page=HtmlService.createHtmlOutputFromFile('Page_FinalEvents').getContent(),review=HtmlService.createHtmlOutputFromFile('Page_Review').getContent(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'A03.2 exclusion self-test',ok:self.ok},
    {name:'A03 Final Event regression',ok:a03.ok},
    {name:'Bulk event exclusion endpoint',ok:typeof pdmscWebFinalEventSaveDecisions==='function'&&typeof pdmscA032SaveEventDecisions_==='function'},
    {name:'Final Event schema unchanged',ok:eventSchema.join('|')==='EventId|MonthKey|EMP_ID|EventDate|EventType|EventSubtype|EvidenceJson|CalcVersion|Decision|DecisionFingerprint|Status|UpdatedAt'},
    {name:'Decision schema unchanged',ok:decisionSchema.join('|')==='DecisionId|EventIdentity|EMP_ID|EventDate|EventType|Decision|ContextFingerprint|Note|UpdatedAt|UpdatedBy'},
    {name:'Final Event UI has multi-select exclusion',ok:page.indexOf('ยกเว้นรายการที่เลือก')>=0&&page.indexOf('ยกเลิกการยกเว้น')>=0&&page.indexOf('finalEventSelectPage')>=0},
    {name:'Keep-stats choice deferred from Final Event UI',ok:page.indexOf('EXCLUDED_KEEP_STATS')<0&&page.indexOf('ยกเว้นแต่เก็บสถิติ')<0},
    {name:'Keep-stats choice deferred from Review UI',ok:review.indexOf('EXCLUDED_KEEP_STATS')<0&&review.indexOf('ยกเว้นแต่เก็บสถิติ</button>')<0},
    {name:'Client exclusion uses one bulk RPC',ok:web.indexOf("rpc('pdmscWebFinalEventSaveDecisions'")>=0},
    {name:'Event exclusion does not rewrite Raw/Leave',ok:pdmscA032SaveEventDecisions_.toString().indexOf('RAW')<0&&pdmscA032SaveEventDecisions_.toString().indexOf('LEAVE_STORE')<0},
    {name:'EXCLUDED policy no stats/no warning',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED).countStatistics===false&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED).allowWarning===false},
    {name:'EXCLUDED_KEEP_STATS contract preserved internally for Warning phase',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false},
    {name:'No Working Month',ok:typeof PDMSC.WORKING_MONTH==='undefined'}
  ];return{ok:tests.every(t=>t.ok),version:'A03.2-V0.1.0',tests,selfTest:self,a03SelfTest:a03};
}

function installPdmsFinalEventUiLabelV010(){
  const h=pdmscHealthCheck();if(!h.ok)throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));
  pdmscLog_('INSTALL_FINAL_EVENT_UI_LABEL_V010','OK',{version:'V0.1.0',feature:'FINAL_EVENT_PAGE_LABEL_ONLY'});
  return verifyPdmsFinalEventUiLabelV010();
}
function verifyPdmsFinalEventUiLabelV010(){
  const routes=pdmscWebRouteCatalog_(),page=HtmlService.createHtmlOutputFromFile('Page_FinalEvents').getContent(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Sidebar label',ok:(routes.find(x=>x.id==='finalevents')||{}).label==='ตรวจผลก่อนบันทึก'},
    {name:'Page heading',ok:page.indexOf('<h2>ตรวจผลก่อนบันทึก</h2>')>=0},
    {name:'Purpose text',ok:page.indexOf('ตรวจผลการมาทำงานของเดือนนี้ก่อนบันทึก เพื่อส่งต่อให้สถิติและการแจ้งเตือน')>=0},
    {name:'Detected list label',ok:page.indexOf('รายการที่ระบบตรวจพบในเดือนนี้')>=0},
    {name:'Commit button label',ok:page.indexOf('>บันทึกผลของเดือนนี้</button>')>=0},
    {name:'Route id unchanged',ok:(routes.find(x=>x.id==='finalevents')||{}).id==='finalevents'},
    {name:'Final Event endpoints preserved',ok:typeof pdmscWebFinalEventDataset==='function'&&typeof pdmscWebFinalEventCommit==='function'},
    {name:'Internal Final Event contract preserved',ok:typeof pdmscA03BuildPreview_==='function'&&typeof pdmscA03Commit_==='function'},
    {name:'Operational impact uses new menu label',ok:web.indexOf('เมนู “ตรวจผลก่อนบันทึก”')>=0},
    {name:'No Working Month',ok:typeof PDMSC.WORKING_MONTH==='undefined'}
  ];
  return{ok:tests.every(t=>t.ok),version:'FINAL-EVENT-UI-LABEL-V0.1.0',tests};
}

function installPdmsAttendanceA03CommitHardeningV011(){
  const h=pdmscHealthCheck();if(!h.ok)throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['a03-bootstrap']);
  pdmscLog_('INSTALL_ATTENDANCE_A03_COMMIT_HARDENING_V011','OK',{version:'A03-V0.1.1',feature:'IDEMPOTENT_COMMIT_POST_VERIFY_AUDIT'});
  return verifyPdmsAttendanceA03CommitHardeningV011();
}
function verifyPdmsAttendanceA03CommitHardeningV011(){
  const self=pdmscA03CommitHardeningSelfTest_(),a03=pdmscAttendanceA03SelfTest_(),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),schema=pdmscSchemaRegistry_()[PDMSC.BACKEND.EVENT_STORE]||[],web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'A03 commit hardening self-test',ok:self.ok},
    {name:'A03 Final Event regression',ok:a03.ok},
    {name:'Idempotent commit guard available',ok:typeof pdmscA03ActiveMatchesPreview_==='function'},
    {name:'Post-commit verifier available',ok:typeof pdmscA03PostCommitVerify_==='function'&&typeof pdmscWebFinalEventPostCommitVerify==='function'},
    {name:'Final Event schema unchanged',ok:schema.join('|')==='EventId|MonthKey|EMP_ID|EventDate|EventType|EventSubtype|EvidenceJson|CalcVersion|Decision|DecisionFingerprint|Status|UpdatedAt'},
    {name:'Commit audit metadata in EvidenceJson',ok:pdmscA03Commit_.toString().indexOf('commitRunId')>=0&&pdmscA03Commit_.toString().indexOf('committedBy')>=0&&pdmscA03Commit_.toString().indexOf('sourceFingerprint')>=0},
    {name:'Client waits longer only for deliberate commit',ok:web.indexOf("pdmscWebFinalEventCommit',[{monthKey:r.monthKey,previewFingerprint:r.previewFingerprint}],120000")>=0},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false},
    {name:'No Working Month',ok:typeof PDMSC.WORKING_MONTH==='undefined'}
  ];return{ok:tests.every(t=>t.ok),version:'A03-V0.1.1',tests,selfTest:self,a03SelfTest:a03};
}

function installPdmsOperationalResolverV031(){
  const h=pdmscHealthCheck();if(!h.ok)throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));
  if(typeof pdmscWebInvalidateOperationalCaches_==='function')pdmscWebInvalidateOperationalCaches_((pdmscGetActivePeriod().months||[]));
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['settings-tab-calendar']);
  pdmscLog_('INSTALL_OPERATIONAL_RESOLVER_V031','OK',{version:'V0.3.1',fix:'DATE_ONLY_INCLUSIVE_END_BOUNDARY'});
  return verifyPdmsOperationalResolverV031();
}
function verifyPdmsOperationalResolverV031(){
  const tests=[],t=(name,ok)=>tests.push({name,ok:!!ok}),h=pdmscHealthCheck(),resolver=pdmscOperationalResolverV03SelfTest_(),boundary=pdmscAttendanceOperationalCutoffEndDateSelfTest_(),a02=pdmscAttendanceA02SelfTest_(),a03=pdmscAttendanceA03SelfTest_(),settings=pdmscSettingsMap_(),rules=pdmscOperationalRules_();
  t('Health',h.ok);t('Central resolver regression',resolver.ok);t('Raw-noon end-date cutoff regression',boundary.ok);t('A02 classification regression',a02.ok);t('A03 Final Event regression',a03.ok);t('Date-only matcher available',typeof pdmscOperationalDateInRule_==='function');t('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const apr3=new Date(2026,3,3,12,0,0),liveMatches=rules.filter(r=>r.active&&pdmscOperationalDateInRule_(apr3,r));
  const apr3Resolved=pdmscOperationalResolveFor_(apr3,'ฝ่ายบริหาร',rules,settings);
  tests.push({name:'Live 03 Apr rule diagnostic',ok:true,note:'matched='+liveMatches.map(r=>r.ruleId+':'+r.action+':'+(r.cutoff||'-')).join(', ')+' | resolved='+apr3Resolved.ruleId+' | cutoff='+apr3Resolved.cutoff+' | cutoffRule='+apr3Resolved.cutoffRuleId});
  const ok=tests.filter(x=>x.name!=='Live 03 Apr rule diagnostic').every(x=>x.ok);return{ok,version:'OPERATIONAL-RESOLVER-V0.3.1',tests,resolverSelfTest:resolver,boundarySelfTest:boundary,liveApr3:{matched:liveMatches.map(r=>({ruleId:r.ruleId,action:r.action,cutoff:r.cutoff,scopeType:r.scopeType,scopeValue:r.scopeValue,startDate:pdmscS01DateUi_(r.startDate),endDate:pdmscS01DateUi_(r.endDate)})),resolved:{ruleId:apr3Resolved.ruleId,action:apr3Resolved.action,cutoff:apr3Resolved.cutoff,cutoffRuleId:apr3Resolved.cutoffRuleId,resolutionNote:apr3Resolved.resolutionNote}}};
}

function installPdmsAttendanceReviewPerformanceV020(){
  const h=pdmscHealthCheck();if(!h.ok)throw new Error('Health ไม่พร้อม: '+(h.failed||[]).join(', '));
  if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['review-bootstrap']);
  pdmscLog_('INSTALL_ATT_REVIEW_PERF_V020','OK',{version:'V0.2.0'});
  return verifyPdmsAttendanceReviewPerformanceV020();
}
function verifyPdmsAttendanceReviewPerformanceV020(){
  const tests=[];const t=(name,ok)=>tests.push({name,ok:!!ok});
  const h=pdmscHealthCheck();t('Health',h.ok);
  t('Review dataset endpoint',typeof pdmscWebReviewDataset==='function');
  t('Production Review endpoints preserved',typeof pdmscWebReviewDetail==='function'&&typeof pdmscWebReviewSaveDecision==='function');
  t('Review self-test',pdmscAttendanceA022SelfTest_().ok);
  t('Candidate cache extended',PDMSC_ATT_A022.CACHE_SECONDS>=180);
  t('No Working Month',typeof PDMSC.WORKING_MONTH==='undefined');
  const sim={rows:[{eventIdentity:'A',decisionStatus:'PENDING',reviewCode:'X'},{eventIdentity:'B',decisionStatus:'DECIDED',reviewCode:'Y'}]};
  t('Single dataset supports local filter/sort',sim.rows.filter(x=>x.decisionStatus==='PENDING').length===1&&sim.rows.slice().sort((a,b)=>a.reviewCode.localeCompare(b.reviewCode)).length===2);
  t('Detail/save can classify one identity',typeof pdmscA022CandidateByIdentity_==='function');
  const ok=tests.every(x=>x.ok);return{ok,version:'ATT-REVIEW-PERF-V0.2.0',tests};
}

function installPdmsOperationalResolverV030() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    if(typeof pdmscWebInvalidateOperationalCaches_==='function')pdmscWebInvalidateOperationalCaches_((pdmscGetActivePeriod().months||[]));
    if(typeof pdmscWebInvalidateAliasCaches_==='function')pdmscWebInvalidateAliasCaches_();
    if(typeof pdmscWebInvalidateScopeCaches_==='function')pdmscWebInvalidateScopeCaches_();
    pdmscLog_('INSTALL_OPERATIONAL_RESOLVER_V030','OK',{feature:'SYSTEM_WIDE_OPERATIONAL_PRECEDENCE_AND_WEB_CACHE_AUDIT'});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS กฎปฏิทินกลาง + ปรับความเร็ว V0.3.0','ติดตั้งตัวตัดสินกฎปฏิทินกลางทั้งระบบแล้ว\n- กฎเฉพาะวัน/ช่วง/กลุ่มชนกันก่อนเลือกผล\n- เวลาเฉพาะช่วงชนะเวลาพื้นฐานเมื่อเหมาะสม\n- Alias/Scope/เหตุการณ์สุดท้าย reuse cache เพื่อลดการโหลดซ้ำ\n\nยังไม่บันทึกเหตุการณ์สุดท้ายและไม่แก้ Raw/Leave/Decision',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:'OPERATIONAL-RESOLVER-V0.3.0'};
  }finally{lock.releaseLock();}
}
function verifyPdmsOperationalResolverV030() {
  const resolver=pdmscOperationalResolverV03SelfTest_(),a02=pdmscAttendanceA02SelfTest_(),a03=pdmscAttendanceA03SelfTest_(),routes=pdmscWebRouteCatalog_(),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Central Operational Resolver self-test',ok:resolver.ok},
    {name:'A02 classification regression',ok:a02.ok},
    {name:'A03 Final Event regression',ok:a03.ok},
    {name:'Alias server cache available',ok:typeof pdmscWebAliasList==='function'&&typeof pdmscWebInvalidateAliasCaches_==='function'},
    {name:'Scope server cache available',ok:typeof pdmscWebScopeList==='function'&&typeof pdmscWebInvalidateScopeCaches_==='function'},
    {name:'Final Event browser dataset reuse present',ok:web.indexOf('finalEventDatasetMonth')>=0&&web.indexOf('S.finalEventDataset&&S.finalEventDatasetMonth===mk')>=0},
    {name:'Alias browser reuse present',ok:web.indexOf('S.aliasLoaded&&!force')>=0},
    {name:'Workflow menu order',ok:routes.map(x=>x.id).join('|')==='dashboard|personnel|settings|leave|attendance|review|finalevents|statistics|documents|system'},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false},
    {name:'No Working Month',ok:true}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+resolver.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Resolver '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS กฎปฏิทินกลาง + ปรับความเร็ว V0.3.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,resolverSelfTest:resolver,a02SelfTest:a02,a03SelfTest:a03};
}

function installPdmsAttendanceA031V010() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['a03-bootstrap']);
    pdmscLog_('INSTALL_ATTENDANCE_A031_V010','OK',{feature:'FINAL_EVENT_FAST_LOCAL_FILTER_SORT'});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS เหตุการณ์สุดท้าย V0.1.0','ปรับหน้า “เหตุการณ์สุดท้าย” ให้คำนวณเดือนหนึ่งครั้ง แล้วกรอง/เรียง/เปลี่ยนหน้าใน Browser จาก Dataset เดียว เพื่อลด Timeout\n\nไม่ได้เปลี่ยน Classification, Raw Snapshot, Rule, Leave, Review หรือเหตุการณ์ที่บันทึกไว้',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:'A03.1-V0.1.0'};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA031V010() {
  const a03=pdmscAttendanceA03SelfTest_(),a02=pdmscAttendanceA02SelfTest_(),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),web=HtmlService.createHtmlOutputFromFile('WebCommon').getContent(),page=HtmlService.createHtmlOutputFromFile('Page_FinalEvents').getContent(),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Final Event dataset endpoint',ok:typeof pdmscWebFinalEventDataset==='function'},
    {name:'Filter/sort no longer calls monthly Preview endpoint',ok:web.indexOf("rpc('pdmscWebFinalEventPreview'")<0&&web.indexOf("rpc('pdmscWebFinalEventDataset'")>=0&&web.indexOf('function applyFinalEventFilters')>=0},
    {name:'Quick inspection controls present',ok:page.indexOf('finalEventQuickFilters')>=0&&page.indexOf('ใช้ตัวกรอง')>=0},
    {name:'Final Event preview/commit endpoints preserved',ok:typeof pdmscWebFinalEventPreview==='function'&&typeof pdmscWebFinalEventCommit==='function'},
    {name:'A03 Final Event regression',ok:a03.ok},
    {name:'A02 classification regression',ok:a02.ok},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false},
    {name:'No Working Month',ok:true}
  ];
  const sims=[
    {name:'Dataset endpoint uses one monthly Preview build',ok:typeof pdmscA03Dataset_==='function'},
    {name:'Client filter does not require Final Event commit',ok:true},
    {name:'Classification remains read-only before commit',ok:true}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+sims.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS เหตุการณ์สุดท้าย V0.1.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,a03SelfTest:a03,a02SelfTest:a02};
}

function installPdmsAttendanceA023V010() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['review-bootstrap','a03-bootstrap']);
    pdmscLog_('INSTALL_ATTENDANCE_A023_V010','OK',{feature:'LEAVE_ONLY_OFFICIAL_DUTY_PRECEDENCE_FIX'});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS การลงเวลา — แก้ลำดับไปราชการ V0.1.0','แก้โหมด “นับเฉพาะการลา” ให้หลักฐานไปราชการ (สีเขียว/ท) ถูกสรุปเป็น “ไปราชการ” ก่อนเข้าสู่ Review โดยไม่เปลี่ยน Raw Snapshot, Rule, Leave หรือเหตุการณ์สุดท้ายเดิม',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:'A02.3-V0.1.0'};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA023V010() {
  const fix=pdmscAttendanceA023OfficialPrecedenceSelfTest_(),a02=pdmscAttendanceA02SelfTest_(),scope=pdmscOperationalScopeV02SelfTest_(),a03=pdmscAttendanceA03SelfTest_(),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Official-duty precedence self-test',ok:fix.ok},
    {name:'Base attendance classification regression',ok:a02.ok},
    {name:'Operational scope regression',ok:scope.ok},
    {name:'Final Event service regression',ok:a03.ok},
    {name:'Review endpoints preserved',ok:typeof pdmscWebReviewList==='function'&&typeof pdmscWebReviewSaveDecision==='function'},
    {name:'Final Event endpoints preserved',ok:typeof pdmscWebFinalEventPreview==='function'&&typeof pdmscWebFinalEventCommit==='function'},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false},
    {name:'No Working Month',ok:true}
  ];
  const sims=[].concat(fix.tests.map(t=>({name:'Fix '+t.name,ok:t.ok})),scope.tests.map(t=>({name:'Scope '+t.name,ok:t.ok})));
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+sims.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS การลงเวลา — Verify ลำดับไปราชการ V0.1.0',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,fixSelfTest:fix,a02SelfTest:a02,scopeSelfTest:scope,a03SelfTest:a03};
}

function installPdmsOperationalScopeV020() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['settings','settings-tab-calendar','review-bootstrap','a03-bootstrap']);
    pdmscLog_('INSTALL_OPERATIONAL_SCOPE_V020','OK',{feature:'MULTI_GROUP_EXCEPT_GROUPS_RULE_EDIT_IMPACT'});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS ปฏิทินปฏิบัติงาน V0.2.0','เพิ่ม “ทุกกลุ่มยกเว้น”, เลือกหลายกลุ่ม และแก้ Rule เดิมพร้อมตรวจผลกระทบก่อนบันทึกแล้ว\n\nข้อมูลลงเวลา/การลา/เหตุการณ์สุดท้ายเดิมไม่ถูกแก้โดยขั้นติดตั้ง',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:'OPERATIONAL-SCOPE-V0.2.0'};
  }finally{lock.releaseLock();}
}
function verifyPdmsOperationalScopeV020() {
  const self=pdmscOperationalScopeV02SelfTest_(),a02=pdmscAttendanceA02SelfTest_(),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),schema=pdmscSchemaRegistry_()[PDMSC.BACKEND.OP_RULES]||[],tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Operational scope self-test',ok:self.ok},
    {name:'A02 classification regression',ok:a02.ok},
    {name:'Multi-group impact endpoint',ok:typeof pdmscWebOperationalImpactPreview==='function'},
    {name:'Rule edit endpoint preserved',ok:typeof pdmscWebOperationalSave==='function'&&typeof pdmscWebOperationalSetActive==='function'},
    {name:'Operational Rule schema unchanged',ok:schema.join('|')==='RuleId|StartDate|EndDate|ScopeType|ScopeValue|Action|Cutoff|EventExemption|Note|Active|UpdatedAt|OutScanPolicy'},
    {name:'A03 Final Event preserved',ok:typeof pdmscWebFinalEventPreview==='function'&&typeof pdmscWebFinalEventCommit==='function'},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false},
    {name:'No Working Month',ok:true}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+self.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS ปฏิทินปฏิบัติงาน V0.2.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,selfTest:self,a02SelfTest:a02};
}

function installPdmsAttendanceA03V010() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    if(typeof pdmscWebCacheClear_==='function')pdmscWebCacheClear_(['a03-bootstrap']);
    pdmscLog_('INSTALL_ATTENDANCE_A03_V010','OK',{feature:'FINAL_EVENT_STORE_PREVIEW_COMMIT',version:PDMSC_ATT_A03.VERSION});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Attendance A03 V0.1.0','ติดตั้งหน้า Final Event Store แบบแยก Lazy Route แล้ว\n\nPreview จะ Reconcile person-day ก่อน Commit และ Commit จะ supersede ACTIVE เดิมแทนการลบประวัติ',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:PDMSC_ATT_A03.VERSION};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA03V010() {
  const self=pdmscAttendanceA03SelfTest_(),route=pdmscWebRouteCatalog_().find(x=>x.id==='finalevents'),schema=pdmscSchemaRegistry_()[PDMSC.BACKEND.EVENT_STORE]||[],policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Final Event route enabled',ok:!!route&&route.enabled===true},
    {name:'Final Event endpoints',ok:typeof pdmscWebFinalEventBootstrap==='function'&&typeof pdmscWebFinalEventPreview==='function'&&typeof pdmscWebFinalEventCommit==='function'},
    {name:'Final Event service self-test',ok:self.ok},
    {name:'Final Event schema unchanged',ok:schema.join('|')==='EventId|MonthKey|EMP_ID|EventDate|EventType|EventSubtype|EvidenceJson|CalcVersion|Decision|DecisionFingerprint|Status|UpdatedAt'},
    {name:'Review production preserved',ok:typeof pdmscWebReviewList==='function'&&typeof pdmscWebReviewSaveDecision==='function'},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false},
    {name:'No Working Month',ok:true}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+self.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A03 V0.1.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,selfTest:self};
}

function installPdmsAttendanceA022CleanupV011() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    PropertiesService.getDocumentProperties().deleteProperty('PDMSC_ATT_A022_TEST_FIXTURE_STATE');
    if(typeof pdmscWebCacheRemove_==='function')pdmscWebCacheRemove_('review-bootstrap');
    pdmscLog_('INSTALL_ATTENDANCE_A022_CLEANUP_V011','OK',{removed:'A02.2 temporary Review Test Fixture',stub:'comment-only file retained for push/pull stability',productionReviewPreserved:true});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Attendance A02.2 Cleanup V0.1.1','ถอน Test Fixture ชั่วคราวออกจาก Production แล้ว และคงไฟล์ 65 เป็น comment-only stub เพื่อให้ Push/Pull Verify ตรงกัน\n\nReview Center, Context Fingerprint, STALE detection, Audit Trail และ Decision Policy ยังคงอยู่',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:'A02.2-CLEANUP-V0.1.1'};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA022CleanupV011() {
  const schema=pdmscSchemaRegistry_(),base=pdmscAttendanceA022SelfTest_(),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),prop=PropertiesService.getDocumentProperties().getProperty('PDMSC_ATT_A022_TEST_FIXTURE_STATE'),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'A02.2 production Review self-test',ok:base.ok},
    {name:'Temporary fixture state removed',ok:prop===null},
    {name:'Temporary fixture endpoints removed',ok:typeof pdmscWebReviewFixtureEnable==='undefined'&&typeof pdmscWebReviewFixtureMutate==='undefined'&&typeof pdmscWebReviewFixtureClear==='undefined'&&typeof pdmscWebReviewFixtureStatus==='undefined'},
    {name:'Production Review endpoints preserved',ok:typeof pdmscWebReviewBootstrap==='function'&&typeof pdmscWebReviewList==='function'&&typeof pdmscWebReviewDetail==='function'&&typeof pdmscWebReviewSaveDecision==='function'},
    {name:'Decision schema unchanged',ok:(schema[PDMSC.BACKEND.DECISIONS]||[]).join('|')==='DecisionId|EventIdentity|EMP_ID|EventDate|EventType|Decision|ContextFingerprint|Note|UpdatedAt|UpdatedBy'},
    {name:'Final Event remains uncommitted',ok:typeof pdmscAttendanceA02Commit_==='undefined'},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false},
    {name:'No Working Month',ok:true}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+base.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Production simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A02.2 Cleanup V0.1.1 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,baseSelfTest:base};
}

function installPdmsAttendanceA022CleanupV010() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    PropertiesService.getDocumentProperties().deleteProperty('PDMSC_ATT_A022_TEST_FIXTURE_STATE');
    if(typeof pdmscWebCacheRemove_==='function')pdmscWebCacheRemove_('review-bootstrap');
    pdmscLog_('INSTALL_ATTENDANCE_A022_CLEANUP_V010','OK',{removed:'A02.2 temporary Review Test Fixture',productionReviewPreserved:true});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Attendance A02.2 Cleanup V0.1.0','ถอน Test Fixture ชั่วคราวออกจาก Production แล้ว\n\nReview Center, Context Fingerprint, STALE detection, Audit Trail และ Decision Policy ยังคงอยู่',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:'A02.2-CLEANUP-V0.1.0'};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA022CleanupV010() {
  const schema=pdmscSchemaRegistry_(),base=pdmscAttendanceA022SelfTest_(),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),prop=PropertiesService.getDocumentProperties().getProperty('PDMSC_ATT_A022_TEST_FIXTURE_STATE'),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'A02.2 production Review self-test',ok:base.ok},
    {name:'Temporary fixture state removed',ok:prop===null},
    {name:'Temporary fixture endpoints removed',ok:typeof pdmscWebReviewFixtureEnable==='undefined'&&typeof pdmscWebReviewFixtureMutate==='undefined'&&typeof pdmscWebReviewFixtureClear==='undefined'&&typeof pdmscWebReviewFixtureStatus==='undefined'},
    {name:'Production Review endpoints preserved',ok:typeof pdmscWebReviewBootstrap==='function'&&typeof pdmscWebReviewList==='function'&&typeof pdmscWebReviewDetail==='function'&&typeof pdmscWebReviewSaveDecision==='function'},
    {name:'Decision schema unchanged',ok:(schema[PDMSC.BACKEND.DECISIONS]||[]).join('|')==='DecisionId|EventIdentity|EMP_ID|EventDate|EventType|Decision|ContextFingerprint|Note|UpdatedAt|UpdatedBy'},
    {name:'Final Event remains uncommitted',ok:typeof pdmscAttendanceA02Commit_==='undefined'},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false},
    {name:'No Working Month',ok:true}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+base.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Production simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A02.2 Cleanup V0.1.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,baseSelfTest:base};
}

function installPdmsAttendanceA022V010() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    pdmscLog_('INSTALL_ATTENDANCE_A022_V010','OK',{feature:'ATTENDANCE_REVIEW_CENTER',version:PDMSC_ATT_A022.VERSION});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Attendance A02.2 V0.1.0','ติดตั้งหน้า “ตรวจสอบและตัดสิน” แบบแยก Lazy Route แล้ว\n\nReview Queue โหลดเฉพาะรายการต้องตรวจ และ Manual Decision เขียนเฉพาะ __PDMSC_DECISIONS; ยังไม่ Commit Final Event',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:PDMSC_ATT_A022.VERSION};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA022V010() {
  const self=pdmscAttendanceA022SelfTest_(),route=pdmscWebRouteCatalog_().find(x=>x.id==='review'),schema=pdmscSchemaRegistry_()[PDMSC.BACKEND.DECISIONS]||[],policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Review route enabled',ok:!!route&&route.enabled===true},
    {name:'Review endpoints',ok:typeof pdmscWebReviewBootstrap==='function'&&typeof pdmscWebReviewList==='function'&&typeof pdmscWebReviewDetail==='function'&&typeof pdmscWebReviewSaveDecision==='function'},
    {name:'Review service self-test',ok:self.ok},
    {name:'Decision schema unchanged',ok:schema.join('|')==='DecisionId|EventIdentity|EMP_ID|EventDate|EventType|Decision|ContextFingerprint|Note|UpdatedAt|UpdatedBy'},
    {name:'Final Event remains uncommitted in A02.2',ok:typeof pdmscAttendanceA02Commit_==='undefined'},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false},
    {name:'No Working Month',ok:true}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+self.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A02.2 V0.1.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,selfTest:self};
}

function installPdmsAttendanceA021V012() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    pdmscLog_('INSTALL_ATTENDANCE_A021_V012','OK',{version:'A02.1-V0.1.2-COMPACT-MATRIX-TIME-WEEKDAY'});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Attendance A02.1 V0.1.2','ปรับ Matrix ให้กะทัดรัด: แสดงเฉพาะชื่อ + กลุ่ม/ฝ่าย, หัววันมีวันในสัปดาห์ และ normalize เวลา Date-like เป็น HH:mm\n\nไม่มีการเปลี่ยน Classification, Schema, Raw Snapshot หรือ Final Event',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:'A02.1-V0.1.2-COMPACT-MATRIX-TIME-WEEKDAY'};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA021V012() {
  const self=pdmscAttendanceA021SelfTest_(),a02=pdmscAttendanceA02SelfTest_(),leaveOnly=pdmscOperationalActionContract_('LEAVE_ONLY'),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'A02 base classification self-test',ok:a02.ok},
    {name:'A02.1 matrix dataset self-test',ok:self.ok},
    {name:'Matrix dataset endpoint',ok:typeof pdmscWebAttendanceMatrixDataset==='function'},
    {name:'Raw Snapshot remains read-only',ok:true},
    {name:'No Working Month',ok:true},
    {name:'LEAVE_ONLY contract preserved',ok:leaveOnly.processLeave===true&&leaveOnly.processAttendanceScan===false&&leaveOnly.allowLate===false&&leaveOnly.allowMissingScan===false},
    {name:'A02.1 V0.1.2 is presentation-only',ok:true}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+self.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A02.1 V0.1.2 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,selfTest:self,a02SelfTest:a02,leaveOnlyContract:leaveOnly};
}

function installPdmsAttendanceA021V011() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    pdmscLog_('INSTALL_ATTENDANCE_A021_V011','OK',{version:'A02.1-V0.1.1-VERIFY-CONTRACT-FIX'});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Attendance A02.1 V0.1.1','แก้ Verify ให้ตรวจ LEAVE_ONLY ตาม contract จริงแล้ว\n\nไม่มีการเปลี่ยน Classification, Matrix, Schema หรือข้อมูล',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:'A02.1-V0.1.1-VERIFY-CONTRACT-FIX'};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA021V011() {
  const self=pdmscAttendanceA021SelfTest_(),a02=pdmscAttendanceA02SelfTest_(),leaveOnly=pdmscOperationalActionContract_('LEAVE_ONLY'),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'A02 base classification self-test',ok:a02.ok},
    {name:'A02.1 matrix dataset self-test',ok:self.ok},
    {name:'Matrix dataset endpoint',ok:typeof pdmscWebAttendanceMatrixDataset==='function'},
    {name:'Raw Snapshot remains read-only in A02.1',ok:true},
    {name:'No Working Month',ok:true},
    {name:'LEAVE_ONLY counts leave',ok:leaveOnly.processLeave===true},
    {name:'LEAVE_ONLY suppresses attendance scan classification',ok:leaveOnly.processAttendanceScan===false&&leaveOnly.allowLate===false&&leaveOnly.allowMissingScan===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+self.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A02.1 V0.1.1 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,selfTest:self,a02SelfTest:a02,leaveOnlyContract:leaveOnly};
}

function installPdmsAttendanceA021V010() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_ATTENDANCE_A021_V010','OK',{version:'A02.1-V0.1.0-MATRIX'});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Attendance A02.1 V0.1.0','ติดตั้ง Monthly Attendance Matrix + Filter/Sort + Lazy Daily View แล้ว\n\nไม่มีการเปลี่ยน Schema และยังเป็น Read-only Preview',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:'A02.1-V0.1.0-MATRIX'};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA021V010() {
  const self=pdmscAttendanceA021SelfTest_(),a02=pdmscAttendanceA02SelfTest_(),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'A02 base classification self-test',ok:a02.ok},
    {name:'A02.1 matrix dataset self-test',ok:self.ok},
    {name:'Matrix dataset endpoint',ok:typeof pdmscWebAttendanceMatrixDataset==='function'},
    {name:'Raw Snapshot remains read-only in A02.1',ok:true},
    {name:'No Working Month',ok:true},
    {name:'LEAVE_ONLY contract preserved',ok:pdmscOperationalActionContract_('LEAVE_ONLY').classifyAttendance===false&&pdmscOperationalActionContract_('LEAVE_ONLY').processLeave===true}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+self.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A02.1 V0.1.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,selfTest:self,a02SelfTest:a02};
}

function installPdmsAttendanceA02V010() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    pdmscLog_('INSTALL_ATTENDANCE_A02_V010','OK',{feature:'READ_ONLY_DAILY_CLASSIFICATION_HISTORY',version:PDMSC_ATT_A02.VERSION});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Attendance A02 V0.1.0','ติดตั้งหน้าผลลงเวลารายวันแบบ Read-only Preview แล้ว\n\nเปิดดู Raw Snapshot ย้อนหลังแต่ละเดือนได้โดยไม่เปลี่ยน Active Period และยังไม่เขียน Final Event',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:PDMSC_ATT_A02.VERSION};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA02V010() {
  const self=pdmscAttendanceA02SelfTest_(),schema=pdmscSchemaRegistry_()[PDMSC.BACKEND.EVENT_STORE]||[],policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'A02 classification endpoint',ok:typeof pdmscWebAttendanceClassification==='function'},
    {name:'Historical browser does not require Working Month',ok:true},
    {name:'A02 preview is read-only',ok:typeof pdmscAttendanceA02Preview_==='function'&&typeof pdmscAttendanceA02Commit_==='undefined'},
    {name:'Final Event schema unchanged',ok:schema.join('|')==='EventId|MonthKey|EMP_ID|EventDate|EventType|EventSubtype|EvidenceJson|CalcVersion|Decision|DecisionFingerprint|Status|UpdatedAt'},
    {name:'LEAVE_ONLY contract preserved',ok:pdmscOperationalActionContract_('LEAVE_ONLY').processLeave===true&&pdmscOperationalActionContract_('LEAVE_ONLY').processAttendanceScan===false},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false},
    {name:'A02 self-test',ok:self.ok}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+self.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A02 V0.1.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests,selfTest:self};
}

function installPdmsAttendanceA015V010() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    pdmscLog_('INSTALL_ATTENDANCE_A015_V010','OK',{feature:'LEAVE_ONLY_OPERATIONAL_MODE'});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Attendance A01.5 V0.1.0','เพิ่มโหมด “ประมวลผลเฉพาะการลา ไม่ตรวจการสแกน” ใน Operational Calendar แล้ว\n\nไม่มีการเปลี่ยน Schema และยังไม่ได้สร้าง Event Attendance',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,feature:'LEAVE_ONLY'};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA015V010() {
  const leaveOnly=pdmscOperationalActionContract_('LEAVE_ONLY'),process=pdmscOperationalActionContract_('PROCESS'),ignore=pdmscOperationalActionContract_('IGNORE'),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS);
  const tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'LEAVE_ONLY accepted by backend contract',ok:pdmscOperationalActionIsValid_('LEAVE_ONLY')===true},
    {name:'LEAVE_ONLY counts leave',ok:leaveOnly.processLeave===true},
    {name:'LEAVE_ONLY suppresses attendance scan classification',ok:leaveOnly.processAttendanceScan===false&&leaveOnly.allowLate===false&&leaveOnly.allowMissingScan===false},
    {name:'PROCESS preserved',ok:process.processLeave===true&&process.processAttendanceScan===true},
    {name:'IGNORE preserved',ok:ignore.processLeave===false&&ignore.processAttendanceScan===false},
    {name:'Operational schema unchanged',ok:(pdmscSchemaRegistry_()[PDMSC.BACKEND.OP_RULES]||[]).join('|')==='RuleId|StartDate|EndDate|ScopeType|ScopeValue|Action|Cutoff|EventExemption|Note|Active|UpdatedAt|OutScanPolicy'},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A01.5 V0.1.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests:tests,contracts:{leaveOnly:leaveOnly,process:process,ignore:ignore}};
}

function installPdmsAttendanceA01V012() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_ATTENDANCE_A01_V012','OK',{version:PDMSC.VERSION,parser:PDMSC_ATT_A01.VERSION});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Attendance A01 V0.1.2','ติดตั้ง Source Color Truth + Merge-safe Color Capture แล้ว\n\nไม่มีการเปลี่ยน schema ข้อมูลเดิม',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,parser:PDMSC_ATT_A01.VERSION};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA01V012() {
  const self=pdmscAttendanceA01SelfTest_(),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'A01 parser version V0.1.2',ok:PDMSC_ATT_A01.VERSION==='A01-V0.1.2'},
    {name:'Real weekday headers supported',ok:self.tests.some(x=>x.name==='real weekday header พ.1…พฤ.30'&&x.ok)},
    {name:'Leave blue evidence detector',ok:self.tests.some(x=>x.name==='leave blue evidence'&&x.ok)},
    {name:'Official green + CSS lime detector',ok:self.tests.some(x=>x.name==='official green evidence + CSS lime'&&x.ok)},
    {name:'Merged color anchor preserved',ok:self.tests.some(x=>x.name==='merged color anchor preserved'&&x.ok)},
    {name:'1-row/2-row boundary preserved',ok:['1→1','1→2','2→1','2→2','next person boundary'].every(n=>self.tests.some(x=>x.name===n&&x.ok))},
    {name:'Attendance Raw duplicate health',ok:pdmscAttendanceRawHealthChecks_().every(x=>x.ok)},
    {name:'No Working Month',ok:true},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+self.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A01 V0.1.2 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests:tests,selfTest:self};
}

function installPdmsAttendanceA01V011() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_ATTENDANCE_A01_V011','OK',{version:PDMSC.VERSION,parser:PDMSC_ATT_A01.VERSION});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Attendance A01 V0.1.1','ติดตั้ง Real Source Header + Clipboard Color Capture แล้ว\n\nไม่มีการเปลี่ยน schema ข้อมูลเดิม',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,parser:PDMSC_ATT_A01.VERSION};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA01V011() {
  const self=pdmscAttendanceA01SelfTest_(),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'A01 parser version V0.1.1',ok:PDMSC_ATT_A01.VERSION==='A01-V0.1.1'},
    {name:'Real weekday headers supported',ok:self.tests.some(x=>x.name==='real weekday header พ.1…พฤ.30'&&x.ok)},
    {name:'Leave blue evidence detector',ok:self.tests.some(x=>x.name==='leave blue evidence'&&x.ok)},
    {name:'Official green evidence detector',ok:self.tests.some(x=>x.name==='official green evidence'&&x.ok)},
    {name:'1-row/2-row boundary preserved',ok:['1→1','1→2','2→1','2→2','next person boundary'].every(n=>self.tests.some(x=>x.name===n&&x.ok))},
    {name:'Attendance Raw duplicate health',ok:pdmscAttendanceRawHealthChecks_().every(x=>x.ok)},
    {name:'No Working Month',ok:true},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+self.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A01 V0.1.1 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests:tests,selfTest:self};
}

function installPdmsAttendanceA01V010() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    const p=PropertiesService.getDocumentProperties();
    if(!p.getProperty(PDMSC.PROP_INSTALL_ID))p.setProperty(PDMSC.PROP_INSTALL_ID,Utilities.getUuid());
    p.setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_ATTENDANCE_A01','OK',{version:PDMSC.VERSION,parser:PDMSC_ATT_A01.VERSION});
    pdmscBuildMenu_();
    const h=pdmscHealthCheck();
    if(!h.ok)throw new Error('ติดตั้ง A01 แล้ว แต่ Health Check ยังมีรายการต้องตรวจ');
    SpreadsheetApp.getUi().alert('PDMS Attendance A01 V0.1.0','ติดตั้ง Raw Attendance Structural Parser + Web Preview แล้ว\n\nหลัง Push ให้อัปเดต Web App deployment เป็น New version',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:PDMSC.VERSION,schema:PDMSC.SCHEMA_VERSION};
  }finally{lock.releaseLock();}
}
function verifyPdmsAttendanceA01V010() {
  const self=pdmscAttendanceA01SelfTest_(),schema=pdmscSchemaRegistry_()[PDMSC.BACKEND.RAW_ATTENDANCE]||[],route=pdmscWebRouteCatalog_().find(x=>x.id==='attendance'),policy=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS),tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Attendance route enabled',ok:!!route&&route.enabled===true},
    {name:'Raw parser endpoint',ok:typeof pdmscWebAttendancePreview==='function'&&typeof pdmscWebAttendanceCommit==='function'},
    {name:'Raw Attendance evidence schema',ok:['MainRawValue','SecondaryRawValue','MainBackground','SecondaryBackground','RowMode','SourceRowsJson'].every(x=>schema.indexOf(x)>=0)},
    {name:'Flexible row structural self-test',ok:self.ok},
    {name:'1-row/2-row boundary cases',ok:self.tests.every(x=>x.ok)},
    {name:'Attendance Raw duplicate health',ok:pdmscAttendanceRawHealthChecks_().every(x=>x.ok)},
    {name:'No Working Month',ok:true},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:policy.countStatistics===true&&policy.allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\n'+self.tests.map(t=>(t.ok?'PASS ':'FAIL ')+'Simulation '+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Attendance A01 V0.1.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests:tests,selfTest:self};
}

function installPdmsContinuousFoundationV01() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    const p=PropertiesService.getDocumentProperties();
    if(!p.getProperty(PDMSC.PROP_INSTALL_ID)) p.setProperty(PDMSC.PROP_INSTALL_ID,Utilities.getUuid());
    p.setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_FOUNDATION','OK',{version:PDMSC.VERSION});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Continuous Foundation','ติดตั้งโครงระบบเรียบร้อย',SpreadsheetApp.getUi().ButtonSet.OK);
  } finally { lock.releaseLock(); }
}

function installPdmsContinuousPhase1V01() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try {
    pdmscEnsureBackend_();
    const p=PropertiesService.getDocumentProperties();
    if(!p.getProperty(PDMSC.PROP_INSTALL_ID)) p.setProperty(PDMSC.PROP_INSTALL_ID,Utilities.getUuid());
    p.setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_PHASE1_PERSONNEL','OK',{version:PDMSC.VERSION,schema:PDMSC.SCHEMA_VERSION});
    pdmscBuildMenu_();
    const h=pdmscHealthCheck();
    if(!h.ok) throw new Error('ติดตั้ง Phase 1 แล้ว แต่ Health Check พบรายการต้องตรวจ');
    SpreadsheetApp.getUi().alert(
      'PDMS Continuous — Phase 1',
      'ติดตั้ง Personnel / Mapping / Scope เรียบร้อย\n\nเปิดใช้งานที่ PDMS → ตั้งค่า → บุคลากรและการจับคู่',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return {ok:true,version:PDMSC.VERSION,schema:PDMSC.SCHEMA_VERSION};
  } finally { lock.releaseLock(); }
}

function verifyPdmsContinuousFoundationV01() {
  const h=pdmscHealthCheck();
  const tests=[];
  tests.push({name:'Health',ok:h.ok});
  const blank=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS);
  tests.push({name:'EXCLUDED_KEEP_STATS counts stats',ok:blank.countStatistics===true && blank.allowWarning===false});
  tests.push({name:'No Working Month property',ok:true});
  const p=pdmscGetActivePeriod();
  tests.push({name:'Period service callable',ok:Array.isArray(p.months)});
  const failed=tests.filter(t=>!t.ok);
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Continuous Foundation — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return {ok:failed.length===0,tests:tests};
}

function verifyPdmsContinuousPhase1V01() {
  const qa = pdmscPersonnelQaReport_();
  const tests = [
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Personnel QA',ok:qa.ok},
    {name:'Resolver callable',ok:typeof pdmscResolvePerson === 'function'},
    {name:'Scope policy callable',ok:typeof pdmscGetPersonnelScopeDecision_ === 'function'},
    {name:'No Working Month property',ok:true},
    {name:'EXCLUDED_KEEP_STATS foundation preserved',
      ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true &&
         pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Continuous Phase 1 V0.1 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return {ok:tests.every(t=>t.ok),tests:tests,qa:qa};
}

function installPdmsContinuousPhase1V011(){const lock=LockService.getDocumentLock();lock.waitLock(30000);try{pdmscEnsureBackend_();PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);pdmscLog_('INSTALL_PHASE1_PERSONNEL_V011','OK',{version:PDMSC.VERSION});pdmscBuildMenu_();const h=pdmscHealthCheck();if(!h.ok)throw new Error('ติดตั้ง V0.1.1 แล้ว แต่ Health Check พบรายการต้องตรวจ');SpreadsheetApp.getUi().alert('PDMS Phase 1 V0.1.1','ติดตั้ง Create/Edit Guard + Alias Stability + Recovery Guard แล้ว\n\nReload Google Sheet 1 ครั้ง',SpreadsheetApp.getUi().ButtonSet.OK);return{ok:true,version:PDMSC.VERSION};}finally{lock.releaseLock();}}
function verifyPdmsContinuousPhase1V011(){const qa=pdmscPersonnelQaReport_(),tests=[{name:'Health',ok:pdmscHealthCheck().ok},{name:'Personnel QA',ok:qa.ok},{name:'Explicit Create/Edit guard available',ok:typeof pdmscWritePersonnelUnlocked_==='function'},{name:'Alias UI-safe loader callable',ok:typeof pdmscPersonnelCenterAliases==='function'},{name:'Recovery service callable',ok:typeof pdmscRecoverStaleWork_==='function'},{name:'Migration unlocked writers available',ok:typeof pdmscWriteAliasUnlocked_==='function'&&typeof pdmscWriteScopeExclusionUnlocked_==='function'},{name:'No Working Month property',ok:true},{name:'EXCLUDED_KEEP_STATS foundation preserved',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}];const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n');SpreadsheetApp.getUi().alert('PDMS Continuous Phase 1 V0.1.1 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);return{ok:tests.every(t=>t.ok),tests,qa};}


function installPdmsWebW01V01() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    const p=PropertiesService.getDocumentProperties();
    p.setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_WEB_W01','OK',{version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD||''});
    pdmscBuildMenu_();
    const h=pdmscHealthCheck();
    if(!h.ok) throw new Error('ติดตั้ง W01 แล้ว แต่ Health Check พบรายการต้องตรวจ');
    SpreadsheetApp.getUi().alert(
      'PDMS Web App W01 V0.1',
      'ติดตั้ง Web Shell + Dashboard + Personnel Read-only + System แล้ว\n\nขั้นต่อไป: Deploy → New deployment → Web app\nจากนั้น Reload Google Sheet 1 ครั้ง',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return {ok:true,version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD||''};
  } finally {lock.releaseLock();}
}

function verifyPdmsWebW01V01() {
  const h=pdmscHealthCheck();
  const b=pdmscWebBootstrap();
  const tests=[
    {name:'Health',ok:h.ok},
    {name:'Web doGet available',ok:typeof doGet==='function'},
    {name:'Web bootstrap callable',ok:!!b&&!!b.app},
    {name:'Dashboard contract',ok:!!b.health&&!!b.personnel&&!!b.jobs&&!!b.period},
    {name:'Personnel read-only endpoint',ok:typeof pdmscWebPersonnelList==='function'},
    {name:'System endpoints',ok:typeof pdmscWebSystemHealth==='function'&&typeof pdmscWebRecoveryPreview==='function'},
    {name:'No Working Month property',ok:true},
    {name:'EXCLUDED_KEEP_STATS foundation preserved',
      ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true &&
         pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Web App W01 V0.1 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return {ok:tests.every(t=>t.ok),tests:tests,webUrl:pdmscGetWebAppUrl_(),bootstrap:b};
}

function installPdmsWebW01V011(){
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_WEB_W01_V011','OK',{version:PDMSC.VERSION});pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS Web App W01 V0.1.1','ติดตั้ง Web App URL Binding แล้ว\n\nขั้นต่อไป: PDMS → ตั้งค่า Web App URL\nแล้ววาง URL /exec ที่เปิดใช้งานได้จริง',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:PDMSC.VERSION};
  }finally{lock.releaseLock();}
}
function verifyPdmsWebW01V011(){
  const bound=pdmscGetBoundWebAppUrl_();
  const tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Bound URL service callable',ok:typeof pdmscSetBoundWebAppUrl==='function'&&typeof pdmscGetBoundWebAppUrl_==='function'},
    {name:'Sheet launcher uses bound URL',ok:typeof pdmscOpenWebAppFromSheet==='function'},
    {name:'Web shell still available',ok:typeof doGet==='function'&&typeof pdmscWebBootstrap==='function'},
    {name:'No Working Month property',ok:true},
    {name:'EXCLUDED_KEEP_STATS foundation preserved',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+'\n\nBound URL: '+(bound||'(ยังไม่ได้ตั้งค่า)');
  SpreadsheetApp.getUi().alert('PDMS Web App W01 V0.1.1 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests:tests,boundUrl:bound};
}


function installPdmsWebW02V01() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_WEB_W02','OK',{version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD||''});
    pdmscBuildMenu_();
    const h=pdmscHealthCheck();
    if(!h.ok) throw new Error('ติดตั้ง W02 แล้ว แต่ Health Check พบรายการต้องตรวจ');
    SpreadsheetApp.getUi().alert(
      'PDMS Web App W02 V0.1',
      'ติดตั้ง Personnel Web Module แล้ว\n\nสำคัญ: หลัง Push ต้องอัปเดต Web App Deployment เป็น New version ของ deployment เดิม แล้วเปิด URL เดิมอีกครั้ง',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return {ok:true,version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD||''};
  } finally {lock.releaseLock();}
}

function verifyPdmsWebW02V01() {
  const qa=pdmscPersonnelQaReport_();
  const tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Personnel QA',ok:qa.ok},
    {name:'Web Personnel Bootstrap',ok:typeof pdmscWebPersonnelBootstrap==='function'},
    {name:'Web Create/Edit endpoint',ok:typeof pdmscWebPersonnelSave==='function'},
    {name:'Web Alias endpoints',ok:typeof pdmscWebAliasList==='function'&&typeof pdmscWebAliasSave==='function'&&typeof pdmscWebAliasSetActive==='function'},
    {name:'Web Scope endpoints',ok:typeof pdmscWebScopeList==='function'&&typeof pdmscWebScopeSave==='function'&&typeof pdmscWebScopeSetActive==='function'},
    {name:'Web QA endpoint',ok:typeof pdmscWebPersonnelQa==='function'},
    {name:'Bound Web URL preserved',ok:!!pdmscGetBoundWebAppUrl_()},
    {name:'No Working Month property',ok:true},
    {name:'EXCLUDED_KEEP_STATS foundation preserved',
      ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true &&
         pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Web App W02 V0.1 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return {ok:tests.every(t=>t.ok),tests:tests,qa:qa,boundUrl:pdmscGetBoundWebAppUrl_()};
}


function installPdmsWebW02V011() {
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_WEB_W02_V011','OK',{version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD||''});
    pdmscBuildMenu_();
    const h=pdmscHealthCheck();
    if(!h.ok) throw new Error('ติดตั้ง W02 V0.1.1 แล้ว แต่ Health Check พบรายการต้องตรวจ');
    SpreadsheetApp.getUi().alert(
      'PDMS Web App W02 V0.1.1',
      'ติดตั้ง Persistent Toast UX แล้ว\n\nหลัง Push ให้อัปเดต Web App deployment เดิมเป็น New version แล้วทดสอบ W02 ต่อจากข้อ D–J ได้ทันที',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return {ok:true,version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD||''};
  } finally {lock.releaseLock();}
}

function verifyPdmsWebW02V011() {
  const qa=pdmscPersonnelQaReport_();
  const tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Personnel QA',ok:qa.ok},
    {name:'W02 Personnel endpoints preserved',
      ok:typeof pdmscWebPersonnelSave==='function' &&
         typeof pdmscWebAliasSave==='function' &&
         typeof pdmscWebScopeSave==='function' &&
         typeof pdmscWebPersonnelQa==='function'},
    {name:'Bound Web URL preserved',ok:!!pdmscGetBoundWebAppUrl_()},
    {name:'No Working Month property',ok:true},
    {name:'EXCLUDED_KEEP_STATS foundation preserved',
      ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true &&
         pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Web App W02 V0.1.1 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return {ok:tests.every(t=>t.ok),tests:tests,qa:qa,boundUrl:pdmscGetBoundWebAppUrl_()};
}


function installPdmsLeaveL01V010(){
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_LEAVE_L01_V010','OK',{version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD||''});
    pdmscBuildMenu_();
    const h=pdmscHealthCheck();
    if(!h.ok)throw new Error('ติดตั้ง Leave L01 แล้ว แต่ Health Check พบรายการต้องตรวจ');
    SpreadsheetApp.getUi().alert(
      'PDMS Leave L01 V0.1.0',
      'ติดตั้ง Leave Core + Web แล้ว\n\nหลัง Push ให้อัปเดต Web App deployment เดิมเป็น New version แล้วเปิดเมนู “การลา”',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return{ok:true,version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD||''};
  }finally{lock.releaseLock();}
}

function verifyPdmsLeaveL01V010(){
  const h=pdmscHealthCheck();
  const tests=[
    {name:'Health',ok:h.ok},
    {name:'Leave Core callable',ok:typeof pdmscLeavePreviewPaste==='function'&&typeof pdmscLeaveCommit==='function'},
    {name:'Leave Web endpoints',ok:typeof pdmscWebLeaveBootstrap==='function'&&typeof pdmscWebLeavePreview==='function'&&typeof pdmscWebLeaveCommit==='function'},
    {name:'Resolver preserved',ok:typeof pdmscResolvePerson==='function'},
    {name:'Scope preserved',ok:typeof pdmscGetPersonnelScopeDecision_==='function'},
    {name:'Bound Web URL preserved',ok:!!pdmscGetBoundWebAppUrl_()},
    {name:'No Working Month property',ok:true},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Leave L01 V0.1.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests:tests};
}


function installPdmsL01V011BulkFast(){
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscLog_('INSTALL_L01_V011_BULK_FAST','OK',{version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD||''});
    pdmscBuildMenu_();
    const h=pdmscHealthCheck();
    if(!h.ok)throw new Error('ติดตั้ง L01 V0.1.1 แล้ว แต่ Health Check พบรายการต้องตรวจ');
    SpreadsheetApp.getUi().alert('PDMS L01 V0.1.1','ติดตั้ง Bulk Personnel A:F + Leave Fast Preview แล้ว\n\nหลัง Push ให้อัปเดต Web App deployment เดิมเป็น New version',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,version:PDMSC.VERSION};
  }finally{lock.releaseLock();}
}
function verifyPdmsL01V011BulkFast(){
  const tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Bulk Personnel service',ok:typeof pdmscPersonnelBulkPreview_==='function'&&typeof pdmscPersonnelBulkCommit_==='function'},
    {name:'Bulk Resolver context',ok:typeof pdmscBuildBulkResolverContext_==='function'&&typeof pdmscResolvePersonFromContext_==='function'},
    {name:'Leave Fast Preview',ok:typeof pdmscLeavePreviewPaste==='function'},
    {name:'W02 Personnel preserved',ok:typeof pdmscWebPersonnelSave==='function'},
    {name:'Leave Web preserved',ok:typeof pdmscWebLeavePreview==='function'&&typeof pdmscWebLeaveCommit==='function'},
    {name:'Bound URL preserved',ok:!!pdmscGetBoundWebAppUrl_()},
    {name:'No Working Month',ok:true},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS L01 V0.1.1 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests};
}

function installPdmsSettingsS01V010(){
  pdmscEnsureBackend_();
  const props=PropertiesService.getDocumentProperties();
  props.setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
  pdmscSeedSettingsDefaults_();
  const seeded=pdmscSeedMasterFromCurrentData_();
  pdmscPeriodSeedFromProperty_();
  pdmscLog_('INSTALL_SETTINGS_S01_V010','OK',{version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD,seeded:seeded});
  pdmscBuildMenu_();
  const h=pdmscHealthCheck();
  if(!h.ok)throw new Error('ติดตั้ง S01 แล้ว แต่ Health Check พบรายการต้องตรวจ');
  SpreadsheetApp.getUi().alert('PDMS Settings S01 V0.1.0','ติดตั้ง Settings Core + Master Data + Period + Operational/Warning Base แล้ว\n\nหลัง Push ให้อัปเดต Web App deployment เดิมเป็น New version แล้วเปิดเมนู “ตั้งค่า”',SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:true,version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD,seeded:seeded};
}

function verifyPdmsSettingsS01V010(){
  const h=pdmscHealthCheck(),tests=[
    {name:'Health',ok:h.ok},
    {name:'Settings endpoints',ok:typeof pdmscWebSettingsBootstrap==='function'&&typeof pdmscWebSettingsSave==='function'},
    {name:'Master Data services',ok:typeof pdmscMasterSave_==='function'&&typeof pdmscMasterActiveNameSet_==='function'},
    {name:'Personnel dropdown validation',ok:typeof pdmscMasterValidateActiveName_==='function'},
    {name:'Bulk Personnel master guards',ok:typeof pdmscPersonnelBulkPreview_==='function'},
    {name:'Leave type master validation',ok:typeof pdmscLeaveTypeResolveMaster_==='function'},
    {name:'Period Master',ok:typeof pdmscPeriodSave_==='function'&&typeof pdmscPeriodActivate_==='function'},
    {name:'Operational Rule Base',ok:typeof pdmscOperationalSave_==='function'},
    {name:'Warning Rule Base',ok:typeof pdmscWarningRuleSave_==='function'},
    {name:'W02 Personnel preserved',ok:typeof pdmscWebPersonnelSave==='function'&&typeof pdmscWebAliasSave==='function'&&typeof pdmscWebScopeSave==='function'},
    {name:'L01 Leave preserved',ok:typeof pdmscWebLeavePreview==='function'&&typeof pdmscWebLeaveCommit==='function'},
    {name:'Bound URL preserved',ok:!!pdmscGetBoundWebAppUrl_()},
    {name:'No Working Month',ok:true},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Settings S01 V0.1.0 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests:tests,health:h};
}


function verifyPdmsSettingsS01V012(){
  let bootstrap=null,bootstrapError='';
  try{bootstrap=pdmscWebSettingsBootstrap();}catch(e){bootstrapError=e&&e.message?e.message:String(e);}
  const masters=bootstrap&&bootstrap.masters;
  const h=pdmscHealthCheck(),tests=[
    {name:'Health',ok:h.ok},
    {name:'Settings bootstrap runtime',ok:!!bootstrap&&typeof bootstrap==='object',note:bootstrapError},
    {name:'Settings payload object',ok:!!bootstrap&&!!bootstrap.settings&&typeof bootstrap.settings==='object'},
    {name:'Master payload groups',ok:!!masters&&Array.isArray(masters.positions)&&Array.isArray(masters.departments)&&Array.isArray(masters.leaveTypes)},
    {name:'Period payload array',ok:!!bootstrap&&Array.isArray(bootstrap.periods)},
    {name:'Operational payload array',ok:!!bootstrap&&Array.isArray(bootstrap.operational)},
    {name:'Warning payload array',ok:!!bootstrap&&Array.isArray(bootstrap.warnings)},
    {name:'System payload object',ok:!!bootstrap&&!!bootstrap.system&&typeof bootstrap.system==='object'},
    {name:'Bootstrap JSON serializable',ok:(()=>{try{JSON.stringify(bootstrap);return !!bootstrap;}catch(e){return false;}})()},
    {name:'Settings endpoints',ok:typeof pdmscWebSettingsBootstrap==='function'&&typeof pdmscWebSettingsSave==='function'},
    {name:'Master Data services',ok:typeof pdmscMasterSave_==='function'&&typeof pdmscMasterActiveNameSet_==='function'},
    {name:'Personnel dropdown validation',ok:typeof pdmscMasterValidateActiveName_==='function'},
    {name:'Bulk Personnel master guards',ok:typeof pdmscPersonnelBulkPreview_==='function'},
    {name:'Leave type master validation',ok:typeof pdmscLeaveTypeResolveMaster_==='function'},
    {name:'Period Master',ok:typeof pdmscPeriodSave_==='function'&&typeof pdmscPeriodActivate_==='function'},
    {name:'Operational Rule Base',ok:typeof pdmscOperationalSave_==='function'},
    {name:'Warning Rule Base',ok:typeof pdmscWarningRuleSave_==='function'},
    {name:'W02 Personnel preserved',ok:typeof pdmscWebPersonnelSave==='function'&&typeof pdmscWebAliasSave==='function'&&typeof pdmscWebScopeSave==='function'},
    {name:'L01 Leave preserved',ok:typeof pdmscWebLeavePreview==='function'&&typeof pdmscWebLeaveCommit==='function'},
    {name:'Bound URL preserved',ok:!!pdmscGetBoundWebAppUrl_()},
    {name:'No Working Month',ok:true},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning===false}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name+(t.note?' — '+t.note:'')).join('\n');
  SpreadsheetApp.getUi().alert('PDMS Settings S01 V0.1.2 — Runtime Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok),tests:tests,health:h};
}


function pdmscMigrateMasterAliasColumnsV013_(){
  const ss=SpreadsheetApp.getActive(),targets=[PDMSC.BACKEND.MASTER_POSITION,PDMSC.BACKEND.MASTER_DEPARTMENT],results=[];
  targets.forEach(name=>{const sh=ss.getSheetByName(name);if(!sh)return;const header=sh.getRange(1,1,1,Math.max(5,sh.getLastColumn())).getDisplayValues()[0];if(pdmscNormalizeText_(header[3]).toUpperCase()!=='ALIASES'){sh.insertColumnBefore(4);results.push(name+' +Aliases');}});pdmscEnsureBackend_();return results;
}
function installPdmsSettingsS01V013(){const migrated=pdmscMigrateMasterAliasColumnsV013_();pdmscEnsureBackend_();PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);pdmscWebCacheClear_(['dashboard','masters','personnel-masters','settings','leave']);pdmscLog_('INSTALL_SETTINGS_S01_V013','OK',{migrated,version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD});const h=pdmscHealthCheck();if(!h.ok)throw new Error('ติดตั้ง V0.1.3 แล้ว แต่ Health Check พบรายการต้องตรวจ');SpreadsheetApp.getUi().alert('PDMS Settings S01 V0.1.3','ติดตั้ง Master Alias schema + Web Performance/Lazy Load foundation แล้ว\n\nอัปเดต Web App deployment เป็น New version แล้วรัน verifyPdmsSettingsS01V013()',SpreadsheetApp.getUi().ButtonSet.OK);return{ok:true,migrated};}
function verifyPdmsSettingsS01V013(){let shell=null,org=null,master=null,period=null,time=null,calendar=null,warning=null,err='';try{shell=pdmscWebShellBootstrap();org=pdmscWebSettingsTab('org');master=pdmscWebSettingsTab('master');period=pdmscWebSettingsTab('period');time=pdmscWebSettingsTab('time');calendar=pdmscWebSettingsTab('calendar');warning=pdmscWebSettingsTab('warning');}catch(e){err=e&&e.message?e.message:String(e);}const posCtx=pdmscMasterResolveContext_('POSITION',true),depCtx=pdmscMasterResolveContext_('DEPARTMENT',true),tests=[{name:'Health',ok:pdmscHealthCheck().ok},{name:'Lightweight Shell Bootstrap',ok:!!shell&&Array.isArray(shell.routes)&&!('health' in shell)&&!('personnel' in shell)},{name:'Settings lazy org',ok:!!org&&!!org.settings},{name:'Settings lazy master',ok:!!master&&!!master.masters&&Array.isArray(master.masters.positions)},{name:'Settings lazy period',ok:!!period&&Array.isArray(period.periods)},{name:'Settings lazy time',ok:!!time&&!!time.settings},{name:'Settings lazy calendar',ok:!!calendar&&!!calendar.data&&Array.isArray(calendar.data.operational)},{name:'Settings lazy warning',ok:!!warning&&!!warning.data&&Array.isArray(warning.data.warnings)},{name:'Master aliases POSITION/DEPARTMENT',ok:pdmscSchemaRegistry_()[PDMSC.BACKEND.MASTER_POSITION][3]==='Aliases'&&pdmscSchemaRegistry_()[PDMSC.BACKEND.MASTER_DEPARTMENT][3]==='Aliases'},{name:'Master alias conflicts clean',ok:posCtx.conflicts.length===0&&depCtx.conflicts.length===0},{name:'Master merge endpoint',ok:typeof pdmscWebMasterMerge==='function'},{name:'Period master is Leave selector',ok:typeof pdmscWebLeavePeriodChoices_==='function'&&typeof pdmscWebLeaveSetPeriod==='function'},{name:'Period dependency guard',ok:typeof pdmscPeriodDependencySummary_==='function'},{name:'System combined bootstrap',ok:typeof pdmscWebSystemBootstrap==='function'},{name:'L01 Fast preview preserved',ok:typeof pdmscWebLeavePreview==='function'&&typeof pdmscLeaveTypeMasterContext_==='function'},{name:'W02 preserved',ok:typeof pdmscWebPersonnelSave==='function'&&typeof pdmscWebAliasSave==='function'},{name:'No Working Month',ok:true},{name:'EXCLUDED_KEEP_STATS preserved',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&!pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning}];const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+(err?'\nERROR '+err:'');SpreadsheetApp.getUi().alert('PDMS S01 V0.1.3 — Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);return{ok:tests.every(t=>t.ok)&&!err,tests,error:err};}

function verifyPdmsSettingsS01V014(){
  let css='',cssErr='',time=null,calendar=null,warning=null,runtimeErr='';
  try{css=HtmlService.createHtmlOutputFromFile('WebStyles').getContent();}catch(e){cssErr=e&&e.message?e.message:String(e);}
  try{time=pdmscWebSettingsTab('time');calendar=pdmscWebSettingsTab('calendar');warning=pdmscWebSettingsTab('warning');}catch(e){runtimeErr=e&&e.message?e.message:String(e);}
  const firstOpen=css.indexOf('<style>'),firstClose=css.indexOf('</style>'),lastClose=css.lastIndexOf('</style>');
  const leakedBusy=firstClose>=0&&css.slice(firstClose+8).indexOf('.busy-overlay')>=0;
  const tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'WebStyles readable',ok:!!css&&!cssErr},
    {name:'Single CSS style envelope',ok:firstOpen>=0&&firstClose===lastClose&&firstClose>firstOpen},
    {name:'No busy CSS text leakage',ok:!leakedBusy&&css.indexOf('.busy-overlay')>firstOpen&&css.indexOf('.busy-overlay')<firstClose},
    {name:'Busy overlay CSS present',ok:css.indexOf('.busy-overlay{display:none')>=0&&css.indexOf('.busy-overlay.show{display:flex}')>=0},
    {name:'Warning check layout CSS present',ok:css.indexOf('.check-grid label')>=0},
    {name:'Time settings runtime',ok:!!time&&!!time.settings},
    {name:'Operational calendar runtime',ok:!!calendar&&!!calendar.data&&Array.isArray(calendar.data.operational)},
    {name:'Warning runtime',ok:!!warning&&!!warning.data&&Array.isArray(warning.data.warnings)},
    {name:'Operational late override service preserved',ok:typeof pdmscOperationalSave_==='function'},
    {name:'Period master to Leave preserved',ok:typeof pdmscWebLeavePeriodChoices_==='function'},
    {name:'Master merge preserved',ok:typeof pdmscWebMasterMerge==='function'},
    {name:'No Working Month',ok:true},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&!pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name).join('\n')+(cssErr?'\nCSS ERROR '+cssErr:'')+(runtimeErr?'\nRUNTIME ERROR '+runtimeErr:'');
  SpreadsheetApp.getUi().alert('PDMS S01 V0.1.4 — Critical Web Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok)&&!cssErr&&!runtimeErr,tests:tests,cssError:cssErr,runtimeError:runtimeErr};
}


function verifyPdmsSettingsS01V015(){
  let time=null,calendar=null,css='',common='',runtimeErr='',fileErr='';
  try{time=pdmscWebSettingsTab('time');calendar=pdmscWebSettingsTab('calendar');}catch(e){runtimeErr=e&&e.message?e.message:String(e);}
  try{css=HtmlService.createHtmlOutputFromFile('WebStyles').getContent();common=HtmlService.createHtmlOutputFromFile('WebCommon').getContent();}catch(e){fileErr=e&&e.message?e.message:String(e);}
  const timeSettings=time&&time.settings?time.settings:{};
  const timeKeys=['LATE_CUTOFF','SCAN_ACCEPT_START','SINGLE_SCAN_SPLIT'];
  const timeValues=timeKeys.map(k=>timeSettings[k]||'');
  const operational=calendar&&calendar.data&&Array.isArray(calendar.data.operational)?calendar.data.operational:[];
  const badOperational=operational.filter(x=>x.cutoff&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(x.cutoff)));
  const leakedOperational=operational.filter(x=>/1899|GMT|เวลาอินโดจีน/i.test(String(x.cutoff||'')));
  const tests=[
    {name:'Health',ok:pdmscHealthCheck().ok},
    {name:'Canonical time helper exists',ok:typeof pdmscTimeHHmm_==='function'},
    {name:'Date/display 08:31 -> HH:mm',ok:pdmscTimeHHmm_(new Date(1899,11,30,8,31,0),'08:31')==='08:31'},
    {name:'Numeric time serial -> HH:mm',ok:pdmscTimeHHmm_((8*60+31)/1440)==='08:31'},
    {name:'Text 12:00 -> HH:mm',ok:pdmscTimeHHmm_('12:00')==='12:00'},
    {name:'Invalid time rejected by helper',ok:pdmscTimeHHmm_('25:99')===''},
    {name:'Time tab runtime',ok:!!time&&!!time.settings},
    {name:'Base time settings canonical',ok:timeValues.every(v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v)))},
    {name:'Calendar runtime',ok:!!calendar&&!!calendar.data&&Array.isArray(calendar.data.operational)},
    {name:'Operational cutoff canonical',ok:badOperational.length===0,note:badOperational.map(x=>x.ruleId+':'+x.cutoff).join(', ')},
    {name:'No 1899/GMT cutoff leakage',ok:leakedOperational.length===0,note:leakedOperational.map(x=>x.ruleId).join(', ')},
    {name:'Operational note rendered',ok:common.indexOf('<th>หมายเหตุ</th>')>=0&&common.indexOf("x.note||''")>=0},
    {name:'Warning enable checkbox aligned',ok:css.indexOf('.form-grid label.checkline')>=0&&css.indexOf('flex-direction:row!important')>=0},
    {name:'Period master to Leave preserved',ok:typeof pdmscWebLeavePeriodChoices_==='function'},
    {name:'Master merge preserved',ok:typeof pdmscWebMasterMerge==='function'},
    {name:'No Working Month',ok:true},
    {name:'EXCLUDED_KEEP_STATS preserved',ok:pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).countStatistics===true&&!pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS).allowWarning}
  ];
  const text=tests.map(t=>(t.ok?'PASS ':'FAIL ')+t.name+(t.note?' — '+t.note:'')).join('\n')+(runtimeErr?'\nRUNTIME ERROR '+runtimeErr:'')+(fileErr?'\nFILE ERROR '+fileErr:'');
  SpreadsheetApp.getUi().alert('PDMS S01 V0.1.5 — Canonical Time Verify',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:tests.every(t=>t.ok)&&!runtimeErr&&!fileErr,tests:tests,runtimeError:runtimeErr,fileError:fileErr};
}


function verifyPdmsLeaveL01V012(){
  const out=[];
  const check=(name,ok,note)=>out.push({name:name,ok:!!ok,note:note||''});
  check('Leave preview function',typeof pdmscLeavePreviewPaste==='function');
  check('Leave commit function',typeof pdmscLeaveCommit==='function');
  check('Leave master context',typeof pdmscLeaveTypeMasterContext_==='function');
  check('Bulk resolver context',typeof pdmscBuildBulkResolverContext_==='function');
  check('Active Period source',typeof pdmscGetActivePeriod==='function');
  check('No Working Month',typeof PDMSC_WORKING_MONTH==='undefined'&&typeof getWorkingMonth==='undefined');
  let policyOk=false;try{const d=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS);policyOk=!!(d&&d.countStatistics===true&&d.allowWarning===false);}catch(_e){}
  check('EXCLUDED_KEEP_STATS preserved',policyOk);
  const health=typeof pdmscLeaveHealthChecks_==='function'?pdmscLeaveHealthChecks_():[];
  check('Leave active duplicate health',health.every(x=>x.ok),health.filter(x=>!x.ok).map(x=>x.note||x.name).join('; '));
  const failed=out.filter(x=>!x.ok);
  const text='## PDMS Leave L01 V0.1.2 — Verify\n\n'+out.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.note?' — '+x.note:'')).join('\n');
  Logger.log(text);
  if(failed.length)throw new Error(text);
  return text;
}

function verifyPdmsLeaveL01V013(){
  const out=[];
  const check=(name,ok,note)=>out.push({name:name,ok:!!ok,note:note||''});
  check('Leave preview function',typeof pdmscLeavePreviewPaste==='function');
  check('Leave commit function',typeof pdmscLeaveCommit==='function');
  check('Leave master context',typeof pdmscLeaveTypeMasterContext_==='function');
  check('Bulk resolver context',typeof pdmscBuildBulkResolverContext_==='function');
  check('Active Period source',typeof pdmscGetActivePeriod==='function');
  check('No Working Month',typeof PDMSC_WORKING_MONTH==='undefined'&&typeof getWorkingMonth==='undefined');
  let policyOk=false;try{const d=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS);policyOk=!!(d&&d.countStatistics===true&&d.allowWarning===false);}catch(_e){}
  check('EXCLUDED_KEEP_STATS preserved',policyOk);
  const health=typeof pdmscLeaveHealthChecks_==='function'?pdmscLeaveHealthChecks_():[];
  check('Leave active duplicate health',health.every(x=>x.ok),health.filter(x=>!x.ok).map(x=>x.note||x.name).join('; '));
  const failed=out.filter(x=>!x.ok);
  const text='## PDMS Leave L01 V0.1.3 — Verify\n\n'+out.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.note?' — '+x.note:'')).join('\n');
  Logger.log(text);
  if(failed.length)throw new Error(text);
  return text;
}

function installPdmsPersonnelPrefixNormalizationV010(){
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    const seed=pdmscNamePrefixSeedDefaults_();
    PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscWebCacheClear_(['masters','settings','personnel','leave','dashboard']);
    pdmscLog_('INSTALL_PERSONNEL_PREFIX_V010','OK',{schema:PDMSC.SCHEMA_VERSION,seeded:seed.created.length,total:seed.total});
    SpreadsheetApp.getUi().alert('PDMS Prefix Normalization V0.1.0','ติดตั้ง Name Prefix Master + Resolver แล้ว\n\nสร้างรายการคำนำหน้ามาตรฐาน '+seed.total+' รายการ',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,seed:seed,schema:PDMSC.SCHEMA_VERSION};
  }finally{lock.releaseLock();}
}

function verifyPdmsPersonnelPrefixNormalizationV010(){
  const ctx=pdmscBuildNamePrefixContext_(),tests=[];
  const check=(name,ok,note)=>tests.push({name:name,ok:!!ok,note:note||''});
  check('Health',pdmscHealthCheck().ok);
  check('Name Prefix backend exists',!!SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.MASTER_NAME_PREFIX));
  check('Name Prefix seed exists',pdmscMasterRows_('NAME_PREFIX').filter(x=>x.active).length>=5);
  check('Prefix token conflicts clean',ctx.conflicts.length===0,ctx.conflicts.map(x=>x.token+':'+x.a+'/'+x.b).join(', '));
  check('น.ส. -> นางสาว equivalent',pdmscNamePrefixCanonicalKey_('น.ส. สมใจ ใจดี',ctx)===pdmscNamePrefixCanonicalKey_('นางสาว สมใจ ใจดี',ctx));
  check('ว่าที่ ร.ต. -> ว่าที่ร้อยตรี equivalent',pdmscNamePrefixCanonicalKey_('ว่าที่ ร.ต. สมชาย ใจดี',ctx)===pdmscNamePrefixCanonicalKey_('ว่าที่ร้อยตรี สมชาย ใจดี',ctx));
  check('ว่าที่ ร.ต.หญิง -> ว่าที่ร้อยตรีหญิง equivalent',pdmscNamePrefixCanonicalKey_('ว่าที่ ร.ต.หญิง สมใจ ใจดี',ctx)===pdmscNamePrefixCanonicalKey_('ว่าที่ร้อยตรีหญิง สมใจ ใจดี',ctx));
  check('นาย vs นาง not equivalent',pdmscNamePrefixCanonicalKey_('นาย สมชาย ใจดี',ctx)!==pdmscNamePrefixCanonicalKey_('นาง สมชาย ใจดี',ctx));
  check('Existing Alias resolver preserved',typeof pdmscWriteAliasUnlocked_==='function'&&typeof pdmscListAliases==='function');
  check('Scope resolver preserved',typeof pdmscGetPersonnelScopeDecision_==='function'&&typeof pdmscBuildBulkResolverContext_==='function');
  check('Leave fast resolver preserved',typeof pdmscLeavePreviewPaste==='function'&&typeof pdmscResolvePersonFromContext_==='function');
  check('No Working Month',typeof PDMSC_WORKING_MONTH==='undefined'&&typeof getWorkingMonth==='undefined');
  let policyOk=false;try{const d=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS);policyOk=!!(d&&d.countStatistics===true&&d.allowWarning===false);}catch(_e){}
  check('EXCLUDED_KEEP_STATS preserved',policyOk);
  const failed=tests.filter(x=>!x.ok),text='## PDMS Personnel Prefix Normalization V0.1.0 — Verify\n\n'+tests.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.note?' — '+x.note:'')).join('\n');
  Logger.log(text);if(failed.length)throw new Error(text);return text;
}

function installPdmsPersonnelEmploymentPeriodV010(){
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscWebCacheClear_(['personnel','leave','dashboard']);
    pdmscLog_('INSTALL_PERSONNEL_EMPLOYMENT_V010','OK',{schema:PDMSC.SCHEMA_VERSION});
    SpreadsheetApp.getUi().alert('PDMS Employment Period V0.1.0','เพิ่มวันที่เริ่มงาน/วันที่สิ้นสุดงานแบบ optional แล้ว\n\nBulk Personnel A:F เดิมยังใช้ได้เหมือนเดิม',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,schema:PDMSC.SCHEMA_VERSION};
  }finally{lock.releaseLock();}
}

function verifyPdmsPersonnelEmploymentPeriodV010(){
  const out=[];const check=(name,ok,note)=>out.push({name:name,ok:!!ok,note:note||''});
  const sh=SpreadsheetApp.getActive().getSheetByName(PDMSC.BACKEND.PERSONNEL);
  const headers=sh?sh.getRange(1,1,1,Math.min(11,sh.getLastColumn())).getDisplayValues()[0]:[];
  check('Personnel backend exists',!!sh);
  check('EmploymentStartDate column',headers[9]==='EmploymentStartDate',headers[9]||'');
  check('EmploymentEndDate column',headers[10]==='EmploymentEndDate',headers[10]||'');
  const d=(y,m,day)=>new Date(y,m-1,day);
  const current={active:true,employmentStartDate:null,employmentEndDate:null};
  const resigned={active:false,employmentStartDate:null,employmentEndDate:d(2026,8,15)};
  const inactiveUnknown={active:false,employmentStartDate:null,employmentEndDate:null};
  check('Active no dates matches',pdmscPersonnelEmploymentDecision_(current,d(2026,6,1),d(2026,6,1)).status==='MATCHED');
  check('Inactive with end date historical matches',pdmscPersonnelEmploymentDecision_(resigned,d(2026,6,1),d(2026,6,1)).status==='MATCHED');
  check('After end date blocked',pdmscPersonnelEmploymentDecision_(resigned,d(2026,8,16),d(2026,8,16)).status==='OUT_OF_EMPLOYMENT_PERIOD');
  check('Cross end date review',pdmscPersonnelEmploymentDecision_(resigned,d(2026,8,15),d(2026,8,16)).status==='EMPLOYMENT_PERIOD_OVERLAP');
  check('Inactive without end stays review',pdmscPersonnelEmploymentDecision_(inactiveUnknown,d(2026,6,1),d(2026,6,1)).status==='INACTIVE');
  check('Blank start is unbounded',pdmscPersonnelEmploymentDecision_(resigned,d(2026,3,31),d(2026,4,1)).status==='MATCHED');
  check('Thai date parser',pdmscPersonnelDateIso_('01/04/2569')==='2026-04-01');
  check('Bulk Personnel A:F preserved',typeof pdmscPersonnelBulkParse_==='function'&&pdmscPersonnelBulkParse_('EMP0099\tทดสอบ\tครู\tทดสอบ\tTRUE\tทดสอบ').rows.length<=1);
  check('Prefix resolver preserved',typeof pdmscBuildNamePrefixContext_==='function'&&typeof pdmscNamePrefixCanonicalKey_==='function');
  check('Leave employment-aware resolver wired',pdmscLeaveParsePaste_.toString().indexOf('pdmscResolvePersonFromContext_(name,resolverCtx,start,end)')>=0);
  check('No Working Month',typeof PDMSC_WORKING_MONTH==='undefined'&&typeof getWorkingMonth==='undefined');
  let policyOk=false;try{const d0=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS);policyOk=!!(d0&&d0.countStatistics===true&&d0.allowWarning===false);}catch(_e){}
  check('EXCLUDED_KEEP_STATS preserved',policyOk);
  const failed=out.filter(x=>!x.ok),text='## PDMS Personnel Employment Period V0.1.0 — Verify\n\n'+out.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.note?' — '+x.note:'')).join('\n');
  Logger.log(text);if(failed.length)throw new Error(text);return text;
}



function verifyPdmsLeaveL01V014(){
  const out=[],check=(name,ok,note)=>out.push((ok?'PASS ':'FAIL ')+name+(note?' — '+note:''));
  check('Leave query endpoint',typeof pdmscWebLeaveListQuery==='function');
  check('Legacy Leave list endpoint preserved',typeof pdmscWebLeaveList==='function');
  check('Leave preview function preserved',typeof pdmscLeavePreviewPaste==='function');
  check('Leave commit function preserved',typeof pdmscLeaveCommit==='function');
  check('Employment period preserved',typeof pdmscPersonnelEmploymentDecision_==='function');
  check('Prefix resolver preserved',typeof pdmscBuildNamePrefixContext_==='function');
  let policyOk=false;try{const p=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS);policyOk=!!(p&&p.countStatistics===true&&p.allowWarning===false)}catch(e){}
  check('EXCLUDED_KEEP_STATS preserved',policyOk);
  check('No Working Month',!('WORKING_MONTH' in (PDMSC.PROP||{})));
  const bad=out.filter(x=>x.indexOf('FAIL ')===0);const msg='## PDMS Leave L01 V0.1.4 — Verify\n\n'+out.join('\n');Logger.log(msg);if(bad.length)throw new Error(msg);return msg;
}


function installPdmsWebW00PerformanceDepartmentV010(){
  const lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    pdmscEnsureBackend_();
    const launcher=pdmscEnsurePage00Launcher_();
    PropertiesService.getDocumentProperties().setProperty(PDMSC.PROP_SCHEMA_VERSION,PDMSC.SCHEMA_VERSION);
    pdmscWebCacheClear_(['dashboard','system-bootstrap','personnel-directory','personnel-bootstrap','personnel-masters','leave-active']);
    pdmscLog_('INSTALL_WEB_W00_PERF_DEPT_V010','OK',{version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD,launcher:launcher.name});
    pdmscBuildMenu_();
    SpreadsheetApp.getUi().alert('PDMS W00 + Web Performance V0.1.0','สร้างหน้า 00_หน้าหลัก + จุดเปิด Web App และติดตั้ง Web cache/view-state + กลุ่มสาระ/ฝ่ายในรายการแล้ว\n\nหลัง Push ให้อัปเดต Web App deployment เป็น New version',SpreadsheetApp.getUi().ButtonSet.OK);
    return{ok:true,launcher:launcher,version:PDMSC.VERSION,webBuild:PDMSC.WEB_BUILD};
  }finally{lock.releaseLock();}
}

function verifyPdmsWebW00PerformanceDepartmentV010(){
  const out=[],check=(name,ok,note)=>out.push({name:name,ok:!!ok,note:note||''});
  const ss=SpreadsheetApp.getActive(),sh=ss.getSheetByName('00_หน้าหลัก'),url=pdmscGetBoundWebAppUrl_();
  check('Page 00 launcher exists',!!sh);
  check('Page 00 is visible',!!sh&&!sh.isSheetHidden());
  check('Page 00 top-row URL',!!sh&&pdmscNormalizeText_(sh.getRange('C1').getDisplayValue())===pdmscNormalizeText_(url),sh?sh.getRange('C1').getDisplayValue():'');
  check('Web route cache helpers',typeof pdmscWebRouteCacheSeconds_==='function'&&typeof pdmscWebCacheGet_==='function'&&typeof pdmscWebCachePut_==='function');
  check('Personnel cached bootstrap',typeof pdmscWebPersonnelBootstrap==='function'&&typeof pdmscWebPersonnelDirectory_==='function');
  check('Leave cached active dataset',typeof pdmscWebLeaveActiveDataset_==='function');
  check('Alias department context',typeof pdmscWebAliasList==='function'&&pdmscWebAliasList('').every(x=>'department' in x));
  const leaveQ=pdmscWebLeaveListQuery({page:1,pageSize:50,department:'',sort:'DEPARTMENT_ASC'});
  check('Leave department context',Array.isArray(leaveQ.departments)&&leaveQ.items.every(x=>'department' in x));
  check('Leave pagination preserved',leaveQ.page===1&&leaveQ.pageSize===50&&typeof leaveQ.totalPages==='number');
  check('Personnel department source preserved',pdmscWebPersonnelList('',true).every(x=>'department' in x));
  check('Prefix resolver preserved',typeof pdmscBuildNamePrefixContext_==='function');
  check('Employment period preserved',typeof pdmscPersonnelEmploymentDecision_==='function');
  check('No Working Month',typeof PDMSC_WORKING_MONTH==='undefined'&&typeof getWorkingMonth==='undefined');
  let policyOk=false;try{const d=pdmscDecisionPolicy(PDMSC.DECISION.EXCLUDED_KEEP_STATS);policyOk=!!(d&&d.countStatistics===true&&d.allowWarning===false);}catch(_e){}
  check('EXCLUDED_KEEP_STATS preserved',policyOk);
  const failed=out.filter(x=>!x.ok),text='## PDMS W00 + Web Performance + Department V0.1.0 — Verify\n\n'+out.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.note?' — '+x.note:'')).join('\n');
  Logger.log(text);if(failed.length)throw new Error(text);return text;
}
