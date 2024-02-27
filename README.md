# App Runner サンプルアプリケーション

※ こちらの CDK では App Runner の作成に alpha 版のコンストラクトを使用しております。  
※ また、コンテナイメージの push に Construt Hub の CDK Docker Image Develoyment を利用しています
※ 上記 2 つとも 2024 年 2 月時点では正式に L2 コンストラクトとして採用されていないため、実装に変更が入る可能性があります。

このサンプルアプリケーションでは CDK を用いて、AWS 上に以下のリソースを作成します。

- VPC , ECR Private Repository
- App Runner Service, Aurora Serverless V2（Writer,Reader それぞれ 1 インスタンスずつ）
- WAF Web ACL (App Runner にアタッチ)
- Systems Manager, SSM Parameter Store（DB 接続に必要な環境変数等）

なお、Docker Compose を用いてローカル環境上にもアプリケーションをデプロイ可能になっています。  
AWS 環境ではなく、ローカルで動かしたい場合は **[ローカル環境のセットアップ手順](./app/README.md)** を参考にしてください。

## アーキテクチャ構成

![全体のアーキテクチャ図](./imgs/architecture.png)

## 画面イメージ

![イメージ図1](./imgs/appimage1.png)

![イメージ図2](./imgs/appimage2.png)

## ディレクトリ構成

以下は重要なファイル·ディレクトリのみ記載しています。

```shell
.
├── README.md                           # 本READMEファイル
├── app                                 # アプリ（コンテナ）に関するアセット
    ├── docker                          # Dockerfile
    │   ├── db                          # Local開発用DBコンテナ
    │   └── web                         # Laravel x appacheコンテナ
    ├── docker-compose.yml              # Local開発用
    └── src                             # Laravelのソースコード
└── infra                               # インフラ（CDK）に関するアセット
    ├── bin                             # スタックの定義
    ├── cdk.json                        # CDKの設定ファイル
    ├── jest.config.js                  # JavaScriptのフレームワークJestの設定ファイル
    ├── lib                             # CDK(Stack)の実装
    │   ├── cdk-base-stack.ts           # VPCやECRリポジトリ、Aurora Serverless V2をデプロイするためのスタック
    │   └── cdk-app-runner-stack.ts     # App Runner、WAFをデプロイするためのスタック
    ├── package-lock.json               # ライブラリ依存関係の定義ファイル
    ├── package.json                    # ライブラリ依存関係の定義ファイル
    ├── test                            # CDKのテストコード(未使用)
    └── tsconfig.json                   # TypeScriptの設定ファイル

```

## デプロイ準備

上記のリソースを AWS にデプロイする方法をまとめます。
デプロイを実行する端末には、下記のソフトウェアが必要です。

- AWS CLI v2
- Node.js 14 以上
- Docker

```shell
# CDKプロジェクト配下に移動
cd infra

# IaCの依存関係をインストール
npm ci

# CDKをデプロイ先のリージョンで使えるように初期化する（以下コマンドはap-northeast-1の例）
AWS_REGION=ap-northeast-1 npx cdk bootstrap
```

## デプロイ手順

**エラーとなった場合はコマンドを実行しているディレクトリが正しいことを確認してください**

### BaseStack のデプロイ

まずはじめに BaseStack をデプロイし、App Runner でサービスを実行するために必要な VPC や DB（Aurora Serverless V2）、コンテナイメージを格納するための ECR プライベートリポジトリを作成します。

```shell
# cdk-base-stackのデプロイ
npx cdk deploy BaseStack --require-approval never
```

### 環境変数を Secrets Manager に登録

コンテナで使用する環境変数（APP_KEY）を Secrets Manager に登録します。

※本来であれば、シークレット情報はコードリポジトリ上にアップするべきではないです。  
そのため、シークレットの arn を用いて、スタック内でシークレットの値を参照します。  
他にも DB 接続用のシークレット（パスワード等）をセットしますが、いずれもシークレットの値自体はコード上に記述しておりません。

```shell
# APP_KEYの値をAppKeyとしてSecrets Managerに登録
aws secretsmanager create-secret --name AppKey --secret-string base64:p6UzRqwZuOOZlSYfovvCaUM+tFGmcNrpQwm4dnmjues=
```

### AppRunnerStack のデプロイ

コンテナイメージプッシュ後、本スタックをデプロイし、App Runner のサービスや WAF をデプロイします。  
また、App Runner に WAF のマネージドルールをアタッチします。

appKeyArn の **[AccountID]** を先ほどメモしたアカウント ID に置き換えてください。  
東京リージョン以外を使用している場合は **リージョン(ap-northeat-1)** も変更してください。

```shell
# cdk-app-runner-stackのデプロイ
npx cdk deploy AppRunnerStack -c appKeyArn=arn:aws:secretsmanager:ap-northeast-1:[AccountID]:secret:AppKey --require-approval never
```

CDK の Outputs として **AppRunnerStack.AppRunnerURI** が出力されると思うので、Web ブラウザでアクセスしてみてください。

```shell
# 出力例
AppRunnerStack.AppRunnerURI = *******.ap-northeast-1.awsapprunner.com
```

### デプロイしたアプリケーションの動作確認や設定の確認

無事に App Runner 上に Note アプリケーションがデプロイされました。  
ノートの内容を追加してみたりしてみてください。

![画面イメージ図](./imgs/website-image.png)

マネジメントコンソールからデプロイやアプリケーションのログも確認できます。
![マネコンイメージ図](./imgs/console-image.png)

## リソースのクリーンアップ

以下のコマンドでデプロイした CDK スタックを削除します。  
※Docker イメージの削除については必要に応じて行ってください。

**[AccountID]** を先ほどメモしたアカウント ID に置き換えてください。  
メモが残っていない場合はマネジメントコンソールや CLI 等で確認します。

東京リージョン以外を使用している場合は**リージョン(ap-northeat-1)**も変更してください。

```shell
# 必要に応じてアカウントID野確認
aws sts get-caller-identity # "Account": "**********"と出力されます

# cdk destroyの実行（[appKeyArn]の書き換え必須）
npx cdk destroy BaseStack  -c appKeyArn=arn:aws:secretsmanager:ap-northeast-1:[AccountID]:secret:AppKey
```

コマンド内では BaseStack のみ削除対象として指定しておりますが、依存関係として AppRunnerStack も合わせて削除するか確認メッセージが出ますので **y**を入力します。

```shell
Are you sure you want to delete: AppRunnerStack, BaseStack (y/n)?
```

15 分ほどかかると全てのリソースが AWS 環境上から削除されます。
