function gmailToSlack(): void {
    const props = PropertiesService.getScriptProperties().getProperties();
    let searchStr = getProp('GMAIL_SEARCH_STR')
    if (searchStr) {
        searchStr = `in:unread AND (${searchStr})`;
    } else {
        searchStr = "in:unread";
    }
    const threads = GmailApp.search(searchStr).reverse();
    threads.forEach(thread => {
        thread.getMessages().map(messageToAttachment).map(attachmentToSlack)
        thread.markRead();
    })
}

function decodeHtmlEntity(str: string): string {
    str = str.replace(/&nbsp;/g, " ");
    return str.replace(/&#(\d+);/g, function (match, dec) {
        return String.fromCharCode(dec);
    });
}

let configVals = {}
let configIds = {}
let configKeys = {}

/** スプレッドシートから設定値を取得
 *   - A列はインデックスキー(id)
 *   - 1行目は設定変数名(key)
 */
function getConfigFromSpreadsheet(id: string, key: string): string {
    if (Object.keys(configVals).length == 0) {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        if (spreadsheet === null) {
            throw new Error('Active spreadsheet not found.')
        }
        const sheet = spreadsheet.getSheets()[0];
        var vals = sheet.getDataRange().getValues();
        if (vals.length < 2 || vals[0].length < 2) {
            throw new Error('The config table requires at least 2 rows and 2 columns. Run InitConfigSpreadsheet() first.');
        }
        let ids = {};
        let keys = {};
        vals.map((_, i) => { if (i !== 0) { ids[vals[i][0]] = i; }});
        vals[0].map((_, i) => { if (i !== 0) { keys[vals[0][i]] = i; }});
        configIds = ids;
        configKeys = keys;
        configVals = vals;
    }
    const colnum = configKeys[key];
    if (colnum === undefined) {
        throw new Error('Unknown key specified: check the 1st row of spreadsheet.')
    }
    let rownum = configIds[id]
    if (rownum === undefined) {
        rownum = 1;
    }
    return configVals[rownum][colnum].toString()
}

/** スプレッドシートを初期化
 */
function initConfigSpreadsheet(): void {
    const headers = ['Mail address', 'SLACK_API_ENDPOINT', 'SLACK_PRETEXT', 'USE_HTMLBODY']
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (spreadsheet === null) {
        throw new Error('Active spreadsheet not found.');
    }
    const sheet = spreadsheet.getSheets()[0];
    const range = sheet.getRange(`R1C1:R2C${headers.length}`);
    let values = range.getValues();
    values[0] = headers;
    values[1][0] = spreadsheet.getOwner().getEmail();
    range.setValues(values);
    sheet.getRange('R1:R1').setBackground('#cfe2f3');
}

function getProp(name: string): string {
    let value = PropertiesService.getScriptProperties().getProperty(name.toUpperCase());
    if (value === null) {
        value = '';
    }
    return value;
}

/** HTMLメールを平文にする
 *   - headタグの内側は全部削る（単にタグだけ削るとCSSが平文として残る）
 *   - aタグはhrefのリンク先だけ残す
 *   - その他のタグは全部削る
 */
function html2text(html: string): string {
    const headers = /<head>[\s\S]*<\/head>/i;
    const anchors = /<a(\s+[^>\s]+)*\s+href="([^"]*)"[^>]*>/ig;
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
    const deliveredTo = /^Delivered-To\s*:\s*(.*)\r?\n/;
    const matches = msg.getRawContent().match(deliveredTo);
    if (matches === null) {
        return '';
    }
    return matches[1];
}

function messageToAttachment(msg: GoogleAppsScript.Gmail.GmailMessage) {
    const mailaddr = getDeliveredTo(msg)
    let text
    const use_htmlbody = getConfigFromSpreadsheet(mailaddr, 'USE_HTMLBODY')
    if (use_htmlbody === '1' || use_htmlbody.toLowerCase() === 'true') {
        text = html2text(msg.getBody());
    } else {
        text = msg.getPlainBody();
    }
    text = "　\n" + minimizeEmptyLines(text); // 1行目を空行にするため全角スペースを利用
    return {
        'mailaddr': mailaddr,
        'payload': {
            'attachments': [
                {
                    pretext: getConfigFromSpreadsheet(mailaddr, 'SLACK_PRETEXT'),
                    title: msg.getSubject(),
                    text: text,
                    footer: msg.getFrom(),
                    ts: Math.floor(msg.getDate().valueOf() / 1000),
                }
            ]
        }
    };
}

function attachmentToSlack(data: any): void {
    const SLACK_API_ENDPOINT = getConfigFromSpreadsheet(data['mailaddr'], 'SLACK_API_ENDPOINT')
    const params: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(data['payload'])
    };
    const response = UrlFetchApp.fetch(SLACK_API_ENDPOINT, params);
}

function main(): void {
    gmailToSlack();
}
