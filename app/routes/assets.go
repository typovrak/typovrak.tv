package routes

import (
	"net/http"
	"os"
)

func Assets() {
	http.Handle("GET /assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(os.Getenv("APP_WEB_PATH")+"assets/"))))
}
