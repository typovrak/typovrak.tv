package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func LinkedIn() {
	http.HandleFunc("GET /linkedin", handlers.GetLinkedIn)
}
