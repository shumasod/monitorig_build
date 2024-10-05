FROM grafana/grafana:9.3.2-alpine

# 必要な場合のみ追加の設定やプラグインをインストール
# RUN grafana-cli plugins install <plugin-name>

# 設定ファイルのコピー（ビルド時に変更が少ない順に配置）
COPY datasources.yaml /etc/grafana/provisioning/datasources/

# datasources.yamlファイルをDockerfileと同じディレクトリに配置する場合
COPY datasources.yaml /etc/grafana/provisioning/datasources/

# 完全なパスを指定する場合
# COPY /path/to/datasources.yaml /etc/grafana/provisioning/datasources/
