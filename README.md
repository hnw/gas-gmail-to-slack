# gas-gmail-to-slack

Gmail APIを利用して未読メールをSlackの指定チャンネルに転送する Google App Script (GAS) です。

これはSlackの公式App「[Email](https://slack.com/apps/A0F81496D-email)」に似た機能を実現するものです。EmailはHTMLメールをかっこよくSlack上で再現してくれますが、gas-gmail-to-slack は最低限の文字情報をSlackに転送します。また、Emailに比べると設定が煩雑です。

gas-gmail-to-slack のメリットとしてSlackの無料プランでも利用可能な点、メールの前に付けるテキストをカスタマイズできる点が挙げられます。

## 利用例

* cronからのメール通知をSlackチャンネルに転送する
* ドメイン更新連絡など重要な割に見逃しやすいメールをSlackチャンネルに転送する

## 仕様・制限

* メールの転送先として複数のSlackワークスペース・チャンネルを使い分けられます
* アイコンや名前の変更はできません
* 元のメールがHTMLメールの場合、HTMLパートとテキストパートのどちらをSlackメッセージとして転送するか選択できます
* 転送したメッセージの先頭に任意の文字列を指定できます
  - たとえばメンションを指定することができます
* メールのSubjectはSlack上では太字で、メールの送信者と受信日は小さい字で表示します
* メール本文の先頭4行だけが表示されます
  - 「Show more」をクリックすれば全文が表示されます

![gas-gmail-to-slack example](https://github.com/hnw/gas-gmail-to-slack/blob/master/doc/gmail-to-slack-example.png?raw=true)

## オススメの使い方

本機能のために独立したGmailアカウントを用意し、メール振り分け機能を使って新アカウントに転送することをお勧めします。

Slackに転送済かどうかの管理はGmailの未読・既読で行っています。そのため、普段使いするGmailアカウントだと事故の元だと思います（転送対象メールを既読にしてしまうとSlackに転送されなくなります）。

また、後述する「複数の設定を使い分ける」機能を活用するためにも別アカウントがあった方が便利だと思います。

## GASのデプロイ

まず Node.js と Visual Studio Code をインストールしましょう。

次のようにタイプすればGASをデプロイできます。

```sh
$ npm install -g @google/clasp
$ npm install -g typescript
$ npm i
$ clasp login
$ clasp create --title gmail-to-slack --type sheets --rootDir ./src
$ clasp push
```

GASはGmailと同じアカウントでないと動作しません。`clasp login`でGASのログインを求められますが、専用Gmailアカウントを使う場合はそちらのアカウントでログインする必要があります。

## 設定

設定にはGASのプロパティ機能を利用します。これはGASの設定画面から「ファイル」「プロジェクトのプロパティ」「スクリプトのプロパティ」でアクセスできます。

![GAS property example](https://github.com/hnw/gas-gmail-to-slack/blob/master/doc/gas-property.png?raw=true)

設定できる値は以下の通りです。

| プロパティ         | 値                                                       |
|--------------------|----------------------------------------------------------|
| SLACK_API_ENDPOINT | Incoming WebhookのURL、スペース区切りで複数指定が可能    |
| SLACK_PRETEXT      | Slack投稿時にメール本文の前につける説明文（任意）        |
| USE_HTMLBODY       | HTMLメールを転送するかどうか（任意、デフォルト値:false） |
| GMAIL_SEARCH_STR   | Gmailの検索条件（任意）                                  |

Incoming WebhookのURLはAppとチャンネルに紐付くもので、[App設定ページ](https://api.slack.com/apps)の「Incoming Webhook」で確認できます。古い方のIncoming Webhook（カスタムインテグレーション）でも動くと思いますが未確認です。

Gmailの検索条件を設定しないとGmailアカウントに届いた全てのメールをSlackに転送します。専用アカウントを作った場合はこれで問題ないと思いますが、Slackに表示したくないメールがあるようならGmailの振り分け機能を使ってSlackに転送したいメールにタグをつけ、それを`GMAIL_SEARCH_STR`で指定すれば良いでしょう。

最後にスケジュール実行の設定をしてください。私は1時間に1回起動していますが、即時性が重要な場合は1分1回などとしても良いでしょう。

これでメールが届いたらSlackに転送されるはずです。

## メンションの指定方法

すでに説明した通り、スクリプトプロパティ`SLACK_PRETEXT`を使えば任意の文字列をメール本文の前に追加することができます。

この機能を使えば、個人やチャンネル全体にメンションを指定することもできます。ただし、普段のSlackクライアントとは書き方が変わる点に注意してください。

`SLACK_PRETEXT`中に下記のように書けば個人またはチャンネル全体にメンションを送れます。

| 記述例          | 意味                             |
|-----------------|--------------------------------|
| <@[メンバーID]> | 特定ユーザーに対するメンション |
| <!here>         | @here の意味                   |

参考：[Formatting text for app surfaces \| Slack](https://api.slack.com/reference/surfaces/formatting#mentioning-users)

## 複数の設定を使い分ける

Gmailではメールアドレスのローカルパート（@の前の部分）に+記号をつけ、その後任意の文字列を付加したようなメールアドレスもエイリアスとして機能します。たとえば、gmail2slack@gmail.comがあなたのメールアドレスだとすれば、gmail2slack+abracadabra@gmail.comというメールアドレス宛のメールも同じアカウントで受け取れるというわけです。

これを利用して、メールエイリアスごとに設定を使い分けることができます。

メールエイリアスに対応する設定は、+以降の文字列をサフィックスとして付加したスクリプトプロパティを利用します。つまり、上の例であれば`ABRACADABRA_SLACK_API_ENDPOINT`を設定すれば投稿先のSlackワークスペース・チャンネルを切り替えることができます。

メールエイリアスで切り替え可能なスクリプトプロパティは以下の通りです。

- `SLACK_API_ENDPOINT`
- `SLACK_PRETEXT`
- `USE_HTMLBODY`

## See also

 * https://github.com/google/clasp
 * [clasp/typescript\.md](https://github.com/google/clasp/blob/master/docs/typescript.md)
