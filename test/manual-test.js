const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require("path");
const assert = require("node:assert");

async function main() {
  const repoPath = process.argv[2] || path.resolve(__dirname, "..");

  const transport = new StdioClientTransport({
    command: "node",
    args: [path.resolve(__dirname, "../bin/server.js"), repoPath],
  });

  const client = new Client({ name: "manual-test-client", version: "1.0.0" });
  await client.connect(transport);

  console.log(`Testataan repositoriota: ${repoPath}\n`);

  const tools = await client.listTools();
  console.log("=== Rekisteröidyt työkalut ===");
  console.log(tools.tools.map((t) => t.name).join(", "));
  assert.strictEqual(tools.tools.length, 3, "Odotettiin 3 työkalua");
  console.log();

  console.log("=== search_commits('testi') ===");
  const searchResult = await client.callTool({
    name: "search_commits",
    arguments: { query: "testi", limit: 5 },
  });
  console.log(searchResult.content[0].text);
  assert.ok(!searchResult.isError, "search_commits palautti virheen");
  console.log();

  // Tyhjä tulos on tekstiä ("Ei commiteja..."), ei JSONia.
  const commits = searchResult.content[0].text.startsWith("[") ? JSON.parse(searchResult.content[0].text) : [];
  if (commits.length > 0) {
    const hash = commits[0].hash;
    console.log(`=== get_commit_diff('${hash}') ===`);
    const diffResult = await client.callTool({
      name: "get_commit_diff",
      arguments: { commitHash: hash },
    });
    console.log(diffResult.content[0].text.slice(0, 500) + "...\n");
    assert.ok(!diffResult.isError, "get_commit_diff palautti virheen");
  }

  console.log("=== get_file_history('README.md') ===");
  const historyResult = await client.callTool({
    name: "get_file_history",
    arguments: { filePath: "README.md" },
  });
  console.log(historyResult.content[0].text);
  assert.ok(!historyResult.isError, "get_file_history palautti virheen");
  console.log();

  console.log("=== virhetapaus: get_file_history('ei-olemassa.js') ===");
  const errorResult = await client.callTool({
    name: "get_file_history",
    arguments: { filePath: "ei-olemassa.js" },
  });
  console.log("isError:", errorResult.isError, "-", errorResult.content[0].text);
  assert.strictEqual(errorResult.isError, true, "Olemattoman tiedoston piti palauttaa virhe");

  console.log("\n=== tietoturva: get_commit_diff('--output=...') ===");
  const injectionResult = await client.callTool({
    name: "get_commit_diff",
    arguments: { commitHash: "--output=/tmp/mcp-git-history-injektio.txt" },
  });
  console.log("isError:", injectionResult.isError, "-", injectionResult.content[0].text);
  assert.strictEqual(injectionResult.isError, true, "Optiolta näyttävä hash piti hylätä");

  await client.close();
  console.log("\nKaikki testit ajettu onnistuneesti.");
}

main().catch((err) => {
  console.error("Testi epäonnistui:", err);
  process.exit(1);
});
