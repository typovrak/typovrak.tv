package routes

import (
	"net/http"
	"typovraktv/config/app"
)

func Assets() {
	http.Handle("GET /assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(app.WebPath+"assets/"))))
}
