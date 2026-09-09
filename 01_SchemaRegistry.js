function pdmscSchemaRegistry_() {
  const B = PDMSC.BACKEND;
  return {
    [B.CONFIG]: ['Key','Value','UpdatedAt','Note'],
    [B.PERSONNEL]: [
      'EMP_ID','FullName','Position','Department','Active','MatchName','CreatedAt','UpdatedAt',
      'Note','EmploymentStartDate','EmploymentEndDate'
    ],
    [B.NAME_MAP]: [
      'SourceName','EMP_ID','CanonicalName','Status','Note','UpdatedAt',
      'SourceType'
    ],
    [B.EXCLUSIONS]: [
      'MatchName','Reason','Active','UpdatedAt',
      'EMP_ID','ScopeType','Note'
    ],
    [B.OP_RULES]: ['RuleId','StartDate','EndDate','ScopeType','ScopeValue','Action','Cutoff','EventExemption','Note','Active','UpdatedAt','OutScanPolicy'],
    [B.MASTER_POSITION]: ['ID','Name','Active','Aliases','Note','UpdatedAt'],
    [B.MASTER_DEPARTMENT]: ['ID','Name','Active','Aliases','Note','UpdatedAt'],
    [B.MASTER_LEAVE_TYPE]: ['ID','Name','Active','Aliases','Note','UpdatedAt','CountOccurrence','CountDays','IncludeWarningBase','ShowSeparateStatistics'],
    [B.MASTER_NAME_PREFIX]: ['ID','Name','Active','Aliases','Note','UpdatedAt'],
    [B.PERIODS]: ['PeriodID','Name','StartDate','EndDate','Active','LockStatus','Note','UpdatedAt'],
    [B.WARNING_RULES]: ['RuleID','Name','Category','IncludedEventTypes','Threshold','Window','Active','Note','Version','UpdatedAt'],
    [B.RAW_LEAVE]: ['ImportId','SourceRow','PayloadJson','Fingerprint','ImportedAt'],
    [B.LEAVE_STORE]: ['LeaveId','EMP_ID','LeaveType','StartDate','EndDate','Days','SourceFingerprint','Status','UpdatedAt'],
    [B.RAW_ATTENDANCE]: ['MonthKey','ImportId','EMP_ID','SourceName','Date','RawValue','ScanJson','Fingerprint','ImportedAt','MainRawValue','SecondaryRawValue','MainBackground','SecondaryBackground','RowMode','SourceRowsJson','ResolverMethod','StructureFlagsJson'],
    [B.EVENT_STORE]: ['EventId','MonthKey','EMP_ID','EventDate','EventType','EventSubtype','EvidenceJson','CalcVersion','Decision','DecisionFingerprint','Status','UpdatedAt'],
    [B.DECISIONS]: ['DecisionId','EventIdentity','EMP_ID','EventDate','EventType','Decision','ContextFingerprint','Note','UpdatedAt','UpdatedBy'],
    [B.DOC_HISTORY]: ['DocumentId','WarningKey','EMP_ID','PeriodStart','PeriodEnd','Revision','Status','SourceFingerprint','FileId','CreatedAt','DocumentType','Category','RuleId','CandidateKey','DocumentReason','Count','Days','Minutes','DepartmentId','DepartmentName','FullName','Position','FileUrl','IssuedBy','TemplateSnapshotJson','StyleRevision','Source','UpdatedAt','IssueDate'],
    [B.MONTHLY_DOC_HISTORY]: ['DocumentId','MonthKey','Revision','Status','SourceFingerprint','FileId','CreatedAt'],
    [B.JOBS]: ['JobId','JobType','MonthKey','Stage','Cursor','Status','PayloadJson','StartedAt','UpdatedAt','Error'],
    [B.LOG]: ['Timestamp','Action','Status','Actor','DetailsJson']
  };
}
