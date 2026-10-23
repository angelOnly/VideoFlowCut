import { readFileSync } from "node:fs";

/** 直接使用维护源中的教学实现，示范与测试不另维护一份人物组件库。 */
export function readPresenterReference(): string {
  const path = new URL("../../../../.agents/skills/presenter-motion-director/references/presenter-material-choreography.md", import.meta.url);
  const markdown = readFileSync(path, "utf8");
  const blocks = [...markdown.matchAll(/```tsx\r?\n([\s\S]*?)\r?\n```/gu)];
  if (blocks.length !== 2) throw new Error("人物编排参考应包含两段完整 TSX 制法");
  return blocks.map(block => block[1]).join("\n\n");
}
