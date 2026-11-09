# ComfyUI 模型 HTTP 接入文档（Bridge v2）

本机新服务以 Ador-able/comfyui_bridge 的 `63b88f3` 版本为基础，沿用现有 ComfyUI、Python、CUDA 和模型环境。新入口为 `http://127.0.0.1:8188/comfyui-bridge/v2`；局域网调用时替换主机地址。v2 是 ComfyUI 内部插件，不单独启动另一个推理服务。

## 部署边界

调用链：外部程序 → 原版 Bridge v2 → 本机 ComfyUI `/prompt` → 同一执行队列 → 已有模型节点 → Bridge 终端输出 → history → HTTP 查询与下载。

当前使用 `C:\Users\13222\anaconda3\envs\comfy_5090_313\python.exe`。本次没有安装或变更依赖：Torch 2.9.1+cu130、Transformers 5.3.0、OmniVoice 0.2.1、FunASR 1.4.6+videoflowcut.1 继续使用。

上游 HTTP、清理及通用节点文件保持原版。入口仅加载通用节点、字幕输出、路由和清理，不导入上游附带的模型运行时，避免引入 Transformers 4.57.6 等依赖。原有 OmniVoice、FunASR、MiniCPM-o 和向量节点继续由现有插件提供；安装新 HTTP 服务不等于更换模型。

本地 OmniVoice 节点在推理成功或异常后清除 Transformers 5.3.0 的音频分词器卷积层缓存，避免缓存继续持有已结束的 GPU 模型；原版 HTTP 核心未修改。正式进程已重启并加载该修复。

旧 `/comfyui-bridge/v1` 在 ComfyUI 服务侧暂时保留；VideoFlowCut 源码现使用 v2，部署状态需单独核验。新旧服务共用执行队列，不会因为同时存在两套接口而在两个独立 GPU 进程中执行任务。v2 清理策略只对启用结束清理的任务生效；继续调用旧 v1 的任务不会自动获得这项策略。

## 接口与调用顺序

以下路径相对于 `/comfyui-bridge/v2`。

| 方法 | 路径 | 行为 |
| --- | --- | --- |
| GET | `/health` | 返回 `status: ready`、`protocolVersion: 2`、可用工作流数量 |
| GET | `/workflows` | 返回工作流列表及 `available`、不可用原因 |
| GET | `/workflows/{workflowId}` | 返回实时 `schemaVersion`、`fields`、`itemSlots`、`outputs` |
| POST | `/workflows/{workflowId}/runs` | multipart 提交，接受后返回 HTTP 202 |
| GET | `/runs/{runId}` | 查询 `queued/running/succeeded/failed` |
| DELETE | `/runs/{runId}` | 精确请求取消运行中任务或删除排队任务，返回 `cancelled` |
| GET | `/runs/{runId}/outputs/{outputId}` | 下载媒体文件，同时适合浏览器预览 |

先读取工作流详情，按本次返回的字段 ID 组织参数。媒体槽位使用 `mediaKind`、`min`、`max`；`min: 1` 表示必填。详情请求成功即表示目录校验通过，详情不包含 v1 的 `available` 字段。

每次提交由客户端生成 UUID，并在请求头传入：

```text
x-comfyui-bridge-run-id: <客户端生成的 UUID>
```

所有提交都使用 `multipart/form-data`，包括只有文字、没有媒体的请求。`request` 表单部分为 JSON 文本：

```json
{
  "schemaVersion": "从当前详情响应获取",
  "fieldValues": {
    "input-1": "按实际字段填写"
  }
}
```

上传媒体的表单名为 `file_{slotId}`，例如 `file_input-1`。字段与文件是否省略表达可选性；空字符串、0 和 false 都是已提供的值。不要沿用旧接口的字段 ID，也不要把空文件代替省略。

客户端提交前保存 runId。网络中断时先查询这个 ID；上游没有声明重复 POST 幂等，不要为同一任务自动换 ID 或反复 POST。查询 404 也不立即证明先前请求从未入队，需要结合连接状态与 ComfyUI history 判断。

## 输出与失败处理

成功响应示例：

```json
{
  "id": "客户端生成的 UUID",
  "status": "succeeded",
  "error": null,
  "outputs": [
    {
      "kind": "audio",
      "outputId": "从实际响应读取",
      "fileName": "audio_00001_.flac",
      "mime": "audio/flac"
    }
  ]
}
```

