// src/parsers/frontmatter.ts
function parseFrontmatter(src) {
  const text = src.replace(/^﻿/, "");
  let markerStart = -1;
  if (text.startsWith("---\n")) {
    markerStart = 4;
  } else if (text.startsWith("---\r\n")) {
    markerStart = 5;
  } else {
    return { data: {}, body: text };
  }
  let closeIndex = markerStart - 1;
  while (true) {
    closeIndex = text.indexOf("\n---", closeIndex + 1);
    if (closeIndex === -1) {
      return { data: {}, body: text };
    }
    const nextChar = text[closeIndex + 4];
    if (nextChar === void 0 || nextChar === "\n" || nextChar === "\r") {
      break;
    }
  }
  const hasCrBeforeDelimiter = text[closeIndex - 1] === "\r";
  const yamlEnd = hasCrBeforeDelimiter ? closeIndex - 1 : closeIndex;
  const yamlRaw = text.slice(markerStart, yamlEnd);
  const yaml = yamlRaw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let bodyStart = closeIndex + 4;
  if (bodyStart < text.length) {
    if (text.startsWith("\r\n", bodyStart)) {
      bodyStart += 2;
    } else if (text[bodyStart] === "\n" || text[bodyStart] === "\r") {
      bodyStart += 1;
    }
  }
  const body = text.slice(bodyStart);
  return { data: parseYamlSubset(yaml), body };
}
function parseYamlSubset(src) {
  const lines = src.split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, container: root, key: null }];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i] ?? "";
    if (/^\s*(#.*)?$/.test(raw)) {
      i++;
      continue;
    }
    const indent = raw.match(/^\s*/)?.[0].length ?? 0;
    const line = raw.slice(indent);
    const isSeqItem = line.startsWith("- ");
    while (stack.length > 1 && indent <= (stack[stack.length - 1]?.indent ?? -1)) {
      const entry = stack[stack.length - 1];
      if (entry && isSeqItem && indent === entry.indent && entry.key !== null && (Array.isArray(entry.container) || Object.keys(entry.container).length === 0)) {
        break;
      }
      stack.pop();
    }
    const top = stack[stack.length - 1];
    if (!top) throw new Error("frontmatter parser stack invariant violated");
    if (line.startsWith("- ")) {
      const value = line.slice(2).trim();
      let container = top.container;
      if (!Array.isArray(container)) {
        const parent = stack[stack.length - 2];
        if (parent && top.key) {
          if (Array.isArray(parent.container)) {
            throw new Error("invalid frontmatter array nesting");
          }
          parent.container[top.key] = [];
          container = parent.container[top.key];
          top.container = container;
        } else {
          i++;
          continue;
        }
      }
      if (value.includes(":")) {
        const obj = {};
        const colonIdx = value.indexOf(":");
        const key2 = value.slice(0, colonIdx).trim();
        const valRaw = value.slice(colonIdx + 1).trim();
        if (valRaw) obj[key2] = coerce(valRaw);
        if (!Array.isArray(container)) throw new Error("frontmatter array container expected");
        container.push(obj);
        stack.push({ indent, container: obj, key: null });
      } else {
        if (!Array.isArray(container)) throw new Error("frontmatter array container expected");
        container.push(coerce(value));
      }
      i++;
      continue;
    }
    const kv = /^([^:]+):\s*(.*)$/.exec(line);
    if (!kv) {
      i++;
      continue;
    }
    const key = (kv[1] ?? "").trim();
    const val = kv[2];
    if (val === "" || val === void 0) {
      if (Array.isArray(top.container)) throw new Error("frontmatter object container expected");
      top.container[key] = {};
      stack.push({ indent, container: top.container[key], key });
      i++;
      continue;
    }
    if (val === "|" || val === "|-" || val === ">" || val === ">-") {
      const collected = [];
      let blockIndent = -1;
      i++;
      while (i < lines.length) {
        const next = lines[i] ?? "";
        if (/^\s*$/.test(next)) {
          collected.push("");
          i++;
          continue;
        }
        const nIndent = next.match(/^\s*/)?.[0].length ?? 0;
        if (nIndent <= indent) break;
        if (blockIndent === -1) blockIndent = nIndent;
        if (nIndent < blockIndent) break;
        collected.push(next.slice(blockIndent));
        i++;
      }
      if (Array.isArray(top.container)) throw new Error("frontmatter object container expected");
      top.container[key] = collected.join("\n").trimEnd();
      continue;
    }
    if (val === "[]") {
      if (Array.isArray(top.container)) throw new Error("frontmatter object container expected");
      top.container[key] = [];
      i++;
      continue;
    }
    if (val.startsWith("[") && val.endsWith("]")) {
      if (Array.isArray(top.container)) throw new Error("frontmatter object container expected");
      top.container[key] = splitInlineArrayItems(val.slice(1, -1)).map((s) => coerce(s.trim())).filter((v) => v !== "");
      i++;
      continue;
    }
    if (Array.isArray(top.container)) throw new Error("frontmatter object container expected");
    top.container[key] = coerce(val);
    i++;
  }
  return root;
}
function splitInlineArrayItems(inner) {
  const items = [];
  let buf = "";
  let quote = null;
  for (const ch of inner) {
    if (quote) {
      buf += ch;
      if (ch === quote) quote = null;
    } else if ((ch === '"' || ch === "'") && buf.trim() === "") {
      quote = ch;
      buf += ch;
    } else if (ch === ",") {
      items.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  items.push(buf);
  return items;
}
function coerce(raw) {
  if (raw === void 0) return "";
  const v = raw.trim();
  if (v.length >= 2 && (v.startsWith('"') && v.endsWith('"') || v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null" || v === "~") return null;
  if (/^-?\d+$/.test(v)) return Number(v);
  if (/^-?\d*\.\d+$/.test(v)) return Number(v);
  return v;
}

// src/parsers/manifest.ts
import {
  OPEN_DESIGN_PLUGIN_SPEC_VERSION,
  PluginManifestSchema
} from "@open-design/contracts";
function parseManifest(raw) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    return {
      ok: false,
      warnings: [],
      errors: [`open-design.json is not valid JSON: ${err.message}`]
    };
  }
  return parseManifestObject(json);
}
function parseManifestObject(value) {
  const result = PluginManifestSchema.safeParse(value);
  if (!result.success) {
    return {
      ok: false,
      warnings: [],
      errors: result.error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
    };
  }
  return {
    ok: true,
    manifest: {
      specVersion: OPEN_DESIGN_PLUGIN_SPEC_VERSION,
      ...result.data
    },
    warnings: []
  };
}

// src/parsers/marketplace.ts
import { MarketplaceManifestSchema } from "@open-design/contracts";
function parseMarketplace(raw) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    return { ok: false, errors: [`open-design-marketplace.json is not valid JSON: ${err.message}`] };
  }
  const result = MarketplaceManifestSchema.safeParse(json);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
    };
  }
  return { ok: true, manifest: result.data };
}

