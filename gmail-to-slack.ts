function gmailToSlack(messageModifier: (msg: GoogleAppsScript.Gmail.GmailMessage) => any, messageSender: (data: any) => void) {
    const props = PropertiesService.getScriptProperties().getProperties();
    let searchStr = props["GMAIL_SEARCH_STR"];
    if (searchStr) {
        searchStr = `in:unread AND (${searchStr})`;
    } else {
        searchStr = "in:unread";
    }
    const threads = GmailApp.search(searchStr).reverse();
    threads.forEach(thread => {
        thread.getMessages().map(messageModifier).map(messageSender)
        thread.markRead();
    })
}

function decodeHtmlEntity(str: string): string {
    str = str.replace(/&nbsp;/g, " ");
    return str.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec);
    });
}

/** HTMLメールを平文にする
 *   - headタグの内側は全部削る（単にタグだけ削るとCSSが平文として残る）
 *   - aタグはhrefのリンク先だけ残す
 *   - その他のタグは全部削る
 *   - 空行2連続以上を空行1個に削る
 */
function html2text(html: string): string {
    const headers = /<head>[\s\S]*<\/head>/i;
    const anchors = /<a(\s+[^>]+)*\s+href="([^"]*)"(\s+[^>]+)*>/ig;
    const tags = /<[^>]*>/g;
    const nbsp = /&nbsp;/g;
    const headingemptylines = /^(\s*\n)+/;
    const emptylines = /([ \t\r]*\n){2,}/g;
    const plaintext = decodeHtmlEntity(html);
    return plaintext.replace(headers, "").replace(anchors, "$2\n").replace(tags, "").replace(headingemptylines, "").replace(emptylines, "\n \n");
}

function messageToAttachment(msg: GoogleAppsScript.Gmail.GmailMessage) {
    const props = PropertiesService.getScriptProperties().getProperties();
    //Logger.log(html2text(msg.getBody()));
    return {
        "attachments": [
            {
                pretext: props['SLACK_PRETEXT'],
                title: msg.getSubject(),
                text: "　\n" + html2text(msg.getBody()), // 1行目を空行にするため全角スペースを利用
                footer: msg.getFrom(),
                ts: Math.floor(msg.getDate().valueOf() / 1000),
            }
        ]
    };
}

function attachmentToSlack(data: any): boolean {
    const props = PropertiesService.getScriptProperties().getProperties();
    const SLACK_API_ENDPOINT = props['SLACK_API_ENDPOINT']
    if (SLACK_API_ENDPOINT === undefined) {
        PropertiesService.getScriptProperties().setProperty("SLACK_API_ENDPOINT", "");
        return false;
    }
    const params: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(data)
    };
    const response = UrlFetchApp.fetch(SLACK_API_ENDPOINT, params)
}

function main(): void {
    gmailToSlack(messageToAttachment, attachmentToSlack)
}
