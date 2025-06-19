package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func TikTok() {
	http.HandleFunc("GET /tiktok", handlers.GetTikTok)
}
