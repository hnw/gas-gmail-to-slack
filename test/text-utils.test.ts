import { describe, expect, it } from 'vitest';

import { html2text, minimizeEmptyLines } from '../src/text-utils';

describe('html2text', () => {
  describe('1. Block-level elements and <br>', () => {
    it('converts <br> to newline', () => {
      const html = 'line1<br>line2<br/>line3';
      expect(html2text(html)).toBe('line1\nline2\nline3');
    });

    it('appends newline to major block-level elements', () => {
      const html = '<div>block1</div><p>block2</p><h1>block3</h1>';
      expect(html2text(html)).toBe('block1\n \nblock2\n \nblock3\n');
    });
  });

  describe('2. Anchor tags optimizations', () => {
    it('[ErrorHandling] handles <a> tags without href', () => {
      const html = '<a name="section">Anchor Text</a>';
      expect(html2text(html)).toBe('Anchor Text');
    });

    it('[Case 1] outputs only URL when text matches exactly or after trimming', () => {
      const html1 = '<a href="https://example.com">https://example.com</a>';
      expect(html2text(html1)).toBe('https://example.com');

      const html2 = '<a href="https://example.com">  https://example.com  </a>';
      expect(html2text(html2)).toBe('https://example.com');
    });

    it('[Case 2] handles inner <img> when no text is present', () => {
      const htmlWithAlt =
        '<a href="https://example.com"><img src="image.jpg" alt="Description"></a>';
      expect(html2text(htmlWithAlt)).toBe('[Description]\nhttps://example.com');

      const htmlWithEmptyAlt =
        '<a href="https://example.com"><img src="image.jpg" alt=""></a>';
      expect(html2text(htmlWithEmptyAlt)).toBe('[画像]\nhttps://example.com');

      const htmlWithoutAlt =
        '<a href="https://example.com"><img src="image.jpg"></a>';
      expect(html2text(htmlWithoutAlt)).toBe('[画像]\nhttps://example.com');

      const htmlWithWhitespace =
        '<a href="https://example.com">   <img src="image.jpg" alt="Desc">   </a>';
      expect(html2text(htmlWithWhitespace)).toBe('[Desc]\nhttps://example.com');
    });

    it('[Case 3] handles arbitrary text and mixed content (prioritizing text)', () => {
      const textOnly = '<a href="https://example.com">Click Here</a>';
      expect(html2text(textOnly)).toBe('[Click Here]\nhttps://example.com');

      const mixedContent =
        '<a href="https://example.com">Click Here<img src="icon.png" alt="icon"></a>';
      expect(html2text(mixedContent)).toBe('[Click Here]\nhttps://example.com');

      const mixedContent2 =
        '<a href="https://example.com"><span>Click Here</span>   <img src="icon.png" alt="icon"></a>';
      expect(html2text(mixedContent2)).toBe(
        '[Click Here]\nhttps://example.com',
      );
    });
  });

  it('strips tags but keeps anchor href correctly depending on context', () => {
    const html =
      '<!DOCTYPE html><head><style>.x{color:red;}</style></head><body><!--comment--><a href="https://example.com">link</a><p>Hello&nbsp;world</p></body>';

    expect(html2text(html)).toBe('[link]\nhttps://example.com\nHello world\n');
  });

  it('decodes nbsp and numeric entities correctly within HTML', () => {
    const html = '<p>A&nbsp;&#66;</p>';
    expect(html2text(html)).toBe('A B\n');
  });
});

describe('minimizeEmptyLines', () => {
  it('trims heading empty lines and compresses multiple empty lines', () => {
    const input = '\n\nline1\n  \n\nline2';
    expect(minimizeEmptyLines(input)).toBe('line1\n \nline2');
  });
});
