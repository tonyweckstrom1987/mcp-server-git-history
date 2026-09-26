# mcp-server-git-history

[![npm version](https://img.shields.io/npm/v/mcp-server-git-history.svg)](https://www.npmjs.com/package/mcp-server-git-history)

Uusin julkaistu versio: **1.0.1** — https://www.npmjs.com/package/mcp-server-git-history

MCP-palvelin (Model Context Protocol) joka antaa tekoälyagenteille (Claude Desktop, Cursor, Windsurf) työkalut Git-repositorion historian lukemiseen ja hakemiseen.

Ratkaisee ongelman jossa tekoäly näkee koodin nykytilan, mutta ei tiedä *miksi* jokin muuttui tai *kuka* teki muutoksen viimeksi.

## Quick start

An MCP server that gives AI agents (Claude Desktop, Cursor, Windsurf) tools to read and search Git history — commit search, file history, blame, contributors, and diffs between refs.

Run it directly with `npx` (no install needed):

```bash
npx -y mcp-server-git-history /path/to/your/repo
```

Add it to Claude Desktop's config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "git-history": {
      "command": "npx",
      "args": ["-y", "mcp-server-git-history", "/path/to/your/repo"]
    }
  }
}
```

Restart Claude Desktop, then ask something like *"When was `src/index.js` last changed, and why?"*

## Työkalut

- **`search_commits(query, limit?)`** — etsii commiteja hakusanalla commit-viestistä
- **`get_recent_commits(limit?)`** — hakee uusimmat commitit (yleiskuva viimeaikaisista muutoksista)
- **`get_commit_diff(commitHash)`** — hakee yhden commitin koko diffin
- **`get_file_history(filePath, limit?)`** — hakee tiedoston muutoshistorian (kuka, milloin, miksi)
- **`blame_file(filePath, startLine?, endLine?)`** — rivikohtainen `git blame`: kuka ja missä commitissa kirjoitti kunkin rivin
- **`get_contributors(limit?)`** — yhteenveto committaajista ja heidän commit-määristään (`git shortlog -sn`)
- **`get_diff_between_refs(fromRef, toRef, filePath?)`** — diffi kahden commitin/branchin/tagin välillä, valinnaisesti yhteen tiedostoon rajattuna

### Esimerkkikutsut

```json
{ "name": "search_commits", "arguments": { "query": "login-bugi", "limit": 10 } }
```

```json
{ "name": "get_recent_commits", "arguments": { "limit": 5 } }
```

```json
{ "name": "get_commit_diff", "arguments": { "commitHash": "a1b2c3d" } }
```

```json
{ "name": "get_file_history", "arguments": { "filePath": "src/index.js", "limit": 10 } }
```

```json
{ "name": "blame_file", "arguments": { "filePath": "src/index.js", "startLine": 10, "endLine": 25 } }
```

```json
{ "name": "get_contributors", "arguments": { "limit": 10 } }
```

```json
{ "name": "get_diff_between_refs", "arguments": { "fromRef": "main", "toRef": "HEAD", "filePath": "src/index.js" } }
```

## Asennus Claude Desktopiin

Lisää `claude_desktop_config.json`-tiedostoon:

```json
{
  "mcpServers": {
    "git-history": {
      "command": "npx",
      "args": ["-y", "mcp-server-git-history", "/polku/repositorioosi"]
    }
  }
}
```

Repositorion polku voidaan antaa myös `GIT_REPO_PATH`-ympäristömuuttujalla, tai jättää pois jolloin käytetään palvelimen käynnistyshakemistoa.

Käynnistä Claude Desktop uudelleen, ja kysy esimerkiksi: *"Milloin tiedostoa src/index.js on viimeksi muokattu ja miksi?"*

## Asennus Cursoriin

Lisää projektin `.cursor/mcp.json`-tiedostoon (tai globaaliin `~/.cursor/mcp.json`-tiedostoon):

```json
{
  "mcpServers": {
    "git-history": {
      "command": "npx",
      "args": ["-y", "mcp-server-git-history", "/polku/repositorioosi"]
    }
  }
}
```

Avaa Cursorin asetuksista *MCP*-välilehti ja varmista, että `git-history`-palvelin on käynnissä (vihreä piste). Sama `GIT_REPO_PATH`-ympäristömuuttuja ja komentoriviargumentti toimivat kuin Claude Desktopissa.

## Kehitys ja testaus paikallisesti

```bash
git clone <repo>
cd mcp-server-git-history
npm install
npm test                                        # testaa tätä samaa repoa
node test/manual-test.js /polku/johonkin/git-repoon   # tai jotain muuta repoa
```

Testiskripti käynnistää palvelimen alaprosessina ja kutsuu kaikkia työkaluja oikeaa MCP-protokollaa käyttäen (`@modelcontextprotocol/sdk`:n `Client` + `StdioClientTransport`), ei vain suoraan funktioita — samalla tavalla kuin Claude Desktop oikeasti kutsuisi palvelinta.

## Miksi tämä on ilmainen ylläpitää

Palvelin itse ei tee tekoälykutsuja — se vain lukee Git-dataa ja palauttaa sen. *Tekoäly* (esim. Claude Desktop) kutsuu palvelinta, ei toisinpäin. Ei API-avaimia, ei kustannuksia.

## Rakenne

- `bin/server.js` — MCP-palvelin, työkalujen rekisteröinti (`McpServer` + `StdioServerTransport`)
- `lib/git-tools.js` — Git-logiikka (`simple-git`)
- `test/manual-test.js` — päästä-päähän-testi oikealla MCP-clientillä
