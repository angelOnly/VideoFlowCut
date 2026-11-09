"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  EXACT_RELEASE_NAME_PATTERN: () => EXACT_RELEASE_NAME_PATTERN,
  RELEASE_CHANNELS: () => RELEASE_CHANNELS,
  RELEASE_PLATFORM_NAMESPACE_SUFFIXES: () => RELEASE_PLATFORM_NAMESPACE_SUFFIXES,
  RESERVED_RELEASE_NAMES: () => RESERVED_RELEASE_NAMES,
  compareReleaseBaseVersions: () => compareReleaseBaseVersions,
  formatReleaseVersion: () => formatReleaseVersion,
  isReleaseChannel: () => isReleaseChannel,
  isReleaseChannelNamespace: () => isReleaseChannelNamespace,
  parseCountedReleaseVersion: () => parseCountedReleaseVersion,
  parseReleaseBaseVersion: () => parseReleaseBaseVersion,
  parseReleaseVersion: () => parseReleaseVersion,
  parseStableReleaseVersion: () => parseStableReleaseVersion,
  releaseChannelDescriptor: () => releaseChannelDescriptor,
  releaseChannelFromNamespace: () => releaseChannelFromNamespace,
  releaseChannelFromVersion: () => releaseChannelFromVersion,
  releaseInstallIdentity: () => releaseInstallIdentity,
  releaseMetadataVersionFields: () => releaseMetadataVersionFields,
  releaseNamespace: () => releaseNamespace
});
module.exports = __toCommonJS(index_exports);
var EXACT_RELEASE_NAME_PATTERN = /^[a-z0-9]{1,12}$/;
var RESERVED_RELEASE_NAMES = Object.freeze(["local"]);
var RELEASE_CHANNELS = Object.freeze({
  BETA: "beta",
  PRERELEASE: "prerelease",
  STABLE: "stable"
});
var RELEASE_PLATFORM_NAMESPACE_SUFFIXES = Object.freeze({
  linux: "linux",
  mac: "",
  macIntel: "intel",
  win: "win"
});
var PRODUCT_NAME = "Open Design";
var DEFAULT_NAMESPACE = "open-design";
var descriptors = {
  prerelease: {
    appId: "io.open-design.desktop.prerelease",
    baseVersionField: "baseVersion",
    channel: "prerelease",
    counterField: "releaseNumber",
    displayLabel: "Prerelease",
    githubReleaseEnabled: false,
    internal: true,
    productName: `${PRODUCT_NAME} Prerelease`,
    releaseVersionField: "releaseVersion",
    storagePrefix: "prerelease"
  },
  stable: {
    appId: "io.open-design.desktop",
    baseVersionField: "baseVersion",
    channel: "stable",
    counterField: null,
    displayLabel: "Stable",
    githubReleaseEnabled: true,
    internal: false,
    productName: PRODUCT_NAME,
    releaseVersionField: "releaseVersion",
    storagePrefix: "stable"
  }
};
function isReleaseChannel(value) {
  return typeof value === "string" && value !== "local" && (value === "stable" || value === "prerelease" || EXACT_RELEASE_NAME_PATTERN.test(value));
}
function releaseChannelDescriptor(channel) {
  if (!isReleaseChannel(channel)) {
    throw new Error(`RELEASE_CHANNEL must be stable, prerelease, or a non-reserved exact name matching [a-z0-9]{1,12}; got ${channel}`);
  }
  if (channel === "stable" || channel === "prerelease") return descriptors[channel];
  const displayLabel = channel[0].toUpperCase() + channel.slice(1);
  return {
    appId: `io.open-design.desktop.${channel}`,
    baseVersionField: "baseVersion",
    channel,
    counterField: "releaseNumber",
    displayLabel,
    githubReleaseEnabled: false,
    internal: true,
    productName: `${PRODUCT_NAME} ${displayLabel}`,
    releaseVersionField: "releaseVersion",
    storagePrefix: channel
  };
}
function releaseChannelFromVersion(version) {
  if (version == null || version.length === 0) return null;
  const match = /^\d+\.\d+\.\d+-([a-z0-9]{1,12})\.\d+$/.exec(version);
  if (isReleaseChannel(match?.[1])) return match[1];
  if (/(?:^|[-.])beta(?:[-.]|$)/i.test(version)) return "beta";
  if (/(?:^|[-.])prerelease(?:[-.]|$)/i.test(version)) return "prerelease";
  return null;
}
function releaseChannelFromNamespace(namespace, defaultNamespace = DEFAULT_NAMESPACE) {
  if (namespace === defaultNamespace || isReleaseChannelNamespace(namespace, "stable")) return "stable";
  const match = /^release-([a-z0-9]{1,12})(?:$|[-_.])/.exec(namespace);
  return isReleaseChannel(match?.[1]) ? match[1] : null;
}
function isReleaseChannelNamespace(namespace, channel) {
  return new RegExp(`^release-${channel}(?:$|[-_.])`, "i").test(namespace);
}
function releaseNamespace(channel, platform = "mac") {
  const suffix = RELEASE_PLATFORM_NAMESPACE_SUFFIXES[platform];
  return suffix.length === 0 ? `release-${channel}` : `release-${channel}-${suffix}`;
}
function releaseInstallIdentity(channel) {
  const descriptor = releaseChannelDescriptor(channel);
  return {
    appId: descriptor.appId,
    executableName: descriptor.productName,
    productName: descriptor.productName
  };
}
function parseCountedReleaseVersion(value, channel) {
  const match = new RegExp(`^(\\d+\\.\\d+\\.\\d+)-${channel}\\.(\\d+)$`).exec(value);
  if (match?.[1] == null || match[2] == null) return null;
  const number = Number(match[2]);
  if (!Number.isSafeInteger(number) || number < 1) return null;
  return { baseVersion: match[1], number, releaseVersion: value };
}
function parseStableReleaseVersion(value) {
  return /^\d+\.\d+\.\d+$/.test(value) ? { baseVersion: value, releaseVersion: value } : null;
}
function parseReleaseBaseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (match?.[1] == null || match[2] == null || match[3] == null) return null;
  const parsed = [Number(match[1]), Number(match[2]), Number(match[3])];
  return parsed.every((part) => Number.isSafeInteger(part) && part >= 0) ? parsed : null;
}
function compareReleaseBaseVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }
  return 0;
}
function parseReleaseVersion(value, channel) {
  if (channel === "stable") {
    const parsed2 = parseStableReleaseVersion(value);
    if (parsed2 == null) throw new Error(`stable release version must be x.y.z; got ${value}`);
    return { ...parsed2, channel };
  }
  const parsed = parseCountedReleaseVersion(value, channel);
  if (parsed == null) throw new Error(`${channel} release version must be x.y.z-${channel}.N; got ${value}`);
  return { ...parsed, channel };
}
function formatReleaseVersion(channel, baseVersion, number) {
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new Error(`${channel} release number must be a positive integer; got ${String(number)}`);
  }
  return `${baseVersion}-${channel}.${number}`;
}
function releaseMetadataVersionFields(channel, releaseVersion) {
  const descriptor = releaseChannelDescriptor(channel);
  const parsed = parseReleaseVersion(releaseVersion, channel);
  const baseVersion = parsed.baseVersion;
  if (!("number" in parsed)) {
    return {
      [descriptor.baseVersionField]: baseVersion,
      releaseVersion,
      stableVersion: baseVersion
    };
  }
  if (descriptor.counterField == null) {
    throw new Error(`${channel} release channel is missing a counter field`);
  }
  return {
    [descriptor.baseVersionField]: baseVersion,
    [descriptor.counterField]: parsed.number,
    releaseVersion
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EXACT_RELEASE_NAME_PATTERN,
  RELEASE_CHANNELS,
  RELEASE_PLATFORM_NAMESPACE_SUFFIXES,
  RESERVED_RELEASE_NAMES,
  compareReleaseBaseVersions,
  formatReleaseVersion,
  isReleaseChannel,
  isReleaseChannelNamespace,
  parseCountedReleaseVersion,
  parseReleaseBaseVersion,
  parseReleaseVersion,
  parseStableReleaseVersion,
  releaseChannelDescriptor,
  releaseChannelFromNamespace,
  releaseChannelFromVersion,
  releaseInstallIdentity,
  releaseMetadataVersionFields,
  releaseNamespace
});
