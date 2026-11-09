// src/design-systems/token-schema.ts
var TOKEN_SCHEMA = [
  // ─── Surface ──────────────────────────────────────────────────────
  { name: "--bg", layer: "A1-identity", description: "Page background \u2014 defines the brand canvas." },
  { name: "--surface", layer: "A1-identity", description: "Card / lifted container background." },
  {
    name: "--surface-warm",
    layer: "B-slot",
    description: "Tertiary surface tier (kami warm-sand).",
    aliasTo: "var(--surface)"
  },
  // ─── Foreground ───────────────────────────────────────────────────
  { name: "--fg", layer: "A1-identity", description: "Primary text color." },
  {
    name: "--fg-2",
    layer: "B-slot",
    description: "Secondary text tier (kami dark-warm).",
    aliasTo: "var(--fg)"
  },
  { name: "--muted", layer: "A1-identity", description: "Subtext / captions." },
  {
    name: "--meta",
    layer: "B-slot",
    description: "Tertiary FG / metadata tier (kami stone).",
    aliasTo: "var(--muted)"
  },
  // ─── Border ───────────────────────────────────────────────────────
  { name: "--border", layer: "A1-identity", description: "Default border / card edge." },
  {
    name: "--border-soft",
    layer: "B-slot",
    description: "Inner row separator that should not visually compete.",
    aliasTo: "var(--border)"
  },
  // ─── Accent ───────────────────────────────────────────────────────
  { name: "--accent", layer: "A1-identity", description: "Brand accent. \u22642 visible uses per screen (lint enforced)." },
  {
    name: "--accent-on",
    layer: "A2",
    description: "FG when --accent is the bg.",
    fallback: "#ffffff"
  },
  {
    name: "--accent-hover",
    layer: "A2",
    description: "Hover state for elements using --accent as bg.",
    fallback: "color-mix(in oklab, var(--accent), black 8%)"
  },
  {
    name: "--accent-active",
    layer: "A2",
    description: "Active state for elements using --accent as bg.",
    fallback: "color-mix(in oklab, var(--accent), black 14%)"
  },
  // ─── Semantic ─────────────────────────────────────────────────────
  { name: "--success", layer: "A2", description: "Success state.", fallback: "#16a34a" },
  { name: "--warn", layer: "A2", description: "Warning state.", fallback: "#eab308" },
  { name: "--danger", layer: "A2", description: "Danger state.", fallback: "#dc2626" },
  // ─── Typography — fonts ───────────────────────────────────────────
  { name: "--font-display", layer: "A1-identity", description: "Display / heading font stack." },
  { name: "--font-body", layer: "A1-identity", description: "Body font stack." },
  {
    name: "--font-mono",
    layer: "A2",
    description: "Monospace font stack \u2014 used by kbd, code, tabular metrics.",
    fallback: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Monaco, Consolas, monospace'
  },
  // ─── Typography — type scale ──────────────────────────────────────
  { name: "--text-xs", layer: "A1-structure", description: "Type scale step \u2014 extra small (\u224811\u201312px)." },
  { name: "--text-sm", layer: "A1-structure", description: "Type scale step \u2014 small (\u224812\u201314px)." },
  { name: "--text-base", layer: "A1-structure", description: "Type scale step \u2014 body baseline." },
  { name: "--text-lg", layer: "A1-structure", description: "Type scale step \u2014 H3 / featured body." },
  { name: "--text-xl", layer: "A1-structure", description: "Type scale step \u2014 H2." },
  { name: "--text-2xl", layer: "A1-structure", description: "Type scale step \u2014 section title." },
  { name: "--text-3xl", layer: "A1-structure", description: "Type scale step \u2014 H1." },
  { name: "--text-4xl", layer: "A1-structure", description: "Type scale step \u2014 display / hero." },
  // ─── Typography — leading & tracking ──────────────────────────────
  { name: "--leading-body", layer: "A1-structure", description: "Line-height for reading body." },
  { name: "--leading-tight", layer: "A1-structure", description: "Line-height for headings." },
  { name: "--tracking-display", layer: "A1-structure", description: "Letter-spacing applied to display sizes." },
  // ─── Spacing — base scale ─────────────────────────────────────────
  { name: "--space-1", layer: "A2", description: "Base spacing \u2014 4px tier.", fallback: "4px" },
  { name: "--space-2", layer: "A2", description: "Base spacing \u2014 8px tier.", fallback: "8px" },
  { name: "--space-3", layer: "A2", description: "Base spacing \u2014 12px tier.", fallback: "12px" },
  { name: "--space-4", layer: "A2", description: "Base spacing \u2014 16px tier.", fallback: "16px" },
  { name: "--space-5", layer: "A2", description: "Base spacing \u2014 20px tier.", fallback: "20px" },
  { name: "--space-6", layer: "A2", description: "Base spacing \u2014 24px tier.", fallback: "24px" },
  { name: "--space-8", layer: "A2", description: "Base spacing \u2014 32px tier.", fallback: "32px" },
  { name: "--space-12", layer: "A2", description: "Base spacing \u2014 48px tier.", fallback: "48px" },
  // ─── Section rhythm ───────────────────────────────────────────────
  { name: "--section-y-desktop", layer: "A1-structure", description: "Vertical padding between sections \u2014 desktop." },
  { name: "--section-y-tablet", layer: "A1-structure", description: "Vertical padding between sections \u2014 tablet." },
  { name: "--section-y-phone", layer: "A1-structure", description: "Vertical padding between sections \u2014 phone." },
  // ─── Radius ───────────────────────────────────────────────────────
  { name: "--radius-sm", layer: "A2", description: "Small radius \u2014 buttons, inputs, chips.", fallback: "8px" },
  { name: "--radius-md", layer: "A2", description: "Medium radius \u2014 cards, modals.", fallback: "12px" },
  { name: "--radius-lg", layer: "A2", description: "Large radius \u2014 featured containers.", fallback: "16px" },
  { name: "--radius-pill", layer: "A2", description: "Pill radius \u2014 avatars, badges.", fallback: "9999px" },
  // ─── Elevation ────────────────────────────────────────────────────
  { name: "--elev-flat", layer: "A2", description: "No elevation.", fallback: "none" },
  { name: "--elev-ring", layer: "A2", description: "Hairline ring (1px box-shadow border).", fallback: "0 0 0 1px var(--border)" },
  {
    name: "--elev-raised",
    layer: "A2",
    description: "Raised surface (blur or whisper).",
    fallback: "0 2px 8px color-mix(in oklab, var(--fg), transparent 92%)"
  },
  // ─── Focus ────────────────────────────────────────────────────────
  {
    name: "--focus-ring",
    layer: "A2",
    description: "Keyboard focus indicator.",
    fallback: "0 0 0 3px color-mix(in oklab, var(--accent), transparent 70%)"
  },
  // ─── Motion ───────────────────────────────────────────────────────
  { name: "--motion-fast", layer: "A2", description: "Hover / micro-state duration.", fallback: "150ms" },
  { name: "--motion-base", layer: "A2", description: "General state-change duration.", fallback: "200ms" },
  {
    name: "--ease-standard",
    layer: "A2",
    description: "Standard easing curve.",
    fallback: "cubic-bezier(0.2, 0, 0, 1)"
  },
  // ─── Layout ───────────────────────────────────────────────────────
  { name: "--container-max", layer: "A1-structure", description: "Max content container width." },
  { name: "--container-gutter-desktop", layer: "A1-structure", description: "Container side gutter \u2014 desktop." },
  { name: "--container-gutter-tablet", layer: "A1-structure", description: "Container side gutter \u2014 tablet." },
  { name: "--container-gutter-phone", layer: "A1-structure", description: "Container side gutter \u2014 phone." }
];
var BRAND_EXTENSIONS = {
  default: [
    "--space-20"
    // 80px — used as section-y-desktop's twin; only default needs it
  ],
  openai: [
    "--space-16"
    // 64px — major section gap in OpenAI's DESIGN.md §5 spacing scale
  ],
  kami: [
    "--accent-light",
    // brighter ink-blue for links on dark surfaces
    "--text-md",
    // 15px lede tier between --text-base and --text-lg
    "--leading-display",
    // 1.10 — only kami needs this tier
    "--leading-dense",
    // 1.40 — resume / one-pager rhythm
    "--tracking-eyebrow",
    // uppercase eyebrow tracking
    "--tracking-label",
    // small uppercase label tracking
    "--space-7",
    // 28px — kami's card interior
    "--space-18",
    // 72px — section gap (web)
    "--space-22",
    // 88px — page top padding (web)
    "--radius-xs",
    // 2px — kami tags
    "--radius-xl",
    // 16px — kami hero containers
    "--elev-ring-accent"
    // 1px brand ring used as primary-button edge
  ],
  "tom-modern": [
    "--tm-accent-soft",
    // rgba accent tint for subtle backgrounds
    "--tm-shadow-hard",
    // 8px 8px hard offset shadow (hover emphasis)
    "--tm-shadow-soft",
    // 4px 4px soft offset shadow (default card)
    "--tm-shadow-code",
    // 0 28px 90px deep shadow (code window)
    "--tm-header-height",
    // 82px sticky header height
    "--tm-code-bg",
    // #111517 code window background
    "--tm-code-panel",
    // #151a1d code window header
    "--tm-code-text"
    // #d8dee9 code syntax text
  ]
};
var BRAND_EXTENSION_PREFIXES = [
  "--tag-bg-"
];
function getRequiredA1Names() {
  return TOKEN_SCHEMA.filter((t) => t.layer === "A1-identity" || t.layer === "A1-structure").map((t) => t.name);
}
function getRequiredA2Names() {
  return TOKEN_SCHEMA.filter((t) => t.layer === "A2").map((t) => t.name);
}
function getBSlotNames() {
  return TOKEN_SCHEMA.filter((t) => t.layer === "B-slot").map((t) => t.name);
}
function getAllSchemaNames() {
  return TOKEN_SCHEMA.map((t) => t.name);
}
function isAllowedExtension(brand, name) {
  if (BRAND_EXTENSION_PREFIXES.some((prefix) => name.startsWith(prefix))) return true;
  const brandList = BRAND_EXTENSIONS[brand];
  if (brandList != null && brandList.includes(name)) return true;
  return false;
}
export {
  BRAND_EXTENSIONS,
  BRAND_EXTENSION_PREFIXES,
  TOKEN_SCHEMA,
  getAllSchemaNames,
  getBSlotNames,
  getRequiredA1Names,
  getRequiredA2Names,
  isAllowedExtension
};
