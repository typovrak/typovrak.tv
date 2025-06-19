package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func Index() {
	// WARN: all the code before the http.HandleFunc will be executed one time

	http.HandleFunc("GET /", handlers.GetIndex)
}
