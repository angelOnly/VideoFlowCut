import type { Context } from '@deepseek-ai/cordis';
export declare const name = "open-design-runtime-invariant";
export declare const inject: string[];
export declare const apply: (ctx: Context) => Promise<() => void>;
