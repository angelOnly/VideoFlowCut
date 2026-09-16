import type { Asset, AssetProvenance, ExportPurpose } from "@videocut/contracts";

/** 许可说明必须明确且可追溯；旧 restricted 数据不自动获得内部使用权。 */
export function validAssetUsageRights(value: AssetProvenance["usageRights"]): boolean {
  return Boolean(value && Array.isArray(value.purposes) && value.purposes.length > 0 && value.purposes.length <= 2
    && new Set(value.purposes).size === value.purposes.length && value.purposes.every(p => p === "draft" || p === "delivery")
    && typeof value.basis === "string" && value.basis.trim() && value.basis.length <= 2000
    && Number.isFinite(Date.parse(value.confirmedAt)));
}

export function assetProvenanceAllowsExport(provenance: AssetProvenance | undefined, purpose: ExportPurpose): boolean {
  if (!provenance) return true; // 历史本地导入沿用既有合同。
  if (provenance.rightsStatus === "rejected") return false;
  if (provenance.rightsStatus === "attribution_required" && !provenance.attributionText?.trim()) return false;
  if (provenance.usageRights) return validAssetUsageRights(provenance.usageRights) && provenance.usageRights.purposes.includes(purpose);
  if (provenance.rightsStatus === "restricted") return false;
  return provenance.source === "local_import" || provenance.rightsStatus === "cleared" || provenance.rightsStatus === "attribution_required";
}

/** 派生作品的许可与来源取交集，不能通过重新标记生成作品扩大来源授权。 */
export function assetExportRestriction(asset: Asset, assets: readonly Asset[], purpose: ExportPurpose, visited = new Set<string>()): string | undefined {
  const usage = purpose === "draft" ? "内部审阅" : "对外交付";
  if (visited.has(asset.id)) return `素材“${asset.name}”的派生来源存在循环，无法核验${usage}许可。`;
  if (!assetProvenanceAllowsExport(asset.provenance, purpose)) return `素材“${asset.name}”没有允许${usage}的有效许可依据（${asset.provenance?.rightsStatus ?? "unknown"}）。`;
  const next = new Set(visited).add(asset.id);
  for (const sourceId of asset.motion?.sourceAssetIds ?? []) {
    const source = assets.find(candidate => candidate.id === sourceId);
    if (!source) return `作品“${asset.name}”缺少派生来源 ${sourceId}，无法核验${usage}许可。`;
    const reason = assetExportRestriction(source, assets, purpose, next);
    if (reason) return `作品“${asset.name}”继承来源限制：${reason}`;
  }
  return undefined;
}
