package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func NotFound() {
	http.HandleFunc("GET /404", handlers.GetNotFound)
}
