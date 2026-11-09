export declare const AIHUBMIX_APP_CODE = "DMCY9912";
export declare const AIHUBMIX_DEFAULT_BASE_URL = "https://aihubmix.com/v1";
/**
 * Build the outbound header set for an AIHubMix request: Bearer auth plus the
 * fixed `APP-Code` attribution header (omitted when unset). Callers spread the
 * result into their `fetch` headers and may add `content-type` etc. on top.
 */
export declare function aihubmixHeaders(apiKey: string): Record<string, string>;
/**
 * The APP-Code attribution header on its own (no auth). For the Anthropic /
 * Gemini routes, which carry their own auth header (`x-api-key` /
 * `x-goog-api-key`) — spread this alongside it so every AIHubMix request,
 * whatever the wire protocol, still carries APP-Code.
 */
export declare function aihubmixAppCodeHeader(): Record<string, string>;
export type AIHubMixProtocol = 'openai' | 'anthropic' | 'gemini';
export declare function classifyAIHubMixModel(model: string): AIHubMixProtocol;
/**
 * Origin of the configured AIHubMix base URL — the three protocol clients all
 * derive their endpoint from it:
 *   openai    → `${origin}/v1`
 *   anthropic → `${origin}` (+ /v1/messages)
 *   gemini    → `${origin}/gemini` (+ /v1beta/models/{model}:...)
 */
export declare function aihubmixOriginFromBase(baseUrl: string): string;
/** Gemini-native generateContent endpoint for an AIHubMix image model. */
export declare function aihubmixGeminiImageUrl(baseUrl: string, wireModel: string): string;
export interface AIHubMixGeminiImageRequest {
    baseUrl: string;
    apiKey: string;
    wireModel: string;
    prompt: string;
    /** Gemini aspectRatio string, e.g. "1:1" / "16:9". */
    aspect: string;
}
/**
 * Generate an image through AIHubMix's Gemini-native `generateContent` wire and
 * return the decoded image bytes.
 *
 * gemini/imagen-family image models reject the OpenAI `/images/generations`
 * shape ("Unknown name prompt/n/size"), so both the in-chat tool
 * (`executeAIHubMixGenerateImage`) and the Home/New Project/CLI media renderer
 * (`renderAIHubMixImage`) route those models here. This helper owns the single
 * source of truth for the request body and the inline-image response parse;
 * `doFetch` lets each caller apply its own request-init wrapper (proxy
 * dispatcher, abort signal, redirect policy). Throws on a non-OK status or a
 * response without inline image data.
 */
export declare function aihubmixGeminiImageBytes(req: AIHubMixGeminiImageRequest, doFetch: (url: string, init: RequestInit) => Promise<Response>): Promise<Buffer>;
export declare function aihubmixWireModel(catalogId: string): string;
export declare function aihubmixVideoSeconds(wireModel: string, requested: number): string;
export type AIHubMixCatalogType = 'llm' | 'image_generation' | 'tts' | 'video';
export declare function aihubmixCatalogUrl(baseUrl: string, type: AIHubMixCatalogType): string;
export interface AIHubMixCatalogModel {
    id: string;
    label: string;
}
export interface ParseAIHubMixCatalogOptions {
    /** Keep only genuine chat models, dropping media-generation rows. AIHubMix's
     *  `?type=llm` query matches any model whose `types` merely CONTAINS `llm`, so
     *  dual-tagged image models (e.g. `gpt-image-2` → "image_generation,llm") leak
     *  into the chat catalogue. The chat model picker passes this; the media
     *  pickers (which query `?type=image_generation` / `video` / `tts`) leave it
     *  off so their own catalogues stay intact. Rows with no `types` are kept —
     *  absent metadata shouldn't hide an otherwise-valid chat model. */
    chatOnly?: boolean;
}
/** Parse the AIHubMix catalogue envelope into { id, label } options. Reads
 *  `model_id` (the wire name sent as `model`) and `model_name` (display). */
export declare function parseAIHubMixCatalog(data: unknown, options?: ParseAIHubMixCatalogOptions): AIHubMixCatalogModel[];
export declare const AIHUBMIX_IMAGE_ASPECT_TO_SIZE: Record<string, string>;
