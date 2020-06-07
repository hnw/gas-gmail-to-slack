# gas-gmail-to-slack

Gmail APIを利用して未読メールをSlackの指定チャンネルに転送する Google App Script (GAS) です。

これはSlackの公式Appである「Email」の劣化コピーです。EmailはSlack有料プランでしか使えないという欠点がありますが、こちらは無料プランでも利用可能です。

## 仕様・制限

* 送信済の管理をGmailの未読・既読で行います
  - 各種事故防止のため本機能専用のGoogleアカウントを新規に作り、普段使いのアカウントからメール転送して使うことをオススメします
* メールの転送先として指定できるSlackワークスペース・チャンネルは1つだけです
* メール本文がHTMLメールの場合、URL以外の全タグを削除して全文をSlackメッセージにします
  - aタグのhref属性だけ平文として残します
  - Subjectは太字で、送信者と送信日は小さい字で表示します
  - Slackの標準機能により、メール本文の先頭5行だけが表示されます
    - 「Show more」をクリックすれば全文が表示されます。

## GASのデプロイ

まず Node.js と Visual Studio Code をインストールしましょう。

次のようにタイプすればGASをデプロイできます。

```sh
$ npm install -g @google/clasp
$ npm install -g typescript
$ npm i
$ clasp login
$ clasp create
$ clasp push
```

GASはGmailと同じアカウントでないと動作しません。`clasp login`でGASのログインを求められますが、専用Gmailアカウントを使う場合はそちらのアカウントでログインする必要があります。

## 設定

デプロイ後にGASの設定画面にアクセスして「ファイル」「プロジェクトのプロパティ」「スクリプトのプロパティ」に次値をセットします。

|プロパティ |値 |
|---|---|
|SLACK_API_ENDPOINT |Incoming WebhookのURL |
|SLACK_PRETEXT |Slack投稿時にメール本文の前につける説明文（任意） |
|GMAIL_SEARCH_STR |Gmailの検索条件（任意） |

Incoming WebhookのURLはAppとチャンネルに紐付くもので、App設定ページの「Incoming Webhook」で確認できます。古い方のIncoming Webhook（カスタムインテグレーション）でも動くと思いますが未確認です。

Gmailの検索条件を設定しないとGmailアカウントに届いた全てのメールをSlackに転送します。専用アカウントを作った場合はこれで問題ないと思いますが、Slackに表示したくないメールがあるようならGmailの振り分け機能を使ってSlackに転送したいメールにタグをつけ、それを`GMAIL_SEARCH_STR`で指定すれば良いでしょう。

最後にスケジュール実行の設定をしてください。私は1時間に1回起動していますが、即時性が重要な場合は1分1回などとしても良いでしょう。

これでメールが届いたらSlackに転送されるはずです。

## See also

 * https://github.com/google/clasp
 * [clasp/typescript\.md](https://github.com/google/clasp/blob/master/docs/typescript.md)
