import {frameHtml} from "./fixtures/hyperframes.js";
import {sizeMotionFixture} from "./fixtures/hyperframes.js";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { PNG } from "pngjs";
import { renderManagedMotion } from "../apps/render-worker/src/motion-renderer.js";
import { validateMotionSource } from "../packages/motion-work/src/compiler.js";
import { motionFixture } from "./fixtures/managed-motion.js";

test("受管 Img 通过 HTML 容器裁切和平移，与 SVG 同层叠加；foreignObject 仍拒绝", { timeout: 60_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "videocut-motion-image-layout-"));
  const source = frameHtml('<div style="position:absolute;left:40px;top:80px;width:160px;height:120px;overflow:hidden"><img id="pic" style="position:absolute;width:320px;height:160px;top:0"></div><svg width="320" height="320" style="position:absolute;inset:0"><line x1="40" y1="130" x2="200" y2="130" stroke="#fff" stroke-width="4"/></svg>',`document.querySelector('#pic').style.left=(-80*f)+'px';`,`document.querySelector('#pic').src=props.assets.evidence;`);
  // 测试色块只用于像素验证，不冒充真实截图或引用证据。
  const picture = new PNG({ width: 320, height: 160 });
  for (let y = 0; y < 160; y++) for (let x = 0; x < 320; x++) {
    picture.data.set(x < 160 ? [255, 0, 0, 255] : [0, 0, 255, 255], (y * 320 + x) * 4);
  }
  try {
    const imageData = { evidence: `data:image/png;base64,${PNG.sync.write(picture).toString("base64")}` };
    const rendered = await renderManagedMotion(sizeMotionFixture({ ...motionFixture, source, durationInFrames: 3 }), root, imageData);
    assert.equal(rendered.frameHashes.length, 3);
    const first = PNG.sync.read(await readFile(join(root, "frames/frame-00000.png")));
    const last = PNG.sync.read(await readFile(join(root, "frames/frame-00002.png")));
    const pixel = (png: PNG, x: number, y: number) => [...png.data.subarray((y * 320 + x) * 4, (y * 320 + x) * 4 + 4)];
    assert.deepEqual(pixel(first, 50, 100), [255, 0, 0, 255]);
    assert.deepEqual(pixel(last, 50, 100), [0, 0, 255, 255]);
    for (const frame of [first, last]) {
      assert.equal(pixel(frame, 30, 100)[3], 0, "图片不得横向越过裁切容器");
      assert.equal(pixel(frame, 50, 210)[3], 0, "图片不得纵向越过裁切容器");
      assert.deepEqual(pixel(frame, 100, 130), [255, 255, 255, 255], "SVG 标注必须叠加在受管图片之上");
    }
    assert.doesNotThrow(() => validateMotionSource(source));
  } finally { await rm(root, { recursive: true, force: true }); }
});
