package routes

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func Metrics() {
	http.Handle("GET /metrics", promhttp.Handler())
}
