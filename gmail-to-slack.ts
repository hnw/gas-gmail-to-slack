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

function messageToAttachment(msg: GoogleAppsScript.Gmail.GmailMessage) {
    const props = PropertiesService.getScriptProperties().getProperties();
    return {
        "attachments": [
            {
                pretext: props['SLACK_PRETEXT'],
                title: msg.getSubject(),
                text: "　\n" + msg.getPlainBody(),
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
