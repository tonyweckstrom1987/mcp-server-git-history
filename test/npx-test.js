const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require("path");

async function main() {
  const repoPath = process.argv[2];

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "mcp-server-git-history@1.0.0", repoPath],
  });

  const client = new Client({ name: "npx-test-client", version: "1.0.0" });
  await client.connect(transport);

  const tools = await client.listTools();
  console.log("Tyokalut npx-asennuksesta:", tools.tools.map((t) => t.name).join(", "));

  const result = await client.callTool({
    name: "search_commits",
    arguments: { query: "gitstandup", limit: 3 },
  });
  console.log("search_commits-tulos:", result.content[0].text);

  await client.close();
  console.log("npx-testi onnistui.");
}

main().catch((err) => {
  console.error("npx-testi epaonnistui:", err);
  process.exit(1);
});
