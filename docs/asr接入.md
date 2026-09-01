
# ComfyUI 已接入应用 HTTP API 调用说明

本文档对应应用目录中已发布的 6 个业务应用：FunASR 本地音频转文字、OmniVoice 自动音色克隆，以及 4 个 MiniMax H3 视频生成应用。

生成日期：2026-08-31。接口由 Comfyui-AppApi Bridge 提供。

> 重要：保存或重新构建应用后，schemaVersion 可能变化。每次正式调用前都应读取工作流详情接口，使用其返回的 schemaVersion 和字段 ID；不要长期硬编码本文中的版本号。

## 已接入的业务应用

| 分类      | 应用                    | 工作流 ID                            | 输入                                       | 主要输出 |
| --------- | ----------------------- | ------------------------------------ | ------------------------------------------ | -------- |
| funasr    | FunASR_本地音频转文字   | dd564543-d02d-4247-9e97-089417db9e7a | 音频                                       | 文本     |
| omnivoice | OmniVoice_自动音色克隆  | ba6238d0-3ee4-41d5-a1f4-a2aefc3933ce | 参考音频、待合成文本                       | 克隆音频 |
| minimax   | MiniMax_H3_文生视频     | 4d02d4eb-a4a5-4c13-95d5-6b6a594b4daa | 提示词、视频参数                           | 视频     |
| minimax   | MiniMax H3 图生视频     | 96dac139-f645-46a7-8dc4-f8d1fb5586d9 | 首帧图像、提示词、视频参数                 | 视频     |
| minimax   | MiniMax H3 首尾帧生视频 | ffa80b03-339d-47ba-b8c4-94577d52f775 | 首帧、尾帧、提示词、视频参数               | 视频     |
| minimax   | MiniMax H3 多参考视频   | 79ae27fd-bd4d-4e67-8dc3-6fcd7e8ce09d | 图像、参考视频、参考音频、提示词、视频参数 | 视频     |

说明：Bridge 当前还会列出一个名为“Bridge E2E 图像保存”的内部验证工作流；它不在应用目录的业务应用中，也不建议作为对外接口使用。

## 1. 服务地址与调用流程

本机默认服务地址：

```
服务根地址： http://127.0.0.1:8188
API 根地址：  http://127.0.0.1:8188/comfyui-bridge/v1
```

完整调用流程：

1. 读取工作流详情，取得最新 schemaVersion、fields 和 itemSlots。
2. 创建任务，取得 run_id。
3. 轮询 run_id，直到状态为 succeeded 或 failed。
4. 成功后从 outputs 取得 downloadUrl 并下载文件。

任务状态：

| 状态      | 含义                         |
| --------- | ---------------------------- |
| queued    | 已入队，尚未开始。           |
| running   | ComfyUI 正在执行。           |
| succeeded | 执行成功，outputs 中有结果。 |
| failed    | 执行失败，error 中有原因。   |

## 2. 通用接口

| 方法 | 路径                               | 用途                                           |
| ---- | ---------------------------------- | ---------------------------------------------- |
| GET  | /health                            | 检查 Bridge 是否可用。                         |
| GET  | /workflows                         | 列出全部已构建的应用。                         |
| GET  | /workflows/{workflow_id}           | 读取一个应用的最新输入、输出及 schemaVersion。 |
| POST | /workflows/{workflow_id}/runs      | 创建一次生成任务。                             |
| GET  | /runs/{run_id}                     | 查询任务状态和输出。                           |
| GET  | /runs/{run_id}/outputs/{output_id} | 下载指定输出文件。                             |

PowerShell 中可先定义：

```powershell
$server = 'http://127.0.0.1:8188'
$api = "$server/comfyui-bridge/v1"
```

健康检查：

```powershell
Invoke-RestMethod -Uri "$api/health"
```

正常响应示例：

```json
{
  "status": "ready",
  "protocolVersion": 1,
  "workflowCount": 7
}
```

列出应用：

```powershell
$catalog = Invoke-RestMethod -Uri "$api/workflows"
$catalog.workflows | Format-Table name, id, available, schemaVersion
```

列表响应的外层结构是：

