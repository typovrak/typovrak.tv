package services

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strconv"
)

type GitHubRepo struct {
	Name        string
	Html_url    string
	Description string
	Topics      []string

	Created_at string
	Updated_at string
	Pushed_at  string

	Stargazers_count int
	Forks_count      int
}

func FetchGitHubRepos(client *http.Client, per_page int) ([]GitHubRepo, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/users/typovrak/repos?per_page="+strconv.Itoa(per_page), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+os.Getenv("GITHUB_TOKEN"))

	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var repos []GitHubRepo
	if err := json.NewDecoder(res.Body).Decode(&repos); err != nil {
		return nil, err
	}

	return repos, nil
}

func FilterNixosRepos(repos []GitHubRepo) ([]GitHubRepo, int, int, error) {
	if repos == nil {
		return nil, 0, 0, errors.New("repos is nil")
	}

	var nixosRepos []GitHubRepo
	var starsCount, forksCount int

	for _, repo := range repos {
		if len(repo.Name) >= 5 && repo.Name[:5] == "nixos" {
			nixosRepos = append(nixosRepos, repo)
			starsCount += repo.Stargazers_count
			forksCount += repo.Forks_count
		}
	}

	return nixosRepos, starsCount, forksCount, nil
}
