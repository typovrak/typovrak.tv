package tests

import (
	"testing"
	"typovraktv/config/app"
)

func TestRequireEnv(t *testing.T) {
	t.Run("all vars must be defined", func(t *testing.T) {
		err := app.RequireEnv()
		if err != nil {
			t.Errorf("expected an nil, got %v", err)
		}
	})
}
