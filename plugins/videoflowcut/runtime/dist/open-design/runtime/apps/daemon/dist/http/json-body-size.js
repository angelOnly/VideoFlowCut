/** Preserve transport bytes without retaining request content or trusting Content-Length. */
const bodyBytes = new WeakMap();
export function captureJsonBodySize(request, _response, buffer) {
    bodyBytes.set(request, buffer.byteLength);
}
export function jsonBodyByteLength(request) {
    // Route-level callers that already decoded JSON still enforce the whole envelope.
    return bodyBytes.get(request) ?? Buffer.byteLength(JSON.stringify(request.body ?? {}), 'utf8');
}
//# sourceMappingURL=json-body-size.js.map