import * as cheerio from 'cheerio';

/** HTMLメールを平文にする
 *   - headタグの内側は全部削る（単にタグだけ削るとCSSが平文として残る）
 *   - aタグはルールに従い、最適なテキストとURLにフォーマットする
 *   - その他の要素は必要に応じた改行処理を行いテキスト化する
 */

export function html2text(html: string): string {
  const $ = cheerio.load(html);

  // 1. 不要なタグの削除
  $('head, style, script, noscript, title').remove();

  // 2. 【重要】HTMLソース上のホワイトスペースの正規化
  // テキストノード内の改行や連続するスペースを、単一の半角スペースに変換する
  // ※これを最初に行うことで、後から追加する意図的な '\n' と区別できる
  $('*')
    .contents()
    .filter((_, el) => el.type === 'text')
    .each((_, el) => {
      // preタグの中身は正規化から除外するなどの配慮があるとさらに完璧です
      if ($(el).closest('pre').length === 0 && el.data) {
        el.data = el.data.replace(/\s+/g, ' ');
      }
    });

  // 3. 意図的な改行の挿入
  $('br').replaceWith('\n');

  // 4. ブロック要素の境界を確実にする（前後に改行を入れる）
  const blockTags = [
    'p',
    'div',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'li',
    'ul',
    'ol',
    'dl',
    'dt',
    'dd', // リスト系を追加
    'blockquote',
    'article',
    'section',
    'tr',
    'hr', // hrを追加
  ];
  $(blockTags.join(', ')).each((_i, el) => {
    $(el).before('\n').after('\n');
  });

  // <a>タグの最適化処理
  $('a').each((_i, el) => {
    const $el = $(el);
    const href = $el.attr('href');

    // [ErrorHandling] hrefが存在しない場合（ページ内アンカーなど）
    if (!href) {
      return; // タグのみ削除され、内部のテキストは抽出に委ねる
    }

    const trimmedHref = href.trim();
    const text = $el.text().trim();

    // [Case 1] テキストとURLが完全に同一の場合
    if (text === trimmedHref) {
      $el.replaceWith(trimmedHref);
      return;
    }

    // [Case 3] 内部が任意のテキストの場合
    // 内部にテキストと画像が混在している場合も、テキストがあれば優先される
    if (text) {
      $el.replaceWith(`[${text}]\n${trimmedHref} `);
      return;
    }

    // [Case 2] 内部が画像（<img>）の場合
    const $img = $el.find('img');
    if ($img.length > 0) {
      const alt = $img.first().attr('alt')?.trim();
      const fallbackText = alt || '画像';
      $el.replaceWith(`[${fallbackText}]\n${trimmedHref}`);
      return;
    }

    // どのケースにも当てはまらない場合
    $el.replaceWith(trimmedHref);
  });

  // 6. テキストの抽出とエスケープ文字の復元
  const rawText = $.root()
    .text()
    .replace(/\u00A0/g, ' ');

  // 7. 最終的な改行の最適化（ここで前後に挿入しすぎた改行を綺麗に丸める）
  return minimizeEmptyLines(normalizeWhitespace(rawText));
}

/** * テキスト内の不要な空白を正規化する
 * - 連続する半角スペース・タブを1つのスペースに圧縮
 * - 各行の行頭・行末のスペースを削除
 */
export function normalizeWhitespace(text: string): string {
  return (
    text
      // 1. 連続する半角スペース・タブを1つのスペースに変換
      // （直前で \u00A0 が半角スペースに変換されている前提）
      .replace(/[ \t]+/g, ' ')
      // 2. 各行の行頭・行末のスペースを削除 (mフラグで複数行モード)
      .replace(/^ +| +$/gm, '')
  );
}

/** 改行をSlack用に削る
 *   - 文字列先頭の改行連続を削る
 *   - 空行2連続以上を空行1個に削る
 */
export function minimizeEmptyLines(text: string): string {
  const headingEmptyLines = /^(\s*\n)+/;
  const emptyLines = /([ \t\r]*\n){2,}/g;
  return text.replace(headingEmptyLines, '').replace(emptyLines, '\n \n');
}
