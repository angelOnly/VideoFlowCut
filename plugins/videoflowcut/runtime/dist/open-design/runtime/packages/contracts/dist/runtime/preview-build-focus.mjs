// src/runtime/preview-build-focus.ts
var PREVIEW_BUILD_FOCUS_BRIDGE_MARKER = "data-od-preview-build-focus";
var PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION = 1;
var PREVIEW_BUILD_FOCUS_READY_TYPE = "od:preview-build-focus-ready";
var PREVIEW_BUILD_FOCUS_REQUEST_TYPE = "od:preview-build-focus";
var PREVIEW_BUILD_FOCUS_RESULT_TYPE = "od:preview-build-focus-rect";
var PREVIEW_BUILD_FOCUS_SECTIONS_TYPE = "od:preview-build-focus-sections";
var PREVIEW_BUILD_FOCUS_MAX_ANCHOR_CHARS = 96;
var PREVIEW_BUILD_FOCUS_MAX_TEXT_NODES = 4e3;
var PREVIEW_BUILD_FOCUS_MAX_FALLBACK_ELEMENTS = 2e3;
var PREVIEW_BUILD_FOCUS_MAX_SECTIONS = 24;
var PREVIEW_BUILD_FOCUS_MAX_LABEL_CHARS = 40;
var PREVIEW_BUILD_FOCUS_MAX_SECTION_KEY_CHARS = 96;
var MAX_COORDINATE = 2e4;
function finiteNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < -MAX_COORDINATE || value > MAX_COORDINATE) {
    return value < 0 ? -MAX_COORDINATE : MAX_COORDINATE;
  }
  return value;
}
function isPreviewBuildFocusReady(value) {
  if (!value || typeof value !== "object") return false;
  const message = value;
  return message.type === PREVIEW_BUILD_FOCUS_READY_TYPE && message.version === PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION;
}
function parsePreviewBuildFocusResult(value) {
  if (!value || typeof value !== "object") return null;
  const message = value;
  if (message.type !== PREVIEW_BUILD_FOCUS_RESULT_TYPE) return null;
  if (message.version !== PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION) return null;
  if (typeof message.requestId !== "string" || !message.requestId) return null;
  if (typeof message.found !== "boolean") return null;
  const x = finiteNumber(message.x);
  const y = finiteNumber(message.y);
  const width = finiteNumber(message.width);
  const height = finiteNumber(message.height);
  const viewportWidth = finiteNumber(message.viewportWidth);
  const viewportHeight = finiteNumber(message.viewportHeight);
  if (x === null || y === null || width === null || height === null || viewportWidth === null || viewportHeight === null) {
    return null;
  }
  return {
    type: PREVIEW_BUILD_FOCUS_RESULT_TYPE,
    version: PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION,
    requestId: message.requestId.slice(0, 64),
    found: message.found,
    x,
    y,
    width: Math.max(0, width),
    height: Math.max(0, height),
    viewportWidth: Math.max(0, viewportWidth),
    viewportHeight: Math.max(0, viewportHeight)
  };
}
function parsePreviewBuildFocusSections(value) {
  if (!value || typeof value !== "object") return null;
  const message = value;
  if (message.type !== PREVIEW_BUILD_FOCUS_SECTIONS_TYPE) return null;
  if (message.version !== PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION) return null;
  if (!Array.isArray(message.sections)) return null;
  const sections = [];
  for (const entry of message.sections) {
    if (sections.length >= PREVIEW_BUILD_FOCUS_MAX_SECTIONS) break;
    if (!entry || typeof entry !== "object") continue;
    const section = entry;
    if (typeof section.key !== "string" || !section.key) continue;
    if (typeof section.label !== "string") continue;
    sections.push({
      key: section.key.slice(0, PREVIEW_BUILD_FOCUS_MAX_SECTION_KEY_CHARS),
      label: section.label.slice(0, PREVIEW_BUILD_FOCUS_MAX_LABEL_CHARS)
    });
  }
  return sections;
}
function previewBuildFocusRequest(requestId, anchor, section = null) {
  const trimmed = typeof anchor === "string" ? anchor.trim() : "";
  const key = typeof section === "string" ? section.trim() : "";
  return {
    type: PREVIEW_BUILD_FOCUS_REQUEST_TYPE,
    version: PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION,
    requestId,
    anchor: trimmed ? trimmed.slice(0, PREVIEW_BUILD_FOCUS_MAX_ANCHOR_CHARS) : null,
    section: key ? key.slice(0, PREVIEW_BUILD_FOCUS_MAX_SECTION_KEY_CHARS) : null
  };
}
function buildPreviewBuildFocusBridge() {
  return `<script ${PREVIEW_BUILD_FOCUS_BRIDGE_MARKER}>
(function(){
  if (window.__odPreviewBuildFocus) return;
  window.__odPreviewBuildFocus = true;
  var READY = ${JSON.stringify(PREVIEW_BUILD_FOCUS_READY_TYPE)};
  var REQUEST = ${JSON.stringify(PREVIEW_BUILD_FOCUS_REQUEST_TYPE)};
  var RESULT = ${JSON.stringify(PREVIEW_BUILD_FOCUS_RESULT_TYPE)};
  var VERSION = ${PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION};
  var SECTIONS = ${JSON.stringify(PREVIEW_BUILD_FOCUS_SECTIONS_TYPE)};
  var MAX_TEXT_NODES = ${PREVIEW_BUILD_FOCUS_MAX_TEXT_NODES};
  var MAX_FALLBACK = ${PREVIEW_BUILD_FOCUS_MAX_FALLBACK_ELEMENTS};
  var MAX_SECTIONS = ${PREVIEW_BUILD_FOCUS_MAX_SECTIONS};
  var MAX_LABEL = ${PREVIEW_BUILD_FOCUS_MAX_LABEL_CHARS};
  var lastRequestId = null;
  var lastAnchor = null;
  var lastSection = null;
  var pending = false;
  function reduced(){
    try {
      return typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_) { return false; }
  }
  function collapse(value){
    return String(value || '').replace(/\\s+/g, ' ').trim();
  }
  function findByText(anchor){
    var needle = collapse(anchor);
    if (!needle || !document.body) return null;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var seen = 0;
    var loose = null;
    while (walker.nextNode() && seen < MAX_TEXT_NODES) {
      seen++;
      var node = walker.currentNode;
      var raw = node.nodeValue || '';
      if (!raw) continue;
      var parent = node.parentElement;
      if (!parent) continue;
      if (raw.indexOf(anchor) !== -1) return parent;
      if (!loose && collapse(raw).indexOf(needle) !== -1) loose = parent;
    }
    return loose;
  }
  function skippable(el){
    var tag = String(el && el.tagName || '').toLowerCase();
    return tag === 'script' || tag === 'style' || tag === 'template' ||
      tag === 'link' || tag === 'meta' || tag === 'noscript' || tag === 'title';
  }
  // The page's top-level parts, in document order. A body that holds one
  // wrapper (a <main>, a layout div) is described by that wrapper's children \u2014
  // otherwise every page would report a single section covering all of it.
  function sectionRoots(){
    if (!document.body) return [];
    var parent = document.body;
    for (var depth = 0; depth < 3; depth++) {
      var kids = [];
      var children = parent.children || [];
      for (var i = 0; i < children.length; i++) {
        if (!skippable(children[i])) kids.push(children[i]);
      }
      if (kids.length === 0) return [];
      var only = kids.length === 1 ? kids[0] : null;
      if (!only || !only.children || only.children.length < 2) return kids;
      parent = only;
    }
    return [];
  }
  function labelFor(el, index){
    var heading = null;
    try { heading = el.querySelector('h1, h2, h3, h4'); } catch (_) {}
    var text = heading ? collapse(heading.textContent) : '';
    if (!text && el.id) text = collapse(el.id);
    if (!text && el.getAttribute) text = collapse(el.getAttribute('aria-label'));
    if (!text) text = collapse(el.tagName).toLowerCase() + ' ' + (index + 1);
    return text.slice(0, MAX_LABEL);
  }
  // Keyed by position, tag AND label: a part whose heading was just rewritten
  // is, for the host's purposes, a part that just landed.
  function sectionList(){
    var roots = sectionRoots();
    var out = [];
    for (var i = 0; i < roots.length && out.length < MAX_SECTIONS; i++) {
      var el = roots[i];
      if (!el || typeof el.getBoundingClientRect !== 'function') continue;
      var box = el.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) continue;
      var label = labelFor(el, i);
      out.push({
        el: el,
        key: i + '|' + collapse(el.tagName).toLowerCase() + '|' + label,
        label: label
      });
    }
    return out;
  }
  function postSections(){
    var list = sectionList();
    var plain = [];
    for (var i = 0; i < list.length; i++) plain.push({ key: list[i].key, label: list[i].label });
    try {
      window.parent.postMessage({ type: SECTIONS, version: VERSION, sections: plain }, '*');
    } catch (_) {}
  }
  function findSection(key){
    var list = sectionList();
    for (var i = 0; i < list.length; i++) {
      if (list[i].key === key) return list[i].el;
    }
    return null;
  }
  function lastVisibleElement(){
    if (!document.body) return null;
    var all = document.body.querySelectorAll('*');
    var start = all.length - 1;
    var limit = Math.max(0, all.length - MAX_FALLBACK);
    for (var i = start; i >= limit; i--) {
      var el = all[i];
      if (!el || typeof el.getBoundingClientRect !== 'function') continue;
      var box = el.getBoundingClientRect();
      if (box.width > 0 && box.height > 0) return el;
    }
    return document.body;
  }
  function post(requestId, found, el){
    var box = found && el && typeof el.getBoundingClientRect === 'function'
      ? el.getBoundingClientRect()
      : null;
    try {
      window.parent.postMessage({
        type: RESULT,
        version: VERSION,
        requestId: requestId,
        found: Boolean(found && box),
        x: box ? box.left : 0,
        y: box ? box.top : 0,
        width: box ? box.width : 0,
        height: box ? box.height : 0,
        viewportWidth: window.innerWidth || 0,
        viewportHeight: window.innerHeight || 0
      }, '*');
    } catch (_) {}
  }
  function locate(requestId, anchor, section){
    var target = section ? findSection(section) : null;
    if (!target && anchor) target = findByText(anchor);
    var found = Boolean(target);
    if (!target) target = lastVisibleElement();
    if (!target) { post(requestId, false, null); return; }
    try {
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
    } catch (_) {
      try { target.scrollIntoView(); } catch (__) {}
    }
    var el = target;
    // \`found\` stays false when the anchor did not match: the page was still
    // scrolled to its newest content, but the host must NOT draw a cursor \u2014
    // pointing confidently at a guess is worse than pointing at nothing.
    //
    // Measured TWICE, and this is not belt-and-braces. A smooth scroll is still
    // animating two frames later, so the first box is the element's pre-scroll
    // position \u2014 off-screen for anything below the fold. The early post keeps
    // the cursor responsive when the target was already in view; the settled
    // one corrects it. Same requestId, so the host simply takes the latest.
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ post(requestId, found, el); });
    });
    var settled = false;
    function settle(){
      if (settled) return;
      settled = true;
      requestAnimationFrame(function(){ post(requestId, found, el); });
    }
    if ('onscrollend' in window) {
      window.addEventListener('scrollend', settle, { once: true });
    }
    setTimeout(settle, 520);
  }
  window.addEventListener('message', function(event){
    var data = event && event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type !== REQUEST || data.version !== VERSION) return;
    if (typeof data.requestId !== 'string' || !data.requestId) return;
    lastRequestId = data.requestId;
    lastAnchor = typeof data.anchor === 'string' ? data.anchor : null;
    lastSection = typeof data.section === 'string' ? data.section : null;
    locate(lastRequestId, lastAnchor, lastSection);
  });
  window.addEventListener('resize', function(){
    if (!lastRequestId || pending) return;
    pending = true;
    requestAnimationFrame(function(){
      pending = false;
      if (lastRequestId) locate(lastRequestId, lastAnchor, lastSection);
    });
  });
  function ready(){
    try { window.parent.postMessage({ type: READY, version: VERSION }, '*'); } catch (_) {}
    // One frame later: at DOMContentLoaded the parts exist but have no boxes
    // yet, and a section with no box is not a section the cursor can visit.
    requestAnimationFrame(postSections);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
  window.addEventListener('load', ready);
})();
</script>`;
}
export {
  PREVIEW_BUILD_FOCUS_BRIDGE_MARKER,
  PREVIEW_BUILD_FOCUS_MAX_ANCHOR_CHARS,
  PREVIEW_BUILD_FOCUS_MAX_FALLBACK_ELEMENTS,
  PREVIEW_BUILD_FOCUS_MAX_LABEL_CHARS,
  PREVIEW_BUILD_FOCUS_MAX_SECTIONS,
  PREVIEW_BUILD_FOCUS_MAX_SECTION_KEY_CHARS,
  PREVIEW_BUILD_FOCUS_MAX_TEXT_NODES,
  PREVIEW_BUILD_FOCUS_PROTOCOL_VERSION,
  PREVIEW_BUILD_FOCUS_READY_TYPE,
  PREVIEW_BUILD_FOCUS_REQUEST_TYPE,
  PREVIEW_BUILD_FOCUS_RESULT_TYPE,
  PREVIEW_BUILD_FOCUS_SECTIONS_TYPE,
  buildPreviewBuildFocusBridge,
  isPreviewBuildFocusReady,
  parsePreviewBuildFocusResult,
  parsePreviewBuildFocusSections,
  previewBuildFocusRequest
};
