package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"typovraktv/routes"
)

func TestRoutesIndex(t *testing.T) {
	t.Run("requesting / page", func(t *testing.T) {
		routes.Index()
		route := "/"

		req := httptest.NewRequest("GET", route, nil)
		rec := httptest.NewRecorder()

		http.DefaultServeMux.ServeHTTP(rec, req)
		res := rec.Result()
		defer res.Body.Close()

		if res.StatusCode != 200 {
			t.Errorf("expected status 200, got %d", res.StatusCode)
		}
	})
}
