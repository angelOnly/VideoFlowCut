// src/schemas.ts
import { z } from "zod";
var RegistryBackendKindSchema = z.enum(["github", "http", "local", "db"]);
var RegistryTrustSchema = z.enum(["official", "trusted", "restricted"]);
var RegistryDistSchema = z.object({
  type: z.enum(["github-release", "https-archive", "local-archive", "database"]).optional(),
  archive: z.string().min(1).optional(),
  integrity: z.string().min(1).optional(),
  manifestDigest: z.string().min(1).optional()
}).passthrough();
var RegistryPublisherSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  github: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  verified: z.boolean().optional()
}).passthrough();
var RegistryMetricsSchema = z.object({
  downloads: z.number().int().nonnegative().optional(),
  installs: z.number().int().nonnegative().optional(),
  stars: z.number().int().nonnegative().optional(),
  updatedAt: z.string().optional(),
  lastPublishedAt: z.string().optional()
}).passthrough();
var RegistrySignatureSchema = z.object({
  kind: z.enum(["github-oidc", "cosign", "minisign", "custom"]),
  issuer: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  signature: z.string().min(1),
  certificate: z.string().min(1).optional(),
  signedAt: z.string().optional()
}).passthrough();
var RegistryVersionSchema = z.object({
  version: z.string().min(1),
  source: z.string().min(1).optional(),
  ref: z.string().min(1).optional(),
  dist: RegistryDistSchema.optional(),
  integrity: z.string().min(1).optional(),
  manifestDigest: z.string().min(1).optional(),
  deprecated: z.union([z.boolean(), z.string()]).optional(),
  yanked: z.boolean().optional(),
  yankedAt: z.string().optional(),
  yankReason: z.string().optional()
}).passthrough();
var RegistryEntrySchema = z.object({
  name: z.string().regex(/^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/),
  version: z.string().min(1),
  source: z.string().min(1),
  ref: z.string().min(1).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  capabilitiesSummary: z.array(z.string()).optional(),
  dist: RegistryDistSchema.optional(),
  versions: z.array(RegistryVersionSchema).optional(),
  distTags: z.record(z.string()).optional(),
  integrity: z.string().min(1).optional(),
  manifestDigest: z.string().min(1).optional(),
  publisher: RegistryPublisherSchema.optional(),
  homepage: z.string().optional(),
  license: z.string().optional(),
  deprecated: z.union([z.boolean(), z.string()]).optional(),
  yanked: z.boolean().optional(),
  yankedAt: z.string().optional(),
  yankReason: z.string().optional(),
  metrics: RegistryMetricsSchema.optional(),
  signatures: z.array(RegistrySignatureSchema).optional()
}).passthrough();
var RegistryListFilterSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  publisher: z.string().optional(),
  includeYanked: z.boolean().optional()
}).optional();
var RegistrySearchQuerySchema = z.object({
  query: z.string().default(""),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(500).optional(),
  includeYanked: z.boolean().optional()
});
var RegistrySearchResultSchema = z.object({
  entry: RegistryEntrySchema,
  score: z.number().nonnegative(),
  matched: z.array(z.string())
});
var ResolvedRegistryEntrySchema = z.object({
  backendId: z.string().min(1),
  backendKind: RegistryBackendKindSchema,
  trust: RegistryTrustSchema,
  entry: RegistryEntrySchema,
  version: RegistryVersionSchema,
  source: z.string().min(1),
  ref: z.string().optional(),
  integrity: z.string().optional(),
  manifestDigest: z.string().optional()
});
var RegistryPublishRequestSchema = z.object({
  entry: RegistryEntrySchema,
  packagePath: z.string().optional(),
  dryRun: z.boolean().optional(),
  tag: z.string().optional(),
  changelog: z.string().optional()
});
var RegistryPublishOutcomeSchema = z.object({
  ok: z.boolean(),
  dryRun: z.boolean().optional(),
  pullRequestUrl: z.string().optional(),
  changedFiles: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([])
});
var RegistryDoctorIssueSchema = z.object({
  severity: z.enum(["error", "warning", "info"]),
  code: z.string().min(1),
  message: z.string().min(1),
  pluginName: z.string().optional()
});
var RegistryDoctorReportSchema = z.object({
  ok: z.boolean(),
  backendId: z.string().min(1),
  checkedAt: z.number(),
  entriesChecked: z.number().int().nonnegative(),
  issues: z.array(RegistryDoctorIssueSchema)
});
var RegistryYankOutcomeSchema = z.object({
  ok: z.boolean(),
  name: z.string().min(1),
  version: z.string().min(1),
  reason: z.string().min(1),
  pullRequestUrl: z.string().optional(),
  warnings: z.array(z.string()).default([])
});
export {
  RegistryBackendKindSchema,
  RegistryDistSchema,
  RegistryDoctorIssueSchema,
  RegistryDoctorReportSchema,
  RegistryEntrySchema,
  RegistryListFilterSchema,
  RegistryMetricsSchema,
  RegistryPublishOutcomeSchema,
  RegistryPublishRequestSchema,
  RegistryPublisherSchema,
  RegistrySearchQuerySchema,
  RegistrySearchResultSchema,
  RegistrySignatureSchema,
  RegistryTrustSchema,
  RegistryVersionSchema,
  RegistryYankOutcomeSchema,
  ResolvedRegistryEntrySchema
};
