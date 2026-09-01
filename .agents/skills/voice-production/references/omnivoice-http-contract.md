# OmniVoice HTTP 合同

## 当前真实模型

每次请求直接提供：

```text
VoiceReference 音频
+
待合成文本
```

工作流内部使用 FunASR 获取参考文本，再完成声音克隆和语音生成。

不要创建不存在的远端 VoiceProfile，也不要要求用户手工提供 reference_text。

## 动态调用

每次正式调用前读取 workflow detail。使用实时：

- schemaVersion；
- 文本 field id；
- 参考音频 itemSlot；
- audio output。

## 输出

成功后筛选 `kind=audio`，立即下载并登记。文件名和 MIME 以实际 outputs 为准。

## 失败

- 400：字段或文件合同错误；
- 409：重新读取 schemaVersion；
- failed：保存 error；
- Run 丢失：从项目 Job 和本地文件对账；
- 无 audio 输出：任务视为失败，不能继续组装。

## 参考音频

推荐 3–15 秒、单人、清晰、低噪声。项目应保存推荐有效区间和权利说明。
