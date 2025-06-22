package handlers

import (
	"net/http"
	"typovraktv/config/app"
	"typovraktv/services"
)

func GetNotFound(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(404)

	services.RenderTemplate(w, services.TemplateParameters{
		Name: services.TemplateNameNotFound,
		Head: services.TemplateHead{
			MetaTitle:       "NOT FOUND" + app.MetaTitleDelimiter + app.Name,
			MetaDescription: "NOT FOUND meta description",
		},
		Files: []services.TemplateFile{
			services.TemplateFiles.Global.Pico,
			services.TemplateFiles.Layout.Base,
			services.TemplateFiles.Layout.Header,
			services.TemplateFiles.Layout.Footer,
			services.TemplateFiles.View.NotFound,
		},
	})
}
