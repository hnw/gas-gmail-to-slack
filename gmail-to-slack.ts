function gmailToSlack(messageModifier: (msg: GoogleAppsScript.Gmail.GmailMessage) => any, messageSender: (data: any) => void) {
    const props = PropertiesService.getScriptProperties().getProperties();
    let searchStr = getEnv('GMAIL_SEARCH_STR')
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

function getEnv(name: string, prefix: string = ''): string {
    let value
    if (prefix !== '') {
        value = PropertiesService.getScriptProperties().getProperty(prefix.toUpperCase()+'_'+name.toUpperCase())
        if (value !== null) {
            return value
        }
    }
    value = PropertiesService.getScriptProperties().getProperty(name.toUpperCase())
    if (value === null) {
        value = ''
    }
    return value
}

/** HTMLメールを平文にする
 *   - headタグの内側は全部削る（単にタグだけ削るとCSSが平文として残る）
 *   - aタグはhrefのリンク先だけ残す
 *   - その他のタグは全部削る
 */
function html2text(html: string): string {
    const headers = /<head>[\s\S]*<\/head>/i;
    const anchors = /<a(\s+[^>]+)*\s+href="([^"]*)"(\s+[^>]+)*>/ig;
    const tags = /<\/?[a-z\d][^>]*>/ig;
    const comments = /<!--.*?-->/sg;
    const doctypedecl = /<!DOCTYPE\s+[^>[]*(\[[^]]*\]\s*)?>/g;
    const nbsp = /&nbsp;/g;
    return decodeHtmlEntity(html).replace(headers, "").replace(anchors, "$2\n").replace(tags, "").replace(comments, "").replace(doctypedecl, "");
}

/** 改行をSlack用に削る
 *   - 文字列先頭の改行連続を削る
 *   - 空行2連続以上を空行1個に削る
 */
function minimizeEmptyLines(text: string): string {
    const headingemptylines = /^(\s*\n)+/;
    const emptylines = /([ \t\r]*\n){2,}/g;
    return text.replace(headingemptylines, "").replace(emptylines, "\n \n");
}

function getDeliveredTo(msg: GoogleAppsScript.Gmail.GmailMessage): string {
    const deliveredTo = /^Delivered-To\s*:\s*(.*)\r?\n/
    const matches = msg.getRawContent().match(deliveredTo)
    if (matches === null) {
        return ''
    }
    return matches[1]
}

function messageToAttachment(msg: GoogleAppsScript.Gmail.GmailMessage) {
    const gmailAlias = /^[^+]+(\+(.*))?@.*$/
    const prefix = getDeliveredTo(msg).replace(gmailAlias, "$2")
    //Logger.log(prefix)
    let text
    if (getEnv('USE_HTMLBODY', prefix) === '1' || getEnv('USE_HTMLBODY', prefix).toLowerCase() === 'true') {
        text = html2text(msg.getBody())
    } else {
        text = msg.getPlainBody()
    }
    text = "　\n" + minimizeEmptyLines(text) // 1行目を空行にするため全角スペースを利用
    return {
        'prefix': prefix,
        'payload': {
            'attachments': [
                {
                    pretext: getEnv('SLACK_PRETEXT', prefix),
                    title: msg.getSubject(),
                    text: text,
                    footer: msg.getFrom(),
                    ts: Math.floor(msg.getDate().valueOf() / 1000),
                }
            ]
        }
    };
}

function attachmentToSlack(data: any): boolean {
    const SLACK_API_ENDPOINT = getEnv('SLACK_API_ENDPOINT', data['prefix'])
    const params: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(data['payload'])
    };
    const response = UrlFetchApp.fetch(SLACK_API_ENDPOINT, params)
}

function main(): void {
    gmailToSlack(messageToAttachment, attachmentToSlack)
}