// src/adapters/agent-skill.ts
import {
  OPEN_DESIGN_PLUGIN_SPEC_VERSION as OPEN_DESIGN_PLUGIN_SPEC_VERSION2
} from "@open-design/contracts";
var ROLE_PARAMETER_KEYS = ["od.parameters"];
function adaptAgentSkill(rawSkillMd, opts) {
  const { data: frontmatter, body } = parseFrontmatter(rawSkillMd);
  const od = isObject(frontmatter["od"]) ? frontmatter["od"] : {};
  const warnings = [];
  const name = stringOr(frontmatter["name"], opts.folderId).trim() || opts.folderId;
  const titleI18n = localizedMapFromFields(frontmatter["en_name"], frontmatter["zh_name"]);
  const title = stringOr(frontmatter["en_name"], "") || humanizeName(name);
  const descriptionI18n = localizedMapFromFields(
    frontmatter["en_description"],
    frontmatter["zh_description"]
  );
  const description = stringOr(frontmatter["en_description"], "") || stringOr(frontmatter["description"], "");
  const version = stringOr(frontmatter["version"], "0.0.0");
  const compatPath = opts.compatPath ?? "./SKILL.md";
  const tags = stringArray(frontmatter["tags"]);
  const designSystemFm = isObject(od["design_system"]) ? od["design_system"] : null;
  const designSystem = designSystemFm ? {
    ref: stringOr(designSystemFm["ref"], "") || void 0,
    primary: typeof designSystemFm["primary"] === "boolean" ? designSystemFm["primary"] : void 0
  } : void 0;
  const craftFm = isObject(od["craft"]) ? od["craft"] : null;
  const craftRequires = craftFm && Array.isArray(craftFm["requires"]) ? craftFm["requires"].filter((v) => typeof v === "string") : void 0;
  const inputs = mapInputs(od["inputs"], warnings);
  for (const key of ROLE_PARAMETER_KEYS) {
    const [namespace, sub] = key.split(".");
    if (namespace === "od" && sub && Array.isArray(od[sub])) {
      warnings.push(`SKILL.md ${key} is preserved as adapter metadata; v1 manifest does not expose live sliders`);
    }
  }
  const previewFm = isObject(od["preview"]) ? od["preview"] : null;
  const preview = previewFm ? {
    type: stringOr(previewFm["type"], "") || void 0,
    entry: stringOr(previewFm["entry"], "") || void 0
  } : void 0;
  const manifest = {
    specVersion: OPEN_DESIGN_PLUGIN_SPEC_VERSION2,
    name,
    title,
    title_i18n: titleI18n,
    version,
    description: description || void 0,
    description_i18n: descriptionI18n,
    tags,
    compat: { agentSkills: [{ path: compatPath }] },
    od: {
      kind: "skill",
      taskKind: stringOr(od["taskKind"], "new-generation"),
      mode: stringOr(od["mode"], "") || void 0,
      platform: stringOr(od["platform"], "") || void 0,
      scenario: stringOr(od["scenario"], "") || void 0,
      preview,
      useCase: { query: examplePromptFromFrontmatter(frontmatter, body) },
      context: {
        designSystem: designSystem ?? void 0,
        craft: craftRequires
      },
      inputs
    }
  };
  return { manifest, warnings, bodyMarkdown: body };
}
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stringOr(value, fallback) {
  return typeof value === "string" ? value : fallback;
}
function localizedMapFromFields(enValue, zhValue) {
  const out = {};
  if (typeof enValue === "string" && enValue.trim()) out.en = enValue.trim();
  if (typeof zhValue === "string" && zhValue.trim()) out["zh-CN"] = zhValue.trim();
  return Object.keys(out).length > 0 ? out : void 0;
}
function stringArray(value) {
  if (!Array.isArray(value)) return void 0;
  const out = value.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  return out.length > 0 ? out : void 0;
}
function humanizeName(name) {
  return name.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().split(" ").map((part) => part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
function mapInputs(value, warnings) {
  if (!Array.isArray(value)) return void 0;
  const out = [];
  for (const raw of value) {
    if (!isObject(raw)) continue;
    const name = stringOr(raw["name"], "").trim();
    if (!name) continue;
    const t = stringOr(raw["type"], "string");
    let mappedType;
    if (t === "integer") mappedType = "number";
    else if (t === "enum") mappedType = "select";
    else if (t === "upload") mappedType = "file";
    else if (t === "string" || t === "text" || t === "select" || t === "number" || t === "boolean" || t === "file") mappedType = t;
    else {
      warnings.push(`SKILL.md inputs[${name}].type='${t}' is not in the v1 input vocabulary; falling back to 'string'`);
      mappedType = "string";
    }
    const optionsSrc = raw["options"] ?? raw["values"];
    const options = Array.isArray(optionsSrc) ? optionsSrc.filter((v) => typeof v === "string") : void 0;
    const field = {
      name,
      label: stringOr(raw["label"], "") || void 0,
      type: mappedType,
      required: typeof raw["required"] === "boolean" ? raw["required"] : void 0,
      options: options && options.length > 0 ? options : void 0,
      placeholder: stringOr(raw["placeholder"], "") || void 0,
      default: raw["default"] ?? void 0
    };
    out.push(field);
  }
  return out.length > 0 ? out : void 0;
}
function examplePromptFromFrontmatter(fm, body) {
  const od = isObject(fm["od"]) ? fm["od"] : {};
  const direct = stringOr(od["example_prompt"], "").trim();
  if (direct) return direct;
  const desc = stringOr(fm["description"], "").trim();
  if (desc) {
    const firstLine = desc.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? "";
    if (firstLine) return firstLine;
  }
  const heading = /^#\s+(.+)$/m.exec(body);
  return heading?.[1]?.trim() ?? "";
}

// src/adapters/claude-plugin.ts
import {
  OPEN_DESIGN_PLUGIN_SPEC_VERSION as OPEN_DESIGN_PLUGIN_SPEC_VERSION3
} from "@open-design/contracts";
function adaptClaudePlugin(rawJson, opts) {
  const warnings = [];
  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return {
      manifest: synthesizeFallback(opts.folderId, opts.compatPath ?? "./.claude-plugin/plugin.json"),
      warnings: [`Failed to parse .claude-plugin/plugin.json: ${err.message}`]
    };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      manifest: synthesizeFallback(opts.folderId, opts.compatPath ?? "./.claude-plugin/plugin.json"),
      warnings: [".claude-plugin/plugin.json must be a JSON object"]
    };
  }
  const obj = parsed;
  const compatPath = opts.compatPath ?? "./.claude-plugin/plugin.json";
  const name = typeof obj["name"] === "string" && obj["name"].trim().length > 0 ? obj["name"].trim() : opts.folderId;
  const safeName = name.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/^[._-]+/, "") || opts.folderId;
  if (safeName !== name) {
    warnings.push(`claude-plugin name '${name}' was sanitized to '${safeName}' to fit the OD plugin id pattern`);
  }
  const version = typeof obj["version"] === "string" ? obj["version"] : "0.0.0";
  const description = typeof obj["description"] === "string" ? obj["description"] : void 0;
  const commands = Array.isArray(obj["commands"]) ? obj["commands"].length : 0;
  if (commands > 0) {
    warnings.push(`claude-plugin declares ${commands} command(s); v1 OD apply does not auto-register hooks. Add them via od.context.claudePlugins[].`);
  }
  const manifest = {
    specVersion: OPEN_DESIGN_PLUGIN_SPEC_VERSION3,
    name: safeName,
    title: typeof obj["title"] === "string" ? obj["title"] : safeName,
    version,
    description: description ?? void 0,
    compat: { claudePlugins: [{ path: compatPath }] },
    od: {
      kind: "skill",
      taskKind: "new-generation"
    }
  };
  return { manifest, warnings };
}
function synthesizeFallback(folderId, compatPath) {
  return {
    specVersion: OPEN_DESIGN_PLUGIN_SPEC_VERSION3,
    name: folderId,
    title: folderId,
    version: "0.0.0",
    compat: { claudePlugins: [{ path: compatPath }] },
    od: { kind: "skill", taskKind: "new-generation" }
  };
}

