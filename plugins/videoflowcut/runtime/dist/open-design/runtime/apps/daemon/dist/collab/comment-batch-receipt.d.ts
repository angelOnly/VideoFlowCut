import { type CommentBatchPushRequest, type CommentBatchPushResponse } from '@open-design/contracts';
/** Validate the whole receipt before any caller may acknowledge individual rows. */
export declare function parseCommentBatchReceipt(stdout: string, request: CommentBatchPushRequest): CommentBatchPushResponse;
export declare function validateCommentBatchRequest(request: CommentBatchPushRequest): void;
