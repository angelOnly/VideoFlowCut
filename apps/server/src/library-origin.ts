import { readRuntimeConfig } from "@videocut/project-overview";

/** 工作台开发端口与 Runtime 端口不同；发行启动器传入实际 Runtime 地址。 */
export function libraryOrigin(): string {
  if (process.env.VIDEOFLOWCUT_RUNTIME_ORIGIN) return process.env.VIDEOFLOWCUT_RUNTIME_ORIGIN;
  const { host, port } = readRuntimeConfig().http;
  return `http://${host === "0.0.0.0" || host === "::" ? "127.0.0.1" : host.includes(":") ? `[${host}]` : host}:${port}`;
}
