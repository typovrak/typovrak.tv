package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"typovraktv/routes"
)

func TestRoutesNotFound(t *testing.T) {
	t.Run("requesting /404 page", func(t *testing.T) {
		routes.NotFound()
		route := "/404"

		req := httptest.NewRequest("GET", route, nil)
		rec := httptest.NewRecorder()

		http.DefaultServeMux.ServeHTTP(rec, req)
		res := rec.Result()
		defer res.Body.Close()

		if res.StatusCode != 404 {
			t.Errorf("expected status 404, got %d", res.StatusCode)
		}
	})
}
