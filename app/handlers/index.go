package handlers

import (
	"log"
	"net/http"
	"os"
	"typovraktv/config/app"
	"typovraktv/services"
)

func GetIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		log.Println(r.URL.Path)
		GetNotFound(w, r)
		return
	}

	if os.Getenv("APP_GO_TEST") == "false" {
		repos, err := services.FetchGitHubRepos(http.DefaultClient, "", 100)
		if err != nil {
			http.Error(w, "error while fetching github repos : "+err.Error(), 500)
			return
		}

		nixosRepos, starsCount, forksCount, err := services.FilterNixosRepos(repos)
		if err != nil {
			http.Error(w, "error while filtering nixos repos : "+err.Error(), 500)
			return
		}

		log.Println(nixosRepos, starsCount, forksCount)
	}

	services.RenderTemplate(w, services.TemplateParameters{
		Name: services.TemplateNameIndex,
		Head: services.TemplateHead{
			MetaTitle:       "HOME" + app.MetaTitleDelimiter + app.Name,
			MetaDescription: "HOME meta description",
		},
		Files: []services.TemplateFile{
			services.TemplateFiles.Component.IconGitHub,
			services.TemplateFiles.Component.ButtonIcon,
			services.TemplateFiles.Layout.Base,
			services.TemplateFiles.Layout.Header,
			services.TemplateFiles.Layout.Footer,
			services.TemplateFiles.Global.Reset,
			services.TemplateFiles.Global.Variables,
			services.TemplateFiles.Global.Config,
			services.TemplateFiles.View.Index,
		},
	})
}
