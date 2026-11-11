import type {CreativeCard, CreativeIndex} from './creative-library.mjs';

export function buildCreativeIndex(root?: string): Omit<CreativeIndex, 'source_sha256' | 'cards'> & {
  cards: Array<Omit<CreativeCard, 'body' | 'raw'>>;
};
export function main(args: string[]): void;