```json
{
  "workflows": [
    {
      "id": "工作流 ID",
      "name": "应用名称",
      "available": true,
      "reason": null,
      "schemaVersion": "当前结构版本"
    }
  ]
}
```

读取一个应用的最新结构：

```powershell
$workflowId = '4d02d4eb-a4a5-4c13-95d5-6b6a594b4daa'
$detail = Invoke-RestMethod -Uri "$api/workflows/$workflowId"
$detail | ConvertTo-Json -Depth 8
```

| 详情属性      | 含义                                                 |
| ------------- | ---------------------------------------------------- |
| schemaVersion | 创建任务时必须原样带回的版本号。                     |
| fields        | 文本、数字、下拉等普通输入，放进 fieldValues。       |
| itemSlots     | 图像、视频、音频输入；上传字段名为 file_ 加该项 id。 |
| outputs       | 对外公开的输出槽位。                                 |
| available     | 是否可执行；为 false 时查看 reason。                 |

## 3. 创建任务与返回值

创建任务时都要提供这个 JSON：

```json
{
  "schemaVersion": "从详情接口获取的值",
  "fieldValues": {
    "普通字段 ID": "字段值"
  }
}
```

规则：

- fieldValues 的 key 必须是 fields 返回的 id，不能使用中文标签，也不能自行添加字段。
- 未传的普通字段会使用工作流保存时的默认值。建议始终明确传入提示词，避免运行到工作流示例提示词。
- 下拉框的值必须与详情接口 options 中的 value 完全一致。
- 未上传媒体时，可以使用 application/json。
- 上传任何图像、视频或音频时，必须使用 multipart/form-data，并包含名为 request 的文本字段，值为上面的 JSON。
- 每个媒体文件字段名固定为 file_{itemSlot.id}。例如 itemSlot 的 id 为 input-39357e2212d4c8cb16fa160c，则文件字段名是 file_input-39357e2212d4c8cb16fa160c。
- request 元数据最大 1 MB；单个上传文件最大 512 MB。

创建成功返回 HTTP 201：

```json
{
  "id": "9b27c6ab-79c7-4f9b-8f28-6f54a6ed54b3",
  "status": "queued",
  "error": null,
  "outputs": []
}
```

其中 id 就是后续使用的 run_id。

正常视频生成完成后，查询任务会得到类似结果：

```json
{
  "id": "9b27c6ab-79c7-4f9b-8f28-6f54a6ed54b3",
  "status": "succeeded",
  "error": null,
  "outputs": [
    {
      "outputSlotId": "output-6c7fe43db63ba2c534ab2323",
      "displayName": "Video Combine 🎥🅥🅗🅢",
      "kind": "video",
      "fileName": "MiniMax_H3_00001.mp4",
      "mime": "video/mp4",
      "outputId": "c6aa5d40-6b51-4b70-8e06-28661073b7f2",
      "downloadUrl": "/comfyui-bridge/v1/runs/9b27c6ab-79c7-4f9b-8f28-6f54a6ed54b3/outputs/c6aa5d40-6b51-4b70-8e06-28661073b7f2"
    }
  ]
}
```

| 输出属性     | 含义                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| outputSlotId | 工作流公开输出槽位 ID。                                                                                            |
| displayName  | 应用里的输出名称。                                                                                                 |
| kind         | video、image、audio、file 或 text。FunASR 返回 text，OmniVoice 返回 audio，4 个 MiniMax 应用正常情况下返回 video。 |
| fileName     | 输出文件名；文本输出没有该属性。                                                                                   |
| mime         | 文件 MIME 类型；文本输出没有该属性。                                                                               |
| outputId     | 下载 ID；文本输出没有该属性。                                                                                      |
| downloadUrl  | 相对路径，需要在前面拼接服务根地址。                                                                               |

通用轮询和下载代码：

```powershell
do {
    Start-Sleep -Seconds 2
    $result = Invoke-RestMethod -Uri "$api/runs/$($run.id)"
    Write-Host "状态：$($result.status)"
} while ($result.status -in @('queued', 'running'))

if ($result.status -eq 'failed') {
    throw "任务失败：$($result.error)"
}

$video = $result.outputs | Where-Object { $_.kind -eq 'video' } | Select-Object -First 1
if ($null -eq $video) {
    throw '任务完成，但没有找到视频输出。'
}

$target = Join-Path $PWD $video.fileName
Invoke-WebRequest -Uri ($server + $video.downloadUrl) -OutFile $target
Write-Host "已下载：$target"
```

