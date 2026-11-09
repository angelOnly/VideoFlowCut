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
function endOfTag(html, from) {
  return scanTag(html, from).end;
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
function findRealTagEnd(html, pattern) {
  const start = findRealTagOffset(html, pattern);
  if (start < 0) return -1;
  const end = endOfTag(html, start);
  return end < 0 ? -1 : end + 1;
}
function findRealElementRange(html, pattern, tagName) {
  const start = findRealTagOffset(html, pattern);
  if (start < 0) return null;
  const openEnd = endOfTag(html, start);
  if (openEnd < 0) return null;
  const contentEnd = findRawTextClose(asciiLower(html), tagName, openEnd + 1);
  if (contentEnd < 0) return null;
  const end = endOfTag(html, contentEnd);
  if (end < 0) return null;
  return { start, contentStart: openEnd + 1, contentEnd, end: end + 1 };
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
export {
  HTML_RAW_TEXT_ELEMENTS,
  HTML_TAG_PATTERNS,
  endOfTag,
  findRawTextClose,
  findRealElementRange,
  findRealTagEnd,
  findRealTagOffset,
  prependAfterDoctype
};
