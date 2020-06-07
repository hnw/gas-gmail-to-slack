# gas-gmail-to-slack

Gmail APIを利用して未読メールをSlackの指定チャンネルに転送する Google App Script (GAS) です。

これはSlackの公式App「Email」に似た機能を実現するものです。EmailはHTMLメールをかっこよくSlack上で再現してくれますが、`gas-gmail-to-slack` は最低限の文字情報をSlackに転送します。

`gas-gmail-to-slack`のメリットとしてSlackの無料プランでも利用可能な点が挙げられます。

## 仕様・制限

* メールの転送先として複数のSlackワークスペース・チャンネルを使い分けられます
* Slack送信済かどうかの管理はGmailの未読・既読で行います
  - 事故防止のため普段使いのメールアカウントと別に本機能専用のGoogleアカウントを新規に作ることをお勧めします
* 元のメールがHTMLメールの場合、HTMLパートとテキストパートのどちらをSlackメッセージとして転送するか選択できます
  - メール本文がHTMLメールの場合、URL以外の全タグを削除して全文をSlackメッセージにします
    - aタグのhref属性だけは平文として残します
* Slackメッセージの先頭に任意の文字列を追加できます
  - たとえばメンションを指定することができます
* メールのSubjectはSlack上では太字で、メールの送信者と受信日は小さい字で表示します
* Slackの標準機能により、メール本文の先頭5行だけが表示されます
  - 「Show more」をクリックすれば全文が表示されます

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

| プロパティ         | 値                                                       |
|--------------------|----------------------------------------------------------|
| SLACK_API_ENDPOINT | Incoming WebhookのURL、スペース区切りで複数指定が可能    |
| SLACK_PRETEXT      | Slack投稿時にメール本文の前につける説明文（任意）        |
| USE_HTMLBODY       | HTMLメールを転送するかどうか（任意、デフォルト値:false） |
| GMAIL_SEARCH_STR   | Gmailの検索条件（任意）                                  |

Incoming WebhookのURLはAppとチャンネルに紐付くもので、App設定ページの「Incoming Webhook」で確認できます。古い方のIncoming Webhook（カスタムインテグレーション）でも動くと思いますが未確認です。

Gmailの検索条件を設定しないとGmailアカウントに届いた全てのメールをSlackに転送します。専用アカウントを作った場合はこれで問題ないと思いますが、Slackに表示したくないメールがあるようならGmailの振り分け機能を使ってSlackに転送したいメールにタグをつけ、それを`GMAIL_SEARCH_STR`で指定すれば良いでしょう。

最後にスケジュール実行の設定をしてください。私は1時間に1回起動していますが、即時性が重要な場合は1分1回などとしても良いでしょう。

これでメールが届いたらSlackに転送されるはずです。

## メンションの指定方法

「設定」で説明したように、環境変数`SLACK_PRETEXT`を使えば任意の文字列をメール本文の前に追加することができます。

この機能を使えば、個人やチャンネル全体にメンションを指定することもできます。ただし、メンションの記述方法はAPI仕様に従うため、普段のSlackクライアントとは書き方が変わる点に注意してください。

| 記述例          | 意味                             |
|-----------------|--------------------------------|
| <@[メンバーID]> | 特定ユーザーに対するメンション |
| <!here>         | @here の意味                   |

参考：[Formatting text for app surfaces \| Slack](https://api.slack.com/reference/surfaces/formatting#mentioning-users)

## 複数の設定を使い分ける

Gmailの+エイリアス機能により複数の設定を使い分けることができます。+エイリアス機能というのはgmail2slack@gmail.comを持っている場合、gmail2slack+[任意の文字列]@gmail.comというメールアドレス宛のメールも同じアカウントで受け取れる機能のことです。

つまり、Aさんからのメールをチャンネルfooに、Bさんからのメールをチャンネルbarに転送したいような場合、Gmailの振り分け・転送機能を使ってAさんからのメールをgmail2slack+foo@gmail.comに、Bさんからのメールをgmail2slack+bar@gmail.comに転送します。

+エイリアスアドレスに対応する設定は、+以降のの文字列をサフィックスとして付加した環境変数を利用します。つまり、上の例であれば`FOO_SLACK_API_ENDPOINT`や`BAR_SLACK_API_ENDPOINT`を設定すれば投稿先のSlackワークスペース・チャンネルを切り替えることができます。

+エイリアスで切り替え可能な環境変数は以下の通りです。

- `SLACK_API_ENDPOINT`
- `SLACK_PRETEXT`
- `USE_HTMLBODY`

## See also

 * https://github.com/google/clasp
 * [clasp/typescript\.md](https://github.com/google/clasp/blob/master/docs/typescript.md)
