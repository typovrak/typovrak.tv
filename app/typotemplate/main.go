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
		"typovrakéé`eèè˙çç  ^💜" +
		props.Suffix +
		"  </a>" +
		"<div class=\"test \"></div>" +
		"<div    data-content=\"   \" title=\" test \"></div>" +
		"<p class=\"coucou bonjour  test aurevoir\"></p>"
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
		char := html[i]

		switch char {
		case '<':
			if buffer.Len() > 0 {
				tokens = append(tokens, Token{Type: TokenText, Value: buffer.String()})
				buffer.Reset()
			}

		case '>':
			tokens = parseTag(tokens, buffer.String())
			buffer.Reset()

		default:
			buffer.WriteByte(char)
		}
	}

	return tokens
}

func parseTag(tokens []Token, tagContent string) []Token {
	if strings.HasPrefix(tagContent, "/") {
		tokens = append(tokens, Token{Type: TokenCloseTag, Value: tagContent[1:]})
		return tokens
	}

	parts := strings.Fields(tagContent)
	tokens = append(tokens, Token{Type: TokenOpenTag, Value: parts[0]})

	// TEST: key without value
	for i := 1; i < len(parts); i++ {
		tokens = append(tokens, Token{Type: TokenAttribute, Value: parts[i]})
	}

	fmt.Println(tokens)
	fmt.Println("parts", parts)
	fmt.Println()

	return tokens
}

func minify(tokens []Token) string {
	var builder strings.Builder
	// lastAttribute := ""

	// WARN: do everything to manage the spacing for the next element.
	for i := 0; i < len(tokens); i++ {
		switch tokens[i].Type {
		// TODO: add intag
		case TokenOpenTag:
			s := "<" + tokens[i].Value

			if tokens[i+1].Type != TokenAttribute {
				s += ">"
			} else {
				s += " "
			}

			builder.WriteString(s)

		case TokenCloseTag:
			builder.WriteString("</" + tokens[i].Value + ">")

		case TokenAttribute:
			s := tokens[i].Value

			if tokens[i+1].Type != TokenAttribute {
				s += ">"
			} else {
				s += " "
			}

			// store attribute name in lastAttribute
			// split := strings.Split(tokens[i].Value, "=")

			// if len(split) > 0 {
			//	lastAttribute = split[0]

			//	content := split[:1]
			//}

			//// check if the other one is an attribute
			//// remove all whitespaces
			//// close the attribute

			//if len(tokens[i].Value) >= 5 && tokens[i].Value[:5] == "class" {
			//	// remove trailing whitespace in class
			//	tokens[i].Value = "class=\"" + strings.Trim(tokens[i].Value, " \"'") + "\""
			//}

			builder.WriteString(s)

		case TokenText:
			builder.WriteString(strings.TrimSpace(tokens[i].Value))
		}
	}
	return builder.String()
}

func main() {
	fmt.Println(MinifyHTML(PageIndex()))
}
