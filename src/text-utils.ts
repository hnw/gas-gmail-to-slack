import * as cheerio from 'cheerio';

/** HTMLメールを平文にする
 *   - headタグの内側は全部削る（単にタグだけ削るとCSSが平文として残る）
 *   - aタグはhrefのリンク先だけ残す
 *   - その他のタグは全部削る
 */
export function html2text(html: string): string {
  const $ = cheerio.load(html);

  // 不要なタグの削除
  $('head, style, script, noscript, title').remove();

  // <a>タグの処理: hrefの値をテキストの先頭に付与
  $('a').each((_i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    if (href) {
      $el.prepend(`${href}\n`);
    }
  });

  // テキストを抽出し、&nbsp; を半角スペースに戻す（古い正規表現の挙動に合わせる）
  return $.root()
    .text()
    .replace(/\u00A0/g, ' ');
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
