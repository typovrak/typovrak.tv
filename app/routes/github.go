package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func GitHub() {
	http.HandleFunc("GET /github", handlers.GetGitHub)
}
