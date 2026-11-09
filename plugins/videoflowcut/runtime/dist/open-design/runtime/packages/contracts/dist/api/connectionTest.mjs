// src/api/connectionTest.ts
function normalizeBracketedIpv6(hostname) {
  const stripped = hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
  return stripped.toLowerCase().replace(/\.+$/, "");
}
function parseIpv4(hostname) {
  const parts = hostname.split(".");
  if (parts.length !== 4) return null;
  const parsed = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    return value >= 0 && value <= 255 ? value : null;
  });
  if (parsed.some((part) => part === null)) return null;
  return parsed;
}
function isLoopbackIpv4(hostname) {
  const parts = parseIpv4(hostname);
  return Boolean(parts && parts[0] === 127);
}
function isBlockedIpv4(hostname) {
  const parts = parseIpv4(hostname);
  if (!parts) return false;
  const [a, b] = parts;
  return a === 0 || a === 100 && b >= 64 && b <= 127 || a === 169 && b === 254 || a === 10 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31 || a >= 224;
}
function ipv4MappedToDotted(hostname) {
  const host = normalizeBracketedIpv6(hostname);
  const mapped = /^::ffff:(.+)$/i.exec(host)?.[1];
  if (!mapped) return null;
  if (parseIpv4(mapped.toLowerCase())) return mapped.toLowerCase();
  const hexParts = mapped.split(":");
  if (hexParts.length !== 2 || !hexParts.every((part) => /^[0-9a-f]{1,4}$/i.test(part))) {
    return null;
  }
  const hi = hexParts[0];
  const lo = hexParts[1];
  if (!hi || !lo) return null;
  const value = Number.parseInt(hi, 16) << 16 | Number.parseInt(lo, 16);
  return [
    value >>> 24 & 255,
    value >>> 16 & 255,
    value >>> 8 & 255,
    value & 255
  ].join(".");
}
function isLoopbackApiHost(hostname) {
  const host = normalizeBracketedIpv6(hostname);
  if (host === "localhost" || host === "::1") return true;
  if (isLoopbackIpv4(host)) return true;
  const mapped = ipv4MappedToDotted(host);
  return Boolean(mapped && isLoopbackIpv4(mapped));
}
function isBlockedExternalApiHostname(hostname) {
  const host = normalizeBracketedIpv6(hostname);
  if (host === "::") return true;
  if (isBlockedIpv4(host)) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(host)) return true;
  if (/^fe[89ab][0-9a-f]:/i.test(host)) return true;
  const mapped = ipv4MappedToDotted(host);
  return Boolean(mapped && isBlockedIpv4(mapped));
}
function internalHostMatchForms(hostname) {
  const normalized = normalizeBracketedIpv6(hostname);
  const forms = /* @__PURE__ */ new Set([normalized]);
  const mapped = ipv4MappedToDotted(hostname);
  if (mapped) forms.add(mapped.toLowerCase());
  return [...forms];
}
function isAllowlistedInternalHost(hostname, allowedInternalHosts) {
  if (!allowedInternalHosts || allowedInternalHosts.length === 0) return false;
  const candidateForms = internalHostMatchForms(hostname);
  for (const entry of allowedInternalHosts) {
    if (typeof entry !== "string" || !entry.trim()) continue;
    const entryForms = internalHostMatchForms(entry.trim());
    if (entryForms.some((form) => candidateForms.includes(form))) return true;
  }
  return false;
}
function validateBaseUrl(baseUrl, options = {}) {
  let parsed;
  try {
    parsed = new URL(String(baseUrl).replace(/\/+$/, ""));
  } catch {
    return { error: "Invalid baseUrl" };
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { error: "Only http/https allowed" };
  }
  const hostname = parsed.hostname.toLowerCase();
  if (options.forbidLoopback && isLoopbackApiHost(hostname)) {
    return { error: "Loopback addresses blocked for asset URLs", forbidden: true };
  }
  if (!isLoopbackApiHost(hostname) && !isAllowlistedInternalHost(hostname, options.allowedInternalHosts) && isBlockedExternalApiHostname(hostname)) {
    return { error: "Internal IPs blocked", forbidden: true };
  }
  return { parsed };
}
export {
  isAllowlistedInternalHost,
  isBlockedExternalApiHostname,
  isLoopbackApiHost,
  validateBaseUrl
};
