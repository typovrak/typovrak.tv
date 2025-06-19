package services

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strconv"
)

type GitHubRepo struct {
	Name        string   `json:"name"`
	Html_url    string   `json:"html_url"`
	Description string   `json:"description"`
	Topics      []string `json:"topics"`

	Created_at string `json:"created_at"`
	Updated_at string `json:"updated_at"`
	Pushed_at  string `json:"pushed_at"`

	Stargazers_count int `json:"stargazers_count"`
	Forks_count      int `json:"forks_count"`
}

func FetchGitHubRepos(client *http.Client, url string, per_page int) ([]GitHubRepo, error) {
	// url can be mocked for testing
	if url == "" {
		url = "https://api.github.com/users/typovrak/repos"
	}

	req, err := http.NewRequest("GET", url+"?per_page="+strconv.Itoa(per_page), nil)
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
