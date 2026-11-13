import { createHash } from "node:crypto";
import { readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import type { EditingApplication } from "@videocut/application";
import { z } from "zod";
import { readMotionDefinition } from "../../../packages/edit-application/src/motion-definition.js";
import { compileMotion, motionContentSecurityPolicy } from "../../../packages/motion-work/src/compiler.js";
import { prepareMotionFonts, readMotionFontFile } from "../../../packages/motion-work/src/fonts.js";
import { prepareMotionImages } from "../../render-worker/src/motion-images.js";
import { prepareMotionVideos } from "../../render-worker/src/motion-video.js";

/** 工作台只读取固定作品；解码资源按短会话释放，不创建媒体 Job 或改写时间线。 */
export function registerMotionWorkbenchRoutes(app: FastifyInstance, application: EditingApplication) {
  type Session = Awaited<ReturnType<typeof open>>;
  const sessions = new Map<string, { value: Promise<Session>; users: number; timer?: ReturnType<typeof setTimeout> }>();
  const open = async (projectId: string, workId: string, revision: number, definitionHash: string) => {
    const { work } = application.readSourceMotionWork(projectId, workId, revision, definitionHash);
    const root = application.readProject(projectId, revision).snapshot.project.rootPath;
    const definition = readMotionDefinition(root, work);
    const directory = join(root, "cache", "workbench-motion", work.id, work.definitionHash);
    await mkdir(directory, { recursive: true });
    const bytes = Object.fromEntries(await Promise.all(definition.boundImages.map(async image => {
      const value = await readFile(join(root, image.managedPath));
      if (createHash("sha256").update(value).digest("hex") !== image.hash) throw new Error("MOTION_IMAGE_CHANGED");
      return [image.slot, value];
    })));
    const images = await prepareMotionImages(bytes, directory);
    const fonts = prepareMotionFonts(definition.work, definition.boundFonts);
    const provider = definition.boundVideos.length ? await prepareMotionVideos(root, directory, definition.work, definition.boundVideos, work.engineVersion, undefined, join(directory, "video")) : undefined;
    return { work, definition, images, fonts, provider };
  };
  const session = async (projectId: string, workId: string, revision: number, definitionHash: string) => {
    application.readSourceMotionWork(projectId, workId, revision, definitionHash);
    const key = `${projectId}:${workId}:${definitionHash}`;
    let entry = sessions.get(key);
    if (!entry) {
      entry = { value: open(projectId, workId, revision, definitionHash), users: 0 }; sessions.set(key, entry);
      void entry.value.catch(() => { if (sessions.get(key) === entry) sessions.delete(key); });
    }
    clearTimeout(entry.timer); entry.users++;
    const selected = entry;
    try {
      const value = await selected.value;
      return { value, release() {
        selected.users--;
        if (selected.users || sessions.get(key) !== selected) return;
        // 只回收空闲会话；正在解码的慢帧不能被空闲计时器关闭。
        selected.timer = setTimeout(() => {
          if (sessions.get(key) !== selected || selected.users) return;
          sessions.delete(key);
          void selected.value.then(value => value.provider?.close()).catch(() => undefined);
        }, 30_000);
        selected.timer.unref();
      } };
    } catch (error) { selected.users--; throw error; }
  };
  const parameters = z.object({ projectId: z.string().min(1), workId: z.string().min(1), revision: z.coerce.number().int().positive(), definitionHash: z.string().regex(/^[a-f0-9]{64}$/u) });
  const prefix = "/motion-work/:projectId/:workId/:revision/:definitionHash";
  app.get(`${prefix}/document`, async (request, reply) => {
    const input = parameters.parse(request.params);
    const lease = await session(input.projectId, input.workId, input.revision, input.definitionHash);
    const value = lease.value;
    try {
    const base = `${request.protocol}://${request.host}/motion-work/${encodeURIComponent(input.projectId)}/${encodeURIComponent(input.workId)}/${input.revision}/${input.definitionHash}/resources/`;
    const fontCss = value.fonts.map(({ binding, format }) => `@font-face{font-family:'${binding.family}';src:url('${base}fonts/${binding.fontId}/${binding.hash}');font-weight:${binding.weight};font-style:${binding.style};font-display:block}`).join("");
    const html = await compileMotion(value.definition.work, value.images.imageData, value.provider?.videos, value.definition.boundFonts, fontCss, { workId: input.workId, videoBaseUrl: `${base}video/` });
    return reply.header("content-security-policy", motionContentSecurityPolicy(html, value.definition.work.source, base)).header("cache-control", "no-store").type("text/html").send(html);
    } finally { lease.release(); }
  });
  app.get(`${prefix}/resources/fonts/:fontId/:hash`, async (request, reply) => {
    const input = parameters.extend({ fontId: z.string(), hash: z.string() }).parse(request.params);
    const { work } = application.readSourceMotionWork(input.projectId, input.workId, input.revision, input.definitionHash);
    if (!work.fontSources.some(font => font.fontId === input.fontId && font.hash === input.hash)) throw new Error("MOTION_FONT_BINDING_MISMATCH");
    const font = readMotionFontFile(input.fontId, input.hash);
    return reply.header("access-control-allow-origin", "*").type(font.contentType).send(font.bytes);
  });
  app.get(`${prefix}/resources/video/:slot/:frame.png`, async (request, reply) => {
    const input = parameters.extend({ slot: z.string(), frame: z.coerce.number().int().nonnegative() }).parse(request.params);
    const lease = await session(input.projectId, input.workId, input.revision, input.definitionHash);
    const value = lease.value;
    try {
    if (!value.provider || input.frame >= value.work.frameCount) throw new Error("MOTION_VIDEO_RANGE");
    const bytes = await value.provider.getFrame(input.slot, input.frame);
    return reply.header("access-control-allow-origin", "*").header("cache-control", "no-store").type("image/png").send(bytes);
    } finally { lease.release(); }
  });
  app.addHook("onClose", async () => {
    await Promise.allSettled([...sessions.values()].map(async entry => { clearTimeout(entry.timer); await (await entry.value).provider?.close(); }));
    sessions.clear();
  });
}
