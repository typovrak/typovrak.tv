- mettre en place websocket le fait de voir le curseur des personnes connecté sur le site sur la page ?

- afficher après chaque réponse et résultat final de quiz le % de réussite ? et le % de personne qui ont choisi chaque réponse ?

- ajouter un composant en début d'article pour les variables faisant que dans l'article et le code, cela sera les bonnes valeurs comme à la place de <USER> -> typovrak pour des commandes cli sur mon utilisateur
  - et ajouter des paramètres tel que remplacer "vim" par "nano" dans les commandes par exemple

- /about page

- améliorer le security.txt

---

Callouts / admonitions (note, warning, tip) thémés Catppuccin. Tu as évoqué des composants « façon AWS » : c'est la base.
Bloc Q&A / FAQ par article (aussi dans ton TODO) avec JSON-LD FAQPage : lisibilité + gain SEO réel (rich snippets).
Diagrammes Mermaid rendus au build en SVG (via rehype, pas de JS client) : schémas d'archi sans casser la CSP.
Casts de terminal en SVG animé (type svg-term, généré au build) : montrer une session CLI sans lecteur JS externe. Parfait pour tes tutos.

- [ ] add components like AWS does it in every article to make it more enjoyable
- [ ] add at the end, before the comment section, a Q&A for every article with a result (like AWS)

---

ARTICLES :
- [ ] sur .git/info/exclude pour exclure des fichiers sans passer par le git ignore (très utile avec NixOS et son fichier shell.nix qui lui est si particulier)
- [ ] sur mon matériel
- [ ] sur mon clavier
- [ ] sur ma disposition particulière des touches de mon clavier
- [ ] sur data-appear, un composant version natif/react et autres frameworks
- [ ] sur mon premier paquet NPM, webcam-in-terminal-cli
- [ ] sur comment faire sa première contribution
- [ ] sur comment lancer le projet freeCodeCamp sous NixOS (bug Prisma non supporté par freeCodeCamp pour le moment)
- [ ] sur mon ancienne configuration Arch Linux x Gnome
- [ ] Star Rune, comment j'ai aidé un jeu de dactylographie à lever plus de 15 000 $
- [ ] Créer un article se basant sur toutes les lois de atomic habite afin de devenir un développeur freelance
