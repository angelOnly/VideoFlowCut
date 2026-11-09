// src/runtime/html-injection-points.ts
var HTML_RAW_TEXT_ELEMENTS = [
  "script",
  "style",
  "textarea",
  "title",
  "iframe",
  "noembed",
  "noframes",
  "noscript",
  "plaintext",
  "xmp"
];
function asciiLower(value) {
  return value.replace(/[A-Z]/g, (c) => c.toLowerCase());
}
function endOfComment(html, from) {
  let i = from + 4;
  if (html.startsWith(">", i)) return i + 1;
  if (html.startsWith("->", i)) return i + 2;
  while (i < html.length) {
    const dash = html.indexOf("--", i);
    if (dash < 0) return -1;
    let j = dash;
    while (html.charCodeAt(j) === 45) j += 1;
    if (html.startsWith(">", j)) return j + 1;
    if (html.startsWith("!>", j)) return j + 2;
    i = j > dash ? j : dash + 2;
  }
  return -1;
}
function scanTag(html, from) {
  const attrs = /* @__PURE__ */ new Map();
  const unterminated = { end: -1, selfClosing: false, attrs };
  let i = from;
  let selfClosing = false;
  while (i < html.length) {
    const ch = html.charCodeAt(i);
    if (isHtmlWhitespace(ch)) {
      selfClosing = false;
      i += 1;
      continue;
    }
    if (ch === 47) {
      selfClosing = true;
      i += 1;
      continue;
    }
    if (ch === 62) return { end: i, selfClosing, attrs };
    selfClosing = false;
    const nameStart = i;
    if (html.charCodeAt(i) === 61) i += 1;
    while (i < html.length) {
      const c = html.charCodeAt(i);
      if (isHtmlWhitespace(c) || c === 47 || c === 61 || c === 62) break;
      i += 1;
    }
    const name = asciiLower(html.slice(nameStart, i)).replace(/\0/g, "\uFFFD");
    while (i < html.length && isHtmlWhitespace(html.charCodeAt(i))) i += 1;
    if (i >= html.length) return unterminated;
    let value = "";
    if (html.charCodeAt(i) === 61) {
      i += 1;
      while (i < html.length && isHtmlWhitespace(html.charCodeAt(i))) i += 1;
      if (i >= html.length) return unterminated;
      const quote = html.charCodeAt(i);
      if (quote === 34 || quote === 39) {
        const close = html.indexOf(String.fromCharCode(quote), i + 1);
        if (close < 0) return unterminated;
        value = html.slice(i + 1, close);
        i = close + 1;
      } else if (quote === 62) {
        if (name && !attrs.has(name)) attrs.set(name, "");
        return { end: i, selfClosing: false, attrs };
      } else {
        const valueStart = i;
        while (i < html.length) {
          const c = html.charCodeAt(i);
          if (isHtmlWhitespace(c) || c === 62) break;
          i += 1;
        }
        value = html.slice(valueStart, i);
      }
    }
    if (name && !attrs.has(name)) attrs.set(name, value);
  }
  return unterminated;
}
function isHtmlWhitespace(code) {
  return code === 9 || code === 10 || code === 12 || code === 13 || code === 32;
}
function isEndTagBoundary(code) {
  return isHtmlWhitespace(code) || code === 47 || code === 62;
}
function findRawTextClose(lowerHtml, tagName, from) {
  if (tagName === "plaintext") return -1;
  if (tagName === "script") return findScriptClose(lowerHtml, from);
  const needle = `</${tagName}`;
  let at = lowerHtml.indexOf(needle, from);
  while (at >= 0) {
    if (isEndTagBoundary(lowerHtml.charCodeAt(at + needle.length))) return at;
    at = lowerHtml.indexOf(needle, at + needle.length);
  }
  return -1;
}
function findScriptClose(lowerHtml, from) {
  let i = from;
  let escaped = false;
  let doubleEscaped = false;
  while (i < lowerHtml.length) {
    if (!escaped && lowerHtml.startsWith("<!--", i)) {
      escaped = true;
      i += 4;
      continue;
    }
    if (escaped && lowerHtml.startsWith("-->", i)) {
      escaped = false;
      doubleEscaped = false;
      i += 3;
      continue;
    }
    if (escaped && !doubleEscaped && lowerHtml.startsWith("<script", i) && isEndTagBoundary(lowerHtml.charCodeAt(i + 7))) {
      doubleEscaped = true;
      i += 7;
      continue;
    }
    if (lowerHtml.startsWith("</script", i) && isEndTagBoundary(lowerHtml.charCodeAt(i + 8))) {
      if (!doubleEscaped) return i;
      doubleEscaped = false;
      i += 8;
      continue;
    }
    i += 1;
  }
  return -1;
}
function skipTemplateContent(html, lowerHtml, from) {
  const tagOpen = /<(\/?)([a-z][^\t\n\f\r \/>]*)/iy;
  const modes = [newSelectModeState()];
  let i = from;
  while (i < html.length && modes.length > 0) {
    if (html.charCodeAt(i) !== 60) {
      i += 1;
      continue;
    }
    if (html.startsWith("<!--", i)) {
      const end = endOfComment(html, i);
      if (end < 0) return -1;
      i = end;
      continue;
    }
    if (html.startsWith("</", i) && !/[a-z]/i.test(html.charAt(i + 2))) {
      const end = html.indexOf(">", i + 2);
      if (end < 0) return -1;
      i = end + 1;
      continue;
    }
    if (html.startsWith("<!", i) || html.startsWith("<?", i)) {
      const end = html.indexOf(">", i + 2);
      if (end < 0) return -1;
      i = end + 1;
      continue;
    }
    tagOpen.lastIndex = i;
    const open = tagOpen.exec(html);
    if (!open) {
      i += 1;
      continue;
    }
    const tag = scanTag(html, i + open[0].length);
    const tagEnd = tag.end;
    if (tagEnd < 0) return -1;
    const tagName = (open[2] ?? "").toLowerCase();
    const selectMode = modes[modes.length - 1];
    if (!observeSelectMode(selectMode, tagName, !!open[1], tag.selfClosing)) return -1;
    if (!open[1] && HTML_RAW_TEXT_ELEMENTS.includes(tagName)) {
      const contentEnd = findRawTextClose(lowerHtml, tagName, tagEnd + 1);
      if (contentEnd < 0) return -1;
      i = contentEnd;
      continue;
    }
    if (!open[1] && !selectMode.inSelect && (tagName === "svg" || tagName === "math") && !tag.selfClosing) {
      const contentEnd = skipForeignContent(html, lowerHtml, tagName, tagEnd + 1);
      if (contentEnd < 0) return -1;
      i = contentEnd;
      continue;
    }
    if (tagName === "template") {
      if (open[1]) {
        modes.pop();
        if (modes.length === 0) return tagEnd + 1;
      } else if (!tag.selfClosing) {
        modes.push(newSelectModeState());
      }
    }
    i = tagEnd + 1;
  }
  return -1;
}
function newSelectModeState() {
  return { inSelect: false, tableDepth: 0 };
}
function observeSelectMode(state, tagName, isEndTag, selfClosing) {
  const wasInSelect = state.inSelect;
  const tableDepthBefore = state.tableDepth;
  let determinate = true;
  if (tagName === "select") state.inSelect = !isEndTag && !state.inSelect;
  else if (state.inSelect && !isEndTag && SELECT_CLOSING_START_TAGS.includes(tagName)) {
    state.inSelect = false;
  } else if (state.inSelect && tableDepthBefore > 0 && SELECT_IN_TABLE_CLOSING_TAGS.includes(tagName)) {
    determinate = false;
  }
  if (!(wasInSelect && tableDepthBefore === 0)) {
    if (!isEndTag && tagName === "table" && !selfClosing) state.tableDepth += 1;
    else if (isEndTag && tagName === "table" && state.tableDepth > 0) state.tableDepth -= 1;
  }
  return determinate;
}
var REPROCESSED_END_TAGS = ["p", "br"];
var SELECT_CLOSING_START_TAGS = ["input", "keygen", "textarea"];
var SELECT_IN_TABLE_CLOSING_TAGS = [
  "caption",
  "table",
  "tbody",
  "tfoot",
  "thead",
  "tr",
  "td",
  "th"
];
var PREVIEW_VOID_ELEMENTS = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr"
];
var HTML_INTEGRATION_POINTS = ["foreignobject", "desc", "title"];
var MATHML_TEXT_INTEGRATION_POINTS = ["mi", "mo", "mn", "ms", "mtext"];
var MATHML_TEXT_INTEGRATION_EXCEPTIONS = ["mglyph", "malignmark"];
var FOREIGN_BREAKOUT_TAGS = [
  "b",
  "big",
  "blockquote",
  "body",
  "br",
  "center",
  "code",
  "dd",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "hr",
  "i",
  "img",
  "li",
  "listing",
  "menu",
  "meta",
  "nobr",
  "ol",
  "p",
  "pre",
  "ruby",
  "s",
  "small",
  "span",
  "strong",
  "strike",
  "sub",
  "sup",
  "table",
  "tt",
  "u",
  "ul",
  "var"
];
var HTML_ANNOTATION_ENCODINGS = ["text/html", "application/xhtml+xml"];
var ATTRIBUTE_NAMED_REFERENCES = /* @__PURE__ */ new Map([
  ["sol", "/"],
  ["plus", "+"],
  ["period", "."]
]);
function decodeAttributeValue(value) {
  if (!value.includes("&")) return value;
  return value.replace(
    /&(?:#([0-9]+);?|#[xX]([0-9a-fA-F]+);?|([a-zA-Z][a-zA-Z0-9]*);)/g,
    (whole, dec, hex, name) => {
      if (dec !== void 0 || hex !== void 0) {
        const code = dec !== void 0 ? Number.parseInt(dec, 10) : Number.parseInt(hex, 16);
        if (!Number.isFinite(code)) return whole;
        if (code === 0 || code > 1114111 || code >= 55296 && code <= 57343) return "\uFFFD";
        return String.fromCodePoint(code);
      }
      return ATTRIBUTE_NAMED_REFERENCES.get(name ?? "") ?? whole;
    }
  );
}
function isForeignBreakoutTag(tagName, attrs) {
  if (tagName === "font") {
    return attrs.has("color") || attrs.has("face") || attrs.has("size");
  }
  return FOREIGN_BREAKOUT_TAGS.includes(tagName);
}
function annotationXmlEncodingIsHtml(value) {
  if (value === void 0) return false;
  return HTML_ANNOTATION_ENCODINGS.includes(asciiLower(decodeAttributeValue(value)));
}
function foreignChildNamespace(tagName, elementNs, attrs) {
  if (elementNs === "svg" && HTML_INTEGRATION_POINTS.includes(tagName)) return "html";
  if (elementNs === "math") {
    if (MATHML_TEXT_INTEGRATION_POINTS.includes(tagName)) return "html";
    if (tagName === "annotation-xml" && annotationXmlEncodingIsHtml(attrs.get("encoding"))) {
      return "html";
    }
  }
  return elementNs;
}
function skipForeignContent(html, lowerHtml, rootName, from) {
  const tagOpen = /<(\/?)([a-z][^\t\n\f\r \/>]*)/iy;
  const nsStack = [
    { name: rootName, childNs: rootName, mathmlText: false }
  ];
  let i = from;
  while (i < html.length && nsStack.length > 0) {
    if (html.charCodeAt(i) !== 60) {
      i += 1;
      continue;
    }
    const currentNs = nsStack[nsStack.length - 1]?.childNs ?? rootName;
    if (html.startsWith("<!--", i)) {
      const end = endOfComment(html, i);
      if (end < 0) return -1;
      i = end;
      continue;
    }
    if (html.startsWith("</", i) && !/[a-z]/i.test(html.charAt(i + 2))) {
      const end = html.indexOf(">", i + 2);
      if (end < 0) return -1;
      i = end + 1;
      continue;
    }
    if (currentNs !== "html" && lowerHtml.startsWith("<![cdata[", i)) {
      const end = html.indexOf("]]>", i + 9);
      if (end < 0) return -1;
      i = end + 3;
      continue;
    }
    if (html.startsWith("<!", i) || html.startsWith("<?", i)) {
      const end = html.indexOf(">", i + 2);
      if (end < 0) return -1;
      i = end + 1;
      continue;
    }
    tagOpen.lastIndex = i;
    const open = tagOpen.exec(html);
    if (!open) {
      i += 1;
      continue;
    }
    const tag = scanTag(html, i + open[0].length);
    const tagEnd = tag.end;
    if (tagEnd < 0) return -1;
    const tagName = (open[2] ?? "").toLowerCase();
    if (open[1]) {
      let matched = false;
      for (let frame = nsStack.length - 1; frame >= 0; frame -= 1) {
        if (nsStack[frame]?.name === tagName) {
          nsStack.length = frame;
          matched = true;
          break;
        }
      }
      if (!matched && REPROCESSED_END_TAGS.includes(tagName)) return -1;
      i = tagEnd + 1;
      if (nsStack.length === 0) return i;
      continue;
    }
    if (currentNs !== "html" && isForeignBreakoutTag(tagName, tag.attrs)) {
      while (nsStack.length > 0 && nsStack[nsStack.length - 1].childNs !== "html") {
        nsStack.pop();
      }
      if (nsStack.length === 0) return i;
      continue;
    }
    const selfClosing = tag.selfClosing && (currentNs !== "html" || PREVIEW_VOID_ELEMENTS.includes(tagName));
    if (!selfClosing && currentNs === "html" && HTML_RAW_TEXT_ELEMENTS.includes(tagName)) {
      const contentEnd = findRawTextClose(lowerHtml, tagName, tagEnd + 1);
      if (contentEnd < 0) return -1;
      i = contentEnd;
      continue;
    }
    if (!selfClosing && !PREVIEW_VOID_ELEMENTS.includes(tagName)) {
      const parent = nsStack[nsStack.length - 1];
      const underMathmlText = parent?.mathmlText ?? false;
      const elementNs = currentNs === "html" ? underMathmlText && MATHML_TEXT_INTEGRATION_EXCEPTIONS.includes(tagName) ? "math" : tagName === "svg" ? "svg" : tagName === "math" ? "math" : "html" : currentNs === "math" && tagName === "svg" && parent?.name === "annotation-xml" ? "svg" : currentNs;
      nsStack.push({
        name: tagName,
        childNs: foreignChildNamespace(tagName, elementNs, tag.attrs),
        mathmlText: elementNs === "math" && MATHML_TEXT_INTEGRATION_POINTS.includes(tagName)
      });
    }
    i = tagEnd + 1;
  }
  return -1;
}
function findRealTagOffset(html, pattern) {
  const anchored = new RegExp(pattern.source, `${pattern.flags.replace(/[gy]/g, "")}y`);
  const tagOpen = /<(\/?)([a-z][^\t\n\f\r \/>]*)/iy;
  const lower = asciiLower(html);
  const selectMode = newSelectModeState();
  let i = 0;
  while (i < html.length) {
    if (html.charCodeAt(i) !== 60) {
      i += 1;
      continue;
    }
    if (html.startsWith("<!--", i)) {
      const end = endOfComment(html, i);
      if (end < 0) return -1;
      i = end;
      continue;
    }
    if (html.startsWith("</", i) && !/[a-z]/i.test(html.charAt(i + 2))) {
      const end = html.indexOf(">", i + 2);
      if (end < 0) return -1;
      i = end + 1;
      continue;
    }
    if (html.startsWith("<!", i) || html.startsWith("<?", i)) {
      const end = html.indexOf(">", i + 2);
      if (end < 0) return -1;
      i = end + 1;
      continue;
    }
    anchored.lastIndex = i;
    if (anchored.test(html)) return i;
    tagOpen.lastIndex = i;
    const open = tagOpen.exec(html);
    if (!open) {
      i += 1;
      continue;
    }
    const tag = scanTag(html, i + open[0].length);
    const tagEnd = tag.end;
    if (tagEnd < 0) return -1;
    const tagName = (open[2] ?? "").toLowerCase();
    if (!observeSelectMode(selectMode, tagName, !!open[1], tag.selfClosing)) return -1;
    if (!open[1] && HTML_RAW_TEXT_ELEMENTS.includes(tagName)) {
      const contentEnd = findRawTextClose(lower, tagName, tagEnd + 1);
      if (contentEnd < 0) return -1;
      i = contentEnd;
      continue;
    }
    if (!open[1] && !selectMode.inSelect && (tagName === "svg" || tagName === "math") && !tag.selfClosing) {
      const contentEnd = skipForeignContent(html, lower, tagName, tagEnd + 1);
      if (contentEnd < 0) return -1;
      i = contentEnd;
      continue;
    }
    if (!open[1] && tagName === "template") {
      const contentEnd = skipTemplateContent(html, lower, tagEnd + 1);
      if (contentEnd < 0) return -1;
      i = contentEnd;
      continue;
    }
    i = tagEnd + 1;
  }
  return -1;
}
var HTML_TAG_PATTERNS = {
  htmlOpen: /<html(?=[\t\n\f\r />])/i,
  headOpen: /<head(?=[\t\n\f\r />])/i,
  headClose: /<\/head(?=[\t\n\f\r >])/i,
  bodyOpen: /<body(?=[\t\n\f\r />])/i,
  bodyClose: /<\/body(?=[\t\n\f\r >])/i,
  baseOpen: /<base(?=[\t\n\f\r />])/i,
  titleOpen: /<title(?=[\t\n\f\r >])/i
};

// src/runtime/deck-protocol.ts
var DECK_PROTOCOL_VERSION = 1;
var DECK_NAVIGATE_MESSAGE_TYPE = "od:slide";
var DECK_STATE_MESSAGE_TYPE = "od:slide-state";
var DECK_READY_MESSAGE_TYPE = "od:deck-ready";
var DECK_PROTOCOL_V1_CAPABILITIES = [
  "absolute-navigation",
  "state-events"
];
var DECK_PROTOCOL_V1_INLINE_RUNTIME = `      var OD_DECK_PROTOCOL_VERSION = ${DECK_PROTOCOL_VERSION};
      function postDeckState() {
        try {
          window.parent.postMessage({
            type: '${DECK_STATE_MESSAGE_TYPE}',
            protocolVersion: OD_DECK_PROTOCOL_VERSION,
            active: idx,
            count: slides.length
          }, '*');
        } catch (_) {}
      }
      function announceDeckProtocol() {
        try {
          window.parent.postMessage({
            type: '${DECK_READY_MESSAGE_TYPE}',
            protocolVersion: OD_DECK_PROTOCOL_VERSION,
            capabilities: ${JSON.stringify(DECK_PROTOCOL_V1_CAPABILITIES)}
          }, '*');
        } catch (_) {}
      }
      window.addEventListener('message', function (event) {
        var data = event && event.data;
        if (!data || data.type !== '${DECK_NAVIGATE_MESSAGE_TYPE}') return;
        if (data.protocolVersion != null && data.protocolVersion !== OD_DECK_PROTOCOL_VERSION) return;
        var target = idx;
        if (data.action === 'go') {
          if (typeof data.index !== 'number' || !isFinite(data.index)) return;
          target = Math.floor(data.index);
        } else if (data.action === 'next') target = idx + 1;
        else if (data.action === 'prev') target = idx - 1;
        else if (data.action === 'first') target = 0;
        else if (data.action === 'last') target = slides.length - 1;
        else return;
        go(target);
      });`;

// src/runtime/deck-stage-fallback.ts
var DECK_STAGE_OPEN_TAG_RE = /<deck-stage\b/i;
var DECK_STAGE_FALLBACK_MARKER = "data-od-deck-stage-fallback";
var DECK_SLIDE_MARKERS = [
  ".slide",
  "[data-screen-label]",
  ".deck-slide",
  ".ppt-slide",
  ".slide-frame"
];
var DECK_EXPLICIT_SLIDE_MARKERS = [
  ".slide",
  ".deck-slide",
  ".ppt-slide",
  ".slide-frame"
];
var DECK_SLIDE_CONTAINERS = [
  "deck-stage",
  ".deck",
  ".deck-stage",
  ".deck-shell",
  "#deck"
];
var DECK_SLIDE_SELECTOR = DECK_SLIDE_MARKERS.join(", ");
var DECK_EXPLICIT_SLIDE_SELECTOR = DECK_EXPLICIT_SLIDE_MARKERS.join(", ");
var DECK_SCREEN_SLIDE_SELECTOR = "[data-screen-label]";
var DECK_LEGACY_SCREEN_SLIDE_SELECTOR = "section[data-screen-label]";
var DECK_LEGACY_SCREEN_LABEL_RE_SOURCE = "^\\s*(\\d{1,3})(?:\\s|[.)\\u00b7:_-]|$)";
function legacyDeckScreenNumber(label) {
  if (!label) return null;
  const match = new RegExp(DECK_LEGACY_SCREEN_LABEL_RE_SOURCE, "i").exec(label);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isFinite(number) && number > 0 ? number : null;
}
var DECK_STRUCTURED_SLIDE_SELECTOR = DECK_SLIDE_CONTAINERS.flatMap((container) => DECK_SLIDE_MARKERS.map((marker) => `${container} > ${marker}`)).join(", ");
var DECK_STAGE_FALLBACK_SCRIPT = `<script data-od-deck-stage-fallback>(function(){
  if (window.__odDeckStageFallbackInstalled) return;
  window.__odDeckStageFallbackInstalled = true;
  if (!window.customElements || window.customElements.get('deck-stage')) return;

  var ACTIVE_ATTR = 'data-od-deck-active';
  var SLIDE_SELECTOR = ${JSON.stringify(DECK_SLIDE_SELECTOR)};

  function numeric(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  function isEditableTarget(target) {
    while (target && target !== document.body && target !== document.documentElement) {
      var tag = String(target.tagName || '').toUpperCase();
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        tag === 'BUTTON' ||
        tag === 'A' ||
        target.isContentEditable
      ) {
        return true;
      }
      target = target.parentElement;
    }
    return false;
  }

  function postSlideState(active, count) {
    try {
      window.parent.postMessage({
        type: ${JSON.stringify(DECK_STATE_MESSAGE_TYPE)},
        protocolVersion: ${DECK_PROTOCOL_VERSION},
        active: active,
        count: count
      }, '*');
    } catch (_) {}
  }

  function postDeckReady() {
    try {
      window.parent.postMessage({
        type: ${JSON.stringify(DECK_READY_MESSAGE_TYPE)},
        protocolVersion: ${DECK_PROTOCOL_VERSION},
        capabilities: ${JSON.stringify(DECK_PROTOCOL_V1_CAPABILITIES)}
      }, '*');
    } catch (_) {}
  }

  class OdDeckStageFallback extends HTMLElement {
    constructor() {
      super();
      this._index = 0;
      this._slides = [];
      this._onMessage = this._onMessage.bind(this);
      this._onKeydown = this._onKeydown.bind(this);
      this._onResize = this.fit.bind(this);
      this._onSlotChange = this._refresh.bind(this);
      var root = this.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<style>' +
        ':host{position:fixed;inset:0;display:block;overflow:hidden;background:#0a0a0a;}' +
        '.stage{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;}' +
        '.canvas{position:relative;flex:none;width:var(--od-deck-stage-width,1920px);height:var(--od-deck-stage-height,1080px);transform-origin:center center;}' +
        ':host([noscale]) .canvas{transform:none!important;}' +
        '::slotted(*){visibility:hidden!important;pointer-events:none!important;}' +
        '::slotted([' + ACTIVE_ATTR + ']){visibility:visible!important;pointer-events:auto!important;}' +
        '</style><div class="stage"><div class="canvas"><slot></slot></div></div>';
      this._slot = root.querySelector('slot');
      this._canvas = root.querySelector('.canvas');
    }

    connectedCallback() {
      this._syncSize();
      postDeckReady();
      this._refresh();
      window.addEventListener('message', this._onMessage);
      window.addEventListener('resize', this._onResize);
      document.addEventListener('keydown', this._onKeydown, true);
      if (this._slot) this._slot.addEventListener('slotchange', this._onSlotChange);
      this.fit();
      setTimeout(this._onResize, 50);
      setTimeout(this._onResize, 250);
    }

    disconnectedCallback() {
      window.removeEventListener('message', this._onMessage);
      window.removeEventListener('resize', this._onResize);
      document.removeEventListener('keydown', this._onKeydown, true);
      if (this._slot) this._slot.removeEventListener('slotchange', this._onSlotChange);
    }

    attributeChangedCallback() {
      this._syncSize();
      this.fit();
    }

    static get observedAttributes() {
      return ['width', 'height', 'noscale'];
    }

    get designWidth() {
      return numeric(this.getAttribute('width'), 1920);
    }

    get designHeight() {
      return numeric(this.getAttribute('height'), 1080);
    }

    get index() {
      return this._index;
    }

    get length() {
      return this._slides.length;
    }

    _syncSize() {
      this.style.setProperty('--od-deck-stage-width', this.designWidth + 'px');
      this.style.setProperty('--od-deck-stage-height', this.designHeight + 'px');
    }

    _collectSlides() {
      var direct = [];
      var nested = Array.prototype.slice.call(this.querySelectorAll(SLIDE_SELECTOR));
      for (var i = 0; i < nested.length; i++) {
        if (nested[i].parentElement === this) direct.push(nested[i]);
      }
      this._slides = direct.length ? direct : nested;
      return this._slides;
    }

    _initialIndex(slides) {
      for (var i = 0; i < slides.length; i++) {
        var cl = slides[i].classList;
        if (cl && (cl.contains('active') || cl.contains('is-active') || cl.contains('current'))) return i;
        if (slides[i].hasAttribute(ACTIVE_ATTR)) return i;
      }
      return 0;
    }

    _refresh() {
      var slides = this._collectSlides();
      this._index = Math.max(0, Math.min(slides.length - 1, this._initialIndex(slides)));
      this._apply();
      this.fit();
    }

    _apply() {
      var slides = this._collectSlides();
      if (!slides.length) {
        postSlideState(0, 0);
        return;
      }
      this._index = Math.max(0, Math.min(slides.length - 1, this._index));
      for (var i = 0; i < slides.length; i++) {
        var on = i === this._index;
        var slide = slides[i];
        slide.toggleAttribute(ACTIVE_ATTR, on);
        slide.toggleAttribute('hidden', false);
        slide.setAttribute('aria-hidden', on ? 'false' : 'true');
        if (slide.classList) {
          slide.classList.toggle('active', on);
          slide.classList.toggle('is-active', on);
          slide.classList.toggle('current', on);
          slide.classList.toggle('visible', on);
        }
      }
      postSlideState(this._index, slides.length);
      try {
        this.dispatchEvent(new CustomEvent('slidechange', {
          detail: { active: this._index, count: slides.length },
          bubbles: true,
        }));
      } catch (_) {}
    }

    fit() {
      if (!this._canvas) return;
      this._syncSize();
      if (this.hasAttribute('noscale')) {
        this._canvas.style.transform = '';
        return;
      }
      var width = this.designWidth;
      var height = this.designHeight;
      var rect = this.getBoundingClientRect();
      var scale = Math.min(rect.width / width, rect.height / height);
      if (!Number.isFinite(scale) || scale <= 0) return;
      this._canvas.style.transform = 'scale(' + scale + ')';
    }

    go(action, index) {
      var slides = this._collectSlides();
      if (!slides.length) return;
      if (action === 'go' && typeof index === 'number') {
        this._index = index;
      } else if (action === 'next') {
        this._index += 1;
      } else if (action === 'prev') {
        this._index -= 1;
      } else if (action === 'first') {
        this._index = 0;
      } else if (action === 'last') {
        this._index = slides.length - 1;
      }
      this._apply();
    }

    goTo(index) {
      this.go('go', index);
    }

    next() {
      this.go('next');
    }

    prev() {
      this.go('prev');
    }

    reset() {
      this.go('first');
    }

    _onMessage(ev) {
      var data = ev && ev.data;
      if (!data || data.type !== 'od:slide') return;
      if (data.protocolVersion != null && data.protocolVersion !== ${DECK_PROTOCOL_VERSION}) return;
      this.go(data.action, data.index);
    }

    _onKeydown(ev) {
      if (!ev || isEditableTarget(ev.target)) return;
      var key = ev.key;
      if (key === 'Escape') {
        try { window.parent.postMessage({ type: 'od:present-escape' }, '*'); } catch (_) {}
        return;
      }
      if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.shiftKey) return;
      var action = '';
      if (key === 'ArrowRight' || key === 'PageDown' || key === ' ') action = 'next';
      else if (key === 'ArrowLeft' || key === 'PageUp') action = 'prev';
      else if (key === 'Home') action = 'first';
      else if (key === 'End') action = 'last';
      else if (String(key).toLowerCase() === 'r') action = 'first';
      if (!action) return;
      ev.preventDefault();
      ev.stopPropagation();
      this.go(action);
    }
  }

  try {
    window.customElements.define('deck-stage', OdDeckStageFallback);
  } catch (_) {}
})();</script>`;
function htmlUsesDeckStageElement(html) {
  return DECK_STAGE_OPEN_TAG_RE.test(html);
}
function injectDeckStageFallback(html) {
  if (!htmlUsesDeckStageElement(html)) return html;
  if (html.includes(DECK_STAGE_FALLBACK_MARKER)) return html;
  return injectBeforeBodyEnd(html, DECK_STAGE_FALLBACK_SCRIPT);
}
function injectBeforeBodyEnd(html, injection) {
  const at = findRealTagOffset(html, HTML_TAG_PATTERNS.bodyClose);
  if (at < 0) return html + injection;
  return html.slice(0, at) + injection + html.slice(at);
}
export {
  DECK_EXPLICIT_SLIDE_SELECTOR,
  DECK_LEGACY_SCREEN_LABEL_RE_SOURCE,
  DECK_LEGACY_SCREEN_SLIDE_SELECTOR,
  DECK_SCREEN_SLIDE_SELECTOR,
  DECK_SLIDE_SELECTOR,
  DECK_STRUCTURED_SLIDE_SELECTOR,
  htmlUsesDeckStageElement,
  injectDeckStageFallback,
  legacyDeckScreenNumber
};
