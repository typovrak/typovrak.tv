package tests

import (
	"log"
	"net/http/httptest"
	"testing"
	"typovraktv/config/app"
	"typovraktv/services"
)

func TestServicesTemplate(t *testing.T) {
	t.Run("crashing the render template service", func(t *testing.T) {
		w := httptest.NewRecorder()

		services.RenderTemplate(w, services.TemplateParameters{
			Name: services.TemplateNameIndex,
			Head: services.TemplateHead{
				MetaTitle:       "HOME" + app.MetaTitleDelimiter + app.Name,
				MetaDescription: "HOME meta description",
			},
			Files: []services.TemplateFile{
				services.TemplateFiles.View.Index,
			},
		})

		if w.Code != 500 {
			t.Errorf("expected 500, got %d", w.Code)
			log.Println(w)
		}
	})

	t.Run("rendering / page", func(t *testing.T) {
		w := httptest.NewRecorder()

		services.RenderTemplate(w, services.TemplateParameters{
			Name: services.TemplateNameIndex,
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

		if w.Code != 200 {
			t.Errorf("expected 200, got %d", w.Code)
			log.Println(w)
		}
	})
}
