import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { open, stat } from "node:fs/promises";
import { extname } from "node:path";
import type { GeneratedAudioFile, MediaMetadata } from "@videocut/contracts";
import type { BridgeOutput } from "@videocut/bridge";
import { DomainError } from "@videocut/domain";
import { probeMedia, runProcess } from "@videocut/speech";

function normalizedOutputMime(mime: string | undefined) { return mime?.split(";", 1)[0]?.trim().toLocaleLowerCase() || undefined; }

async function hashFile(path: string): Promise<string> {
  return new Promise((resolveHash, rejectHash) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (chunk: string | Buffer) => { hash.update(chunk); });
    stream.once("error", rejectHash);
    stream.once("end", () => resolveHash(hash.digest("hex")));
  });
}

const PLAYABLE_AUDIO_CODECS = new Set([
  "aac", "mp3", "opus", "vorbis", "flac", "alac",
  "pcm_s16le", "pcm_s24le", "pcm_s32le", "pcm_f32le", "pcm_f64le"
]);

/**
 * 远端只要返回“成功”不代表可用于编辑。这里拒绝 HTML 错误页、无音轨文件和当前 Player/Render
 * 未承诺的音频编码；不做隐式转码，以免改变音频长度或隐藏 Provider 输出问题。
 */
export async function inspectGeneratedAudioFile(path: string, outputMime?: string, verifyDecode = false): Promise<Pick<GeneratedAudioFile, "contentHash" | "sourceHash" | "durationMs" | "metadata">> {
  const mime = normalizedOutputMime(outputMime);
  if (mime && !mime.startsWith("audio/")) {
    throw new DomainError(`音频输出 MIME 必须为 audio/*，当前为：${outputMime}`, "AUDIO_OUTPUT_MIME_UNSUPPORTED");
  }
  const info = await stat(path);
  if (!info.isFile() || info.size <= 0) throw new DomainError("音频输出为空或不是文件", "AUDIO_OUTPUT_EMPTY");
  const handle = await open(path, "r");
  try {
    const header = Buffer.alloc(Math.min(512, info.size));
    await handle.read(header, 0, header.length, 0);
    const leadingText = header.toString("utf8").trimStart().toLocaleLowerCase();
    if (/^(?:<!doctype\s+html|<html(?:\s|>)|<\?xml)/u.test(leadingText)) {
      throw new DomainError("音频下载结果是网页错误页，不是音频", "AUDIO_OUTPUT_HTML");
    }
  } finally {
    await handle.close();
  }
  const metadata = await probeMedia(path);
  if (!metadata.hasAudio || metadata.durationMs <= 0) {
    throw new DomainError("音频输出没有可读取的有效音轨", "AUDIO_OUTPUT_AUDIO_STREAM_MISSING");
  }
  const codec = metadata.audioCodec?.toLocaleLowerCase();
  if (!codec || !PLAYABLE_AUDIO_CODECS.has(codec)) {
    throw new DomainError(`音频输出编码 ${metadata.audioCodec ?? "未知"} 不在当前 Player/Render 支持范围内`, "AUDIO_OUTPUT_CODEC_UNSUPPORTED");
  }
  if (verifyDecode) await runProcess("ffmpeg", ["-v", "error", "-xerror", "-i", path, "-f", "null", "-"]);
  const contentHash = await hashFile(path);
  return { contentHash, sourceHash: contentHash, durationMs: metadata.durationMs, metadata };
}

function isExtensionCompatibleWithAudio(extension: string, metadata: MediaMetadata): boolean {
  const codec = metadata.audioCodec?.toLocaleLowerCase();
  if (extension === ".mp3") return codec === "mp3";
  if (extension === ".wav") return Boolean(codec?.startsWith("pcm_"));
  if (extension === ".m4a") return codec === "aac" || codec === "alac";
  if (extension === ".ogg") return codec === "opus" || codec === "vorbis";
  if (extension === ".opus") return codec === "opus";
  if (extension === ".flac") return codec === "flac";
  if (extension === ".aac") return codec === "aac";
  return false;
}

export function extensionForGeneratedAudio(output: BridgeOutput, metadata: MediaMetadata): string {
  const provided = extname(output.fileName ?? "").toLocaleLowerCase();
  // Provider 的文件名有时会沿用错误后缀；先以 ffprobe 的真实音频编码确认它和容器相容。
  if (isExtensionCompatibleWithAudio(provided, metadata)) return provided;
  const mime = normalizedOutputMime(output.mime);
  if (mime === "audio/mpeg") return ".mp3";
  if (["audio/wav", "audio/x-wav"].includes(mime ?? "")) return ".wav";
  if (["audio/mp4", "audio/x-m4a"].includes(mime ?? "")) return ".m4a";
  if (mime === "audio/ogg") return ".ogg";
  if (mime === "audio/opus") return ".opus";
  if (mime === "audio/flac") return ".flac";
  const codec = metadata.audioCodec?.toLocaleLowerCase();
  if (codec === "mp3") return ".mp3";
  if (codec?.startsWith("pcm_")) return ".wav";
  if (codec === "aac" || codec === "alac") return ".m4a";
  if (codec === "opus") return ".opus";
  if (codec === "vorbis") return ".ogg";
  if (codec === "flac") return ".flac";
  return ".audio";
}

