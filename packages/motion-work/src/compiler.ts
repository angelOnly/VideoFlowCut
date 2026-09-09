import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { build } from "esbuild";
import ts from "typescript";
import type { BoundMotionImage, MotionSubmission } from "./schema.js";

export const MOTION_ENGINE_VERSION = "managed-motion-4";
const forbidden = new Set(["eval", "Function", "globalThis", "window", "document", "navigator", "location", "parent", "top", "opener", "self", "fetch", "XMLHttpRequest", "WebSocket", "Worker", "SharedWorker", "process", "require", "Date", "performance", "setTimeout", "setInterval", "requestAnimationFrame", "localStorage", "sessionStorage", "indexedDB", "constructor", "__proto__", "prototype"]);
const allowedImports: Record<string, Set<string>> = {
  react: new Set(["default", "Fragment", "createElement", "useMemo"]),
  remotion: new Set(["AbsoluteFill", "Img", "Sequence", "Series", "useCurrentFrame", "useVideoConfig", "interpolate", "interpolateColors", "spring", "Easing", "random"])
};

/** AST 用于依赖与确定性约束；真正的执行安全还依赖 Chromium sandbox、CSP 和网络拒绝。 */
export function validateMotionSource(source: string): void {
  const file = ts.createSourceFile("motion.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const diagnostics = (file as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics;
  if (diagnostics.length) throw new Error(`MOTION_SOURCE_INVALID: ${ts.flattenDiagnosticMessageText(diagnostics[0].messageText, " ")}`);
  // 只绑定当前源码中的词法作用域，不读取宿主文件或解析外部依赖。
  // 同名局部变量可以用于几何计算；未绑定的浏览器全局仍须拒绝。
  const checker = ts.createProgram([file.fileName], { noLib: true, noResolve: true }, {
    getSourceFile: (name) => name === file.fileName ? file : undefined,
    getDefaultLibFileName: () => "", writeFile: () => {}, getCurrentDirectory: () => "",
    getDirectories: () => [], fileExists: (name) => name === file.fileName,
    readFile: (name) => name === file.fileName ? source : undefined,
    getCanonicalFileName: (name) => name, useCaseSensitiveFileNames: () => true, getNewLine: () => "\n"
  }).getTypeChecker();
  const isLocalValue = (node: ts.Identifier) => {
    const symbol = ts.isShorthandPropertyAssignment(node.parent)
      ? checker.getShorthandAssignmentValueSymbol(node.parent) : checker.getSymbolAtLocation(node);
    // 类型、接口、declare 声明不会建立运行时绑定，不能据此放行浏览器全局。
    return symbol?.declarations?.some((declaration) => {
      if (!ts.isVariableDeclaration(declaration) && !ts.isParameter(declaration) && !ts.isBindingElement(declaration)
        && !ts.isFunctionDeclaration(declaration) && !ts.isFunctionExpression(declaration)
        && !ts.isClassDeclaration(declaration) && !ts.isClassExpression(declaration)
        && !ts.isImportClause(declaration) && !ts.isImportSpecifier(declaration)) return false;
      if (ts.isFunctionDeclaration(declaration) && !declaration.body) return false;
      for (let ancestor: ts.Node | undefined = declaration; ancestor; ancestor = ancestor.parent) {
        if (ts.canHaveModifiers(ancestor) && ts.getModifiers(ancestor)?.some((m) => m.kind === ts.SyntaxKind.DeclareKeyword)) return false;
        if ((ts.isImportClause(ancestor) || ts.isImportSpecifier(ancestor)) && ancestor.isTypeOnly) return false;
      }
      return declaration.getSourceFile() === file;
    }) ?? false;
  };
  let hasDefault = false;
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      const module = ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : "";
      const permitted = allowedImports[module];
      if (!permitted || !node.importClause || node.importClause.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings)) throw new Error(`MOTION_IMPORT_REJECTED: ${module}`);
      if (node.importClause.name && module !== "react") throw new Error("MOTION_IMPORT_REJECTED: 仅 React 支持 default import");
      if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        for (const entry of node.importClause.namedBindings.elements) if (!permitted.has((entry.propertyName ?? entry.name).text)) throw new Error(`MOTION_IMPORT_REJECTED: ${entry.name.text}`);
      }
    }
    if (ts.isExportDeclaration(node) || ts.isImportEqualsDeclaration(node) || ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) throw new Error("MOTION_IMPORT_REJECTED: 不允许转导出、require 或动态 import");
    if (ts.isExportAssignment(node) && !node.isExportEquals || ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) hasDefault = true;
    const literalPropertyName = node.parent && (ts.isPropertyAssignment(node.parent) || ts.isPropertySignature(node.parent)) && node.parent.name === node;
    const forbiddenIdentifier = ts.isIdentifier(node) && !literalPropertyName && forbidden.has(node.text)
      && (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node || !isLocalValue(node));
    if (forbiddenIdentifier || ts.isStringLiteral(node) && ts.isElementAccessExpression(node.parent) && forbidden.has(node.text)) throw new Error(`MOTION_API_REJECTED: ${node.getText(file)}`);
    if (ts.isPropertyAccessExpression(node) && node.expression.getText(file) === "Math" && node.name.text === "random") throw new Error("MOTION_NONDETERMINISTIC: 使用 Remotion random(seed)，不要 Math.random()");
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(file);
      const owner = node.parent.parent;
      const managedImage = name === "src" && (ts.isJsxOpeningElement(owner) || ts.isJsxSelfClosingElement(owner)) && owner.tagName.getText(file) === "Img" && node.initializer && ts.isJsxExpression(node.initializer);
      if (/^on[A-Z]/u.test(name) || ["dangerouslySetInnerHTML", "href", "srcDoc"].includes(name) || name === "src" && !managedImage) throw new Error("MOTION_DOM_REJECTED: 图片用 Img 和 props.assets 的受管数据，其余事件、HTML 或外部链接不可用");
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      if (["script", "iframe", "object", "embed", "link", "meta", "style", "audio", "video", "img", "canvas", "foreignObject"].includes(node.tagName.getText(file))) throw new Error("MOTION_DOM_REJECTED: 当前作品只允许文字、CSS 和 SVG 图形");
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!hasDefault) throw new Error("MOTION_DEFAULT_EXPORT_REQUIRED: 导出默认 React 组件");
  if (/\b(?:transition|animation)\s*:/u.test(source)) throw new Error("MOTION_NONDETERMINISTIC: 动画必须由 useCurrentFrame 驱动，不能使用 CSS transition/animation");
}