## 4. MiniMax H3 通用画面比例

比例字段只能使用下列字符串：

| 可用值                     |
| -------------------------- |
| 1:1 (Square)               |
| 2:3 (Portrait Photo)       |
| 3:2 (Photo)                |
| 3:4 (Portrait Standard)    |
| 4:3 (Standard)             |
| 9:16 (Portrait Widescreen) |
| 16:9 (Widescreen)          |
| 21:9 (Ultrawide)           |

## 5. FunASR 本地音频转文字

| 项目               | 值                                                               |
| ------------------ | ---------------------------------------------------------------- |
| 工作流 ID          | dd564543-d02d-4247-9e97-089417db9e7a                             |
| 当前 schemaVersion | 15c8439f2d842f50890163f2906a37465a0a0abc59aa99dd6ee04adc8ae077a0 |
| 请求类型           | multipart/form-data，音频必传                                    |
| 输出槽位           | output-a754f8f91fab898b68713986                                  |

该应用没有普通输入字段，fieldValues 传空对象即可。内部固定使用 language=auto 和 use_itn=true。请上传 ComfyUI 可以解码的音频文件，例如 mp3、wav、flac、m4a。

媒体输入：

| 中文含义 | 表单文件字段名                      | 必填 |
| -------- | ----------------------------------- | ---- |
| 音频     | file_input-5885c94eaaaea66971d2aae7 | 是   |

PowerShell 7+ 调用：

```powershell
$server = 'http://127.0.0.1:8188'
$api = "$server/comfyui-bridge/v1"
$workflowId = 'dd564543-d02d-4247-9e97-089417db9e7a'
$detail = Invoke-RestMethod -Uri "$api/workflows/$workflowId"
$request = @{ schemaVersion = $detail.schemaVersion; fieldValues = @{} } | ConvertTo-Json -Compress
$form = @{ request = $request; 'file_input-5885c94eaaaea66971d2aae7' = Get-Item -LiteralPath 'E:\素材\待转写音频.mp3' }
$run = Invoke-RestMethod -Method Post -Uri "$api/workflows/$workflowId/runs" -Form $form
$run
```

curl.exe 调用：

```powershell
curl.exe -sS -X POST 'http://127.0.0.1:8188/comfyui-bridge/v1/workflows/dd564543-d02d-4247-9e97-089417db9e7a/runs' --form-string 'request={"schemaVersion":"15c8439f2d842f50890163f2906a37465a0a0abc59aa99dd6ee04adc8ae077a0","fieldValues":{}}' -F 'file_input-5885c94eaaaea66971d2aae7=@E:/素材/待转写音频.mp3;type=audio/mpeg'
```

成功后的 Bridge 输出直接包含转写文本，不需要下载文件：

```json
{
  "status": "succeeded",
  "outputs": [
    {
      "outputSlotId": "output-a754f8f91fab898b68713986",
      "displayName": "本地 FunASR 音频转文字",
      "kind": "text",
      "text": "这是一段识别出来的文本。"
    }
  ]
}
```

工作流同时会在本机 ComfyUI/output 目录保存一份 funasr_transcript 前缀的 txt 文件；HTTP 接口以 outputs 中的 text 为准。

## 6. OmniVoice 自动音色克隆

| 项目               | 值                                                               |
| ------------------ | ---------------------------------------------------------------- |
| 工作流 ID          | ba6238d0-3ee4-41d5-a1f4-a2aefc3933ce                             |
| 当前 schemaVersion | c3c54039c03a3ceeacc32a0d6181a4bd8b9838204b944a31b4bd2f597099cf9c |
| 请求类型           | multipart/form-data，参考音频必传                                |
| 输出槽位           | output-491586216985ba5e8fe28c56                                  |

该应用会把参考音频同时送给本地 FunASR 和 OmniVoice：FunASR 自动识别 reference_text，再交给 OmniVoice 克隆。因此 HTTP 调用只需提供参考音频和待合成文本，不存在需要手动传入的 reference_text 字段。

普通输入：

