# gas-gmail-to-slack

Gmail APIを利用してメールをSlackの指定チャンネルに転送するGASスクリプトです。

Google App Script which sends mail contents in Gmail to specified Slack channel

Slackの公式Appである「Email」の劣化コピーです。Emailは有料プランでしか使えないという欠点がありますが、こちらは無料プランでも利用可能です。

## Setup

まず Node.js と Visual Studio Code をインストールしましょう。

そして次のようにタイプしてデプロイします。

```sh
$ npm install -g @google/clasp
$ npm install -g typescript
$ npm i
$ clasp login
$ clasp create
$ clasp push
```

作ったGASにアクセスして「ファイル」「プロジェクトのプロパティ」「スクリプトのプロパティ」に次のような値をセットします。

|プロパティ |値 |
|---|---|
|SLACK_API_ENDPOINT |POST用URL |
|SLACK_PRETEXT | メール本文の前につける説明文（必要なら） |

最後にスケジュール実行の設定をすれば完成です。私は1時間に1回起動しています。

## See also

 * https://github.com/google/clasp
 * [clasp/typescript\.md](https://github.com/google/clasp/blob/master/docs/typescript.md)