// src/merge.ts
function mergeManifests(inputs) {
  const adapters = inputs.adapters ?? [];
  const layers = inputs.sidecar ? [inputs.sidecar, ...adapters] : adapters;
  if (layers.length === 0) {
    throw new Error("mergeManifests requires at least one input layer (sidecar or adapter)");
  }
  const root = deepClonePlain(layers[0]);
  for (let i = 1; i < layers.length; i++) {
    deepMerge(root, layers[i]);
  }
  root.compat = mergeCompat(layers);
  return root;
}
function mergeCompat(layers) {
  const skills = [];
  const plugins = [];
  const seenSkills = /* @__PURE__ */ new Set();
  const seenPlugins = /* @__PURE__ */ new Set();
  for (const layer of layers) {
    const compat2 = layer.compat;
    if (!compat2) continue;
    for (const ref of compat2.agentSkills ?? []) {
      if (!ref || typeof ref.path !== "string") continue;
      if (seenSkills.has(ref.path)) continue;
      seenSkills.add(ref.path);
      skills.push(ref);
    }
    for (const ref of compat2.claudePlugins ?? []) {
      if (!ref || typeof ref.path !== "string") continue;
      if (seenPlugins.has(ref.path)) continue;
      seenPlugins.add(ref.path);
      plugins.push(ref);
    }
  }
  if (skills.length === 0 && plugins.length === 0) return void 0;
  const compat = {};
  if (skills.length > 0) compat.agentSkills = skills;
  if (plugins.length > 0) compat.claudePlugins = plugins;
  return compat;
}
function deepClonePlain(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((entry) => deepClonePlain(entry));
  }
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = deepClonePlain(v);
  }
  return out;
}
function deepMerge(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (val === void 0) continue;
    if (key === "compat") continue;
    const existing = target[key];
    if (isPlainObject(existing) && isPlainObject(val)) {
      const cloned = deepClonePlain(existing);
      deepMerge(cloned, val);
      target[key] = cloned;
    } else if (existing === void 0) {
      target[key] = deepClonePlain(val);
    } else {
    }
  }
}
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

