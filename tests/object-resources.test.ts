import assert from "node:assert/strict";
import test from "node:test";
import { PNG } from "pngjs";
import { prepareObjectResourcePixels, objectResourceHash, validateObjectResourceSpec, ObjectResourceError, type NormalizedObjectSource } from "../packages/media-intelligence/src/object-resources/index.js";

const source = (width: number, height: number, color: number[]): NormalizedObjectSource => {
  const data = Buffer.from(Array.from({ length: width * height }, () => color).flat());
  return { width, height, data, sourceHash: objectResourceHash(data), normalization: "test-srgb" };
};
const part = (id: string, source_id = "source") => ({ id, source_id, trim_transparent: true, local_rect: { x: -20, y: 10, width: 80, height: 60 } });
const spec = (parts = [part("body")], atlas = { enabled: true, max_side: 32, max_pages: 8 }) => ({ sources: [{ id: "source", asset_id: "asset" }], parts, atlas });

test("显式遮罩使用原图坐标，裁切透明边后保留局部框与轴心，边缘扩展不串色", () => {
  const image = source(8, 6, [230, 20, 10, 200]), mask = source(8, 6, [255, 255, 255, 0]);
  for (let y = 2; y < 4; y++) for (let x = 3; x < 6; x++) mask.data[(y * 8 + x) * 4 + 3] = 128;
  const input = { ...spec(), sources: [...spec().sources, { id: "mask", asset_id: "maskAsset" }], parts: [
    { ...part("body"), source_rect: { x: 1, y: 1, width: 6, height: 4 }, alpha_mask_source_id: "mask", mask_mode: "alpha" },
    { ...part("back"), trim_transparent: false, source_rect: { x: 0, y: 0, width: 2, height: 2 } }
  ] };
  const result = prepareObjectResourcePixels(input, { source: image, mask });
  const body = result.layout.parts.find(p => p.id === "body")!;
  assert.deepEqual(body.sourceSize, { width: 6, height: 4 });
  assert.deepEqual(body.trimOffset, { x: 2, y: 1 });
  assert.deepEqual(body.localRect, part("body").local_rect);
  assert.equal(body.atlasRect.width, 3); assert.equal(body.atlasRect.height, 2);
  const png = PNG.sync.read(result.pages[0]!.bytes);
  for (const offset of [-2, -1, 0, 2, 3, 4]) {
    const index = ((body.atlasRect.y - 1) * png.width + body.atlasRect.x + offset) * 4;
    assert.deepEqual([...png.data.subarray(index, index + 4)], [230, 20, 10, 100]);
  }
  const luma = prepareObjectResourcePixels({ ...input, parts: [{ ...input.parts[0], mask_mode: "luminance" }] }, { source: image, mask: source(8, 6, [128, 128, 128, 255]) });
  assert.equal(PNG.sync.read(luma.pages[0]!.bytes).data[3], 100);
});

test("图集排列及哈希确定，无关说明不影响身份，源和制法改变产生新身份", () => {
  const image = source(4, 4, [20, 120, 200, 255]);
  const input = spec([part("b"), part("a")]);
  const a = prepareObjectResourcePixels(input, { source: image });
  const renamed = { ...image, displayName: "改说明" };
  const b = prepareObjectResourcePixels({ ...input, parts: [...input.parts].reverse() }, { source: renamed });
  assert.deepEqual(a, b);
  assert.equal(a.layout.parts[0]!.id, "a");
  assert.notEqual(a.layout.inputHash, prepareObjectResourcePixels(input, { source: { ...image, sourceHash: "new-bytes" } }).layout.inputHash);
  assert.notEqual(a.layout.inputHash, prepareObjectResourcePixels({ ...input, parts: [part("a")] }, { source: image }).layout.inputHash);
  assert.notEqual(a.layout.inputHash, prepareObjectResourcePixels(input, { source: { ...image, normalization: "new-decoder" } }).layout.inputHash);
});

test("缺源、越界、遮罩不完整、尺寸不同和全透明明确失败，超页数报告实际需求", () => {
  const image = source(4, 4, [0, 0, 255, 255]);
  const fails = (input: unknown, sources: Record<string, NormalizedObjectSource>, code: string) => assert.throws(() => prepareObjectResourcePixels(input, sources), (error: unknown) => error instanceof ObjectResourceError && error.code === code);
  fails(spec(), {}, "OBJECT_RESOURCE_SOURCE_MISSING");
  fails({ ...spec(), parts: [{ ...part("a"), source_rect: { x: 3, y: 0, width: 4, height: 4 } }] }, { source: image }, "OBJECT_RESOURCE_CROP_BOUNDS");
  fails({ ...spec(), parts: [{ ...part("a"), alpha_mask_source_id: "source" }] }, { source: image }, "OBJECT_RESOURCE_MASK_MODE");
  fails({ ...spec(), sources: [...spec().sources, { id: "mask", asset_id: "mask" }], parts: [{ ...part("a"), alpha_mask_source_id: "mask", mask_mode: "alpha" }] }, { source: image, mask: source(3, 4, [0, 0, 0, 255]) }, "OBJECT_RESOURCE_MASK_SIZE");
  fails(spec(), { source: source(4, 4, [0, 0, 0, 0]) }, "OBJECT_RESOURCE_EMPTY");
  fails(spec([part("a"), part("a")]), { source: image }, "OBJECT_RESOURCE_DUPLICATE_ID");
  assert.throws(() => prepareObjectResourcePixels(spec([part("a"), part("b"), part("c")], { enabled: true, max_side: 8, max_pages: 1 }), { source: image }),
    (error: unknown) => error instanceof ObjectResourceError && error.code === "OBJECT_RESOURCE_PAGE_LIMIT" && error.details.requiredPages === 3);
  assert.throws(() => validateObjectResourceSpec({ ...spec(), parts: [{ ...part("a"), source_rect: { x: 0.5, y: 0, width: 4, height: 4 } }] }));
});
