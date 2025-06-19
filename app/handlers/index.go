package handlers

import (
	"log"
	"net/http"
	"typovraktv/config/app"
	"typovraktv/services"
)

func GetIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		log.Println(r.URL.Path)
		GetNotFound(w, r)
		return
	}

	repos, err := services.FetchGitHubRepos(http.DefaultClient, 100)
	if err != nil {
		http.Error(w, "Error handlers.FetchGitHubRepos(http.DefaultClient, 100) : "+err.Error(), 500)
		return
	}

	nixosRepos, starsCount, forksCount, err := services.FilterNixosRepos(repos)
	if err != nil {
		http.Error(w, "Error handlers.FilterNixosRepos(repos) : "+err.Error(), 500)
		return
	}

	log.Println(nixosRepos)
	log.Println(starsCount)
	log.Println(forksCount)

	services.RenderTemplate(w, services.TemplateParameters{
		Name: "base",
		Head: services.TemplateHead{
			MetaTitle:       "HOME" + app.MetaTitleDelimiter + app.Name,
			MetaDescription: "HOME meta description",
		},
		Files: []services.TemplateFile{
			services.TemplateFiles.Globals.Pico,
			services.TemplateFiles.Layout.Base,
			services.TemplateFiles.Layout.Header,
			services.TemplateFiles.Layout.Footer,
			services.TemplateFiles.View.Index,
		},
	})
}
