# FunASR HTTP 合同

实现以 `docs/asr接入.md` 和实时 workflow detail 为准。

## 调用原则

1. GET workflow detail；
2. 读取最新 schemaVersion、fields、itemSlots、outputs；
3. 用 multipart/form-data 上传音频；
4. POST 创建 Run；
5. 轮询 Run；
6. succeeded 后读取 `kind=text` 输出；
7. failed 时保存 error 并停止下游正式编辑。

## 当前能力边界

当前工作流主要输出完整文本，不公开：

- 词级时间；
- Token 时间；
- 说话者分离；
- 置信度数组。

因此任何更细时间信息必须来自项目侧真实切片或未来正式对齐能力。

## 409

schemaVersion 冲突时重新读取 workflow detail，不重用旧版本。

## ComfyUI 重启

Run 映射在进程重启后可能丢失。项目侧 Job 必须保存请求和本地化输出；成功输出应立即登记。
