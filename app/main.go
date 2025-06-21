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

	routes.Metrics()
	routes.Assets()
	routes.Index()
	routes.NotFound()

	routes.YouTube()
	routes.Discord()
	routes.Coffee()
	routes.Instagram()
	routes.TikTok()

	log.Println("Server listening on port :", os.Getenv("APP_PORT"))
	if err := http.ListenAndServe(":"+os.Getenv("APP_PORT"), nil); err != nil {
		log.Fatal("error while listening and serving the http server : " + err.Error())
	}
}
