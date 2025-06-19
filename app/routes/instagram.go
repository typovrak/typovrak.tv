package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func Instagram() {
	http.HandleFunc("GET /instagram", handlers.GetInstagram)
}
