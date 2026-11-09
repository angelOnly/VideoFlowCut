export interface AgentTitleMarkerStripper {
    flush(): string;
    strip(delta: string): string;
}
export interface AgentTitleMarkerStripperOptions {
    emitTitle: (title: string) => void;
    /**
     * 是否**采用**这个标记去命名会话。
     *
     * 注意它**不控制剥离** —— 标记是协议噪音,任何情况下都不许出现在正文里。
     * 模型是按系统提示词吐 `<od-title>` 的,它并不知道这一轮我们要不要标题;
     * 原来这里同时兼任「关掉剥离」,于是不请求标题的轮次里标记原样漏进聊天正文
     * (线上量到:`<od-title>编辑级羊皮纸单页</od-title>` 出现在正文第一行)。
     */
    enabled: boolean;
    maxScanLength?: number;
}
export declare function sanitizeAgentGeneratedTitle(value: unknown): string;
export declare function createAgentTitleMarkerStripper(options: AgentTitleMarkerStripperOptions): AgentTitleMarkerStripper;
