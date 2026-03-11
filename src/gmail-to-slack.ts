import { html2text, minimizeEmptyLines } from './text-utils';

type ConfigIndex = Record<string, number>;
type ConfigTable = string[][];

type SlackPostData = {
  mailaddr: string;
  payload: {
    attachments: Array<{
      pretext: string;
      title: string;
      text: string;
      footer: string;
      ts: number;
    }>;
  };
};

let configVals: ConfigTable = [];
let configIds: ConfigIndex = {};
let configKeys: ConfigIndex = {};

export function gmailToSlack(): void {
  const configuredSearchStr = getProp('GMAIL_SEARCH_STR');
  const searchStr = configuredSearchStr
    ? `in:unread AND (${configuredSearchStr})`
    : 'in:unread';
  const threads = GmailApp.search(searchStr).reverse();

  threads.forEach((thread) => {
    thread.getMessages().map(messageToAttachment).forEach(attachmentToSlack);
    thread.markRead();
  });
}

function loadConfigFromSpreadsheet(): void {
  if (configVals.length > 0) {
    return;
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (spreadsheet === null) {
    throw new Error('Active spreadsheet not found.');
  }
  const sheet = spreadsheet.getSheets()[0];
  const rawVals = sheet
    .getDataRange()
    .getValues()
    .map((row) => row.map((cell) => String(cell ?? '')));

  if (rawVals.length < 2 || rawVals[0].length < 2) {
    throw new Error(
      'The config table requires at least 2 rows and 2 columns. Run initConfigSpreadsheet() first.',
    );
  }

  const ids: ConfigIndex = {};
  const keys: ConfigIndex = {};

  for (let rowIndex = 1; rowIndex < rawVals.length; rowIndex += 1) {
    const id = rawVals[rowIndex][0];
    if (id !== '') {
      ids[id] = rowIndex;
    }
  }

  for (let colIndex = 1; colIndex < rawVals[0].length; colIndex += 1) {
    const key = rawVals[0][colIndex];
    if (key !== '') {
      keys[key] = colIndex;
    }
  }

  configVals = rawVals;
  configIds = ids;
  configKeys = keys;
}

/** スプレッドシートから設定値を取得
 *   - A列はインデックスキー(id)
 *   - 1行目は設定変数名(key)
 */
function getConfigFromSpreadsheet(id: string, key: string): string {
  loadConfigFromSpreadsheet();

  const colNum = configKeys[key];
  if (colNum === undefined) {
    throw new Error('Unknown key specified: check the 1st row of spreadsheet.');
  }

  const rowNum = configIds[id] ?? 1;
  return configVals[rowNum][colNum];
}

/** スプレッドシートを初期化
 */
export function initConfigSpreadsheet(): void {
  const headers = [
    'Mail address',
    'SLACK_API_ENDPOINT',
    'SLACK_PRETEXT',
    'USE_HTMLBODY',
  ];
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (spreadsheet === null) {
    throw new Error('Active spreadsheet not found.');
  }

  const sheet = spreadsheet.getSheets()[0];
  const range = sheet.getRange(`R1C1:R2C${headers.length}`);
  const values = range.getValues();
  values[0] = headers;
  values[1][0] = spreadsheet.getOwner()?.getEmail() ?? '';
  range.setValues(values);
  sheet.getRange('R1:R1').setBackground('#cfe2f3');
}

function getProp(name: string): string {
  const value = PropertiesService.getScriptProperties().getProperty(
    name.toUpperCase(),
  );
  return value ?? '';
}

function getDeliveredTo(msg: GoogleAppsScript.Gmail.GmailMessage): string {
  const deliveredTo = /^Delivered-To\s*:\s*(.*)\r?\n/;
  const matches = msg.getRawContent().match(deliveredTo);
  if (matches === null) {
    return '';
  }
  return matches[1];
}

function messageToAttachment(
  msg: GoogleAppsScript.Gmail.GmailMessage,
): SlackPostData {
  const mailaddr = getDeliveredTo(msg);
  const useHtmlBody = getConfigFromSpreadsheet(mailaddr, 'USE_HTMLBODY');

  const bodyText =
    useHtmlBody === '1' || useHtmlBody.toLowerCase() === 'true'
      ? html2text(msg.getBody())
      : msg.getPlainBody();

  const text = `　\n${minimizeEmptyLines(bodyText)}`;

  return {
    mailaddr,
    payload: {
      attachments: [
        {
          pretext: getConfigFromSpreadsheet(mailaddr, 'SLACK_PRETEXT'),
          title: msg.getSubject(),
          text,
          footer: msg.getFrom(),
          ts: Math.floor(msg.getDate().valueOf() / 1000),
        },
      ],
    },
  };
}

function attachmentToSlack(data: SlackPostData): void {
  const slackApiEndpoint = getConfigFromSpreadsheet(
    data.mailaddr,
    'SLACK_API_ENDPOINT',
  );
  const params: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data.payload),
  };
  UrlFetchApp.fetch(slackApiEndpoint, params);
}

export function main(): void {
  gmailToSlack();
}

declare const global: Record<string, unknown>;

// esbuild-gas-plugin reads these assignments and emits GAS global stubs.
global.gmailToSlack = gmailToSlack;
global.initConfigSpreadsheet = initConfigSpreadsheet;
global.main = main;