| 中文含义   | fieldValues 的 key             | 类型   | 当前默认值                                                |
| ---------- | ------------------------------ | ------ | --------------------------------------------------------- |
| 待合成文本 | input-caf62e956e5d99e3e2f4b68e | string | 你好，这是本地 OmniVoice 自动转写参考文本的音色克隆测试。 |

媒体输入：

| 中文含义 | 表单文件字段名                      | 必填 |
| -------- | ----------------------------------- | ---- |
| 参考音频 | file_input-1f85f7c29fbfbb2985331aae | 是   |

参考音频建议为 3 至 15 秒、清晰、只含一人说话的音频。当前模型输出采样率为 24000 Hz；预览节点将音频作为临时 FLAC 文件公开，最终文件名和 MIME 类型以返回的 outputs 为准。

PowerShell 7+ 调用：

```powershell
$server = 'http://127.0.0.1:8188'
$api = "$server/comfyui-bridge/v1"
$workflowId = 'ba6238d0-3ee4-41d5-a1f4-a2aefc3933ce'
$detail = Invoke-RestMethod -Uri "$api/workflows/$workflowId"
$request = @{ schemaVersion = $detail.schemaVersion; fieldValues = @{ 'input-caf62e956e5d99e3e2f4b68e' = '你好，这是一段通过本地 OmniVoice 自动音色克隆生成的语音。' } } | ConvertTo-Json -Compress -Depth 5
$form = @{ request = $request; 'file_input-1f85f7c29fbfbb2985331aae' = Get-Item -LiteralPath 'E:\素材\参考音色.wav' }
$run = Invoke-RestMethod -Method Post -Uri "$api/workflows/$workflowId/runs" -Form $form
$run
```

curl.exe 调用：

```powershell
curl.exe -sS -X POST 'http://127.0.0.1:8188/comfyui-bridge/v1/workflows/ba6238d0-3ee4-41d5-a1f4-a2aefc3933ce/runs' --form-string 'request={"schemaVersion":"c3c54039c03a3ceeacc32a0d6181a4bd8b9838204b944a31b4bd2f597099cf9c","fieldValues":{"input-caf62e956e5d99e3e2f4b68e":"你好，这是一段通过本地 OmniVoice 自动音色克隆生成的语音。"}}' -F 'file_input-1f85f7c29fbfbb2985331aae=@E:/素材/参考音色.wav;type=audio/wav'
```

成功后从 outputs 中取得音频下载地址：

```json
{
  "status": "succeeded",
  "outputs": [
    {
      "outputSlotId": "output-491586216985ba5e8fe28c56",
      "displayName": "预览克隆结果",
      "kind": "audio",
      "fileName": "ComfyUI_temp_xxxxx.flac",
      "mime": "audio/flac",
      "outputId": "输出 ID",
      "downloadUrl": "/comfyui-bridge/v1/runs/任务 ID/outputs/输出 ID"
    }
  ]
}
```

下载方式与第 3 节的通用轮询和下载代码相同；将其中筛选条件从 video 改为 audio 即可。

## 7. MiniMax H3 文生视频

| 项目               | 值                                                               |
| ------------------ | ---------------------------------------------------------------- |
| 工作流 ID          | 4d02d4eb-a4a5-4c13-95d5-6b6a594b4daa                             |
| 当前 schemaVersion | e05f2fe8241fa9aceb4bbf0a5fada951050eaf660d4b3dc0dad80d228a033ec4 |
| 请求类型           | application/json                                                 |
| 输出槽位           | output-6c7fe43db63ba2c534ab2323                                  |

所有普通输入均可省略，省略时使用工作流默认值：

| 中文含义           | fieldValues 的 key             | 类型   | 当前默认值                 |
| ------------------ | ------------------------------ | ------ | -------------------------- |
| 提示词             | input-9cba93bc1180fbcd475a6981 | string | 工作流示例提示词           |
| 视频时长（秒）     | input-ec1635efae33c980f7339d0d | number | 6                          |
| 画面比例           | input-82c76755986379efa7f1ed67 | string | 9:16 (Portrait Widescreen) |
| 清晰度（百万像素） | input-3d3b5074f3c4a7ee70252e54 | number | 0.9，范围 0.1 至 16        |
| 随机种子           | input-e93ffea95203063ef1b0002f | number | 773405159843938            |

