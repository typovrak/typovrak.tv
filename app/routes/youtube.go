package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func YouTube() {
	http.HandleFunc("GET /youtube", handlers.GetYouTube)
}