// src/digest.ts
import { createHash } from "node:crypto";
function manifestSourceDigest(input) {
  const canonical = canonicalize({
    manifest: input.manifest,
    inputs: input.inputs,
    resolvedContextRefs: input.resolvedContextRefs
  });
  const json = JSON.stringify(canonical);
  return createHash("sha256").update(json, "utf8").digest("hex");
}
function canonicalize(value) {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value !== "object") return value;
  const obj = value;
  const out = {};
  for (const key of Object.keys(obj).sort()) {
    out[key] = canonicalize(obj[key]);
  }
  return out;
}

// src/validate.ts
import { PluginManifestSchema as PluginManifestSchema2 } from "@open-design/contracts";
var KNOWN_CAPABILITIES = /* @__PURE__ */ new Set([
  "prompt:inject",
  "fs:read",
  "fs:write",
  "mcp",
  "subprocess",
  "bash",
  "network",
  "connector"
]);
function validateManifest(value) {
  const parsed = PluginManifestSchema2.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      warnings: [],
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
    };
  }
  return validateSafe(parsed.data);
}
function validateSafe(manifest) {
  const warnings = [];
  const errors = [];
  const od = manifest.od;
  if (od) {
    const stages = od.pipeline?.stages ?? [];
    for (const stage of stages) {
      if (stage.repeat && !stage.until) {
        errors.push(`pipeline.stages[${stage.id}]: repeat=true requires an 'until' expression`);
      }
    }
    const caps = od.capabilities ?? [];
    for (const cap of caps) {
      if (cap.startsWith("connector:")) continue;
      if (!KNOWN_CAPABILITIES.has(cap)) {
        warnings.push(`capability '${cap}' is not in the v1 vocabulary; doctor will surface this to the operator`);
      }
    }
    const declaredConnectorIds = /* @__PURE__ */ new Set();
    for (const ref of od.connectors?.required ?? []) declaredConnectorIds.add(ref.id);
    for (const ref of od.connectors?.optional ?? []) declaredConnectorIds.add(ref.id);
    const declaredMcpNames = /* @__PURE__ */ new Set();
    for (const mcp of od.context?.mcp ?? []) {
      if (typeof mcp.name === "string") declaredMcpNames.add(mcp.name);
    }
    for (const surface of od.genui?.surfaces ?? []) {
      const oauth = surface.oauth;
      if (!oauth) continue;
      if (oauth.route === "connector") {
        if (!oauth.connectorId) {
          errors.push(`genui.surfaces[${surface.id}]: oauth.route='connector' requires connectorId`);
        } else if (declaredConnectorIds.size > 0 && !declaredConnectorIds.has(oauth.connectorId)) {
          errors.push(`genui.surfaces[${surface.id}]: oauth.connectorId='${oauth.connectorId}' is not in od.connectors.required/optional`);
        }
      } else if (oauth.route === "mcp") {
        if (!oauth.mcpServerId) {
          errors.push(`genui.surfaces[${surface.id}]: oauth.route='mcp' requires mcpServerId`);
        } else if (declaredMcpNames.size > 0 && !declaredMcpNames.has(oauth.mcpServerId)) {
          errors.push(`genui.surfaces[${surface.id}]: oauth.mcpServerId='${oauth.mcpServerId}' is not declared in od.context.mcp`);
        }
      }
    }
  }
  return { ok: errors.length === 0, warnings, errors };
}

