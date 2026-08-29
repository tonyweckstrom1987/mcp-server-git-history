const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require("path");

async function main() {
  const repoPath = process.argv[2] || path.resolve(__dirname, "../../gitstandup-ai");

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
  console.log();

  console.log("=== search_commits('gitstandup') ===");
  const searchResult = await client.callTool({
    name: "search_commits",
    arguments: { query: "gitstandup", limit: 5 },
  });
  console.log(searchResult.content[0].text);
  console.log();

  const commits = JSON.parse(searchResult.content[0].text);
  if (commits.length > 0) {
    const hash = commits[0].hash;
    console.log(`=== get_commit_diff('${hash}') ===`);
    const diffResult = await client.callTool({
      name: "get_commit_diff",
      arguments: { commitHash: hash },
    });
    console.log(diffResult.content[0].text.slice(0, 500) + "...\n");
  }

  console.log("=== get_file_history('README.md') ===");
  const historyResult = await client.callTool({
    name: "get_file_history",
    arguments: { filePath: "README.md" },
  });
  console.log(historyResult.content[0].text);
  console.log();

  console.log("=== virhetapaus: get_file_history('ei-olemassa.js') ===");
  const errorResult = await client.callTool({
    name: "get_file_history",
    arguments: { filePath: "ei-olemassa.js" },
  });
  console.log("isError:", errorResult.isError, "-", errorResult.content[0].text);

  await client.close();
  console.log("\nKaikki testit ajettu onnistuneesti.");
}

main().catch((err) => {
  console.error("Testi epäonnistui:", err);
  process.exit(1);
});
