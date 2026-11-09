const ESC = '\u001b';
const BEL = '\u0007';
const COMPLETE_TERMINAL_CONTROL_RE = /(?:\u001b\][\s\S]*?(?:\u0007|\u001b\\)|\u001b\[[0-?]*[ -/]*[@-~]|\u001b[@-Z\\-_]|\u009b[0-?]*[ -/]*[@-~])/g;
function hasOscTerminator(value) {
    return value.includes(BEL) || value.includes(`${ESC}\\`);
}
function hasCsiFinalByte(value) {
    return /[\x40-\x7e]/.test(value.slice(2));
}
function splitIncompleteControlTail(value) {
    const escIndex = value.lastIndexOf(ESC);
    const csiIndex = value.lastIndexOf('\u009b');
    const index = Math.max(escIndex, csiIndex);
    if (index < 0)
        return [value, ''];
    const tail = value.slice(index);
    if (tail === ESC || tail === '\u009b')
        return [value.slice(0, index), tail];
    if (tail.startsWith(`${ESC}]`)) {
        return hasOscTerminator(tail) ? [value, ''] : [value.slice(0, index), tail];
    }
    if (tail.startsWith(`${ESC}[`)) {
        return hasCsiFinalByte(tail) ? [value, ''] : [value.slice(0, index), tail];
    }
    if (tail.startsWith('\u009b')) {
        return /[\x40-\x7e]/.test(tail.slice(1))
            ? [value, '']
            : [value.slice(0, index), tail];
    }
    return [value, ''];
}
export function stripTerminalControlSequences(value) {
    return value.replace(COMPLETE_TERMINAL_CONTROL_RE, '');
}
export class TerminalControlSequenceStripper {
    #pending = '';
    write(chunk) {
        const value = `${this.#pending}${typeof chunk === 'string' ? chunk : String(chunk)}`;
        this.#pending = '';
        const [ready, pending] = splitIncompleteControlTail(value);
        this.#pending = pending;
        return stripTerminalControlSequences(ready);
    }
    flush() {
        this.#pending = '';
        return '';
    }
}
//# sourceMappingURL=terminal-control.js.map