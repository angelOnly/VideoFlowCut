import assert from "node:assert/strict";
import test from "node:test";
import { compileMotion, validateMotionSource } from "../packages/motion-work/src/compiler.js";
import { motionFixture } from "./fixtures/managed-motion.js";

const component = (body: string) => `import React from 'react';export default function Motion(){${body}}`;

test("动效几何变量按实际作用域解析，允许局部 top 和闭包引用", async () => {
  const source = component("const p=0.5, top=626-p*200, height=200+p*200;const shape=()=> <path d={'M 120 '+top+' L 120 800'}/>;return <svg>{shape()}<text y={top+height}>总量</text></svg>;");
  validateMotionSource(source);
  assert.ok((await compileMotion({ ...motionFixture, source })).length > 100);
  for (const body of [
    "const top=10;const bounds={top};return <div style={bounds}/>;",
    "const place=(top:number)=>top+1;return <div>{place(10)}</div>;",
    "const [top]=[10];return <div>{top}</div>;",
    "const {height:top}={height:10};return <div>{top}</div>;",
    "let parent=10;return <div>{parent}</div>;"
  ]) assert.doesNotThrow(() => validateMotionSource(component(body)));
});

test("局部同名绑定不能放行其它作用域中的全局或对象属性访问", () => {
  for (const body of [
    "return <div>{top}</div>;",
    "const bounds={top};return <div/>;",
    "{const top=10;}return <div>{top}</div>;",
    "const place=(top:number)=>top;return <div>{top}</div>;",
    "const local=function top(){return 10};return <div>{top}</div>;",
    "const top=10;return <div>{window.top}</div>;",
    "const top=10;return <div>{globalThis.top}</div>;",
    "const top=10;return <div>{globalThis['top']}</div>;",
    "const top=10;const holder={};return <div>{holder.top}</div>;",
    "const top=10;const holder={};return <div>{holder['top']}</div>;",
    "const top=10;return <div>{({}).constructor}</div>;",
    "const top=10;return <div>{fetch('https://example.com')}</div>;"
  ]) assert.throws(() => validateMotionSource(component(body)), /MOTION_API_REJECTED/u, body);
});

test("类型和环境声明不能伪装成实际局部值", () => {
  for (const declaration of ["type top=number;", "interface top{}", "declare const top:number;", "declare function top():number;", "function top():number;", "declare class top{}", "declare namespace Fake{const top:number;}", "import type {useMemo as top} from 'react';", "import {type useMemo as top} from 'react';"]) {
    assert.throws(() => validateMotionSource(`${declaration}export default function Motion(){return <div>{top}</div>}`), /MOTION_API_REJECTED/u, declaration);
  }
});