媒体结果不包含 `downloadUrl`，用 runId 和 outputId 拼接上述下载端点。普通 AUDIO 经上游音频输出编码为 FLAC；视频、图片、模型按相应终端节点返回。文本为 `{kind: "text", text: "..."}`，原生对象/数组输出为 `{kind: "json", value: ...}`。

结果不提供 `outputSlotId` 或节点 ID。按 `kind` 和业务内容选择结果，不依赖内部节点排序。当前 FunASR 对齐应用仍返回两个 text：普通转写文本与 JSON 文本；调用方应解析并校验 JSON 的业务结构，不将两个文本直接拼接。v2 不会自动把 JSON 字符串转成 `kind: json`。

| 情况 | 上游行为 | 调用方处理 |
| --- | --- | --- |
| 参数、UUID、schema 不匹配，或创建时工作流不可用 | HTTP 400，返回 `error` | 读取错误并重新获取 schema；不套用旧 v1 的 409 重试规则 |
| 查询不到工作流、任务或文件 | HTTP 404 | 检查工作流状态、history、服务是否重启 |
| 创建或取消内部异常 | HTTP 500 | 保留 runId，检查 ComfyUI 日志 |
| 模型推理失败或运行中取消 | 查询结果通常为 `failed` | 读取 `error`；详细节点异常保留在 ComfyUI 日志和原生 history |
| 清理异常 | 记录到 ComfyUI 错误日志 | 已保存的任务结果不被清理错误改写 |

取消端点返回的 `cancelled` 是布尔值；找不到可取消的任务时，本机实测返回 HTTP 200 和 `{"cancelled": false}`。已开始执行的任务取消后可能在查询中显示 `failed`，排队任务被删除后可能返回 404。

HTTP 202 只表明任务被接受，不能证明每条输出分支均通过 ComfyUI 校验或模型能成功生成；应查询最终结果并在必要时检查服务日志。

任务事实直接来自 ComfyUI 的队列和 history。服务重启或 history 被删除后，旧 runId 和下载端点可能失效；成功后及时下载到调用方自己的目录。原版没有前台插队协议，`queueMode: foreground` 不受支持。

## Python 调用示例

以下示例使用原有的“OmniVoice 自动音色克隆”应用。请先将 `reference_audio` 改为本地参考音频路径；运行后会实际生成音频。

```python
import json
from pathlib import Path
import time
import uuid
import requests

base = "http://127.0.0.1:8188/comfyui-bridge/v2"
workflow_id = "ba6238d0-3ee4-41d5-a1f4-a2aefc3933ce"
reference_audio = Path("请替换为参考音频文件路径.wav")
response = requests.get(f"{base}/workflows/{workflow_id}", timeout=15)
response.raise_for_status()
schema = response.json()
text_field = next(field for field in schema["fields"] if field["label"] == "text")
audio_slot = next(slot for slot in schema["itemSlots"] if slot["mediaKind"] == "audio")
run_id = str(uuid.uuid4())
payload = {
    "schemaVersion": schema["schemaVersion"],
    "fieldValues": {text_field["id"]: "你好，这是新接口的本地配音测试。"},
}
with reference_audio.open("rb") as audio:
    response = requests.post(
        f"{base}/workflows/{workflow_id}/runs",
        headers={"x-comfyui-bridge-run-id": run_id},
        files={
            "request": (None, json.dumps(payload, ensure_ascii=False)),
            f"file_{audio_slot['id']}": (reference_audio.name, audio, "audio/wav"),
        },
        timeout=60,
    )
response.raise_for_status()
assert response.status_code == 202
deadline = time.monotonic() + 600
while time.monotonic() < deadline:
    response = requests.get(f"{base}/runs/{run_id}", timeout=15)
    response.raise_for_status()
    run = response.json()
    if run["status"] == "failed":
        raise RuntimeError(run["error"])
    if run["status"] == "succeeded":
        break
    time.sleep(1)
else:
    raise TimeoutError(f"等待超时，请继续查询原任务：{run_id}")
output = next(item for item in run["outputs"] if item["kind"] == "audio")
response = requests.get(f"{base}/runs/{run_id}/outputs/{output['outputId']}", timeout=60)
response.raise_for_status()
Path(Path(output["fileName"]).name).write_bytes(response.content)
```

