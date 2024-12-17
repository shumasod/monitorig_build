# モニタリングシステムセットアップ（検証）


**検証ツール**
- Prometheus
- Grafana
- Grafana Loki
- Elasticsearch
- Kibana
- Fluentd
- Zabbix
- Nagios

## 操作はVSCodeで実施

## 1. 環境準備
1. VSCodeをインストールし、必要な拡張機能をセットアップします。
   - Docker拡張機能
   - Remote - Containers拡張機能
   - YAML拡張機能
2. Dockerをインストールし、Docker Composeが利用可能であることを確認します。

## 2. プロジェクトセットアップ
1. VSCodeで新しいプロジェクトフォルダを作成します。
2. プロジェクトフォルダ内に以下のディレクトリ構造を作成します：

```
monitoring_build/
├── docker-compose.yml
├── prometheus/
│   └── prometheus.yml
├── grafana/
│   └── provisioning/
│       ├── dashboards/
│       └── datasources/
├── elasticsearch/
│   └── elasticsearch.yml
└── fluentd/
    └── fluent.conf
```

## 3. Docker Compose設定
1. `docker-compose.yml`ファイルを開き、以下の内容を追加します：

```yaml
version: '3'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - 9090:9090
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
  grafana:
    image: grafana/grafana
    ports:
      - 3000:3000
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    ports:
      - 9200:9200
    environment:
      - discovery.type=single-node
    volumes:
      - ./elasticsearch/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml
  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - 5601:5601
    depends_on:
      - elasticsearch
  fluentd:
    image: fluent/fluentd
    ports:
      - 24224:24224
    volumes:
      - ./fluentd/fluent.conf:/fluentd/etc/fluent.conf
    depends_on:
      - elasticsearch
```

## 4. Prometheus設定
1. `prometheus/prometheus.yml`ファイルを開き、以下の内容を追加します：

```yaml
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

## 5. Fluentd設定
1. `fluentd/fluent.conf`ファイルを開き、以下の内容を追加します：

```
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>
<match **>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
</match>
```

## 6. Elasticsearch設定
1. `elasticsearch/elasticsearch.yml`ファイルを開き、以下の内容を追加します：

```yaml
cluster.name: "docker-cluster"
network.host: 0.0.0.0
```

## 7. システム起動
1. VSCodeのターミナルを開きます。
2. プロジェクトのルートディレクトリに移動し、以下のコマンドを実行してシステムを起動します：

```
docker-compose up -d
```

## 8. 動作確認
1. 各サービスにアクセスして動作を確認します：
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000 (初期ユーザー名/パスワード: admin/admin)
   - Kibana: http://localhost:5601
   - Elasticsearch: http://localhost:9200
2. Grafanaでデータソースとしてプロメテウスを追加し、ダッシュボードを作成します。
3. アプリケーションログをFluentdに送信し、ElasticsearchとKibanaで可視化します。

## 9. カスタマイズと拡張
1. 監視対象のアプリケーションやサービスを追加する場合は、`prometheus.yml`にスクレイプ設定を追加します。
2. Grafanaダッシュボードをカスタマイズし、必要なメトリクスを表示します。
3. Fluentdの設定を拡張して、さまざまなログソースからデータを収集します。
4. Kibanaで高度な検索やビジュアライゼーションを作成し、ログデータを分析します。
5. Lokiを追加する場合は、Docker Composeファイルに新しいサービスを追加し、Grafanaのデータソースとして設定します。

これで、基本的なモニタリングシステムのセットアップが完了しました。必要に応じて各コンポーネントの設定をカスタマイズし、監視環境を拡張してください。
