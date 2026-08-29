# mcp-server-git-history

MCP-palvelin (Model Context Protocol) joka antaa tekoälyagenteille (Claude Desktop, Cursor, Windsurf) työkalut Git-repositorion historian lukemiseen ja hakemiseen.

Ratkaisee ongelman jossa tekoäly näkee koodin nykytilan, mutta ei tiedä *miksi* jokin muuttui tai *kuka* teki muutoksen viimeksi.

## Työkalut

- **`search_commits(query, limit?)`** — etsii commiteja hakusanalla commit-viestistä
- **`get_commit_diff(commitHash)`** — hakee yhden commitin koko diffin
- **`get_file_history(filePath, limit?)`** — hakee tiedoston muutoshistorian (kuka, milloin, miksi)

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

## Kehitys ja testaus paikallisesti

```bash
git clone <repo>
cd mcp-server-git-history
npm install
node test/manual-test.js /polku/johonkin/git-repoon
```

Testiskripti käynnistää palvelimen alaprosessina ja kutsuu kaikkia kolmea työkalua oikeaa MCP-protokollaa käyttäen (`@modelcontextprotocol/sdk`:n `Client` + `StdioClientTransport`), ei vain suoraan funktioita — samalla tavalla kuin Claude Desktop oikeasti kutsuisi palvelinta.

## Miksi tämä on ilmainen ylläpitää

Palvelin itse ei tee tekoälykutsuja — se vain lukee Git-dataa ja palauttaa sen. *Tekoäly* (esim. Claude Desktop) kutsuu palvelinta, ei toisinpäin. Ei API-avaimia, ei kustannuksia.

## Rakenne

- `bin/server.js` — MCP-palvelin, työkalujen rekisteröinti (`McpServer` + `StdioServerTransport`)
- `lib/git-tools.js` — Git-logiikka (`simple-git`)
- `test/manual-test.js` — päästä-päähän-testi oikealla MCP-clientillä
