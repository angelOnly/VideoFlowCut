// src/runtime/preview-runtime-state.ts
var PREVIEW_RUNTIME_STATE_VERSION = 1;
var PREVIEW_RUNTIME_STATE_LIMITS = {
  maxElements: 3500,
  maxRoots: 64,
  maxRootHtmlLength: 2 * 1024 * 1024,
  maxBodyHtmlLength: 2 * 1024 * 1024,
  maxAttributes: 64,
  maxAttributeNameLength: 128,
  maxAttributeValueLength: 2e4,
  maxHashLength: 4096,
  maxTagLength: 32,
  maxPathLength: 64,
  maxPathIndex: 1e5,
  maxIdentityLength: 4096,
  maxValueLength: 1e5
};
function isPreviewRuntimeAttributeMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= PREVIEW_RUNTIME_STATE_LIMITS.maxAttributes && entries.every(([name, attrValue]) => name.length <= PREVIEW_RUNTIME_STATE_LIMITS.maxAttributeNameLength && typeof attrValue === "string" && attrValue.length <= PREVIEW_RUNTIME_STATE_LIMITS.maxAttributeValueLength);
}
function isPreviewRuntimePath(value) {
  return Array.isArray(value) && value.length <= PREVIEW_RUNTIME_STATE_LIMITS.maxPathLength && value.every((index) => Number.isInteger(index) && index >= 0 && index <= PREVIEW_RUNTIME_STATE_LIMITS.maxPathIndex);
}
function hasValidPreviewRuntimeIdentity(value) {
  return value === void 0 || typeof value === "string" && value.length <= PREVIEW_RUNTIME_STATE_LIMITS.maxIdentityLength;
}
function isPreviewRuntimeState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value;
  if (state.version !== PREVIEW_RUNTIME_STATE_VERSION || typeof state.hash !== "string" || state.hash.length > PREVIEW_RUNTIME_STATE_LIMITS.maxHashLength || state.bodyHtml !== void 0 && state.bodyHtml !== null && (typeof state.bodyHtml !== "string" || state.bodyHtml.length > PREVIEW_RUNTIME_STATE_LIMITS.maxBodyHtmlLength) || state.roots !== void 0 && (!Array.isArray(state.roots) || state.roots.length > PREVIEW_RUNTIME_STATE_LIMITS.maxRoots || state.roots.reduce((total, root) => total + (root && typeof root === "object" && typeof root.html === "string" ? root.html.length : PREVIEW_RUNTIME_STATE_LIMITS.maxRootHtmlLength + 1), 0) > PREVIEW_RUNTIME_STATE_LIMITS.maxRootHtmlLength || !state.roots.every((root) => !!root && typeof root === "object" && typeof root.tag === "string" && root.tag.length <= PREVIEW_RUNTIME_STATE_LIMITS.maxTagLength && isPreviewRuntimePath(root.path) && hasValidPreviewRuntimeIdentity(root.id) && hasValidPreviewRuntimeIdentity(root.odId) && typeof root.html === "string")) || !isPreviewRuntimeAttributeMap(state.htmlAttrs) || !isPreviewRuntimeAttributeMap(state.bodyAttrs) || !Array.isArray(state.entries) || state.entries.length > PREVIEW_RUNTIME_STATE_LIMITS.maxElements) {
    return false;
  }
  return state.entries.every((entry) => !!entry && typeof entry === "object" && typeof entry.tag === "string" && entry.tag.length <= PREVIEW_RUNTIME_STATE_LIMITS.maxTagLength && isPreviewRuntimePath(entry.path) && hasValidPreviewRuntimeIdentity(entry.id) && hasValidPreviewRuntimeIdentity(entry.odId) && isPreviewRuntimeAttributeMap(entry.attrs) && (entry.value === void 0 || typeof entry.value === "string" && entry.value.length <= PREVIEW_RUNTIME_STATE_LIMITS.maxValueLength) && (entry.checked === void 0 || typeof entry.checked === "boolean") && (entry.selectedIndex === void 0 || Number.isInteger(entry.selectedIndex)) && (entry.scrollLeft === void 0 || Number.isFinite(entry.scrollLeft)) && (entry.scrollTop === void 0 || Number.isFinite(entry.scrollTop)));
}
export {
  PREVIEW_RUNTIME_STATE_LIMITS,
  PREVIEW_RUNTIME_STATE_VERSION,
  isPreviewRuntimeState
};
