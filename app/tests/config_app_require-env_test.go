package tests

import (
	"os"
	"testing"
	"typovraktv/config/app"
)

func TestRequireEnv(t *testing.T) {
	t.Run("APP_PORT env var not defined", func(t *testing.T) {
		os.Unsetenv("APP_PORT")

		err := app.RequireEnv()
		if err == nil {
			t.Error("expected an error, got nil")
		}

		os.Setenv("APP_PORT", "8080")
	})

	t.Run("all vars must be defined", func(t *testing.T) {
		err := app.RequireEnv()
		if err != nil {
			t.Errorf("expected an nil, got %v", err)
		}
	})
}
