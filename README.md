# gas-gmail-to-slack

Gmail APIを利用して未読メールをSlackの指定チャンネルに転送する Google App Script (GAS) です。

これはSlackの公式Appである「Email」の劣化コピーです。Emailは有料プランでしか使えないという欠点がありますが、こちらは無料プランでも利用可能です。

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

GMailとGASは同じアカウントで動かす必要があります。`clasp login`で同じアカウントを利用するようにしてください。

作ったGASにアクセスして「ファイル」「プロジェクトのプロパティ」「スクリプトのプロパティ」に次のような値をセットします。

|プロパティ |値 |
|---|---|
|SLACK_API_ENDPOINT |SlackのPOST用URL |
|SLACK_PRETEXT |Slack投稿時にメール本文の前につける説明文（任意） |
|GMAIL_SEARCH_STR |GMailの検索条件（任意） |

SlackのPOST用URLはSlackの管理画面から取得できます。

最後にスケジュール実行の設定をしてください。私は1時間に1回起動していますが、即時性が重要な場合は1分1回などとしても良いでしょう。

## See also

 * https://github.com/google/clasp
 * [clasp/typescript\.md](https://github.com/google/clasp/blob/master/docs/typescript.md)
