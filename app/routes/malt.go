package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func Malt() {
	http.HandleFunc("GET /malt", handlers.GetMalt)
}
