import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// 交付时明确指定另一个仓库；运行时不依赖该仓库存在。
const source = fileURLToPath(new URL("../packages/contracts/src/authored-motion-manifest-v1.ts", import.meta.url));
const targetRoot = process.argv[2];
if (!targetRoot || targetRoot.startsWith("--")) throw new Error("请指定 OpenDesign 仓库目录");
const target = resolve(targetRoot, "apps/daemon/src/services/authored-motion-manifest-v1.ts");
const content = await readFile(source);
if (process.argv.includes("--check")) {
  if (!content.equals(await readFile(target))) throw new Error("作者清单合同副本与维护源不一致");
} else {
  await writeFile(target, content);
}
console.log("作者清单 v1 合同一致。 ");
