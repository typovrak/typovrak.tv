package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"typovraktv/routes"
)

func TestRoutesAssets(t *testing.T) {
	t.Run("requesting /assets page", func(t *testing.T) {
		routes.Assets()
		route := "/assets/test.txt"

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
