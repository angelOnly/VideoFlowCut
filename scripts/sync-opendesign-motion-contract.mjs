import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// 同仓维护一份合同；画面模块的副本由构建统一生成。
const source = fileURLToPath(new URL("../packages/contracts/src/authored-motion-manifest-v1.ts", import.meta.url));
const target = fileURLToPath(new URL("../components/open-design/apps/daemon/src/services/authored-motion-manifest-v1.ts", import.meta.url));
const content = await readFile(source);
if (process.argv.includes("--check")) {
  if (!content.equals(await readFile(target))) throw new Error("作者清单合同副本与维护源不一致");
} else {
  await writeFile(target, content);
}
console.log("作者清单 v1 合同一致。 ");
