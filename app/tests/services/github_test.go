package tests

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"typovraktv/services"
)

func mockFetchGitHubRepos(t *testing.T) ([]services.GitHubRepo, error) {
	reposLenWanted := 38

	data, err := os.ReadFile("./github_repos.json")
	if err != nil {
		t.Fatalf("error while reading github_repos.json : %v", err.Error())
		return nil, err
	}

	mockServer := httptest.NewServer(
		http.HandlerFunc(
			func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				w.Write(data)
			},
		),
	)
	defer mockServer.Close()

	repos, err := services.FetchGitHubRepos(http.DefaultClient, mockServer.URL, 100)
	if err != nil {
		t.Fatalf("error while fetching github repos : %v", err.Error())
		return nil, err
	}

	if len(repos) != reposLenWanted {
		t.Fatalf("expected len(repos) %d, got %d", reposLenWanted, len(repos))
		return nil, err
	}

	// for testing FilterNixosRepos
	return repos, nil
}

func TestFetchGitHubRepos(t *testing.T) {
	mockFetchGitHubRepos(t)
}

func TestFilterNixosRepos(t *testing.T) {
	nixosReposLenWanted := 32
	starsCountWanted := 7
	forksCountWanted := 3

	repos, err := mockFetchGitHubRepos(t)
	if err != nil {
		t.Fatalf("error while geting repos values : %v", err.Error())
	}

	nixosRepos, starsCount, forksCount, err := services.FilterNixosRepos(repos)
	if err != nil {
		t.Fatalf("error while filtering nixos repos : %v", err.Error())
	}

	if len(nixosRepos) != nixosReposLenWanted {
		t.Fatalf("expected len(nixosRepos) %d, got %d", nixosReposLenWanted, len(nixosRepos))
	}

	if starsCount != starsCountWanted {
		t.Fatalf("expected starsCount %d, got %d", starsCountWanted, starsCount)
	}

	if forksCount != forksCountWanted {
		t.Fatalf("expected forksCount %d, got %d", forksCountWanted, forksCount)
	}
}
