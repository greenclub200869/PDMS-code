function pdmscLog_(action, status, details) {
  const actor = Session.getActiveUser().getEmail() || '';
  pdmscAppendRow_(PDMSC.BACKEND.LOG, [new Date(), action, status, actor, JSON.stringify(details || {})]);
}
