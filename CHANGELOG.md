# Changelog

Kaikki tähän projektiin tehdyt merkittävät muutokset dokumentoidaan tähän tiedostoon.

Muoto perustuu [Keep a Changelogiin](https://keepachangelog.com/fi/1.0.0/), ja versiointi noudattaa [Semantic Versioningia](https://semver.org/lang/fi/).

## [Unreleased]

### Korjattu

- Palvelin ilmoitti MCP-kättelyssä version `1.0.1`, vaikka paketti on `1.1.1`: versio luetaan nyt `package.json`:ista. Testi varmistaa, että ne täsmäävät.

### Turvallisuus

- Päivitetty riippuvuudet, joissa oli korkean ja kriittisen tason `npm audit` -löydöksiä: `simple-git` 4.0.2 (lähdekoodiin muutos: `const { simpleGit } = require("simple-git")`), `@modelcontextprotocol/sdk` 1.32.1 sekä välillisesti `fast-uri` ja `hono`. `npm audit --omit=dev` on nyt puhdas ja CI ajaa sen.

### Lisätty

- `smoke.json` ja CI-askel, joka ajaa [mcp-doctor](https://github.com/tonyweckstrom1987/mcp-doctor)-terveystarkastuksen (kättely, skeemat, savuajo ja argument injection -suojaus).
- Dependabot (npm ja GitHub Actions, viikoittain), CI:ssä `permissions: contents: read`, `npm audit` ja Node 24 testimatriisiin.

## [1.1.1] - 2026-09-26

### Lisätty

- `mcpName`-kenttä `package.json`:iin (`io.github.tonyweckstrom1987/git-history`) MCP-rekisterin (registry.modelcontextprotocol.io) julkaisua varten.
- `repository`, `homepage` ja `bugs`-kentät `package.json`:iin.
- `server.json` MCP-rekisterin skeeman mukaisesti.
- MIT-lisenssi (`LICENSE`-tiedosto) sekä `license`-kenttä `package.json`:iin.

## [1.1.0] - 2026-09-26

### Lisätty

- `blame_file(filePath, startLine?, endLine?)` — rivikohtainen `git blame`: kuka ja missä commitissa kirjoitti kunkin rivin.
- `get_contributors(limit?)` — yhteenveto committaajista ja heidän commit-määristään (`git shortlog -sn`).
- `get_diff_between_refs(fromRef, toRef, filePath?)` — diffi kahden commitin, branchin tai tagin välillä, valinnaisesti rajattuna yhteen tiedostoon.
- Testit uusille työkaluille `test/manual-test.js`-tiedostoon, mukaan lukien argument injection -suojaus tiedostopoluille ja viitteille.
- README: esimerkkikutsut kaikille työkaluille sekä asennusohje Cursoriin.
