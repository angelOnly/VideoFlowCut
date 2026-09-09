"""在独立 Transformers 4 环境中执行单次 MiniCPM-o 推理。"""

import json
import sys
from pathlib import Path

import torch
from transformers import AutoModel, AutoProcessor
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import comfy.model_management as model_management
from local_semantic_nodes import _video_content, _audio_content


def main():
    request = json.load(sys.stdin)
    path = Path(request["media"])
    kind = request["kind"]
    if kind == "video":
        content, has_audio = _video_content(path, request["start_seconds"], request["duration_seconds"])
    elif kind == "audio":
        content, has_audio = [_audio_content(path, request["start_seconds"], request["duration_seconds"])], True
    elif kind == "image":
        with Image.open(path) as image:
            content, has_audio = [image.convert("RGB")], False
    else:
        raise ValueError("不支持的素材类型")
    model = AutoModel.from_pretrained(
        request["model"], trust_remote_code=True, local_files_only=True,
        torch_dtype=torch.bfloat16, attn_implementation="sdpa",
        init_vision=True, init_audio=True, init_tts=False,
    ).eval()
    processor = AutoProcessor.from_pretrained(request["model"], trust_remote_code=True, local_files_only=True)
    model.to(model_management.get_torch_device())
    text = model.chat(
        msgs=[{"role": "user", "content": content + [request["prompt"]]}], processor=processor,
        enable_thinking=False, generate_audio=False, omni_mode=has_audio and kind == "video",
        use_tts_template=has_audio, use_image_id=False, max_slice_nums=1,
        do_sample=False, num_beams=1, max_new_tokens=request["max_new_tokens"],
    )
    if not isinstance(text, str) or not text.strip():
        raise ValueError("MiniCPM-o 未返回有效分析文本")
    Path(request["output"]).write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
