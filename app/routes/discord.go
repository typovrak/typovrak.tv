package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func Discord() {
	http.HandleFunc("GET /discord", handlers.GetDiscord)
}
