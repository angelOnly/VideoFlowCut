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
function isBogusCommentStart(html, i) {
  if (html.startsWith("<?", i)) return true;
  if (html.startsWith("</", i)) return !/[a-z]/i.test(html.charAt(i + 2));
  if (!html.startsWith("<!", i)) return false;
  if (html.startsWith("<!--", i)) return false;
  return !/^<!doctype/i.test(html.slice(i, i + 9));
}
function prependAfterDoctype(html, payload) {
  const bom = html.charCodeAt(0) === 65279 ? 1 : 0;
  const atTop = () => html.slice(0, bom) + payload + html.slice(bom);
  let i = bom;
  for (; ; ) {
    while (i < html.length && isHtmlWhitespace(html.charCodeAt(i))) i += 1;
    if (html.startsWith("<!--", i)) {
      const end = endOfComment(html, i);
      if (end < 0) return atTop();
      i = end;
      continue;
    }
    if (isBogusCommentStart(html, i)) {
      const end = html.indexOf(">", i + 2);
      if (end < 0) return atTop();
      i = end + 1;
      continue;
    }
    break;
  }
  if (!/^<!doctype/i.test(html.slice(i))) return atTop();
  const doctypeEnd = html.indexOf(">", i);
  if (doctypeEnd < 0) return atTop();
  return html.slice(0, doctypeEnd + 1) + payload + html.slice(doctypeEnd + 1);
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

// src/runtime/motion-source-player.ts
var MOTION_PREVIEW_OUTPUT_HEADER = "x-od-motion-output";
var MOTION_PLAYER_MARKER = "data-od-motion-source-player";
var MOTION_PREVIEW_REQUEST = "od:motion-preview-request";
var MOTION_PREVIEW_ACTIVITY = "od:motion-preview-activity";
var MOTION_PREVIEW_PROBE = "od:motion-preview-probe";
var MOTION_TIMELINE_CHECK_SCRIPT = `
window.__odValidateMotionTimeline = function (root, tl) {
  var mode = document.querySelector('meta[name="od-motion-output"]');
  if (!mode || mode.content !== 'video') return null;
  var seconds = Number(root && root.getAttribute('data-duration'));
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Motion video requires a positive data-duration.';
  if (!tl || typeof tl.duration !== 'function' || typeof tl.timeScale !== 'function') return 'Motion video requires a registered GSAP timeline.';
  if (!Number.isFinite(tl.timeScale()) || Math.abs(tl.timeScale() - 1) > 0.000001) return 'Motion video timeScale must be 1. Do not use duration(seconds) to stretch the timeline; author tracks in real seconds.';
  if (!Number.isFinite(tl.duration()) || Math.abs(tl.duration() - seconds) > 0.001) return 'Motion video timeline duration must equal data-duration. Add a clock tween at time 0 for the full duration; do not change playback speed.';
  if ((typeof tl.repeat === 'function' && tl.repeat() !== 0) || (typeof tl.delay === 'function' && tl.delay() !== 0)) return 'Motion video master timeline must have no repeat or delay.';
  return null;
};`;
var MOTION_AUDIO_SYNC_RUNTIME = `// A render stall is not a request to seek the soundtrack. Only correct drift
// after fresh, stable samples; explicit transport actions bypass that filter.
function createMotionAudioSync(audio) {
  var sampledAt = null, driftSince = null, previousDrift = 0, correctedAt = -Infinity, align = false;
  return function (target, moving, force) {
    var now = performance.now(), gap = sampledAt === null ? Infinity : now - sampledAt;
    sampledAt = now;
    if (force) { align = true; driftSince = null; }
    if (align) {
      if (audio.readyState > 0) {
        if (Math.abs(audio.currentTime - target) > .01) audio.currentTime = target;
        align = false; correctedAt = now;
      }
      return;
    }
    var drift = target - audio.currentTime;
    if (!moving || audio.paused || audio.seeking || audio.readyState < 3 || gap > 200 || Math.abs(drift) <= .3 || now - correctedAt < 1500) {
      driftSince = null; previousDrift = drift; return;
    }
    if (driftSince === null || drift * previousDrift <= 0 || Math.abs(drift - previousDrift) > .1) driftSince = now;
    previousDrift = drift;
    if (now - driftSince >= 750) {
      audio.currentTime = target; correctedAt = now; driftSince = null;
    }
  };
}`;
var PLAYER = `<script data-od-motion-source-player="8">
${MOTION_TIMELINE_CHECK_SCRIPT}
(function () {
${MOTION_AUDIO_SYNC_RUNTIME}
  function boot() {
    if (window.__odMotionRender || window.__odMotionSourcePlayer) return;
    var root = document.querySelector('[data-composition-id][data-duration][data-width][data-height]');
    var mode = document.querySelector('meta[name="od-motion-output"]');
    if (!root || (mode && mode.content === 'interactive')) return;
    window.__odMotionSourcePlayer = true;
    var width = Number(root.dataset.width), height = Number(root.dataset.height);
    if (!(width > 0 && height > 0)) return;
    var hint = document.createElement('output');
    hint.setAttribute('data-od-motion-status', ''); hint.setAttribute('role', 'status');
    hint.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:2147483647;padding:6px 10px;border-radius:6px;background:#17191d;color:white;font:13px system-ui;display:none';
    document.body.appendChild(hint);
    function notice(text) { hint.textContent = text; hint.style.display = text ? 'block' : 'none'; }
    var hosted = window.__odMotionPreview === true || new URL(location.href).searchParams.get('odMotionPreview') === '1';
    var thumbnail = window.__odMotionThumbnail === true || new URL(location.href).searchParams.get('odMotionThumbnail') === '1';
    var instance = Date.now().toString(36) + Math.random().toString(36).slice(2);
    var hostMuted = false;
    var active = !hosted, playing = false, wantsPlay = true, pageActive = true, updateTimer = null;
    var applyPlayback = function () {};
    function requestActivity() { window.parent.postMessage({type:'${MOTION_PREVIEW_REQUEST}', id:instance, width:width, height:height}, '*'); }
    function onActivity(event) {
      var data = event.data;
      if (!hosted || event.source !== window.parent || !data) return;
      if (data.type === '${MOTION_PREVIEW_PROBE}') { requestActivity(); return; }
      if (data.type !== '${MOTION_PREVIEW_ACTIVITY}' || typeof data.active !== 'boolean' || (data.active && data.id !== instance)) return;
      hostMuted = data.muted === true;
      active = data.active; applyPlayback();
    }
    window.addEventListener('message', onActivity);
    var tracks = Array.prototype.map.call(document.querySelectorAll('audio[src]'), function (audio) {
      audio.pause(); audio.autoplay = false;
      return { audio: audio, start: Number(audio.dataset.start || 0), duration: Number(audio.dataset.duration), volume: Number(audio.dataset.volume || 1), pending: false, blocked: false, sync: createMotionAudioSync(audio) };
    });
    var muted = thumbnail;
    function syncAudio(time, shouldPlay, force) {
      tracks.forEach(function (track) {
        var audio = track.audio, local = time - track.start;
        if (thumbnail || hostMuted) { audio.muted = true; audio.pause(); return; }
        var trackActive = local >= 0 && local < track.duration;
        audio.volume = Math.max(0, Math.min(1, track.volume)); audio.muted = muted;
        if (!trackActive || !shouldPlay) audio.pause();
        var target = Math.max(0, Math.min(track.duration, local));
        track.sync(target, trackActive && shouldPlay, force || (trackActive && shouldPlay && audio.paused && !track.pending && !track.blocked));
        if (trackActive && shouldPlay && audio.paused && !track.pending && !track.blocked) {
          track.pending = true;
          var promise = audio.play();
          if (promise) promise.catch(function (error) {
            if (error && error.name === 'AbortError') return;
            track.blocked = true;
            notice(error && error.name === 'NotAllowedError' ? '\u70B9\u51FB\u753B\u9762\u5F00\u542F\u58F0\u97F3' : '\u97F3\u9891\u65E0\u6CD5\u64AD\u653E\uFF0C\u8BF7\u68C0\u67E5\u7D20\u6750');
          }).finally(function () {
            track.pending = false;
            if (hostMuted || !active || !pageActive || !playing || !wantsPlay) audio.pause();
          });
          else track.pending = false;
        }
      });
    }
    var fitStyle = document.createElement('style');
    fitStyle.textContent = 'html,body{width:100% !important;height:100% !important;margin:0 !important;overflow:hidden !important}';
    document.head.appendChild(fitStyle);
    var stage = document.createElement('div');
    root.parentNode.insertBefore(stage, root); stage.appendChild(root);
    function fit() {
      var scale = Math.min(innerWidth / width, Math.max(1, innerHeight) / height);
      stage.style.cssText = 'position:fixed;width:' + width + 'px;height:' + height + 'px;left:' + ((innerWidth-width*scale)/2) + 'px;top:' + ((innerHeight-height*scale)/2) + 'px;transform-origin:0 0;transform:scale(' + scale + ')';
    }
    fit(); window.addEventListener('resize', fit);
    var started = Date.now();
    function connect() {
      var tl = window.__timelines && window.__timelines[root.dataset.compositionId];
      if (!tl || typeof tl.seek !== 'function' || typeof tl.play !== 'function' || !(tl.duration() > 0)) {
        if (Date.now()-started < 15000) { setTimeout(connect, 100); return; }
        notice('\u52A8\u6548\u672A\u5C31\u7EEA\uFF0C\u8BF7\u68C0\u67E5\u65F6\u95F4\u8F74\u6216\u4F9D\u8D56\u6587\u4EF6'); return;
      }
      var timingError = window.__odValidateMotionTimeline(root, tl);
      if (timingError) { tl.pause(); notice(timingError); return; }
      var duration = tl.duration(), applied = false;
      applyPlayback = function () {
        var nextPlaying = active && pageActive && wantsPlay;
        if (applied && nextPlaying === playing) { syncAudio(tl.time(), playing, false); return; }
        applied = true;
        clearTimeout(updateTimer); updateTimer = null;
        playing = nextPlaying;
        if (playing) {
          if (tl.time() >= duration) tl.seek(0, false);
          tl.play(); syncAudio(tl.time(), true, true); update();
        } else { tl.pause(); syncAudio(tl.time(), false, false); }
      };
      function play() { wantsPlay = true; applyPlayback(); }
      function pause() { wantsPlay = false; applyPlayback(); }
      function seek(time) { pause(); tl.seek(Math.max(0, Math.min(duration, Number(time))), false); syncAudio(tl.time(), false, true); }
      function replay() { seek(0); play(); }
      window.__odMotionPlayer = {
        play: play, pause: pause, seek: seek, replay: replay,
        setMuted: function (value) { muted = thumbnail || !!value; syncAudio(tl.time(), playing, false); },
        state: function () { return { playing: playing, active: active, time: tl.time(), duration: duration, muted: muted || hostMuted,
          audio: tracks.map(function (track) { return { paused: track.audio.paused, time: track.audio.currentTime, muted: track.audio.muted, volume: track.audio.volume, blocked: track.blocked }; }) }; }
      };
      root.addEventListener('click', function () {
        var blocked = tracks.some(function (track) { return track.blocked; });
        if (blocked) { tracks.forEach(function (track) { track.blocked = false; }); notice(''); if (playing) syncAudio(tl.time(), true, true); else play(); }
        else if (playing) pause(); else play();
      });
      tl.seek(0, false); applyPlayback();
      function update() {
        if (!stage.isConnected) { active = false; applyPlayback(); return; }
        if (!active || !pageActive || !playing) return;
        if (playing && tl.time() >= duration) { tl.seek(0, false); tl.play(); syncAudio(0, true, true); }
        syncAudio(tl.time(), playing && !tl.paused(), false);
        updateTimer = setTimeout(update, 33);
      }
    }
    window.addEventListener('pagehide', function () { pageActive = false; applyPlayback(); tracks.forEach(function (track) { track.audio.pause(); }); });
    window.addEventListener('pageshow', function () {
      pageActive = true;
      if (hosted) { active = false; requestActivity(); }
      applyPlayback();
    });
    if (hosted) requestActivity();
    connect();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
</script>`;
function isMotionVideoComposition(html) {
  const metaOffset = findRealTagOffset(html, /<meta\b[^>]*\bname\s*=\s*["']od-motion-output["']/i);
  const meta = metaOffset >= 0 ? /^<meta\b[^>]*>/i.exec(html.slice(metaOffset))?.[0] ?? "" : "";
  return /\bcontent\s*=\s*(?:["']video["']|video(?=\s|\/?>))/i.test(meta);
}
function injectMotionSourcePlayer(html) {
  if (!isMotionVideoComposition(html)) return html;
  if (findRealTagOffset(html, /<[^/!][^>]*\bdata-composition-id\s*=/i) < 0) return html;
  const existing = findRealTagOffset(html, /<script\b[^>]*\bdata-od-motion-source-player\b/i);
  if (existing >= 0) {
    const script = /^<script\b[^>]*>[\s\S]*?<\/script\s*>/i.exec(html.slice(existing));
    if (!script || /data-od-motion-source-player="8"/.test(script[0])) return html;
    return html.slice(0, existing) + PLAYER + html.slice(existing + script[0].length);
  }
  const end = findRealTagOffset(html, HTML_TAG_PATTERNS.bodyClose);
  return end < 0 ? html + PLAYER : html.slice(0, end) + PLAYER + html.slice(end);
}
function markMotionFrameRender(html) {
  return prependAfterDoctype(html, "<script>window.__odMotionRender=true;</script>");
}
function markMotionHostedPreview(html) {
  return isMotionVideoComposition(html) ? prependAfterDoctype(html, "<script>window.__odMotionPreview=true;</script>") : html;
}
export {
  MOTION_AUDIO_SYNC_RUNTIME,
  MOTION_PLAYER_MARKER,
  MOTION_PREVIEW_ACTIVITY,
  MOTION_PREVIEW_OUTPUT_HEADER,
  MOTION_PREVIEW_PROBE,
  MOTION_PREVIEW_REQUEST,
  MOTION_TIMELINE_CHECK_SCRIPT,
  injectMotionSourcePlayer,
  isMotionVideoComposition,
  markMotionFrameRender,
  markMotionHostedPreview
};
