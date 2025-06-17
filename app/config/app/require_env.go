package app

import (
	"log"
	"os"
)

func RequireEnv() {
	envs := []string{
		"APP_PORT",
		"APP_URL",
	}

	for i := 0; i < len(envs); i++ {
		_, defined := os.LookupEnv(envs[i])
		if !defined {
			log.Fatal("Environment variable not defined: " + envs[i])
		}
	}

	log.Println("All environment variables defined")
}
