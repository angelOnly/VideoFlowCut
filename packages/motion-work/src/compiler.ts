import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { build } from "esbuild";
import ts from "typescript";
import type { BoundMotionImage, BoundMotionVideo, DecodedMotionVideo, MotionSubmission } from "./schema.js";

export const MOTION_ENGINE_VERSION = "managed-motion-8";
const forbidden = new Set(["eval", "Function", "globalThis", "window", "document", "navigator", "location", "parent", "top", "opener", "self", "fetch", "XMLHttpRequest", "WebSocket", "Worker", "SharedWorker", "process", "require", "Date", "performance", "setTimeout", "setInterval", "requestAnimationFrame", "localStorage", "sessionStorage", "indexedDB", "constructor", "__proto__", "prototype"]);
const prototypeProperties = new Set(["constructor", "__proto__", "prototype"]);
const allowedImports: Record<string, Set<string>> = {
  "@videoflowcut/motion": new Set(["BoundVideo"]),
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
  // 同名字段只对可确认的数据接收者开放，不把任意对象上的 window/fetch 当成数据。
  // Props 来自平台 JSON；普通局部常量仅沿字面量与数据展开追溯，类型断言不作为证明。
  const isDataValue = (node: ts.Expression, seen = new Set<ts.Node>()): boolean => {
    if (seen.has(node) || seen.size > 32) return false;
    const next = new Set(seen).add(node);
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)
      || ts.isSatisfiesExpression(node) || ts.isNonNullExpression(node)) return isDataValue(node.expression, next);
    if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)
      || [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.kind)) return true;
    if (ts.isPrefixUnaryExpression(node) && [ts.SyntaxKind.MinusToken, ts.SyntaxKind.PlusToken].includes(node.operator)) return isDataValue(node.operand, next);
    if (ts.isArrayLiteralExpression(node)) return node.elements.every((item) => isDataValue(ts.isSpreadElement(item) ? item.expression : item, next));
    if (ts.isObjectLiteralExpression(node)) return node.properties.every((item) => {
      if (ts.isSpreadAssignment(item)) return isDataValue(item.expression, next);
      if (ts.isShorthandPropertyAssignment(item)) return isDataValue(item.name, next);
      return ts.isPropertyAssignment(item) && !ts.isComputedPropertyName(item.name)
        && !prototypeProperties.has(item.name.text) && isDataValue(item.initializer, next);
    });
    if (ts.isPropertyAccessExpression(node)) return !prototypeProperties.has(node.name.text) && isDataValue(node.expression, next);
    if (ts.isElementAccessExpression(node)) return ts.isStringLiteralLike(node.argumentExpression)
      && !prototypeProperties.has(node.argumentExpression.text) && isDataValue(node.expression, next);
    if (!ts.isIdentifier(node)) return false;
    const symbol = ts.isShorthandPropertyAssignment(node.parent)
      ? checker.getShorthandAssignmentValueSymbol(node.parent) : checker.getSymbolAtLocation(node);
    const declaration = symbol?.valueDeclaration;
    if (!declaration || declaration.getSourceFile() !== file || !isLocalValue(node)) return false;
    if (ts.isVariableDeclaration(declaration)) return ts.isVariableDeclarationList(declaration.parent)
      && Boolean(declaration.parent.flags & ts.NodeFlags.Const) && Boolean(declaration.initializer && isDataValue(declaration.initializer, next));
    if (!ts.isParameter(declaration)) return false;
    const owner = declaration.parent;
    if (!ts.isFunctionDeclaration(owner) && !ts.isFunctionExpression(owner) && !ts.isArrowFunction(owner)) return false;
    return owner.parameters[0] === declaration && (
      ts.isFunctionDeclaration(owner) && Boolean(ts.getModifiers(owner)?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword))
      || ts.isExportAssignment(owner.parent) && !owner.parent.isExportEquals);
  };
  const isDataProperty = (node: ts.PropertyAccessExpression | ts.ElementAccessExpression, name: string) =>
    !prototypeProperties.has(name) && isDataValue(node.expression);
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
      && (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node
        ? !isDataProperty(node.parent, node.text) : !isLocalValue(node));
    const forbiddenElement = ts.isStringLiteralLike(node) && ts.isElementAccessExpression(node.parent)
      && node.parent.argumentExpression === node && forbidden.has(node.text) && !isDataProperty(node.parent, node.text);
    if (forbiddenIdentifier || forbiddenElement) throw new Error(`MOTION_API_REJECTED: ${node.getText(file)}`);
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

