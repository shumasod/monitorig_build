FROM docker.elastic.co/elasticsearch/elasticsearch:7.14.0

# カスタム設定やプラグインのインストールをここに追加できます
# 例：
# COPY elasticsearch.yml /usr/share/elasticsearch/config/
# RUN bin/elasticsearch-plugin install analysis-icu

# 必要に応じて環境変数を設定
ENV discovery.type=single-node

# Elasticsearchのデフォルトユーザーに切り替え
USER elasticsearch