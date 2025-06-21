package tests

import (
	"os"
	"testing"
)

// WARN: all tests must be in this folder, no subfolder authorized
func TestMain(m *testing.M) {
	// before tests
	os.Setenv("APP_PORT", "8080")
	os.Setenv("APP_URL", "http://localhost:8080")
	os.Setenv("APP_WEB_PATH", "../web/")
	os.Setenv("APP_GO_TEST", "true")
	os.Setenv("GITHUB_TOKEN", "xxx")

	// run tests
	exitVal := m.Run()

	// after tests

	// exit value from tests
	os.Exit(exitVal)
}
