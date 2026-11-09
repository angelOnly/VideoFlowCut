/**
 * Pull the file path out of a tool call's arguments **while they are still
 * streaming**, without ever holding or forwarding the arguments themselves.
 *
 * Claude streams a tool call's JSON arguments as `input_json_delta` fragments
 * that split at arbitrary byte offsets — a real recording splits one path
 * across four fragments and closes it inside a fifth that has already started
 * on `"content"`:
 *
 *   '{"file_path": "/private/tmp/claude-501'
 *   '/-Users-elian-Documents-open-design/bff58f5e-18'
 *   'bb-4b58-96e7-8180846e980a/'
 *   'scratchpad/w107/cwd/alpha.html'
 *   '", "content": "<!doctype html><html><body'
 *
 * `file_path` is normally the first key, so the answer is complete after a few
 * dozen bytes even when `content` runs to tens of kilobytes. This scanner
 * exists to spend exactly those bytes.
 *
 * ## Why not `JSON.parse` in a try/catch
 *
 * A truncated fragment is not a JSON document, so the retry-until-it-parses
 * shape would re-parse a growing buffer on every fragment — quadratic in the
 * argument size, and it cannot answer at all until the LAST byte arrives, which
 * is the exact moment this scanner is trying to beat.
 *
 * This is instead a resumable character scanner: each fragment advances a small
 * state machine over the new bytes only, so the whole stream costs one linear
 * pass and the answer lands the instant the path's closing quote does.
 *
 * ## When it deliberately yields nothing
 *
 * By contract it returns a path only when that path is **provably complete**.
 * It stays silent when:
 *
 *  - the closing quote never arrives (model stopped mid-path, run aborted);
 *  - the path key is absent, nested deeper than the top-level argument object,
 *    or holds a non-string value;
 *  - the tool is not a file-writing tool (`Bash`, `Grep`, … are never scanned);
 *  - the arguments exceed {@link SCAN_BUDGET_BYTES} without yielding a path.
 *
 * A key that appears late still resolves correctly — just late enough that the
 * head start is small or gone. Silence is the designed outcome, never a guess:
 * a half-read path must never reach the UI.
 *
 * ## 顺带把行数数出来(W120)
 *
 * 光有文件名,那一行在剩下的一百多秒里是**静止**的。同一趟扫描顺手数一下正文里
 * 的换行,行上就能一边写一边长 —— 代价是每个字符多一次比较,而这些字符本来就已经
 * 在 `claude-stream` 的缓冲里躺着了,不是新开的一遍扫描。
 *
 * 三条约束写死在这里,别在别处重新发明:
 *
 *  · **口径必须和落定后完全一致。** 落定那一行的 `+N` 由
 *    `apps/web/src/runtime/chat/format.ts` 的 `diffStat` 算出,Write 分支是
 *    `content.split('\n').length` —— 也就是**换行数 + 1**(结尾换行多算一行,
 *    空串算 1 行)。这里逐字用同一条,所以 `tool_use` 落地时数字不会跳。
 *  · **只给整份写下去的工具数**({@link WHOLE_FILE_WRITE_TOOLS})。`Edit` 落定后
 *    是 `+N −M`,而 `−M` 要等 `old_string` 数完才知道 —— 在途给不出来就一半都不
 *    显示,绝不拿 0 冒充。`MultiEdit` / `replace` 同理:`diffStat` 对它们本来
 *    就返回 null,在途也必须跟着不报。
 *  · **必须节流。** 每来一个分片就报一次 = 把心跳变成广播。攒够
 *    {@link COUNT_REPORT_STEP_CHARS} 个正文字符、而且行数确实变了才报一次;
 *    正文那个字符串一收尾则**立刻补报最后一个值**,不管攒了多少 —— 这一条就是
 *    「结尾不许跳数字」的实现。
 *
 * 路径没收尾之前一个数字都不报:行上还没有那一行,报了也没处放。
 */
export declare function isFileWriteToolName(name: unknown): name is string;
/** 这一片喂进去之后有了什么新结论。两样都没有就返回 `null`。 */
export interface ToolInputScanUpdate {
    /** 这次调用要写的路径,**整趟只出现一次**。 */
    path?: string;
    /**
     * 到目前为止正文的行数,口径与 `diffStat` 一致(换行数 + 1)。
     * 只在节流放行、或正文收尾时出现,所以连着两次的值一定不同。
     */
    lines?: number;
}
export interface ToolInputPathScanner {
    /**
     * Feed the next raw argument fragment.
     *
     * Returns what this fragment newly established — the decoded path the first
     * time one is provably complete, and/or a fresh line count when the throttle
     * lets one through. `null` means this fragment established nothing, so a
     * caller that emits on a non-null return never emits noise.
     */
    push(fragment: string): ToolInputScanUpdate | null;
}
/**
 * A scanner for `toolName`, or `null` when that tool does not name a file.
 *
 * A `null` return is the caller's signal to not scan at all, so non-file tools
 * cost nothing beyond one set lookup for the whole call.
 */
export declare function createToolInputPathScanner(toolName: unknown): ToolInputPathScanner | null;
