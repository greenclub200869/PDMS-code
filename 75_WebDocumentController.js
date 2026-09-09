function pdmscWebDocumentSettingsSave(payload){return pdmscDocSaveSettings_(payload||{});}
function pdmscWebDocumentValidateTemplates(){return pdmscWebSafe_(pdmscDocValidateAllTemplates_());}
function pdmscWebDocumentPreview(monthKey,candidateKey){return pdmscDocPreview_(monthKey,candidateKey);}
function pdmscWebDocumentIssuePerson(monthKey,candidateKey,previewFingerprint,issueDateKey){return pdmscWebSafe_(pdmscDocIssuePerson_(monthKey,candidateKey,previewFingerprint,issueDateKey));}
function pdmscWebDocumentCoverPreview(monthKey,candidateKeys){return pdmscDocCoverPreviewCached_(monthKey,candidateKeys||[]);}
function pdmscWebDocumentIssueCover(monthKey,candidateKeys,previewFingerprint,issueDateKey){return pdmscWebSafe_(pdmscDocIssueCover_(monthKey,candidateKeys||[],previewFingerprint,issueDateKey));}
function pdmscWebDocumentHistory(){return pdmscDocHistoryDataset_();}

function pdmscWebDocumentTestPrepare(monthKey,candidateKeys,issueDateKey){return pdmscWebSafe_(pdmscDocTestPrepare_(monthKey,candidateKeys||[],issueDateKey));}
function pdmscWebDocumentTestGenerateChunk(batchId,indexes){return pdmscWebSafe_(pdmscDocTestGenerateChunk_(batchId,indexes||[]));}
function pdmscWebDocumentTestGenerateCover(batchId,groupIndex){return pdmscWebSafe_(pdmscDocTestGenerateCover_(batchId,groupIndex));}
function pdmscWebDocumentTestSelected(monthKey,candidateKeys,issueDateKey){return pdmscWebSafe_(pdmscDocTestSelected_(monthKey,candidateKeys||[],issueDateKey));}
function pdmscWebDocumentIssueSelectedPersons(monthKey,candidateKeys,issueDateKey){return pdmscWebSafe_(pdmscDocIssueSelectedPersons_(monthKey,candidateKeys||[],issueDateKey));}
function pdmscWebDocumentIssuePrepare(monthKey,candidateKeys,issueDateKey){return pdmscWebSafe_(pdmscDocIssuePrepare_(monthKey,candidateKeys||[],issueDateKey));}
function pdmscWebDocumentIssueGenerateChunk(batchId,indexes){return pdmscWebSafe_(pdmscDocIssueGenerateChunk_(batchId,indexes||[]));}
function pdmscWebDocumentIssueGenerateCover(batchId,groupIndex){return pdmscWebSafe_(pdmscDocIssueGenerateCover_(batchId,groupIndex));}
