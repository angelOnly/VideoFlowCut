/**
 * Deterministic canonical XML tree for prompt payloads.
 *
 * Prompt bytes are an identity: the same logical input must serialize to the
 * same string forever, and a string read back from storage must either parse to
 * the identical tree or fail closed. That rules out a general XML parser, whose
 * accepted forms are many-to-one. Instead this module defines exactly one legal
 * encoding per tree and parses by consuming that encoding literally.
 *
 * Pure and synchronous by contract: no Node, filesystem, browser, or crypto
 * dependency. Callers that need a digest hash the returned string themselves.
 */
/** A leaf carrying opaque text. Text is always CDATA-wrapped, never entity-escaped. */
export interface CanonicalXmlTextNode {
    kind: 'text';
    tag: string;
    attributes?: ReadonlyArray<readonly [string, string]>;
    text: string;
}
/** A branch carrying ordered child nodes and no text of its own. */
export interface CanonicalXmlElementNode {
    kind: 'element';
    tag: string;
    attributes?: ReadonlyArray<readonly [string, string]>;
    children: ReadonlyArray<CanonicalXmlNode>;
}
/** A presence marker: the tag and its attributes are the whole payload. */
export interface CanonicalXmlMarkerNode {
    kind: 'marker';
    tag: string;
    attributes?: ReadonlyArray<readonly [string, string]>;
}
export type CanonicalXmlNode = CanonicalXmlTextNode | CanonicalXmlElementNode | CanonicalXmlMarkerNode;
/**
 * Reject every code point XML 1.0 forbids and normalize newlines, so the same
 * logical text cannot produce two different byte strings.
 */
export declare function assertCanonicalXmlText(value: string, field: string): string;
/** Serialize a tree to its single legal encoding. */
export declare function serializeCanonicalXml(root: CanonicalXmlNode): string;
/**
 * Parse the single legal encoding, then prove canonicality by re-serializing:
 * anything the cursor tolerated but that would not round-trip is rejected here.
 */
export declare function parseCanonicalXml(source: string): CanonicalXmlNode;
/** Narrow a node to a text leaf, or throw naming the offending path. */
export declare function requireCanonicalXmlText(node: CanonicalXmlNode | undefined, field: string): CanonicalXmlTextNode;
/** Narrow a node to a branch, or throw naming the offending path. */
export declare function requireCanonicalXmlElement(node: CanonicalXmlNode | undefined, field: string): CanonicalXmlElementNode;
/** Read one attribute value, or throw naming the offending path. */
export declare function requireCanonicalXmlAttribute(node: CanonicalXmlNode, name: string, field: string): string;
/** Index a branch's children by tag, rejecting any tag outside `allowed`. */
export declare function indexCanonicalXmlChildren(node: CanonicalXmlElementNode, allowed: ReadonlyArray<string>, field: string): ReadonlyMap<string, CanonicalXmlNode>;
//# sourceMappingURL=canonical-xml.d.ts.map