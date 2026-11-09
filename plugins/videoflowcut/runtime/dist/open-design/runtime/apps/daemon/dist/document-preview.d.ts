type PreviewSection = {
    title: string;
    lines: string[];
};
type PreviewFile = {
    name: string;
    buffer: Buffer;
};
export declare function buildDocumentPreview(file: PreviewFile): Promise<{
    kind: "pdf";
    title: string;
    sections: unknown;
} | {
    kind: "document";
    title: string;
    sections: PreviewSection[];
} | {
    kind: "presentation";
    title: string;
    sections: PreviewSection[];
} | {
    kind: "spreadsheet";
    title: string;
    sections: PreviewSection[];
}>;
export {};
