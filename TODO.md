- mettre en place websocket le fait de voir le curseur des personnes connecté sur le site sur la page ?

- ajouter un composant en début d'article pour les variables faisant que dans l'article et le code, cela sera les bonnes valeurs comme à la place de <USER> -> typovrak pour des commandes cli sur mon utilisateur
  - et ajouter des paramètres tel que remplacer "vim" par "nano" dans les commandes par exemple

- /about page

- compléter le security.txt : il existe déjà dans `public/.well-known/`, conforme RFC 9116
  (`Contact`, `Expires`, `Canonical`), il lui manque `Policy` et `Acknowledgments`

---

- diagrammes Mermaid rendus au build en SVG (via rehype, pas de JS client) : schémas d'archi
  sans casser la CSP. Rien n'est commencé. Les callouts, eux, sont faits (`rehype-callouts`)

- [ ] add components like AWS does it in every article to make it more enjoyable

---

ARTICLES :
- [ ] sur .git/info/exclude pour exclure des fichiers sans passer par le git ignore (très utile avec NixOS et son fichier shell.nix qui lui est si particulier)
- [ ] sur mon matériel
- [ ] sur mon clavier
- [ ] sur ma disposition particulière des touches de mon clavier
- [ ] sur data-appear, un composant version natif/react et autres frameworks
- [ ] sur mon premier paquet NPM, webcam-in-terminal-cli
- [ ] sur comment faire sa première contribution
- [ ] sur comment lancer le projet freeCodeCamp sous NixOS : écrit (`freecodecamp-on-nixos-prisma.md`), encore en `draft: true`, reste à publier
- [ ] Star Rune, comment j'ai aidé un jeu de dactylographie à lever plus de 15 000 $
- [ ] Créer un article se basant sur toutes les lois de atomic habite afin de devenir un développeur freelance
