export function decodeHtmlEntity(str: string): string {
  const withSpaces = str.replace(/&nbsp;/g, ' ');
  return withSpaces.replace(/&#(\d+);/g, (_match, dec: string) =>
    String.fromCharCode(Number(dec)),
  );
}

/** HTMLメールを平文にする
 *   - headタグの内側は全部削る（単にタグだけ削るとCSSが平文として残る）
 *   - aタグはhrefのリンク先だけ残す
 *   - その他のタグは全部削る
 */
export function html2text(html: string): string {
  const headers = /<head>[\s\S]*<\/head>/i;
  const anchors = /<a(\s+[^>\s]+)*\s+href="([^"]*)"[^>]*>/gi;
  const tags = /<\/?[a-z\d][^>]*>/gi;
  const comments = /<!--.*?-->/gs;
  const docTypeDecl = /<!DOCTYPE\s+[^>[]*(\[[^\]]*\]\s*)?>/gi;

  return decodeHtmlEntity(html)
    .replace(headers, '')
    .replace(anchors, '$2\n')
    .replace(tags, '')
    .replace(comments, '')
    .replace(docTypeDecl, '');
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