// src/resolve.ts
function resolveContext(manifest, opts) {
  const warnings = [];
  const items = [];
  const digestRefs = [];
  const ctx = manifest.od?.context;
  const registry = opts.registry;
  if (ctx) {
    for (const ref of ctx.skills ?? []) {
      const id = (ref.ref ?? ref.path ?? "").trim();
      if (!id) continue;
      const skill = registry.skills.find((s) => s.id === id || s.id === stripDotSlash(id));
      if (!skill) {
        if (opts.warnOnMissing) warnings.push(`Unknown skill ref: '${id}'`);
        continue;
      }
      items.push({ kind: "skill", id: skill.id, label: skill.title ?? skill.id });
      digestRefs.push({ kind: "skill", ref: skill.id });
    }
    if (ctx.designSystem) {
      const dsRef = ctx.designSystem;
      const explicitRef = typeof dsRef.ref === "string" ? dsRef.ref.trim() : "";
      if (explicitRef) {
        const ds = registry.designSystems.find((d) => d.id === explicitRef);
        if (ds) {
          items.push({ kind: "design-system", id: ds.id, label: ds.title ?? ds.id, primary: true });
          digestRefs.push({ kind: "design-system", ref: ds.id });
        } else if (opts.warnOnMissing) {
          warnings.push(`Unknown design-system ref: '${explicitRef}'`);
        }
      } else if (registry.activeProjectDesignSystem) {
        const ds = registry.activeProjectDesignSystem;
        items.push({ kind: "design-system", id: ds.id, label: ds.title ?? ds.id, primary: true });
        digestRefs.push({ kind: "design-system", ref: ds.id });
      }
    }
    for (const slug of ctx.craft ?? []) {
      const id = String(slug).trim();
      if (!id) continue;
      const c = registry.craft.find((x) => x.id === id);
      if (!c) {
        if (opts.warnOnMissing) warnings.push(`Unknown craft slug: '${id}'`);
        continue;
      }
      items.push({ kind: "craft", id: c.id, label: c.title ?? c.id });
      digestRefs.push({ kind: "craft", ref: c.id });
    }
    for (const rawPath of ctx.assets ?? []) {
      const p = String(rawPath).trim();
      if (!p) continue;
      const label = p.split("/").pop() ?? p;
      items.push({ kind: "asset", path: p, label });
      digestRefs.push({ kind: "asset", ref: p });
    }
    for (const mcp of ctx.mcp ?? []) {
      if (!mcp.name) continue;
      items.push({
        kind: "mcp",
        name: mcp.name,
        label: mcp.name,
        command: typeof mcp.command === "string" ? mcp.command : void 0
      });
      digestRefs.push({ kind: "mcp", ref: mcp.name });
    }
    for (const ref of ctx.claudePlugins ?? []) {
      const id = (ref.ref ?? ref.path ?? "").trim();
      if (!id) continue;
      items.push({ kind: "claude-plugin", id, label: id });
      digestRefs.push({ kind: "claude-plugin", ref: id });
    }
    for (const atomId of ctx.atoms ?? []) {
      const id = String(atomId).trim();
      if (!id) continue;
      const atom = registry.atoms.find((a) => a.id === id);
      const label = atom?.label ?? id;
      items.push({ kind: "atom", id, label });
      digestRefs.push({ kind: "atom", ref: id });
    }
  }
  for (const stage of manifest.od?.pipeline?.stages ?? []) {
    for (const atomId of stage.atoms) {
      digestRefs.push({ kind: "pipeline-atom", ref: `${stage.id}:${atomId}` });
    }
  }
  return {
    context: {
      items,
      atoms: ctx?.atoms ? Array.from(ctx.atoms) : void 0
    },
    warnings,
    digestRefs
  };
}
function stripDotSlash(value) {
  return value.startsWith("./") ? value.slice(2) : value;
}

