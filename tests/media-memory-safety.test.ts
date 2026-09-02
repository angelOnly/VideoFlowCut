import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ComfyUIBridgeClient, type BridgeWorkflow } from "@videocut/bridge";
import { sha256File } from "../apps/server/src/media-hash.js";

test("本地媒体 SHA-256 按流读取，长文件哈希仍与标准结果一致", async () => {
  const directory = await mkdtemp(join(tmpdir(), "videocut-stream-hash-"));
  const target = join(directory, "long-source.mp4");
  try {
    const expected = createHash("sha256");
    for (let index = 0; index < 12; index += 1) {
      const chunk = Buffer.alloc(512 * 1024, index);
      await appendFile(target, chunk);
      expected.update(chunk);
    }
    assert.equal(await sha256File(target), expected.digest("hex"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Bridge multipart 上传使用文件背载 Blob，保持原有表单合同而不预读完整媒体", async () => {
  const directory = await mkdtemp(join(tmpdir(), "videocut-bridge-upload-"));
  const target = join(directory, "long-source.wav");
  const originalFetch = globalThis.fetch;
  try {
    const bytes = Buffer.alloc(3 * 1024 * 1024, 0x5a);
    await writeFile(target, bytes);
    const workflow: BridgeWorkflow = {
      id: "stream-upload-workflow",
      name: "流式上传测试",
      available: true,
      schemaVersion: "v1",
      fields: [],
      itemSlots: [{ id: "audio", label: "Audio", kind: "audio", required: true }],
      outputs: []
    };
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      assert.match(String(input), /\/workflows\/stream-upload-workflow\/runs$/u);
      assert.ok(init?.body instanceof FormData, "有本地文件时仍必须使用 Bridge multipart 合同");
      const form = init.body as FormData;
      assert.deepEqual(JSON.parse(String(form.get("request"))), { schemaVersion: "v1", fieldValues: { prompt: "测试" } });
      const upload = form.get("file_audio");
      assert.ok(upload instanceof Blob, "本地文件必须作为 Blob 交给 Undici 按需发送");
      assert.equal(upload.type, "audio/wav");
      assert.equal(upload.size, bytes.byteLength);
      return Response.json({ id: "stream-upload-run", status: "queued", outputs: [] });
    }) as typeof fetch;

    const client = new ComfyUIBridgeClient("http://bridge.test/comfyui-bridge/v1");
    const result = await client.createRun({
      workflow,
      fieldValues: { prompt: "测试" },
      files: [{ slot: workflow.itemSlots[0]!, path: target, mime: "audio/wav" }]
    });
    assert.equal(result.id, "stream-upload-run");
  } finally {
    globalThis.fetch = originalFetch;
    await rm(directory, { recursive: true, force: true });
  }
});
