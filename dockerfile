FROM grafana/grafana:9.3.2

# datasources.yamlファイルをDockerfileと同じディレクトリに配置する場合
COPY datasources.yaml /etc/grafana/provisioning/datasources/

# 完全なパスを指定する場合
# COPY /path/to/datasources.yaml /etc/grafana/provisioning/datasources/
