# Bridge 与 API 错误

## 400

字段 ID、文件字段、请求类型或必传媒体错误。重新读取 workflow detail，按实时 fields/itemSlots 构造。

## 404

workflow、run 或 output 不存在。检查 ID；ComfyUI 重启后旧 Run 可能丢失。

## 409

schemaVersion 变化或 workflow unavailable。重新读取 detail，不重用旧 Schema。

## 413

请求或文件过大。切分、压缩或使用受管文件策略。

## 500 / failed

保存 error，检查 ComfyUI 控制台和工作流。不要下载不存在的 output。

## succeeded 但缺输出

按失败处理。状态成功不能替代预期 output kind。

## Run 丢失

项目侧根据请求、Job、已下载文件和 hash 对账，不能凭空声明失败或成功。
