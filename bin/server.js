#!/usr/bin/env node
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const path = require("path");
const { searchCommits, getCommitDiff, getFileHistory } = require("../lib/git-tools");

// Repositorion polku: komentoriviargumentti > GIT_REPO_PATH-ympäristömuuttuja > nykyinen hakemisto.
// MCP-palvelin käynnistetään clientin (esim. Claude Desktop) toimesta, joten
// polku pitää saada joko konfiguraatiosta tai ympäristöstä, ei interaktiivisesti.
const REPO_PATH = path.resolve(process.argv[2] || process.env.GIT_REPO_PATH || process.cwd());

const server = new McpServer({
  name: "mcp-server-git-history",
  version: "1.0.0",
});

server.registerTool(
  "search_commits",
  {
    title: "Etsi commiteja",
    description:
      "Etsii Git-commiteja joiden commit-viesti sisältää annetun hakusanan (esim. bugin numero tai avainsana). " +
      "Käytä tätä kun haluat selvittää MIKSI jokin muutos tehtiin.",
    inputSchema: {
      query: z.string().describe("Hakusana tai -lause commit-viesteistä"),
      limit: z.number().int().positive().max(100).optional().describe("Enintään näin monta tulosta (oletus 20)"),
    },
  },
  async ({ query, limit }) => {
    try {
      const results = await searchCommits(REPO_PATH, query, limit ?? 20);
      if (results.length === 0) {
        return { content: [{ type: "text", text: `Ei commiteja jotka sisältävät: "${query}"` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Virhe: ${err.message}` }], isError: true };
    }
  }
);

server.registerTool(
  "get_commit_diff",
  {
    title: "Hae commitin diffi",
    description: "Hakee tietyn commitin koko diffin (kaikki tiedostomuutokset). Käytä kun haluat nähdä TARKALLEEN mitä muuttui.",
    inputSchema: {
      // Vain heksamerkit: estää syötteen kuten "--output=..." jonka Git tulkitsisi optioksi.
      commitHash: z
        .string()
        .regex(/^[0-9a-f]{4,64}$/i, "Commitin hashissa saa olla vain heksamerkkejä (0-9, a-f), 4-64 merkkiä")
        .describe("Commitin hash (lyhyt tai pitkä muoto)"),
    },
  },
  async ({ commitHash }) => {
    try {
      const diff = await getCommitDiff(REPO_PATH, commitHash);
      return { content: [{ type: "text", text: diff }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Virhe: ${err.message}` }], isError: true };
    }
  }
);

server.registerTool(
  "get_file_history",
  {
    title: "Hae tiedoston muutoshistoria",
    description:
      "Hakee tiedoston muutoshistorian: milloin sitä on muokattu, kuka muokkasi ja mihin commit-viestiin muutos liittyi. " +
      "Käytä kun haluat selvittää MILLOIN ja KUKA muokkasi tiettyä tiedostoa viimeksi.",
    inputSchema: {
      filePath: z.string().describe("Tiedoston polku repositorion juuresta (esim. src/index.js)"),
      limit: z.number().int().positive().max(100).optional().describe("Enintään näin monta tulosta (oletus 20)"),
    },
  },
  async ({ filePath, limit }) => {
    try {
      const results = await getFileHistory(REPO_PATH, filePath, limit ?? 20);
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Virhe: ${err.message}` }], isError: true };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Palvelin kaatui käynnistyksessä:", err);
  process.exit(1);
});