有媒体时，在 `files` 中加入 `file_{slotId}`；无媒体时仍使用 multipart，只提交 `request` 部分。实际字段 ID 应以本次读取的工作流详情为准。

## 工作流与显存清理

服务只扫描 `user/default/workflows/AI/*.app.json`，不递归扫描整个工作流目录，也不读取旧的 `api_workflows/*.bridge.json`。

当前有 22 个可用应用，v2 副本保留 workflowId、原模型与生成参数，重新生成输入槽位 ID。原工作流文件未覆盖。v2 副本添加或连接上游 Bridge 终端输出；原生保存节点可能仍执行，因此部分应用会同时保留原保存文件和 Bridge 导出文件。

所有迁移副本均启用 `extra.comfyuiBridgeCleanupAfterRun: true`。成功、执行失败或执行中取消后，由 ComfyUI 工作线程保存 history，再卸载受管模型、重置节点缓存，进行 GC、CUDA 缓存回收及 Windows 工作集整理。跨任务不再复用模型缓存，下次需要重新加载。CUDA 上下文和第三方仍持有的对象不保证归零，也不能保证单次推理峰值一定低于显存上限。

图发生变化后，需要在 ComfyUI 中重新保存，生成与图匹配的 v2 快照。保存后的图与快照指纹不一致时，上游会将应用标记为不可用。今后编辑新接口应用应打开 AI 目录中的 v2 副本；旧 v1 文件保留给尚未迁移的调用方。

## 新服务提供方的既有检查范围

已在相同 Python 环境的独立候选实例验证连续文本提交、音频上传和 FLAC 下载、无效参数拒绝、执行失败结果。上游清理验证脚本仅适配本机 ComfyUI 的构造函数与导入路径，实际验证了多输出、缓存命中后回收、CPU/CUDA 张量和受管模型释放、异常与取消；服务清理代码未改动。

22 个当前工作流副本通过上游目录、输入输出映射和快照指纹校验。正式服务连续执行 9 次 OmniVoice，全部生成并下载成功，每次清理后 PyTorch 活跃显存均约为 17 MiB；随后切到 MiniCPM-o 音频分析并切回 OmniVoice，均成功。模型应用的逐项推理不等于目录可用性，未逐个执行图像、视频和 3D 大模型生成。

原有 FunASR 音频转写和 OmniVoice 参考音频克隆均已通过 v2 上传、执行及输出检查。其他应用的逐项推理尚未全部验证；这些结果来自提供的新服务接入说明，不能代替本次逐项连通性测试。

## 回退与调用端状态

部署前备份位于 `E:\ai\comfyui\bridge-v2-deploy-20261105\backup`，包括旧插件和工作流。回退需停止 ComfyUI 后移出新插件，恢复旧插件入口与目录扫描文件，再用原启动方式启动。不得同时注册两套前端保存钩子和同名 Bridge 节点。

VideoFlowCut 源码已迁移 v2：使用 multipart 和客户端 UUID，读取实时媒体槽，按输出类型和内容选择结果，以 Run ID 与 outputId 下载。v2 没有前台插队能力；多个同类型输出无法唯一确定时拒绝猜测。源码变更不代表已部署，实际运行版本需单独核验。旧任务中保存的 v1 地址不会自动切换，应先对账原 Run。

## 原有 8 个主要应用

下列为本文件维护的 8 个主要应用。v2 使用各自的工作流副本和同一模型节点。其他已经存在的接口也保留，不影响原有调用。

字段来自当前 v2 返回的结构，供接入时参考；工作流重新保存后 ID 或版本可能变化，每次运行前请重新获取工作流详情。

### 1. FunASR 本地音频转文字

工作流 ID：`dd564543-d02d-4247-9e97-089417db9e7a`

| 输入 | 类型 | 是否必填 | 默认值或说明 |
| --- | --- | --- | --- |
| `file_input-1` | audio | 是 | audio |

输出：`text`。

### 2. LTX2.3 数字人

工作流 ID：`7f5e0c56-93b4-4937-b7f2-efd0f1853e33`

| 输入 | 类型 | 是否必填 | 默认值或说明 |
| --- | --- | --- | --- |
| `file_input-1` | image | 是 | image |
| `file_input-2` | audio | 是 | audio |

