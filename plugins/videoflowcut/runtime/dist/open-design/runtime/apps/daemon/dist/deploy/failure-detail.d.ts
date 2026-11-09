import { type ApiFailureDetail } from '@open-design/contracts';
/**
 * Classify a failed `POST /api/projects/:id/deploy` into closed tokens.
 *
 * Only observational: the route keeps answering with the same status and
 * error code it always did. This adds what that code cannot say — whether a
 * generic failure was the provider rejecting the request (and with which
 * status/code), the provider being unreachable, a local file problem, or a
 * rejected token hiding behind PROVIDER_FORBIDDEN.
 */
export declare function classifyDeployFailure(stage: 'file_plan' | 'provider', error: unknown, isDeployError: boolean): ApiFailureDetail;