PowerShell 调用：

```powershell
$server = 'http://127.0.0.1:8188'
$api = "$server/comfyui-bridge/v1"
$workflowId = '4d02d4eb-a4a5-4c13-95d5-6b6a594b4daa'
$detail = Invoke-RestMethod -Uri "$api/workflows/$workflowId"
$body = @{ schemaVersion = $detail.schemaVersion; fieldValues = @{ 'input-9cba93bc1180fbcd475a6981' = '一只橘猫坐在窗台上看雨，电影感，慢速推镜，柔和钢琴配乐。'; 'input-ec1635efae33c980f7339d0d' = 6; 'input-82c76755986379efa7f1ed67' = '16:9 (Widescreen)'; 'input-3d3b5074f3c4a7ee70252e54' = 0.9; 'input-e93ffea95203063ef1b0002f' = 123456 } } | ConvertTo-Json -Depth 5
$run = Invoke-RestMethod -Method Post -Uri "$api/workflows/$workflowId/runs" -ContentType 'application/json; charset=utf-8' -Body $body
$run
```

## 8. MiniMax H3 图生视频

| 项目               | 值                                                               |
| ------------------ | ---------------------------------------------------------------- |
| 工作流 ID          | 96dac139-f645-46a7-8dc4-f8d1fb5586d9                             |
| 当前 schemaVersion | c0b580fdabbaaabe022e186743a7541bc5490b4684d0ecc6fcc843b3051999a5 |
| 请求类型           | multipart/form-data，首帧图像必传                                |
| 输出槽位           | output-a4afdad358a04688707ea738                                  |

普通输入：

| 中文含义           | fieldValues 的 key             | 类型   | 当前默认值              |
| ------------------ | ------------------------------ | ------ | ----------------------- |
| 提示词             | input-430a9ac52e063fb5990c7484 | string | 工作流示例提示词        |
| 视频时长（秒）     | input-78e423877b75bc90a4e52547 | number | 8                       |
| 画面比例           | input-095fc48f851fa45251839c3f | string | 3:4 (Portrait Standard) |
| 清晰度（百万像素） | input-7bfa6da95fd6cb345d72a268 | number | 0.9，范围 0.1 至 16     |
| 随机种子           | input-9ee3d0e1afb379070c9f2ece | number | 202098902293030         |

媒体输入：

| 中文含义     | 表单文件字段名                      | 必填 |
| ------------ | ----------------------------------- | ---- |
| 参考首帧图像 | file_input-39357e2212d4c8cb16fa160c | 是   |

PowerShell 7+ 调用：

```powershell
$server = 'http://127.0.0.1:8188'
$api = "$server/comfyui-bridge/v1"
$workflowId = '96dac139-f645-46a7-8dc4-f8d1fb5586d9'
$detail = Invoke-RestMethod -Uri "$api/workflows/$workflowId"
$request = @{ schemaVersion = $detail.schemaVersion; fieldValues = @{ 'input-430a9ac52e063fb5990c7484' = '镜头缓慢推进，人物自然眨眼并微笑，保持参考图像中的服装和构图。'; 'input-78e423877b75bc90a4e52547' = 8; 'input-095fc48f851fa45251839c3f' = '3:4 (Portrait Standard)'; 'input-7bfa6da95fd6cb345d72a268' = 0.9; 'input-9ee3d0e1afb379070c9f2ece' = 123456 } } | ConvertTo-Json -Compress -Depth 5
$form = @{ request = $request; 'file_input-39357e2212d4c8cb16fa160c' = Get-Item -LiteralPath 'E:\素材\首帧.png' }
$run = Invoke-RestMethod -Method Post -Uri "$api/workflows/$workflowId/runs" -Form $form
$run
```

curl.exe 调用。这里的 schemaVersion 仅为当前版本；若得到 HTTP 409，请重新读取详情接口后替换。PowerShell 中请使用 curl.exe，不要使用 curl 别名。

