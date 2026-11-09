// src/design-systems/components-manifest.ts
var COMPONENTS_MANIFEST_SCHEMA_VERSION = 1;
var COMPONENT_GROUPS = [
  {
    id: "buttons",
    label: "Buttons and calls to action",
    selectorMatchers: [/\bbutton\b/i, /\.btn(?:\b|[-_:])/i, /\[type=["']?(?:button|submit|reset)/i],
    classMatchers: [/^btn(?:$|-)/i, /button/i, /cta/i],
    elementMatchers: [/^button$/i]
  },
  {
    id: "inputs",
    label: "Form fields and controls",
    selectorMatchers: [/\binput\b/i, /\btextarea\b/i, /\bselect\b/i, /\.field(?:\b|[-_:])/i, /\blabel\b/i],
    classMatchers: [/^field(?:$|-)/i, /input/i, /control/i, /form/i],
    elementMatchers: [/^(input|textarea|select|label|form)$/i]
  },
  {
    id: "cards",
    label: "Cards and panels",
    selectorMatchers: [/\.card(?:\b|[-_:])/i, /\.panel(?:\b|[-_:])/i, /\.tile(?:\b|[-_:])/i],
    classMatchers: [/^card(?:$|-)/i, /^panel(?:$|-)/i, /^tile(?:$|-)/i],
    elementMatchers: []
  },
  {
    id: "badges",
    label: "Badges, chips, and status labels",
    selectorMatchers: [/\.badge(?:\b|[-_:])/i, /\.chip(?:\b|[-_:])/i, /\.tag(?:\b|[-_:])/i, /\.pill(?:\b|[-_:])/i],
    classMatchers: [/^badge(?:$|-)/i, /^chip(?:$|-)/i, /^tag(?:$|-)/i, /^pill(?:$|-)/i, /status/i],
    elementMatchers: []
  },
  {
    id: "links",
    label: "Links and inline actions",
    selectorMatchers: [/\ba\b/i, /\.link(?:\b|[-_:])/i],
    classMatchers: [/^link(?:$|-)/i],
    elementMatchers: [/^a$/i]
  },
  {
    id: "keyboard",
    label: "Keyboard hints",
    selectorMatchers: [/\bkbd\b/i, /\.kbd(?:\b|[-_:])/i],
    classMatchers: [/^kbd(?:$|-)/i, /keyboard/i, /shortcut/i],
    elementMatchers: [/^kbd$/i]
  },
  {
    id: "icons",
    label: "Icon slots",
    selectorMatchers: [/\.icon(?:\b|[-_:])/i, /\[aria-hidden=["']true["']\]/i],
    classMatchers: [/^icon(?:$|-)/i],
    elementMatchers: [/^svg$/i]
  },
  {
    id: "typography",
    label: "Typography scale and text utilities",
    selectorMatchers: [/\bh[1-6]\b/i, /\.lead(?:\b|[-_:])/i, /\.eyebrow(?:\b|[-_:])/i, /\.body-(?:muted|sm|small)\b/i],
    classMatchers: [/^lead$/i, /^eyebrow$/i, /^body-(?:muted|sm|small)$/i, /caption/i],
    elementMatchers: [/^h[1-6]$/i, /^p$/i]
  },
  {
    id: "layout",
    label: "Layout primitives",
    selectorMatchers: [
      /\.container(?:\b|[-_:])/i,
      /\.stack-\d+\b/i,
      /\.row-(?:between|center|start|end)\b/i,
      /\bsection\b/i,
      /\bmain\b/i,
      /\bnav\b/i
    ],
    classMatchers: [/^container$/i, /^stack-\d+$/i, /^row-(?:between|center|start|end)$/i, /grid/i, /layout/i],
    elementMatchers: [/^(main|section|nav|header|footer)$/i]
  }
];
function extractComponentsManifest({
  brandId,
  fixtureHtml,
  tokensCss
}) {
  const styleBlocks = extractStyleBlocks(fixtureHtml);
  const css = styleBlocks.join("\n\n");
  const selectors = extractCssSelectors(css);
  const selectorTokenReferences = extractSelectorTokenReferences(css);
  const classes = extractHtmlClasses(fixtureHtml);
  const elements = extractHtmlElements(fixtureHtml);
  const declaredTokens = parseTokenNames(tokensCss ?? extractFirstRootBody(css) ?? "");
  const referencedTokens = extractTokenReferences(fixtureHtml);
  return {
    schemaVersion: COMPONENTS_MANIFEST_SCHEMA_VERSION,
    brandId,
    source: tokensCss === void 0 ? { componentsHtml: "components.html" } : { componentsHtml: "components.html", tokensCss: "tokens.css" },
    fixture: {
      ...optionalText("title", extractTitle(fixtureHtml)),
      ...optionalText("description", extractMetaDescription(fixtureHtml)),
      styleBlockCount: styleBlocks.length,
      selectorCount: selectors.length,
      classCount: classes.length,
      elementCount: elements.length
    },
    tokens: {
      declared: declaredTokens,
      referenced: referencedTokens,
      unusedDeclared: declaredTokens.filter((token) => !referencedTokens.includes(token)),
      undeclaredReferenced: declaredTokens.length === 0 ? [] : referencedTokens.filter((token) => !declaredTokens.includes(token))
    },
    selectors,
    classes,
    elements,
    groups: COMPONENT_GROUPS.map(
      (definition) => buildGroupManifest(definition, {
        selectors,
        selectorTokenReferences,
        classes,
        elements,
        referencedTokens
      })
    ),
    literals: countLiterals(stripRootBlocks(stripCssComments(css)))
  };
}
function summarizeComponentsManifestForPrompt(manifest) {
  const presentGroups = manifest.groups.filter((group) => group.present).map((group) => {
    const selectors = group.selectors.slice(0, 8).join(", ") || "none";
    const tokens = group.tokenReferences.slice(0, 10).join(", ") || "none";
    return `- ${group.label}: selectors ${selectors}; tokens ${tokens}`;
  });
  return [
    `components.manifest schema v${manifest.schemaVersion} for ${manifest.brandId}`,
    `Fixture: ${manifest.fixture.selectorCount} selectors, ${manifest.fixture.classCount} classes, ${manifest.tokens.declared.length} declared tokens, ${manifest.tokens.referenced.length} referenced tokens.`,
    "Available component groups:",
    ...presentGroups.length > 0 ? presentGroups : ["- none detected"]
  ].join("\n");
}
function buildGroupManifest(definition, inventory) {
  const selectors = inventory.selectors.filter(
    (selector) => definition.selectorMatchers.some((matcher) => matcher.test(selector))
  );
  const classes = inventory.classes.filter(
    (className) => definition.classMatchers.some((matcher) => matcher.test(className))
  );
  const elements = inventory.elements.filter(
    (element) => definition.elementMatchers.some((matcher) => matcher.test(element))
  );
  const tokenReferences = uniqueSorted(
    selectors.flatMap((selector) => inventory.selectorTokenReferences.get(selector) ?? [])
  );
  return {
    id: definition.id,
    label: definition.label,
    present: selectors.length > 0 || classes.length > 0 || elements.length > 0,
    selectors,
    classes,
    elements,
    tokenReferences: tokenReferences.filter((token) => inventory.referencedTokens.includes(token))
  };
}
function extractStyleBlocks(html) {
  const blocks = [];
  const stylePattern = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = stylePattern.exec(html)) !== null) {
    blocks.push((match[1] ?? "").trim());
  }
  return blocks;
}
function extractCssSelectors(css) {
  const selectors = /* @__PURE__ */ new Set();
  const commentlessCss = stripContainerAtRuleHeaders(stripCssComments(css));
  const selectorPattern = /(?:^|[{}])\s*([^@{}][^{}]*?)\s*\{/g;
  let match;
  while ((match = selectorPattern.exec(commentlessCss)) !== null) {
    const rawSelectorList = match[1]?.trim();
    if (rawSelectorList == null || rawSelectorList.length === 0) continue;
    if (rawSelectorList.includes(":root")) continue;
    if (/^(?:from|to|\d+(?:\.\d+)?%)$/i.test(rawSelectorList)) continue;
    for (const selector of splitSelectorList(rawSelectorList)) {
      const normalized = normalizeSelector(selector);
      if (normalized.length > 0 && !normalized.startsWith("@")) {
        selectors.add(normalized);
      }
    }
  }
  return [...selectors].sort((a, b) => a.localeCompare(b));
}
function extractSelectorTokenReferences(css) {
  const referencesBySelector = /* @__PURE__ */ new Map();
  const commentlessCss = stripContainerAtRuleHeaders(stripCssComments(css));
  const rulePattern = /(?:^|[{}])\s*([^@{}][^{}]*?)\s*\{([^{}]*)\}/g;
  let match;
  while ((match = rulePattern.exec(commentlessCss)) !== null) {
    const rawSelectorList = match[1]?.trim();
    const rawBody = match[2] ?? "";
    if (rawSelectorList == null || rawSelectorList.length === 0) continue;
    if (rawSelectorList.includes(":root")) continue;
    if (/^(?:from|to|\d+(?:\.\d+)?%)$/i.test(rawSelectorList)) continue;
    const tokenReferences = extractTokenReferences(rawBody);
    if (tokenReferences.length === 0) continue;
    for (const selector of splitSelectorList(rawSelectorList)) {
      const normalized = normalizeSelector(selector);
      if (normalized.length === 0 || normalized.startsWith("@")) continue;
      const selectorReferences = referencesBySelector.get(normalized) ?? /* @__PURE__ */ new Set();
      for (const token of tokenReferences) {
        selectorReferences.add(token);
      }
      referencesBySelector.set(normalized, selectorReferences);
    }
  }
  return new Map(
    [...referencesBySelector.entries()].map(([selector, references]) => [selector, [...references].sort((a, b) => a.localeCompare(b))]).sort(([left], [right]) => left.localeCompare(right))
  );
}
function splitSelectorList(selectorList) {
  const selectors = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < selectorList.length; index += 1) {
    const char = selectorList[index];
    if (char === "(" || char === "[") {
      depth += 1;
      continue;
    }
    if (char === ")" || char === "]") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (char === "," && depth === 0) {
      selectors.push(selectorList.slice(start, index));
      start = index + 1;
    }
  }
  selectors.push(selectorList.slice(start));
  return selectors;
}
function normalizeSelector(selector) {
  return selector.trim().replace(/\s+/g, " ");
}
function extractHtmlClasses(html) {
  const classes = /* @__PURE__ */ new Set();
  const classPattern = /\bclass\s*=\s*(["'])(.*?)\1/gis;
  let match;
  while ((match = classPattern.exec(html)) !== null) {
    const classValue = match[2] ?? "";
    for (const className of classValue.split(/\s+/)) {
      if (className.length > 0) classes.add(className);
    }
  }
  return [...classes].sort((a, b) => a.localeCompare(b));
}
function extractHtmlElements(html) {
  const elements = /* @__PURE__ */ new Set();
  const elementPattern = /<\s*([a-z][a-z0-9-]*)\b/gi;
  let match;
  while ((match = elementPattern.exec(html)) !== null) {
    const element = match[1]?.toLowerCase();
    if (element == null || element.startsWith("!")) continue;
    elements.add(element);
  }
  return [...elements].sort((a, b) => a.localeCompare(b));
}
function parseTokenNames(css) {
  const tokens = /* @__PURE__ */ new Set();
  const tokenPattern = /(--[a-zA-Z0-9_-]+)\s*:/g;
  let match;
  while ((match = tokenPattern.exec(stripCssComments(css))) !== null) {
    const token = match[1];
    if (token != null) tokens.add(token);
  }
  return [...tokens].sort((a, b) => a.localeCompare(b));
}
function extractTokenReferences(source) {
  const tokens = /* @__PURE__ */ new Set();
  const tokenPattern = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  let match;
  while ((match = tokenPattern.exec(source)) !== null) {
    const token = match[1];
    if (token != null) tokens.add(token);
  }
  return [...tokens].sort((a, b) => a.localeCompare(b));
}
function extractFirstRootBody(css) {
  return stripCssComments(css).match(/:root(?!\[)\s*\{([\s\S]*?)\}/)?.[1] ?? null;
}
function stripRootBlocks(css) {
  return css.replace(/:root(?:\[[^\]]+\])?\s*\{[\s\S]*?\}/g, "");
}
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}
function stripContainerAtRuleHeaders(css) {
  return css.replace(/@(media|supports|container|layer)\b[^{]*\{/gi, "{");
}
function countLiterals(css) {
  return {
    colorExpressions: countMatches(
      css,
      /(?:#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|color-mix\([^)]*\))/gi
    ),
    pixelValues: countMatches(css, /(?<![\w-])-?\d*\.?\d+px\b/g),
    hardcodedFontFamilies: countMatches(css, /\bfont-family\s*:\s*(?!var\()/gi)
  };
}
function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}
function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
function extractTitle(html) {
  const value = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim().replace(/\s+/g, " ");
  return value == null || value.length === 0 ? void 0 : decodeBasicEntities(value);
}
function extractMetaDescription(html) {
  const match = /<meta\b(?=[^>]*\bname\s*=\s*["']description["'])(?=[^>]*\bcontent\s*=\s*(["'])([\s\S]*?)\1)[^>]*>/i.exec(html);
  const value = match?.[2]?.trim().replace(/\s+/g, " ");
  return value == null || value.length === 0 ? void 0 : decodeBasicEntities(value);
}
function decodeBasicEntities(value) {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function optionalText(key, value) {
  return value === void 0 ? {} : { [key]: value };
}
export {
  COMPONENTS_MANIFEST_SCHEMA_VERSION,
  extractComponentsManifest,
  summarizeComponentsManifestForPrompt
};
