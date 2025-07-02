package handlers

import (
	"net/http"
	"typovraktv/config/app"
)

func GetYouTube(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, app.YouTubeURL, 302)
}

func GetDiscord(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, app.DiscordURL, 302)
}

func GetCoffee(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, app.CoffeeURL, 302)
}

func GetInstagram(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, app.InstagramURL, 302)
}

func GetTikTok(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, app.TikTokURL, 302)
}

func GetGitHub(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, app.GitHubURL, 302)
}

func GetMalt(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, app.MaltURL, 302)
}

func GetSuperProf(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, app.SuperProfURL, 302)
}

func GetLinkedIn(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, app.LinkedInURL, 302)
}