```powershell
curl.exe -sS -X POST 'http://127.0.0.1:8188/comfyui-bridge/v1/workflows/96dac139-f645-46a7-8dc4-f8d1fb5586d9/runs' --form-string 'request={"schemaVersion":"c0b580fdabbaaabe022e186743a7541bc5490b4684d0ecc6fcc843b3051999a5","fieldValues":{"input-430a9ac52e063fb5990c7484":"镜头缓慢推进，人物自然眨眼并微笑。","input-78e423877b75bc90a4e52547":8,"input-095fc48f851fa45251839c3f":"3:4 (Portrait Standard)","input-7bfa6da95fd6cb345d72a268":0.9,"input-9ee3d0e1afb379070c9f2ece":123456}}' -F 'file_input-39357e2212d4c8cb16fa160c=@E:/素材/首帧.png;type=image/png'
```

## 9. MiniMax H3 首尾帧生视频

| 项目               | 值                                                               |
| ------------------ | ---------------------------------------------------------------- |
| 工作流 ID          | ffa80b03-339d-47ba-b8c4-94577d52f775                             |
| 当前 schemaVersion | b9a8e8d5c764064a86e9bb1bbb8174db93814be5831ef4aa61431499a52fe572 |
| 请求类型           | multipart/form-data，首帧和尾帧图像必传                          |
| 输出槽位           | output-c05cebe99263ebdc05e8d38e                                  |

普通输入：

| 中文含义           | fieldValues 的 key             | 类型   | 当前默认值              |
| ------------------ | ------------------------------ | ------ | ----------------------- |
| 提示词             | input-5a2e9f7ec4073c663eccf036 | string | 空字符串                |
| 视频时长（秒）     | input-b587e9be1cb4fe730baeda5f | number | 10                      |
| 画面比例           | input-194dc9fef7e731fe355fec7d | string | 3:4 (Portrait Standard) |
| 清晰度（百万像素） | input-685cf6ed95997eef190ff5dc | number | 0.9，范围 0.1 至 16     |
| 随机种子           | input-aa48dd9a3095a593a659cab7 | number | 573299373916122         |

媒体输入：

| 中文含义 | 表单文件字段名                      | 必填 |
| -------- | ----------------------------------- | ---- |
| 首帧图像 | file_input-e5410f0549b2698117eea16c | 是   |
| 尾帧图像 | file_input-d6a3609e515cfe83aead3c20 | 是   |

PowerShell 7+ 调用：

```powershell
$server = 'http://127.0.0.1:8188'
$api = "$server/comfyui-bridge/v1"
$workflowId = 'ffa80b03-339d-47ba-b8c4-94577d52f775'
$detail = Invoke-RestMethod -Uri "$api/workflows/$workflowId"
$request = @{ schemaVersion = $detail.schemaVersion; fieldValues = @{ 'input-5a2e9f7ec4073c663eccf036' = '镜头从首帧自然过渡到尾帧，主体持续行走，光线和服装保持连贯。'; 'input-b587e9be1cb4fe730baeda5f' = 10; 'input-194dc9fef7e731fe355fec7d' = '16:9 (Widescreen)'; 'input-685cf6ed95997eef190ff5dc' = 0.9; 'input-aa48dd9a3095a593a659cab7' = 123456 } } | ConvertTo-Json -Compress -Depth 5
$form = @{ request = $request; 'file_input-e5410f0549b2698117eea16c' = Get-Item -LiteralPath 'E:\素材\首帧.png'; 'file_input-d6a3609e515cfe83aead3c20' = Get-Item -LiteralPath 'E:\素材\尾帧.png' }
$run = Invoke-RestMethod -Method Post -Uri "$api/workflows/$workflowId/runs" -Form $form
$run
```

curl.exe 调用：

```powershell
curl.exe -sS -X POST 'http://127.0.0.1:8188/comfyui-bridge/v1/workflows/ffa80b03-339d-47ba-b8c4-94577d52f775/runs' --form-string 'request={"schemaVersion":"b9a8e8d5c764064a86e9bb1bbb8174db93814be5831ef4aa61431499a52fe572","fieldValues":{"input-5a2e9f7ec4073c663eccf036":"镜头从首帧自然过渡到尾帧。","input-b587e9be1cb4fe730baeda5f":10,"input-194dc9fef7e731fe355fec7d":"16:9 (Widescreen)","input-685cf6ed95997eef190ff5dc":0.9,"input-aa48dd9a3095a593a659cab7":123456}}' -F 'file_input-e5410f0549b2698117eea16c=@E:/素材/首帧.png;type=image/png' -F 'file_input-d6a3609e515cfe83aead3c20=@E:/素材/尾帧.png;type=image/png'
```

