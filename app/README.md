## ディレクトリ構成

```shell
.
├── README.md
├── docker                  # Dockerfile
│   ├── db                  # Local開発用DBコンテナ
│   └── web                 # Laravel x appacheコンテナ
│       └── src             # Laravelのソースコード
└── docker-compose.yml      # Local開発用
```

## ローカル開発環境のセットアップ

1. 以下のコマンドを打ち、コンテナを起動してください。

   ```shell
   docker compose up -d
   ```

1. `http://localhost:8080/`で起動した Web アプリへアクセスすることができます。
