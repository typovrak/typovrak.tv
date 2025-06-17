package handlers

import (
	"html/template"
	"log"
	"net/http"
	"os"
	"typovraktv/config/app"
)

type TemplateName string

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
			Css:  true,
			Js:   true,
		},
		Footer: TemplateFile{
			Path: "layouts/footer",
			Html: true,
			Css:  true,
			Js:   true,
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

func GetIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		GetNotFound(w, r)
		return
	}

	renderTemplate(w, TemplateParameters{
		Name: "base",
		Head: TemplateHead{
			MetaTitle:       "HOME" + app.MetaTitleDelimiter + app.Name,
			MetaDescription: "HOME meta description",
		},
		Files: []TemplateFile{
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
			TemplateFiles.Layout.Base,
			TemplateFiles.Layout.Header,
			TemplateFiles.Layout.Footer,
			TemplateFiles.View.NotFound,
		},
	})
}