## 10. MiniMax H3 多参考视频

| 项目               | 值                                                                        |
| ------------------ | ------------------------------------------------------------------------- |
| 工作流 ID          | 79ae27fd-bd4d-4e67-8dc3-6fcd7e8ce09d                                      |
| 当前 schemaVersion | 08f7abc3fc1a67567cd66aa2c0caa5ea59fcdc65329d909a97640f520bc74546          |
| 请求类型           | 未上传媒体时可用 application/json；上传任意媒体时使用 multipart/form-data |
| 输出槽位           | output-88829de5bdd392e91d396314                                           |

所有参考媒体都是可选项。未上传某一项时，Bridge 会移除该项到生成节点的连接，不会继续使用工作流里的样例媒体。提示词中的 Picture 1 至 Picture 6 分别对应参考图像 1 至参考图像 6。

普通输入：

| 中文含义               | fieldValues 的 key             | 类型   | 当前默认值          |
| ---------------------- | ------------------------------ | ------ | ------------------- |
| 提示词                 | input-8a3551cf4e00e8f6c1227f21 | string | 工作流示例提示词    |
| 视频时长（秒）         | input-e6d51ade08a92ce0ece3f5c6 | number | 12                  |
| 初采画面比例           | input-9132a699ed38b888e08a5770 | string | 16:9 (Widescreen)   |
| 初采清晰度（百万像素） | input-2673498cfad358686687df93 | number | 0.4，范围 0.1 至 16 |
| 最终画面比例           | input-39ad94877131325afab1e27e | string | 16:9 (Widescreen)   |
| 最终清晰度（百万像素） | input-98031c4a91bceb25a4e8479e | number | 0.9，范围 0.1 至 16 |
| 初采随机种子           | input-3aedc32ad032bcc507395110 | number | 813357748329420     |
| 二采随机种子           | input-30925a51399f3d64e1bc6890 | number | 398645500441357     |

媒体输入：

| 中文含义   | 表单文件字段名                      | 必填 |
| ---------- | ----------------------------------- | ---- |
| 参考图像 1 | file_input-6c34d91a401708239425b2d0 | 否   |
| 参考图像 2 | file_input-4e3badbedb0f409ad8e4c0a1 | 否   |
| 参考图像 3 | file_input-d42f70bdf10e7e04ab77e89b | 否   |
| 参考图像 4 | file_input-39c9e20bfa5cdffb1507e31e | 否   |
| 参考图像 5 | file_input-9515c1fa94d36413a37c3267 | 否   |
| 参考图像 6 | file_input-4155d142acb167358743f81c | 否   |
| 参考视频   | file_input-7d82d872cc299131e9b39617 | 否   |
| 参考音频 1 | file_input-6a686c95af18351ff7f60862 | 否   |
| 参考音频 2 | file_input-468f71c6757ad772bcab095f | 否   |
| 参考音频 3 | file_input-26a1730b22aac74d867526b7 | 否   |

PowerShell 7+ 调用。要省略某个参考项，只需删除对应的表单行：

```powershell
$server = 'http://127.0.0.1:8188'
$api = "$server/comfyui-bridge/v1"
$workflowId = '79ae27fd-bd4d-4e67-8dc3-6fcd7e8ce09d'
$detail = Invoke-RestMethod -Uri "$api/workflows/$workflowId"
$request = @{ schemaVersion = $detail.schemaVersion; fieldValues = @{ 'input-8a3551cf4e00e8f6c1227f21' = 'Picture 1 是人物外观参考，Picture 2 是场景参考。人物走进场景，镜头平稳跟拍，保留参考视频的运镜节奏。'; 'input-e6d51ade08a92ce0ece3f5c6' = 12; 'input-9132a699ed38b888e08a5770' = '16:9 (Widescreen)'; 'input-2673498cfad358686687df93' = 0.4; 'input-39ad94877131325afab1e27e' = '16:9 (Widescreen)'; 'input-98031c4a91bceb25a4e8479e' = 0.9; 'input-3aedc32ad032bcc507395110' = 123456; 'input-30925a51399f3d64e1bc6890' = 654321 } } | ConvertTo-Json -Compress -Depth 5
$form = @{ request = $request; 'file_input-6c34d91a401708239425b2d0' = Get-Item -LiteralPath 'E:\素材\人物.png'; 'file_input-4e3badbedb0f409ad8e4c0a1' = Get-Item -LiteralPath 'E:\素材\场景.png'; 'file_input-7d82d872cc299131e9b39617' = Get-Item -LiteralPath 'E:\素材\参考运镜.mp4'; 'file_input-6a686c95af18351ff7f60862' = Get-Item -LiteralPath 'E:\素材\参考声音.wav' }
$run = Invoke-RestMethod -Method Post -Uri "$api/workflows/$workflowId/runs" -Form $form
$run
```

