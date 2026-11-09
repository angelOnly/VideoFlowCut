import { parseV1 } from './parsers/v1.js';
export async function* parseCritiqueStream(source, opts) {
    // For v1, the version is detected from <CRITIQUE_RUN version="1"> in the first chunk.
    // Only v1 exists currently so we always dispatch to parsers/v1.
    yield* parseV1(source, opts);
}
//# sourceMappingURL=parser.js.map