输出：`video`。

### 3. MiniMax H3 文生视频

工作流 ID：`4d02d4eb-a4a5-4c13-95d5-6b6a594b4daa`

| 输入 | 类型 | 是否必填 | 默认值或说明 |
| --- | --- | --- | --- |
| `input-1` | text | 否 | 提示词；工作流预设文本 |
| `input-2` | number | 否 | 视频时长（秒）；`6` |
| `input-3` | select | 否 | 画面比例；`"9:16 (Portrait Widescreen)"` |
| `input-4` | number | 否 | 清晰度（百万像素）；`0.9` |
| `input-5` | number | 否 | 随机种子；`773405159843938` |

输出：`video`。

### 4. MiniMax H3 图生视频

工作流 ID：`96dac139-f645-46a7-8dc4-f8d1fb5586d9`

| 输入 | 类型 | 是否必填 | 默认值或说明 |
| --- | --- | --- | --- |
| `file_input-1` | image | 是 | 参考首帧图像 |
| `input-2` | text | 否 | 提示词；工作流预设文本 |
| `input-3` | number | 否 | 视频时长（秒）；`8` |
| `input-4` | select | 否 | 画面比例；`"3:4 (Portrait Standard)"` |
| `input-5` | number | 否 | 清晰度（百万像素）；`0.9` |
| `input-6` | number | 否 | 随机种子；`202098902293030` |

输出：`video`。

### 5. MiniMax H3 首尾帧生视频

工作流 ID：`ffa80b03-339d-47ba-b8c4-94577d52f775`

| 输入 | 类型 | 是否必填 | 默认值或说明 |
| --- | --- | --- | --- |
| `file_input-1` | image | 是 | 首帧图像 |
| `file_input-2` | image | 是 | 尾帧图像 |
| `input-3` | text | 否 | 提示词；`""` |
| `input-4` | number | 否 | 视频时长（秒）；`10` |
| `input-5` | select | 否 | 画面比例；`"3:4 (Portrait Standard)"` |
| `input-6` | number | 否 | 清晰度（百万像素）；`0.9` |
| `input-7` | number | 否 | 随机种子；`573299373916122` |

输出：`video`。

### 6. MiniMax H3 多参考视频

工作流 ID：`79ae27fd-bd4d-4e67-8dc3-6fcd7e8ce09d`

| 输入 | 类型 | 是否必填 | 默认值或说明 |
| --- | --- | --- | --- |
| `file_input-1` | image | 否 | 参考图像 1（可选） |
| `file_input-2` | image | 否 | 参考图像 2（可选） |
| `file_input-3` | image | 否 | 参考图像 3（可选） |
| `file_input-4` | image | 否 | 参考图像 4（可选） |
| `file_input-5` | image | 否 | 参考图像 5（可选） |
| `file_input-6` | image | 否 | 参考图像 6（可选） |
| `file_input-7` | video | 否 | 参考视频（可选） |
| `file_input-8` | audio | 否 | 参考音频 1（可选） |
| `file_input-9` | audio | 否 | 参考音频 2（可选） |
| `file_input-10` | audio | 否 | 参考音频 3（可选） |
| `input-11` | text | 否 | 提示词；工作流预设文本 |
| `input-12` | number | 否 | 视频时长（秒）；`12` |
| `input-13` | select | 否 | 初采画面比例；`"16:9 (Widescreen)"` |
| `input-14` | number | 否 | 初采清晰度（百万像素）；`0.4` |
| `input-15` | select | 否 | 最终画面比例；`"16:9 (Widescreen)"` |
| `input-16` | number | 否 | 最终清晰度（百万像素）；`0.9` |
| `input-17` | number | 否 | 初采随机种子；`813357748329420` |
| `input-18` | number | 否 | 二采随机种子；`398645500441357` |

输出：`video`。

接口结构将参考素材列为可选。经检查，未提供参考图像时，v2 对部分图片预处理支路的处理与旧 v1 不同；其中图像 1 还连接了引导节点，缺少时可能导致该节点报错。多参考视频的缺省素材场景尚未完成端到端验证，现阶段请提供参考图像 1，并在正式使用前验证所需素材组合。

### 7. OmniVoice 自动音色克隆

工作流 ID：`ba6238d0-3ee4-41d5-a1f4-a2aefc3933ce`

