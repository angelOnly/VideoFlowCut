// src/api/touchpointOffline.ts
var TOUCHPOINT_OFFLINE_REPLAY_HEADER = "x-od-touchpoint-offline";
var TOUCHPOINT_OFFLINE_REPLAY_FIELD = "offlineReplay";
var TOUCHPOINT_SCHEDULE_FIELDS = [
  "serverTime",
  "startsAt",
  "endsAt",
  "authorizationExpiresAt"
];
var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var isoMs = (value) => {
  if (typeof value !== "string" || !value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};
function touchpointScheduleOf(decision) {
  if (!isRecord(decision)) return null;
  const fields = TOUCHPOINT_SCHEDULE_FIELDS.map((field) => isoMs(decision[field]));
  if (fields.some((value) => value === null)) return null;
  const [, startsAt, endsAt] = fields;
  if (endsAt <= startsAt) return null;
  return {
    serverTime: decision.serverTime,
    startsAt: decision.startsAt,
    endsAt: decision.endsAt,
    authorizationExpiresAt: decision.authorizationExpiresAt
  };
}
function touchpointCachedIdentityOf(decision) {
  if (!isRecord(decision)) return null;
  const content = isRecord(decision.content) ? decision.content : null;
  const identity = {
    activityId: decision.activityId,
    deploymentId: decision.deploymentId,
    contentVersionId: content?.id,
    touchpointDecisionId: decision.touchpointDecisionId
  };
  return Object.values(identity).every((value) => typeof value === "string" && value) ? identity : null;
}
function touchpointRevocationReceiptOf(body) {
  if (!isRecord(body) || body.error !== "production_runtime_revoked") return null;
  const receipt = body.receipt;
  if (!isRecord(receipt)) return null;
  const parsed = {
    activityId: receipt.activityId,
    deploymentId: receipt.deploymentId,
    contentVersionId: receipt.contentVersionId,
    touchpointDecisionId: receipt.touchpointDecisionId
  };
  return Object.values(parsed).every((value) => typeof value === "string" && value) ? parsed : null;
}
var touchpointReceiptMatches = (receipt, identity) => receipt.activityId === identity.activityId && receipt.deploymentId === identity.deploymentId && receipt.contentVersionId === identity.contentVersionId;
function touchpointWithdrawalReclaims(body, identity) {
  const receipt = touchpointRevocationReceiptOf(body);
  if (!receipt) return true;
  return identity !== null && touchpointReceiptMatches(receipt, identity);
}
var touchpointScheduleAllowsDisplay = (schedule, now) => {
  const startsAt = Date.parse(schedule.startsAt);
  const endsAt = Date.parse(schedule.endsAt);
  return Number.isFinite(startsAt) && Number.isFinite(endsAt) && now >= startsAt && now < endsAt;
};
var touchpointScheduleHasEnded = (schedule, now) => {
  const endsAt = Date.parse(schedule.endsAt);
  return Number.isFinite(endsAt) && now >= endsAt;
};
function touchpointOfflineReplayOf(decision) {
  if (!isRecord(decision)) return null;
  const marker = decision[TOUCHPOINT_OFFLINE_REPLAY_FIELD];
  if (!isRecord(marker)) return null;
  const { reason, cachedServerTime, effectiveServerTime } = marker;
  return (reason === "upstream_unreachable" || reason === "upstream_unavailable") && typeof cachedServerTime === "string" && typeof effectiveServerTime === "string" ? { reason, cachedServerTime, effectiveServerTime } : null;
}
var touchpointStatusIsTransient = (status) => status >= 500 && status < 600;
export {
  TOUCHPOINT_OFFLINE_REPLAY_FIELD,
  TOUCHPOINT_OFFLINE_REPLAY_HEADER,
  TOUCHPOINT_SCHEDULE_FIELDS,
  touchpointCachedIdentityOf,
  touchpointOfflineReplayOf,
  touchpointReceiptMatches,
  touchpointRevocationReceiptOf,
  touchpointScheduleAllowsDisplay,
  touchpointScheduleHasEnded,
  touchpointScheduleOf,
  touchpointStatusIsTransient,
  touchpointWithdrawalReclaims
};
