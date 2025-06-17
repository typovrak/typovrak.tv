package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func Index() {
	http.HandleFunc("GET /", handlers.GetIndex)
}
