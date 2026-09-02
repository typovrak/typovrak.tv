- mettre en place websocket le fait de voir le curseur des personnes connecté sur le site sur la page ?

- ajouter un composant en début d'article pour les variables faisant que dans l'article et le code, cela sera les bonnes valeurs comme à la place de <USER> -> typovrak pour des commandes cli sur mon utilisateur
  - et ajouter des paramètres tel que remplacer "vim" par "nano" dans les commandes par exemple

- /about page

- améliorer le security.txt

- `curl typovrak.tv` : servir les articles en texte ANSI aux clients en ligne de commande
  - un `.txt` prérendu par article côté Astro, puis une route conditionnelle ajoutée au Build
    Output config par `scripts/security-headers.mjs` (un `has` sur l'en-tête `user-agent`, sur le
    modèle du `config.routes.unshift` qu'il fait déjà). Aucune fonction serverless, aucun JS,
    rien à consentir
  - piège : les codes ANSI polluent la sortie dès qu'on redirige vers un fichier, donc ne
    coloriser que si le client ne demande pas du texte pur, ou prévoir une variante `?raw`
  - piège : `X-Content-Type-Options: nosniff` déjà en place impose de servir le bon content-type

- barre de recherche fixe pour rediriger n'importe où sur le site, comme celle de
  `morphikweb-project-001` (`front/src/components/ui/SearchBar.tsx`)
  - toujours visible, ouverture au clic ou par ctrl+k, résultats groupés par catégorie
  - l'index n'est pas une liste de pages mais une liste d'entrées portant une ancre, donc on
    atterrit sur la bonne section et pas seulement sur la bonne page
  - prévoir un champ `keywords` indexé mais jamais affiché, pour les synonymes : sans lui on ne
    trouve un sujet que par son titre exact
  - c'est une évolution de `CommandPalette.astro`, qui fait déjà le ctrl+k sur la liste des
    pages, pas un second composant à côté
  - `/questions` produit déjà des entrées à ancre prêtes à indexer
  - la référence est en React avec un routeur client, ici il n'y en a pas (pas de ClientRouter,
    voir CLAUDE.md), donc chaque résultat est une navigation complète

- mieux stocker la provenance des visiteurs, pour distinguer deux liens posés sur le même
  domaine (deux subreddits, ou le lien en bio contre le lien en commentaire)
  - aujourd'hui `page_view_event.referrer_host` ne garde que l'hôte, donc tout Reddit se
    confond en `reddit.com`, et le trafic sans en-tête `referer` (applis mobiles, Discord,
    clients mail) tombe en `null`, indiscernable du direct
  - la seule forme acceptable : une colonne `campaign` alimentée par `utm_source`, validée
    contre une liste fermée écrite en dur dans le code, sur le modèle de `countryCode()` dans
    `requestInfo.ts`. Une valeur absente de la liste est jetée, pas stockée
  - la query string brute est exclue définitivement : elle transporte des termes de recherche,
    des jetons de session et des identifiants publicitaires comme `gclid`, ce qui ferait passer
    le compteur du décompte au tracking
  - RGPD : conforme uniquement à ces conditions, sinon on abandonne. Rien n'est lu ni écrit sur
    l'appareil du visiteur, donc pas de bandeau de consentement (ePrivacy art. 5(3) hors champ).
    Le jeton vient d'une liste fermée de noms de campagne, donc il ne décrit pas la personne et
    ne peut pas devenir un identifiant. Il ne doit jamais servir à recouper deux visites entre
    elles, et la liste ne doit jamais accueillir une valeur propre à une personne ou à un très
    petit groupe. Rétention alignée sur le reste, purge manuelle à 25 mois
  - piège : `PageViewTracker.astro` envoie `window.location.pathname`, qui supprime déjà la
    query string. Il faudra lire `utm_source` côté client et le passer explicitement, la
    provenance ne remontera pas toute seule côté serveur
  - piège : mettre à jour la page de politique de confidentialité, elle doit lister ce qui est
    collecté

---

Callouts / admonitions (note, warning, tip) thémés Catppuccin. Tu as évoqué des composants « façon AWS » : c'est la base.
Diagrammes Mermaid rendus au build en SVG (via rehype, pas de JS client) : schémas d'archi sans casser la CSP.

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
- [ ] sur comment lancer le projet freeCodeCamp sous NixOS (bug Prisma non supporté par freeCodeCamp pour le moment)
- [ ] sur mon ancienne configuration Arch Linux x Gnome
- [ ] Star Rune, comment j'ai aidé un jeu de dactylographie à lever plus de 15 000 $
- [ ] Créer un article se basant sur toutes les lois de atomic habite afin de devenir un développeur freelance
