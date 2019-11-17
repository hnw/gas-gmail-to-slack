function gmailToSlack(searchStr: string, messageModifier: (msg: GoogleAppsScript.Gmail.GmailMessage) => any, messageSender: (data: any) => void) {
    if (searchStr === "") {
        searchStr = "in:unread";
    } else {
        searchStr = `in:unread AND (${searchStr})`;
    }
    const threads = GmailApp.search(searchStr);
    threads.forEach(thread => {
        thread.getMessages().map(messageModifier).map(messageSender)
        thread.markRead();
    })
}

function messageToAttachment(msg: GoogleAppsScript.Gmail.GmailMessage) {
    return {
            "attachments": [
                {
                    title: msg.getSubject(),
                    text: msg.getPlainBody(),
                    footer: msg.getFrom(),
                    ts: Math.floor(msg.getDate().valueOf() / 1000),
                }
            ]
        }
    };
}

function attachmentToSlack(data: any): boolean {
    const props = PropertiesService.getScriptProperties();
    const SLACK_API_ENDPOINT = props.getProperty('SLACK_API_ENDPOINT')
    if (SLACK_API_ENDPOINT === null) {
        props.setProperty("SLACK_API_ENDPOINT", "");
        return false;
    }
    const SLACK_USERNAME = props.getProperty('SLACK_USERNAME') || 'gmail2slack';
    const params: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(data)
    };
    const response = UrlFetchApp.fetch(SLACK_API_ENDPOINT, params)
}

function main(): void {
    gmailToSlack("", messageToAttachment, attachmentToSlack)
}
