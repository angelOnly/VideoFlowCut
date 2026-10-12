#!/usr/bin/env python3
"""只读校验本交付包；不联网、不安装依赖、不修改项目、不渲染视频。"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys

CASE = ".agents/skills/visual-treatment-planning/references/whole-scene-collaboration"

def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()

def safe_path(base: Path, relative: str) -> Path:
    raw = PurePosixPath(relative)
    if raw.is_absolute() or ".." in raw.parts or "\\" in relative:
        raise ValueError(f"不安全的相对路径：{relative}")
    result = (base / Path(*raw.parts)).resolve()
    result.relative_to(base.resolve())
    return result

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent,
                        help="解压后的交付包根目录，默认脚本所在目录")
    args = parser.parse_args()
    base = args.root.resolve()
    errors: list[str] = []
    manifest = json.loads((base / "文件清单.json").read_text(encoding="utf-8-sig"))
    entries = manifest.get("files")
    if not isinstance(entries, list):
        raise ValueError("总清单缺少files数组")
    seen: set[str] = set()
    for entry in entries:
        name = entry["path"]
        if name in seen:
            errors.append(f"重复清单项：{name}")
            continue
        seen.add(name)
        path = safe_path(base, name)
        if not path.is_file():
            errors.append(f"缺少文件：{name}")
            continue
        if path.stat().st_size != entry["bytes"] or sha256(path) != entry["sha256"]:
            errors.append(f"字节数或SHA-256不符：{name}")
    if len(entries) != manifest.get("hashed_file_count"):
        errors.append("清单计数不符")

    case = base / CASE
    input_root = case / "input"
    original = json.loads((input_root / "文件清单.json").read_text(encoding="utf-8-sig"))
    for entry in original["files"]:
        path = safe_path(input_root, entry["path"])
        if not path.is_file() or path.stat().st_size != entry["bytes"] or sha256(path) != entry["sha256"]:
            errors.append(f"原始输入清单不符：{entry['path']}")

    source = (case / "source/AirfareIndependent.tsx").read_text(encoding="utf-8-sig")
    work = json.loads((case / "source/work.original.json").read_text(encoding="utf-8-sig"))
    if source != work.get("source"):
        errors.append("TSX与原始提交快照的source不一致")

    fonts = {".ttf", ".otf", ".ttc", ".otc", ".woff", ".woff2", ".eot", ".dfont"}
    for path in base.rglob("*"):
        if path.is_file() and path.suffix.lower() in fonts:
            errors.append(f"出现不应包含的字体文件：{path.relative_to(base)}")

    if errors:
        print("校验失败：")
        for error in errors:
            print(" - " + error)
        return 1
    print(f"校验通过：{len(entries)}个文件哈希、7项原始输入以及TSX/提交快照一致性。")
    print("本校验只证明文件完整性，不表示已部署、已重渲染或全部声画与美术通过。")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f"校验无法完成：{exc}", file=sys.stderr)
        raise SystemExit(2)
