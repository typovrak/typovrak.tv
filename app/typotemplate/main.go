package main

import (
	"bytes"
	"fmt"
	"strings"
)

// étapes
// 1. créer un composant
// 		* qui est une fonction golang
// 		* qui prend des props
// 		* qui prend des childs composants
// 		* return html pure static à 100%
// 		-
// 2. créer un objet de configuration pour page
// 		* définir les composants à importer
// 		* définir des propos variables pour les composants importés
//		-
// 3. créer une fonction qui va générer la page static
// 		* ajouter le contenu variable des children composant
// 		- minifier le html en une ligne et supprimer les whitespaces inutiles
//		-
// 4. mise en cache de la géneration dans un .tmp.html ???
// 		- en chunck
// 		-

type HeaderProps struct {
	backgroundColor  string
	titleBrandSuffix string
}

func Header(props HeaderProps) string {
	return "<header  >" +
		TitleBrand(TitleBrandProps{
			Suffix: props.titleBrandSuffix,
		}) +
		"</  header>"
}

type TitleBrandProps struct {
	Suffix string
}

func TitleBrand(props TitleBrandProps) string {
	return "<a   href=\"/\" class=\"\" >   " +
		"typovrak" +
		props.Suffix +
		"  </a>"
}

func PageIndex() string {
	return Header(HeaderProps{
		backgroundColor:  "purple",
		titleBrandSuffix: "!",
	})
}

func MinifyHTML(html string) string {
	fmt.Println(html)
	tokens := Tokenize(html)

	fmt.Println(tokens)
	minified := minify(tokens)

	return minified
}

type Token struct {
	Type  TokenType
	Value string
}

type TokenType int

const (
	TokenOpenTag TokenType = iota
	TokenCloseTag
	TokenAttribute
	TokenText
)

// TODO: tester les caractères qui sont sur plusieurs bytes.
func Tokenize(html string) []Token {
	var tokens []Token
	var buffer bytes.Buffer

	for i := 0; i < len(html); i++ {
		// TODO: perhaps use rune() here
		char := html[i]

		switch {
		case char == '<':
			if buffer.Len() > 0 {
				tokens = append(tokens, Token{Type: TokenText, Value: buffer.String()})
				buffer.Reset()
			}

		case char == '>':
			tokens = append(tokens, parseTag(buffer.String()))
			buffer.Reset()

		default:
			buffer.WriteByte(char)
		}
	}

	return tokens
}

func parseTag(tagContent string) Token {
	if strings.HasPrefix(tagContent, "/") {
		return Token{Type: TokenCloseTag, Value: tagContent[1:]}
	}

	parts := strings.Fields(tagContent)
	tagName := parts[0]
	// Gérer les attributs ici...
	return Token{Type: TokenOpenTag, Value: tagName}
}

func minify(tokens []Token) string {
	var builder strings.Builder
	for _, token := range tokens {
		switch token.Type {
		case TokenOpenTag:
			builder.WriteString("<" + token.Value + ">")
		case TokenCloseTag:
			builder.WriteString("</" + token.Value + ">")
		case TokenText:
			builder.WriteString(strings.TrimSpace(token.Value))
		}
	}
	return builder.String()
}

func main() {
	fmt.Println(MinifyHTML(PageIndex()))
}