export function motionHash(input: MotionSubmission, images: BoundMotionImage[] = [], engineVersion = MOTION_ENGINE_VERSION): string {
  return createHash("sha256").update(engineVersion).update(JSON.stringify(input)).update(JSON.stringify(images)).digest("hex");
}
/** 旧 Job 的输入哈希保持可核验；新提交固定新引擎，不能使历史作品版本漂移。 */
export function motionHashEngine(input: MotionSubmission, images: BoundMotionImage[], version: unknown, declared?: unknown): string {
  const accepted = [MOTION_ENGINE_VERSION, "managed-motion-3"];
  const engine = accepted.find((candidate) => (declared === undefined || declared === candidate) && motionHash(input, images, candidate) === version);
  if (!engine) throw new Error("MOTION_VERSION_MISMATCH");
  return engine;
}

/** esbuild 只转换用户源码，不在 Node 中求值；只有受信任依赖可由文件系统解析。 */
export async function compileMotion(input: MotionSubmission, imageData: Record<string, string> = {}): Promise<string> {
  validateMotionSource(input.source);
  const require = createRequire(typeof __filename === "string" ? __filename : import.meta.url);
  const entry = `import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';import {Player} from '@remotion/player';import Motion,* as motionModule from 'motion-user';
window.__readMotionEvents=()=>typeof motionModule.resolveMotionEvents==='function'?motionModule.resolveMotionEvents(${JSON.stringify(input.props)},{fps:${input.fps},durationInFrames:${input.durationInFrames}}):null;
const ref=React.createRef();const root=createRoot(document.getElementById('root'));
flushSync(()=>root.render(React.createElement(Player,{ref,component:Motion,inputProps:${JSON.stringify({ ...input.props, assets: imageData })},durationInFrames:${input.durationInFrames},fps:${input.fps},compositionWidth:${input.width},compositionHeight:${input.height},controls:false,autoPlay:false,loop:false,style:{width:${input.width},height:${input.height}}})));
window.__motionReady=true;window.__motionSeek=async(frame)=>{ref.current.seekTo(frame);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await document.fonts.ready;};`;
  const result = await build({
    stdin: { contents: entry, sourcefile: "motion-entry.tsx", loader: "tsx" }, bundle: true, write: false,
    // 浏览器依赖只看到固定构建常量，不注入任何宿主环境变量。
    platform: "browser", format: "iife", minify: true, define: { "process.env": JSON.stringify({ NODE_ENV: "production" }) }, logLevel: "silent",
    plugins: [{ name: "motion-closed-imports", setup(builder) {
      builder.onResolve({ filter: /^motion-user$/ }, () => ({ path: "motion-user", namespace: "motion" }));
      builder.onLoad({ filter: /.*/, namespace: "motion" }, () => ({ contents: input.source, loader: "tsx" }));
      builder.onResolve({ filter: /.*/ }, (args) => {
        if (args.namespace === "motion" && !["react", "remotion", "react/jsx-runtime"].includes(args.path)) throw new Error("MOTION_IMPORT_REJECTED");
        if (["react", "react-dom/client", "react-dom", "@remotion/player", "remotion", "react/jsx-runtime"].includes(args.path)) return { path: require.resolve(args.path) };
        return undefined;
      });
    } }]
  });
  return result.outputFiles[0].text;
}
