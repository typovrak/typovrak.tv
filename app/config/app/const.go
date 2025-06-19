package app

const (
	Name               string = "Typovrak TV"
	MetaTitleDelimiter string = " - "

	YouTubeURL   string = "https://www.youtube.com/@typovrak_tv"
	DiscordURL   string = "https://discord.gg/ZDN7CYAGpx"
	CoffeeURL    string = "https://coffee.com"
	InstagramURL string = "https://www.instagram.com/typovrak"
	TikTokURL    string = "https://www.tiktok.com/@typovrak"
)

var WebPath string

func InitWebPath() {
	WebPath = "./web/"
}
