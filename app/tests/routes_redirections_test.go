package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"typovraktv/config/app"
	"typovraktv/routes"
)

func TestRoutesRedirections(t *testing.T) {
	t.Run("redirecting from /youtube to youtube channel", func(t *testing.T) {
		routes.YouTube()
		route := "/youtube"
		locationWanted := app.YouTubeURL

		req := httptest.NewRequest("GET", route, nil)
		rec := httptest.NewRecorder()

		http.DefaultServeMux.ServeHTTP(rec, req)
		res := rec.Result()
		defer res.Body.Close()

		if res.StatusCode != 302 {
			t.Errorf("expected status 302, got %d", res.StatusCode)
		}

		location := res.Header.Get("Location")
		if location != locationWanted {
			t.Errorf("expected location header %q, got %q", locationWanted, location)
		}
	})

	t.Run("redirecting from /discord to discord server", func(t *testing.T) {
		routes.Discord()
		route := "/discord"
		locationWanted := app.DiscordURL

		req := httptest.NewRequest("GET", route, nil)
		rec := httptest.NewRecorder()

		http.DefaultServeMux.ServeHTTP(rec, req)
		res := rec.Result()
		defer res.Body.Close()

		if res.StatusCode != 302 {
			t.Errorf("expected status 302, got %d", res.StatusCode)
		}

		location := res.Header.Get("Location")
		if location != locationWanted {
			t.Errorf("expected Location header %q, got %q", locationWanted, location)
		}
	})

	t.Run("redirecting from /coffee to buymeacoffee support page", func(t *testing.T) {
		routes.Coffee()
		route := "/coffee"
		locationWanted := app.CoffeeURL

		req := httptest.NewRequest("GET", route, nil)
		rec := httptest.NewRecorder()

		http.DefaultServeMux.ServeHTTP(rec, req)
		res := rec.Result()
		defer res.Body.Close()

		if res.StatusCode != 302 {
			t.Errorf("expected status 302, got %d", res.StatusCode)
		}

		location := res.Header.Get("Location")
		if location != locationWanted {
			t.Errorf("expected Location header %q, got %q", locationWanted, location)
		}
	})

	t.Run("redirecting to /instagram to instagram account", func(t *testing.T) {
		routes.Instagram()
		route := "/instagram"
		locationWanted := app.InstagramURL

		req := httptest.NewRequest("GET", route, nil)
		rec := httptest.NewRecorder()

		http.DefaultServeMux.ServeHTTP(rec, req)
		res := rec.Result()
		defer res.Body.Close()

		if res.StatusCode != 302 {
			t.Errorf("expected status 302, got %d", res.StatusCode)
		}

		location := res.Header.Get("Location")
		if location != locationWanted {
			t.Errorf("expected Location header %q, got %q", locationWanted, location)
		}
	})

	t.Run("redirecting from /tiktok to tik tok account", func(t *testing.T) {
		routes.TikTok()
		route := "/tiktok"
		locationWanted := app.TikTokURL

		req := httptest.NewRequest("GET", route, nil)
		rec := httptest.NewRecorder()

		http.DefaultServeMux.ServeHTTP(rec, req)
		res := rec.Result()
		defer res.Body.Close()

		if res.StatusCode != 302 {
			t.Errorf("expected status 302, got %d", res.StatusCode)
		}

		location := res.Header.Get("Location")
		if location != locationWanted {
			t.Errorf("expected Location header %q, got %q", locationWanted, location)
		}
	})
}
