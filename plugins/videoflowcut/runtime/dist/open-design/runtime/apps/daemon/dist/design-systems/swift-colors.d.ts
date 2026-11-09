export interface SwiftColorToken {
    name: string;
    hex: string;
}
/**
 * Evaluate a single SwiftUI color component expression: a hex byte (`0xF4`), a
 * decimal (`0.99`), an integer (`255`), or a single division of those
 * (`0xF4 / 255`, `220 / 360`). Returns null when the expression is anything
 * more complex so callers can skip it rather than guess.
 */
export declare function evalSwiftNumber(expr: string): number | null;
/** Build #rrggbb from red/green/blue unit floats (0..1). */
export declare function rgbUnitToHex(red: number, green: number, blue: number): string;
/** Convert HSB/HSV unit floats (0..1) to #rrggbb. */
export declare function hsbToHex(hue: number, saturation: number, brightness: number): string;
/**
 * Find SwiftUI `Color(...)` declarations in source/markdown and return them as
 * named hex swatches. Handles the `red:green:blue:`, `hue:saturation:brightness:`,
 * and `white:` initializers (a trailing `opacity:`/`alpha:` arg is ignored for
 * the swatch hex). A leading `let name =` / `var name =` / `static let name =`
 * names the swatch; named asset colors like `Color("Accent")` carry no value
 * and are skipped.
 */
export declare function extractSwiftColors(raw: string): SwiftColorToken[];