curl.exe 调用：

```powershell
curl.exe -sS -X POST 'http://127.0.0.1:8188/comfyui-bridge/v1/workflows/79ae27fd-bd4d-4e67-8dc3-6fcd7e8ce09d/runs' --form-string 'request={"schemaVersion":"08f7abc3fc1a67567cd66aa2c0caa5ea59fcdc65329d909a97640f520bc74546","fieldValues":{"input-8a3551cf4e00e8f6c1227f21":"Picture 1 是人物外观参考，Picture 2 是场景参考。","input-e6d51ade08a92ce0ece3f5c6":12,"input-9132a699ed38b888e08a5770":"16:9 (Widescreen)","input-2673498cfad358686687df93":0.4,"input-39ad94877131325afab1e27e":"16:9 (Widescreen)","input-98031c4a91bceb25a4e8479e":0.9,"input-3aedc32ad032bcc507395110":123456,"input-30925a51399f3d64e1bc6890":654321}}' -F 'file_input-6c34d91a401708239425b2d0=@E:/素材/人物.png;type=image/png' -F 'file_input-4e3badbedb0f409ad8e4c0a1=@E:/素材/场景.png;type=image/png' -F 'file_input-7d82d872cc299131e9b39617=@E:/素材/参考运镜.mp4;type=video/mp4' -F 'file_input-6a686c95af18351ff7f60862=@E:/素材/参考声音.wav;type=audio/wav'
```

## 11. 错误与限制

| HTTP 状态 / 状态 | 常见原因                                            | 处理方式                                                             |
| ---------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| 400              | 字段 ID、文件字段名、请求类型错误，或缺少必传媒体。 | 重新读取详情接口，严格使用 fields、itemSlots 返回的 id。             |
| 404              | 工作流、任务或输出不存在。                          | 检查 workflow_id、run_id、outputId 是否正确。                        |
| 409              | schemaVersion 已变化，或应用不可执行。              | 重新读取详情，使用新的 schemaVersion；同时查看 available 和 reason。 |
| 413              | request 超过 1 MB，或单文件超过 512 MB。            | 缩小文本或媒体文件。                                                 |
| 500              | Bridge 与 ComfyUI 通信异常或执行错误。              | 查看 ComfyUI 控制台，以及任务的 error。                              |
| failed           | 任务已创建，但 ComfyUI 执行失败。                   | 查询 GET /runs/{run_id} 的 error，不要下载 outputs。                 |

## 12. 对外部署注意事项

- 当前接口没有鉴权机制。默认本机地址可以直接使用。
- 不要把 8188 端口直接暴露到公网；如需局域网或公网调用，请在反向代理层增加 HTTPS、身份认证、访问控制和上传大小限制。
- 任务记录和下载映射只保存在 ComfyUI 进程内存中。重启 ComfyUI 后，之前的 run_id 无法继续查询或下载。
- POST 成功只代表已入队，视频仍需通过轮询确认是否生成完成。

## 13. 最小联调

先执行：

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:8188/comfyui-bridge/v1/health'
Invoke-RestMethod -Uri 'http://127.0.0.1:8188/comfyui-bridge/v1/workflows/4d02d4eb-a4a5-4c13-95d5-6b6a594b4daa'
```

然后运行第 7 节的文生视频脚本创建任务，最后使用第 3 节的轮询与下载脚本取得视频。
