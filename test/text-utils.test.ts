import { describe, expect, it } from 'vitest';

import {
  decodeHtmlEntity,
  html2text,
  minimizeEmptyLines,
} from '../src/text-utils';

describe('decodeHtmlEntity', () => {
  it('decodes nbsp and numeric entities', () => {
    expect(decodeHtmlEntity('A&nbsp;&#66;')).toBe('A B');
  });
});

describe('html2text', () => {
  it('strips tags but keeps anchor href', () => {
    const html =
      '<!DOCTYPE html><head><style>.x{color:red;}</style></head><body><!--comment--><a href="https://example.com">link</a><p>Hello&nbsp;world</p></body>';

    expect(html2text(html)).toBe('https://example.com\nlinkHello world');
  });
});

describe('minimizeEmptyLines', () => {
  it('trims heading empty lines and compresses multiple empty lines', () => {
    const input = '\n\nline1\n\n\nline2';
    expect(minimizeEmptyLines(input)).toBe('line1\n \nline2');
  });
});
