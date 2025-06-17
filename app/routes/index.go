package routes

import (
	"net/http"
	"typovraktv/handlers"
)

type GitHubRepo struct {
	Name string
}

func Index() {
	// WARN: all the code before the http.HandleFunc will be executed one time

	http.HandleFunc("GET /", handlers.GetIndex)
}
