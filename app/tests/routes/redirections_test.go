package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"typovraktv/config/app"
	"typovraktv/routes"
)

func TestYouTube(t *testing.T) {
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
		t.Errorf("expected Location header %q, got %q", locationWanted, location)
	}
}

func TestDiscord(t *testing.T) {
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
}

func TestCoffee(t *testing.T) {
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
}

func TestInstagram(t *testing.T) {
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
}

func TestTikTok(t *testing.T) {
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
}
