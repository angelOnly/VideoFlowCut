import { parse } from '@babel/parser';
const IMAGE_PATH = /^[^<>"'`\r\n{}()]+\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp|apng)(?:[?#][^<>"'`\r\n]*)?$/i;
const LOCAL_MODULE = /^(?:\.{1,2}\/|\/(?!\/))/;
/** Discover literal image URLs without executing code or treating arbitrary text
 * as HTML/CSS. Computed paths are deliberately not evaluated; callers can still
 * declare those assets through the existing manifest supportingFiles contract.
 * Authored JavaScript is never rewritten by this dependency-only scanner. */
export function javascriptImageReferences(source) {
    let root;
    try {
        root = parse(source, { sourceType: 'unambiguous', allowReturnOutsideFunction: true,
            allowAwaitOutsideFunction: true, createImportExpressions: true });
    }
    catch {
        // Keep existing deployment behavior for invalid/non-JavaScript source.
        // A dependency scan is not a new syntax-validation or code-execution gate.
        return [];
    }
    const references = [];
    const pending = [{ node: root }];
    while (pending.length) {
        const { node, parent } = pending.pop();
        const value = node.type === 'StringLiteral' ? node.value
            : node.type === 'TemplateLiteral' && node.expressions.length === 0 ? node.quasis[0]?.value.cooked : null;
        if (typeof value === 'string' && parent?.type !== 'BinaryExpression'
            && !(parent?.type === 'ObjectProperty' && parent.key === node && !parent.computed)
            && parent?.type !== 'TaggedTemplateExpression') {
            const isImport = (parent?.type === 'ImportDeclaration' || parent?.type === 'ExportNamedDeclaration'
                || parent?.type === 'ExportAllDeclaration' || parent?.type === 'ImportExpression') && parent.source === node;
            if (isImport ? LOCAL_MODULE.test(value) : IMAGE_PATH.test(value.trim())) {
                const isModuleUrl = parent?.type === 'NewExpression' && parent.callee.type === 'Identifier'
                    && parent.callee.name === 'URL' && parent.arguments[0] === node
                    && parent.arguments[1]?.type === 'MemberExpression'
                    && parent.arguments[1].object.type === 'MetaProperty'
                    && parent.arguments[1].object.meta.name === 'import'
                    && parent.arguments[1].object.property.name === 'meta'
                    && !parent.arguments[1].computed && parent.arguments[1].property.type === 'Identifier'
                    && parent.arguments[1].property.name === 'url';
                if (parent?.type === 'NewExpression' && parent.callee.type === 'Identifier' && parent.callee.name === 'URL') {
                    const base = parent.arguments[1];
                    const isDocumentUrl = base?.type === 'MemberExpression' && !base.computed
                        && base.object.type === 'Identifier' && base.object.name === 'document'
                        && base.property.type === 'Identifier' && base.property.name === 'baseURI';
                    // Never interpret a URL with an external/computed base as a local image.
                    if (parent.arguments[0] !== node || (!isModuleUrl && !isDocumentUrl))
                        continue;
                }
                references.push({ ref: value, line: node.loc?.start.line, relativeTo: isImport || isModuleUrl ? 'script' : 'document' });
            }
        }
        for (const value of Object.values(node)) {
            if (Array.isArray(value)) {
                // Reverse push retains source order (and deterministic diagnostics).
                for (let i = value.length - 1; i >= 0; i--)
                    if (isNode(value[i]))
                        pending.push({ node: value[i], parent: node });
            }
            else if (isNode(value))
                pending.push({ node: value, parent: node });
        }
    }
    return references;
}
function isNode(value) {
    return value !== null && typeof value === 'object' && 'type' in value && typeof value.type === 'string';
}
//# sourceMappingURL=javascript-image-references.js.map