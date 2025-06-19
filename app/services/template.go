package services

import (
	"html/template"
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

func RenderTemplate(w http.ResponseWriter, templateParams TemplateParameters) {
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

	err := parsedTemplate.ExecuteTemplate(w, string(templateParamsGlobal.Name), templateParamsGlobal)
	if err != nil {
		http.Error(w, "error while executing the template : "+err.Error(), 500)
		return
	}
}
