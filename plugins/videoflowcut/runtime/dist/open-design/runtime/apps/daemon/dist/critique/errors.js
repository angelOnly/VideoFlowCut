export class MalformedBlockError extends Error {
    position;
    constructor(message, position) {
        super(message);
        this.position = position;
        this.name = 'MalformedBlockError';
    }
}
export class OversizeBlockError extends Error {
    position;
    constructor(message, position) {
        super(message);
        this.position = position;
        this.name = 'OversizeBlockError';
    }
}
export class MissingArtifactError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MissingArtifactError';
    }
}
//# sourceMappingURL=errors.js.map