import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { build } from "esbuild";
import { pluginRootFromModule, resolveRepoRoot } from "./repo-root.mjs";

const pluginRoot = pluginRootFromModule(import.meta.url);
const repoRoot = resolveRepoRoot({ pluginRoot });
const runtimeRoot = join(pluginRoot, "runtime");
const distRoot = join(runtimeRoot, "dist");
const webSourceRoot = join(repoRoot, "apps", "web", "dist");

/**
 * 发行入口只打包本仓库的 TypeScript 与 JSX；第三方包仍由宿主仓库的 node_modules
 * 提供。启动器会给 CommonJS 入口设置 NODE_PATH，因此插件缓存无需复制一棵
 * 不可控、体积很大的 node_modules，也不再依赖 tsx 或 apps/*.ts 源文件。
 */
const aliases = {
  "@videocut/contracts": join(repoRoot, "packages", "contracts", "src", "index.ts"),
  "@videocut/domain": join(repoRoot, "packages", "edit-domain", "src", "index.ts"),
  "@videocut/application": join(repoRoot, "packages", "edit-application", "src", "index.ts"),
  "@videocut/acquisition": join(repoRoot, "packages", "asset-acquisition", "src", "index.ts"),
  "@videocut/bridge": join(repoRoot, "packages", "comfyui-bridge-client", "src", "index.ts"),
  "@videocut/speech": join(repoRoot, "packages", "speech-services", "src", "index.ts"),
  "@videocut/quality": join(repoRoot, "packages", "quality-system", "src", "index.ts"),
  "@videocut/job-runtime": join(repoRoot, "packages", "job-runtime", "src", "index.ts"),
  "@videocut/remotion": join(repoRoot, "packages", "remotion-runtime", "src", "index.tsx")
};

const outputPaths = {
  runtime: join(distRoot, "runtime.cjs"),
  mcp: join(distRoot, "mcp.cjs"),
  remotion: join(distRoot, "remotion", "render-entry.cjs"),
  web: join(distRoot, "web"),
  manifest: join(distRoot, "manifest.json")
};

const buildOptions = {
  absWorkingDir: repoRoot,
  bundle: true,
  format: "cjs",
  platform: "node",
  // 项目存储层使用 node:sqlite；该内置模块从 Node 22.5 起可用。
  target: "node22",
  packages: "external",
  alias: aliases,
  legalComments: "none",
  minifyWhitespace: true,
  sourcemap: false,
  logLevel: "warning",
  banner: {
    js: "/* 此文件由 npm run plugin:build 自动生成；请修改源码与 build-runtime.mjs。 */"
  }
};

function assertUnder(root, candidate) {
  const relativePath = relative(root, candidate);
  if (relativePath.startsWith("..") || relativePath === "") {
    throw new Error(`发行构建目标不在插件 runtime 目录内：${candidate}`);
  }
}

async function requireNonEmpty(path, label) {
  const information = await stat(path).catch(() => undefined);
  if (!information?.isFile() || information.size <= 0) {
    throw new Error(`${label} 未生成或为空：${path}`);
  }
}

/** Vite 压缩产物偶尔保留行尾空格；发行文件统一清理，避免提交校验被生成噪声阻断。 */
async function trimReleaseTextWhitespace(root) {
  const entries = await readdir(root, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return trimReleaseTextWhitespace(path);
    if (!/\.(?:css|html|js)$/iu.test(entry.name)) return undefined;
    const contents = await readFile(path, "utf8");
    const normalized = contents.replace(/[\t ]+(?=\r?\n)/gu, "");
    if (normalized !== contents) await writeFile(path, normalized, "utf8");
    return undefined;
  }));
}

async function assertReleaseEntry(path) {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(path, "utf8");
  const forbidden = [
    /apps[\\/]runtime[\\/]src/iu,
    /apps[\\/]server[\\/]src[\\/]mcp/iu,
    /apps[\\/]render-worker[\\/]src[\\/]render-entry/iu,
    /[\\/]tsx(?:[\\/]|['"])/iu
  ];
  const hit = forbidden.find((pattern) => pattern.test(source));
  if (hit) throw new Error(`发行入口仍包含源码启动引用 ${hit}：${path}`);
}

async function main() {
  if (!existsSync(webSourceRoot)) {
    throw new Error(`找不到 Web 构建产物：${webSourceRoot}。请先执行 npm run build:web。`);
  }
  assertUnder(runtimeRoot, distRoot);
  // dist 是唯一允许整目录覆盖的生成目标；repo-root.json 和用户数据不会触及。
  await rm(distRoot, { recursive: true, force: true });
  await mkdir(dirname(outputPaths.remotion), { recursive: true });

  await Promise.all([
    build({
      ...buildOptions,
      entryPoints: [join(repoRoot, "apps", "runtime", "src", "index.ts")],
      outfile: outputPaths.runtime
    }),
    build({
      ...buildOptions,
      entryPoints: [join(repoRoot, "apps", "server", "src", "mcp.ts")],
      outfile: outputPaths.mcp
    }),
    build({
      ...buildOptions,
      entryPoints: [join(repoRoot, "apps", "render-worker", "src", "render-entry.tsx")],
      outfile: outputPaths.remotion
    })
  ]);
  await cp(webSourceRoot, outputPaths.web, { recursive: true, force: true });
  await trimReleaseTextWhitespace(outputPaths.web);
  await Promise.all([
    requireNonEmpty(outputPaths.runtime, "Runtime 入口"),
    requireNonEmpty(outputPaths.mcp, "MCP 入口"),
    requireNonEmpty(outputPaths.remotion, "Remotion 入口"),
    requireNonEmpty(join(outputPaths.web, "index.html"), "Web 入口")
  ]);
  await Promise.all([
    assertReleaseEntry(outputPaths.runtime),
    assertReleaseEntry(outputPaths.mcp),
    assertReleaseEntry(outputPaths.remotion)
  ]);
  await writeFile(outputPaths.manifest, `${JSON.stringify({
    schemaVersion: 1,
    format: "commonjs",
    runtimeEntry: "runtime.cjs",
    mcpEntry: "mcp.cjs",
    remotionEntry: "remotion/render-entry.cjs",
    webRoot: "web",
    nodeRuntime: ">=22.5.0",
    dependencies: "由启动器通过宿主仓库 node_modules 的 NODE_PATH 提供；发行入口不使用 tsx 或 apps 源码。"
  }, null, 2)}\n`, "utf8");
  console.log(`已生成 VideoFlowCut 插件发行 Runtime：${distRoot}`);
}

await main();