| 输入 | 类型 | 是否必填 | 默认值或说明 |
| --- | --- | --- | --- |
| `file_input-1` | audio | 是 | audio |
| `input-2` | text | 否 | text；`"你好，这是本地 OmniVoice 自动转写参考文本的音色克隆测试。"` |

输出：`audio`。

### 8. Stable Audio 3 Medium 音效与音乐

工作流 ID：`stable-audio-3-medium-v1`

| 输入 | 类型 | 是否必填 | 默认值或说明 |
| --- | --- | --- | --- |
| `input-1` | text | 是 | 提示词（英文）；无 |
| `input-2` | number | 否 | 最大时长（秒）；`10` |
| `input-3` | number | 否 | 随机种子；`20260921` |

输出：`audio`。

提示词为英文声音描述；时长为最大时长，实际音频可能更短。模型使用 Stable Audio 3 Medium，工作流固定使用 8 步 LCM 采样与 CFG 1；尾部静音会按工作流设置裁剪。请求后应检查实际音频时长、起音和尾音。

VideoFlowCut 的音效生成设计及候选素材处理见 [音效生成与动效联动实施方案](VideoFlowCut_音效生成与动效联动实施方案.md)。VideoFlowCut 源码已适配 v2，运行中的版本是否采用新代码需单独核验。

## 其他已保留接口

字幕对齐、MiniCPM-o 分析、文本向量和其他已存在的工作流接口继续保留，可通过 `GET /workflows` 查看；字段与输出以对应详情为准。

## 2026-11-06 本机连通性复测

测试基础地址为 `http://127.0.0.1:8188/comfyui-bridge/v2`。`/health` 返回 HTTP 200、`ready`、`protocolVersion: 2`，列表返回 22 项可用；本文八项详情均为 HTTP 200。八项使用错误版本提交均返回 HTTP 400，说明提交入口能够接收并拒绝过期版本。

| 应用 | 本次结果 |
| --- | --- |
| FunASR 本地音频转文字 | 上传人声，HTTP 202，任务 `9d7727cb-f786-43ee-b768-1f9af5f714a1` 成功，返回非空文本。 |
| OmniVoice 自动音色克隆 | 上传人声，HTTP 202，任务 `79c121a6-1e1b-45c6-8f7a-7acc1ff16ee0` 成功，音频下载 HTTP 200。 |
| Stable Audio 3 Medium | 文本 multipart 提交 HTTP 202，任务 `5e2bd2c9-4ec6-46e5-ba1b-4ef75df96c5c` 成功，FLAC 下载 HTTP 200。 |
| LTX2.3 数字人 | 上传图片和音频后返回 HTTP 202，随即取消成功；未验证完整推理和视频输出。 |
| MiniMax H3 文生视频 | 提交返回 HTTP 202，随即取消成功；未验证完整生成。日志报告 `easy cleanGpuUsed` 缺少 `anything` 输入，该输出分支被忽略。 |
| MiniMax H3 图生视频 | 上传图片后返回 HTTP 202，随即取消成功；未验证完整生成。 |
| MiniMax H3 首尾帧生视频 | 上传两张图片后返回 HTTP 202，随即取消成功；未验证完整生成。 |
| MiniMax H3 多参考视频 | 上传第一张参考图后返回 HTTP 202，随即取消成功；未验证完整推理、视频输出或其他素材组合。 |

此前的测试中，首尾帧被拒，文生与图生视频日志出现 VAE 路径校验错误。之后三个工作流的 Schema 版本发生变化；本次复测三者均接受请求，测试期间日志未再出现该 VAE 错误。由于任务随即取消，尚不能据此判断完整推理能否成功。

取消测试针对本次提交的任务：五次返回 HTTP 200、`cancelled: true`；其中已开始执行的任务后续查询为 `failed`，被删除的排队任务查询为 404。随机不存在的任务查询及下载返回 404，取消返回 HTTP 200、`cancelled: false`。测试结束时队列为空。

前一次测试首次误用了静音音频，FunASR 没有有效输出，OmniVoice 因参考文本为空失败；更换人声后的测试与本次复测均成功。音频只验证生成和下载，没有进行听感验收。视频工作流均未完成实际生成，不能据此判断视频画面、音频、模型推理或输出下载是否正常。
