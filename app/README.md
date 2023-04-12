## ディレクトリ構成

```shell
.
├── README.md
├── docker                  # Dockerfile
│   ├── db                  # Local開発用DBコンテナ
│   └── web                 # Laravel x appacheコンテナ
├── docker-compose.yml      # Local開発用
└── src                     # Laravelのソースコード
```

## ローカル開発環境のセットアップ
1. `./docker-compose.yml`のコメントアウトを外してください。`src`ディレクトリをマウントすることができます。
1. `./docker/web/Dockerfile`の12行目から2行をコメントアウトしてください。また、同じく19行目·22行目の指示にしたがってください。
1. 以下のコマンドを打ち、コンテナを起動してください。

    ```shell
    docker compose up -d
    ```

1. `http://localhost:8080/`で起動したWebアプリへアクセスすることができます。

App Runnerへデプロイする場合は、1, 2の変更を元に戻してコンテナをビルドしてください。