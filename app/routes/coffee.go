package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func Coffee() {
	http.HandleFunc("GET /coffee", handlers.GetCoffee)
}