export function motionHash(input: MotionSubmission, images: BoundMotionImage[] = [], engineVersion = MOTION_ENGINE_VERSION, videos: BoundMotionVideo[] = []): string {
  const hash = createHash("sha256").update(engineVersion).update(JSON.stringify(input)).update(JSON.stringify(images));
  // 无视频时不追加空数组，历史作品哈希保持原样。
  if (videos.length) hash.update(JSON.stringify(videos));
  return hash.digest("hex");
}
/** 旧 Job 的输入哈希保持可核验；新提交固定新引擎，不能使历史作品版本漂移。 */
export function motionHashEngine(input: MotionSubmission, images: BoundMotionImage[], version: unknown, declared?: unknown, videos: BoundMotionVideo[] = []): string {
  const accepted = [MOTION_ENGINE_VERSION, "managed-motion-7", "managed-motion-6", "managed-motion-5", "managed-motion-4", "managed-motion-3"];
  const engine = accepted.find((candidate) => (declared === undefined || declared === candidate) && motionHash(input, images, candidate, videos) === version);
  if (!engine) throw new Error("MOTION_VERSION_MISMATCH");
  return engine;
}

/** esbuild 只转换用户源码，不在 Node 中求值；只有受信任依赖可由文件系统解析。 */
export async function compileMotion(input: MotionSubmission, imageData: Record<string, string> = {}, videos: Record<string, DecodedMotionVideo> = {}): Promise<string> {
  validateMotionSource(input.source);
  const require = createRequire(typeof __filename === "string" ? __filename : import.meta.url);
  const entry = `import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';import {Player} from '@remotion/player';import Motion,* as motionModule from 'motion-user';
window.__readMotionEvents=()=>typeof motionModule.resolveMotionEvents==='function'?motionModule.resolveMotionEvents(${JSON.stringify(input.props)},{fps:${input.fps},durationInFrames:${input.durationInFrames}}):null;
const ref=React.createRef();const root=createRoot(document.getElementById('root'));
flushSync(()=>root.render(React.createElement(Player,{ref,component:Motion,errorFallback:({error})=>{window.__motionError=String(error);return null},inputProps:${JSON.stringify({ ...input.props, assets: imageData })},durationInFrames:${input.durationInFrames},fps:${input.fps},compositionWidth:${input.width},compositionHeight:${input.height},controls:false,autoPlay:false,loop:false,style:{width:${input.width},height:${input.height}}})));
window.__motionReady=true;window.__motionSeek=async(frame)=>{if(window.__motionError)throw new Error(window.__motionError);ref.current.seekTo(frame);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await document.fonts.ready;if(window.__motionError)throw new Error(window.__motionError);};`;
  const result = await build({
    stdin: { contents: entry, sourcefile: "motion-entry.tsx", loader: "tsx" }, bundle: true, write: false,
    // 浏览器依赖只看到固定构建常量，不注入任何宿主环境变量。
    platform: "browser", format: "iife", minify: true, define: { "process.env": JSON.stringify({ NODE_ENV: "production" }) }, logLevel: "silent",
    plugins: [{ name: "motion-closed-imports", setup(builder) {
      builder.onResolve({ filter: /^@videoflowcut\/motion$/ }, () => ({ path: "bound-video", namespace: "trusted-video" }));
      builder.onLoad({ filter: /.*/, namespace: "trusted-video" }, () => ({ loader: "tsx", contents: `
import React from 'react';import {useCurrentFrame,Img} from 'remotion';
const counts=${JSON.stringify(Object.fromEntries(Object.entries(videos).map(([slot, video]) => [slot, video.framePaths.length])))};
export function BoundVideo({slot,offsetInFrames=0,style,fit='cover'}) {
 const frame=useCurrentFrame()+offsetInFrames;
 if(!Number.isInteger(frame)||frame<0||!Object.hasOwn(counts,slot)||frame>=counts[slot]) throw new Error('MOTION_VIDEO_RANGE: '+slot+' frame '+frame);
 if(!['cover','contain','fill'].includes(fit)) throw new Error('MOTION_VIDEO_FIT');
 return <Img src={'https://motion.invalid/video/'+slot+'/'+frame+'.png'} style={{width:'100%',height:'100%',objectFit:fit,...style}}/>;
}` }));
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
