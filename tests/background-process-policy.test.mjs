import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const processMethods = new Set(["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]);
const commandMethods = new Set(["exec", "execSync"]);
const childProcessModules = new Set(["child_process", "node:child_process"]);

function childProcessCall(expression) {
  return ts.isCallExpression(expression)
    && ts.isIdentifier(expression.expression)
    && expression.expression.text === "require"
    && expression.arguments.length === 1
    && ts.isStringLiteral(expression.arguments[0])
    && childProcessModules.has(expression.arguments[0].text);
}

function inspectSource(source, fileName) {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  const methods = new Map();
  const namespaces = new Set();
  const values = new Map();
  const promisifyNames = new Set(["promisify"]);

  function visitImports(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const module = node.moduleSpecifier.text;
      const bindings = node.importClause?.namedBindings;
      if (childProcessModules.has(module)) {
        if (node.importClause?.name) namespaces.add(node.importClause.name.text);
        if (bindings && ts.isNamespaceImport(bindings)) namespaces.add(bindings.name.text);
        if (bindings && ts.isNamedImports(bindings)) {
          for (const item of bindings.elements) {
            const method = (item.propertyName ?? item.name).text;
            if (processMethods.has(method)) methods.set(item.name.text, method);
          }
        }
      }
      if ((module === "node:util" || module === "util") && bindings && ts.isNamedImports(bindings)) {
        for (const item of bindings.elements) {
          if ((item.propertyName ?? item.name).text === "promisify") promisifyNames.add(item.name.text);
        }
      }
    }
    if (ts.isVariableDeclaration(node) && node.initializer) {
      if (ts.isIdentifier(node.name)) {
        values.set(node.name.text, node.initializer);
        if (childProcessCall(node.initializer)) namespaces.add(node.name.text);
      } else if (ts.isObjectBindingPattern(node.name) && childProcessCall(node.initializer)) {
        for (const item of node.name.elements) {
          if (ts.isIdentifier(item.name)) {
            const method = item.propertyName?.getText(file) ?? item.name.text;
            if (processMethods.has(method)) methods.set(item.name.text, method);
          }
        }
      }
    }
    ts.forEachChild(node, visitImports);
  }
  visitImports(file);

  function methodOf(expression) {
    if (ts.isIdentifier(expression)) return methods.get(expression.text);
    if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression)
      && namespaces.has(expression.expression.text) && processMethods.has(expression.name.text)) return expression.name.text;
    if (ts.isElementAccessExpression(expression) && ts.isIdentifier(expression.expression)
      && namespaces.has(expression.expression.text) && ts.isStringLiteral(expression.argumentExpression)
      && processMethods.has(expression.argumentExpression.text)) return expression.argumentExpression.text;
  }

  for (const [name, value] of values) {
    if (ts.isCallExpression(value) && ts.isIdentifier(value.expression)
      && promisifyNames.has(value.expression.text) && value.arguments.length === 1) {
      const method = methodOf(value.arguments[0]);
      if (method) methods.set(name, method);
    }
  }

  function hidesWindow(expression) {
    if (!expression) return false;
    if (ts.isIdentifier(expression)) expression = values.get(expression.text);
    if (!expression || !ts.isObjectLiteralExpression(expression)) return false;
    let hidden = false;
    for (const property of expression.properties) {
      if (ts.isSpreadAssignment(property)) hidden = false;
      if (ts.isPropertyAssignment(property) && property.name.getText(file).replace(/["']/gu, "") === "windowsHide") {
        hidden = property.initializer.kind === ts.SyntaxKind.TrueKeyword;
      }
    }
    return hidden;
  }

  const violations = [];
  function visitCalls(node) {
    if (ts.isCallExpression(node)) {
      const method = methodOf(node.expression);
      if (method) {
        const options = commandMethods.has(method) ? node.arguments[1] : node.arguments[2] ?? node.arguments[1];
        if (!hidesWindow(options)) {
          const line = file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
          violations.push(`${fileName}:${line} ${method}`);
        }
      }
    }
    ts.forEachChild(node, visitCalls);
  }
  visitCalls(file);
  return violations;
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.isFile() && /\.(?:[cm]?js|tsx?)$/u.test(entry.name) ? [path] : [];
  }));
  return files.flat();
}

test("视频业务的子进程调用显式隐藏 Windows 窗口", async () => {
  const root = resolve(".");
  const packages = await readdir(join(root, "packages"), { withFileTypes: true });
  const directories = ["apps/server/src", "apps/job-worker/src", "apps/render-worker/src", "apps/runtime/src",
    "references/motion-cases/skillry/tools"];
  for (const entry of packages) {
    if (entry.isDirectory()) {
      const src = join(root, "packages", entry.name, "src");
      try { await readdir(src); directories.push(src); } catch (error) { if (error.code !== "ENOENT") throw error; }
    }
  }
  const launcherFiles = ["runtime-launcher.mjs", "open-design-mcp-launcher.mjs", "open-design-release.mjs", "prepare-render-browser.mjs"]
    .map(name => join(root, "plugins/videoflowcut/scripts", name));
  const files = (await Promise.all(directories.map(directory => sourceFiles(resolve(root, directory))))).flat().concat(launcherFiles);
  const violations = (await Promise.all(files.map(async path => inspectSource(await readFile(path, "utf8"), relative(root, path))))).flat();
  assert.deepEqual(violations, [], `下列后台进程可能弹出窗口，请在调用处设置 windowsHide: true：\n${violations.join("\n")}`);
});

test("检查能识别别名、异步包装和选项覆盖", () => {
  const source = `
    import {execFile as runFile, spawn} from "node:child_process";
    import * as cp from "child_process";
    import {promisify as promise} from "node:util";
    const run = promise(runFile);
    run("ffprobe", [], {});
    spawn("ffmpeg", [], {windowsHide: true, ...options});
    cp.execSync("cmd");
    cp.fork("worker.js", [], {windowsHide: true});
  `;
  assert.equal(inspectSource(source, "fixture.ts").length, 3);
});
