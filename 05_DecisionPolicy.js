function pdmscDecisionPolicy(decision) {
  const d = String(decision || PDMSC.DECISION.NORMAL).toUpperCase();
  const map = {};
  map[PDMSC.DECISION.NORMAL] = {countStatistics:true, allowWarning:true, allowMonthlyReport:true, final:true};
  map[PDMSC.DECISION.EXCLUDED] = {countStatistics:false, allowWarning:false, allowMonthlyReport:false, final:true};
  map[PDMSC.DECISION.EXCLUDED_KEEP_STATS] = {countStatistics:true, allowWarning:false, allowMonthlyReport:true, final:true};
  map[PDMSC.DECISION.PENDING] = {countStatistics:false, allowWarning:false, allowMonthlyReport:false, final:false};
  if (!map[d]) throw new Error('Decision ไม่รองรับ: ' + d);
  return Object.assign({decision:d}, map[d]);
}
