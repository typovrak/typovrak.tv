package main

import (
	"log"
	"net/http"
	"os"
	"typovraktv/config/app"
	"typovraktv/routes"
)

func main() {
	app.RequireEnv()

	routes.Assets()
	routes.Index()

	log.Println("Server listening on port :", os.Getenv("APP_PORT"))
	if err := http.ListenAndServe(":"+os.Getenv("APP_PORT"), nil); err != nil {
		log.Fatal(err)
	}
}
