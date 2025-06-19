package app

import (
	"log"
	"os"
)

func RequireEnv() {
	envs := []string{
		"APP_PORT",
		"APP_URL",
		"GITHUB_TOKEN",
	}

	for i := 0; i < len(envs); i++ {
		_, defined := os.LookupEnv(envs[i])
		if !defined {
			log.Fatal("environment variable not defined : " + envs[i])
		}
	}

	log.Println("All environment variables defined")
}
