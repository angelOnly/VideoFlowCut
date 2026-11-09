/**
 * 评审剧场(Critique Theater)通信语法的**兜底剥离**。
 *
 * 为什么需要它:评审剧场已经在总闸上关掉了(`critique/rollout.ts`),而且它跑起来时
 * 子进程 stdout 会被整个改道给编排器 —— 按结构说,这套语法到不了聊天正文。
 * 但用户在真实客户端里**连着撞到四次** `<CRITIQUE_RUN>` / `<PANELIST role="Critic" score="9.0">`
 * 原样打在回答里。最可能的路径是:某一轮漏出来之后,它进了对话历史,
 * 模型看见自己上一轮的输出就跟着模仿 —— 一旦开始就会自我延续。
 *
 * 所以不去赌「注入源已经堵住」:凡是这套语法,一律不进正文。
 *
 * 两条硬要求(都来自用户):
 *  1. **不能闪**:标记被 SSE 切成两半时,半截字符一个都不许出现在屏幕上;
 *  2. **不吞用户的字**:攒着的半截如果最终不是标记,`flush()` 要原样吐回去。
 */
export interface PanelGrammarStripper {
    strip(delta: string): string;
    /** 流结束时把攒着的半截原样吐回去 —— 它终究不是标记 */
    flush(): string;
}
/**
 * 剥离**吃掉了整帧**吗 —— 也就是这一帧该不该整条扔掉。
 *
 * 判据是「**上游到底送没送字符**」,不是「剥完还剩没剩」。两者不是一回事,
 * 而分不开它们正是 W102 那条回归(2026-09-03)的全部内容:
 *
 *  · **原本就空**(`rawDelta === ''`)→ `false`,**照发**。
 *    claude 的扩展思考出厂就是这个形态:真 CLI 实测 opus-5 与 sonnet-4-5 各一轮,
 *    `content_block_delta` 的 delta 全是 `{"type":"thinking_delta","thinking":""}`。
 *    这种帧一个像素都不画,但它是两件事的**唯一**来源 ——
 *    壳头「思考中」(规格 W11:`thinking_delta` 到达**哪怕 delta 为空**就进入思考中)
 *    与传输层心跳(web 每收到一条真运行帧就 `markUpstreamActivity`)。
 *    真机录制 `7ed15c2f`(1150 秒)里 414/414 条思考帧都是空串;把它们扔掉,
 *    1357 帧只剩 943 帧,最长空档从 73.6 秒变成 300.6 秒。
 *
 *  · **送了字符、剥完一个不剩**(`rawDelta` 非空而 `visible` 为空)→ `true`,**扔掉**。
 *    整片都是评审剧场协议标记(或攒在缓冲里的半截标记),发出去只会让思考区
 *    多出一格空的「Thoughts」。这正是 ba3e64ea69 要治的那件事,不能回退。
 *
 * 空 delta 不成段这件事由客户端管(`build-turn-blocks.ts` 的
 * `if (!text.trim() && !cont) continue;`),所以「照发」不会画出空段落。
 */
export declare function strippingConsumedTheWholeFrame(rawDelta: string, visible: string): boolean;
export declare function createPanelGrammarStripper(): PanelGrammarStripper;
