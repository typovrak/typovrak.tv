package routes

import (
	"net/http"
	"typovraktv/handlers"
)

func SuperProf() {
	http.HandleFunc("GET /superprof", handlers.GetSuperProf)
}
