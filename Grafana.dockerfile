FROM grafana/grafana:latest
COPY datasources.yaml /etc/grafana/provisioning/datasources/