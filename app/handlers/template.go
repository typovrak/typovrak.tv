package handlers

import (
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"os"
	"typovraktv/config/app"
)

type TemplateName string

// WARN: always use snake_case, kebab-case don't work with html/template
const (
	TemplateNameIndex    TemplateName = "index"
	TemplateNameNotFound TemplateName = "not_found"
)

type TemplateHead struct {
	MetaTitle       string
	MetaDescription string
	OgImage         string
}

type TemplateFile struct {
	Path string
	Html bool
	Css  bool
	Js   bool
}

var TemplateFiles = struct {
	Globals struct {
		Pico TemplateFile
	}
	Layout struct {
		Base   TemplateFile
		Header TemplateFile
		Footer TemplateFile
	}
	View struct {
		Index    TemplateFile
		NotFound TemplateFile
		User     TemplateFile
	}
}{
	Globals: struct {
		Pico TemplateFile
	}{
		Pico: TemplateFile{
			Path: "globals/pico",
			Html: false,
			Css:  true,
			Js:   false,
		},
	},
	Layout: struct {
		Base   TemplateFile
		Header TemplateFile
		Footer TemplateFile
	}{
		Base: TemplateFile{
			Path: "layouts/base",
			Html: true,
			Css:  false,
			Js:   false,
		},
		Header: TemplateFile{
			Path: "layouts/header",
			Html: true,
			Css:  false,
			Js:   false,
		},
		Footer: TemplateFile{
			Path: "layouts/footer",
			Html: true,
			Css:  false,
			Js:   false,
		},
	},
	View: struct {
		Index    TemplateFile
		NotFound TemplateFile
		User     TemplateFile
	}{
		Index: TemplateFile{
			Path: "views/index",
			Html: true,
			Css:  false,
			Js:   false,
		},
		NotFound: TemplateFile{
			Path: "views/not_found",
			Html: true,
			Css:  false,
			Js:   false,
		},
	},
}

type TemplateParameters struct {
	Name  TemplateName
	Head  TemplateHead
	Files []TemplateFile
}

type TemplateParametersGlobal struct {
	Name   TemplateName
	Head   TemplateHead
	Files  []TemplateFile
	AppUrl string
}

func renderTemplate(w http.ResponseWriter, templateParams TemplateParameters) {
	var parsedFiles []string
	for i := 0; i < len(templateParams.Files); i++ {
		if templateParams.Files[i].Html {
			parsedFiles = append(parsedFiles, app.WebPath+templateParams.Files[i].Path+".html")
		}
	}

	parsedTemplate := template.Must(template.ParseFiles(parsedFiles...))

	templateParamsGlobal := TemplateParametersGlobal{
		Name:   templateParams.Name,
		Head:   templateParams.Head,
		Files:  templateParams.Files,
		AppUrl: os.Getenv("APP_URL"),
	}

	if err := parsedTemplate.ExecuteTemplate(w, string(templateParamsGlobal.Name), templateParamsGlobal); err != nil {
		log.Fatal(err)
		return
	}
}

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

func GetIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		GetNotFound(w, r)
		return
	}

	req, _ := http.NewRequest("GET", "https://api.github.com/users/typovrak/repos?per_page=100", nil)
	req.Header.Set("Authorization", "Bearer "+os.Getenv("GITHUB_TOKEN"))
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	defer res.Body.Close()

	var repos []GitHubRepo
	if err := json.NewDecoder(res.Body).Decode(&repos); err != nil {
		log.Fatal(err)
	}

	starsCount := 0
	forksCount := 0
	var nixosRepos []GitHubRepo
	for i := 0; i < len(repos); i++ {
		if len(repos[i].Name) >= 5 && repos[i].Name[:5] == "nixos" {
			starsCount += repos[i].Stargazers_count
			forksCount += repos[i].Forks_count
			nixosRepos = append(nixosRepos, repos[i])
		}
	}

	log.Println(nixosRepos)
	log.Println(starsCount)
	log.Println(forksCount)

	renderTemplate(w, TemplateParameters{
		Name: "base",
		Head: TemplateHead{
			MetaTitle:       "HOME" + app.MetaTitleDelimiter + app.Name,
			MetaDescription: "HOME meta description",
		},
		Files: []TemplateFile{
			TemplateFiles.Globals.Pico,
			TemplateFiles.Layout.Base,
			TemplateFiles.Layout.Header,
			TemplateFiles.Layout.Footer,
			TemplateFiles.View.Index,
		},
	})
}

func GetNotFound(w http.ResponseWriter, _ *http.Request) {
	renderTemplate(w, TemplateParameters{
		Name: TemplateNameNotFound,
		Head: TemplateHead{
			MetaTitle:       "NOT FOUND" + app.MetaTitleDelimiter + app.Name,
			MetaDescription: "NOT FOUND meta description",
		},
		Files: []TemplateFile{
			TemplateFiles.Globals.Pico,
			TemplateFiles.Layout.Base,
			TemplateFiles.Layout.Header,
			TemplateFiles.Layout.Footer,
			TemplateFiles.View.NotFound,
		},
	})
}
