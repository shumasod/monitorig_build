resource "kubernetes_service" "prometheus" {
  metadata {
    name      = "prometheus"
    namespace = "my_monitoring"
  }

  spec {
    selector = {
      app = "prometheus"
    }

    port {
      port        = 9090
      target_port = 9090
    }

    type = "LoadBalancer"
  }
}