// src/pipeline-fallback.ts
function resolveAppliedPipeline(input) {
  const declared = input.manifest.od?.pipeline;
  if (declared && Array.isArray(declared.stages) && declared.stages.length > 0) {
    return { pipeline: declared, source: "declared" };
  }
  const kind = input.manifest.od?.kind;
  if (kind === "scenario") return { pipeline: void 0, source: "none" };
  const taskKind = input.manifest.od?.taskKind ?? "new-generation";
  const scenarios = input.scenarios ?? [];
  for (const candidate of scenarios) {
    if (candidate.taskKind !== taskKind) continue;
    if (!candidate.pipeline || !Array.isArray(candidate.pipeline.stages)) continue;
    if (candidate.pipeline.stages.length === 0) continue;
    return { pipeline: candidate.pipeline, source: "scenario", scenarioId: candidate.id };
  }
  return { pipeline: void 0, source: "none" };
}

// src/strategy-package.ts
import { createHash as createHash2 } from "node:crypto";
var STRATEGY_PACKAGE_IDENTITY_SCHEMA = "open-design.strategy-package-identity/v1";
var SHA256_HEX = /^[a-f0-9]{64}$/;
function normalizeStrategyAssetPath(input) {
  if (typeof input !== "string" || input.length === 0 || input.includes("\0")) {
    throw new Error("Strategy asset path must be a non-empty relative path.");
  }
  if (input.includes("\\")) {
    throw new Error("Strategy asset path must use POSIX separators; backslashes are not allowed.");
  }
  if (input.startsWith("/") || /^[A-Za-z]:/.test(input)) {
    throw new Error("Strategy asset path must be relative to the plugin root.");
  }
  const parts = [];
  for (const part of input.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      throw new Error("Strategy asset path may not traverse outside the plugin root.");
    }
    parts.push(part);
  }
  if (parts.length === 0) {
    throw new Error("Strategy asset path must identify a file below the plugin root.");
  }
  return `./${parts.join("/")}`;
}
function buildStrategyPackageIdentity(input) {
  if (input.assets.length === 0) {
    throw new Error("Strategy package identity requires at least one declared asset.");
  }
  const seen = /* @__PURE__ */ new Set();
  const assetDigests = input.assets.map((asset) => {
    const normalizedPath = normalizeStrategyAssetPath(asset.path);
    if (seen.has(normalizedPath)) {
      throw new Error(`Duplicate strategy asset path after normalization: ${normalizedPath}`);
    }
    seen.add(normalizedPath);
    if (!(asset.bytes instanceof Uint8Array)) {
      throw new Error(`Strategy asset bytes are required for ${normalizedPath}.`);
    }
    return {
      path: normalizedPath,
      sha256: createHash2("sha256").update(asset.bytes).digest("hex")
    };
  }).sort((a, b) => compareCodeUnits(a.path, b.path));
  return {
    packageHash: strategyPackageHashFromDigests(assetDigests),
    assetDigests
  };
}
function strategyPackageHashFromDigests(input) {
  if (input.length === 0) {
    throw new Error("Strategy package digest roster must not be empty.");
  }
  const seen = /* @__PURE__ */ new Set();
  const assets = input.map((asset) => {
    const normalizedPath = normalizeStrategyAssetPath(asset.path);
    if (seen.has(normalizedPath)) {
      throw new Error(`Duplicate strategy asset digest path: ${normalizedPath}`);
    }
    seen.add(normalizedPath);
    if (!SHA256_HEX.test(asset.sha256)) {
      throw new Error(`Invalid SHA-256 digest for strategy asset ${normalizedPath}.`);
    }
    return { path: normalizedPath, sha256: asset.sha256 };
  }).sort((a, b) => compareCodeUnits(a.path, b.path));
  const canonical = JSON.stringify({
    schema: STRATEGY_PACKAGE_IDENTITY_SCHEMA,
    assets
  });
  return createHash2("sha256").update(canonical, "utf8").digest("hex");
}
function compareCodeUnits(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
export {
  adaptAgentSkill,
  adaptClaudePlugin,
  buildStrategyPackageIdentity,
  manifestSourceDigest,
  mergeManifests,
  normalizeStrategyAssetPath,
  parseFrontmatter,
  parseManifest,
  parseManifestObject,
  parseMarketplace,
  resolveAppliedPipeline,
  resolveContext,
  strategyPackageHashFromDigests,
  validateManifest,
  validateSafe
};
