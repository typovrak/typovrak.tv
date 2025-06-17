package main

import (
	"log"
	"net/http"
	"os"
	"typovraktv/config/app"
)

func main() {
	app.RequireEnv()

	log.Println("Server listening on port :", os.Getenv("APP_PORT"))
	if err := http.ListenAndServe(":"+os.Getenv("APP_PORT"), nil); err != nil {
		log.Fatal(err)
	}
}
