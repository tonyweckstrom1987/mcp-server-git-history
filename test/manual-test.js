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
  assert.strictEqual(tools.tools.length, 7, "Odotettiin 7 työkalua");
  console.log();

  console.log("=== get_recent_commits(2) ===");
  const recentResult = await client.callTool({
    name: "get_recent_commits",
    arguments: { limit: 2 },
  });
  console.log(recentResult.content[0].text);
  assert.ok(!recentResult.isError, "get_recent_commits palautti virheen");
  const recent = JSON.parse(recentResult.content[0].text);
  assert.ok(recent.length > 0 && recent.length <= 2, "limit ei toiminut");
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

  console.log("\n=== blame_file('README.md') ===");
  const blameResult = await client.callTool({
    name: "blame_file",
    arguments: { filePath: "README.md", startLine: 1, endLine: 3 },
  });
  console.log(blameResult.content[0].text.slice(0, 500));
  assert.ok(!blameResult.isError, "blame_file palautti virheen");
  const blameLines = JSON.parse(blameResult.content[0].text);
  assert.strictEqual(blameLines.length, 3, "blame_file: rivirajaus ei toiminut");
  assert.ok(blameLines[0].hash && blameLines[0].author, "blame_file: rivin tiedot puuttuvat");
  console.log();

  console.log("=== tietoturva: blame_file('--upload-pack=...') ===");
  const blameInjectionResult = await client.callTool({
    name: "blame_file",
    arguments: { filePath: "--upload-pack=/bin/sh" },
  });
  console.log("isError:", blameInjectionResult.isError, "-", blameInjectionResult.content[0].text);
  assert.strictEqual(blameInjectionResult.isError, true, "Optiolta näyttävä polku piti hylätä");

  console.log("\n=== get_contributors(5) ===");
  const contributorsResult = await client.callTool({
    name: "get_contributors",
    arguments: { limit: 5 },
  });
  console.log(contributorsResult.content[0].text);
  assert.ok(!contributorsResult.isError, "get_contributors palautti virheen");
  const contributors = JSON.parse(contributorsResult.content[0].text);
  assert.ok(contributors.length > 0, "get_contributors: ei tuloksia");
  assert.ok(typeof contributors[0].commits === "number" && contributors[0].author, "get_contributors: väärä muoto");
  console.log();

  console.log("=== get_diff_between_refs(HEAD~1, HEAD) ===");
  const diffRefsResult = await client.callTool({
    name: "get_diff_between_refs",
    arguments: { fromRef: "HEAD~1", toRef: "HEAD" },
  });
  console.log(diffRefsResult.content[0].text.slice(0, 500) + "...\n");
  assert.ok(!diffRefsResult.isError, "get_diff_between_refs palautti virheen");

  console.log("=== tietoturva: get_diff_between_refs('--exec=...', 'HEAD') ===");
  const diffRefsInjectionResult = await client.callTool({
    name: "get_diff_between_refs",
    arguments: { fromRef: "--exec=/bin/sh", toRef: "HEAD" },
  });
  console.log("isError:", diffRefsInjectionResult.isError, "-", diffRefsInjectionResult.content[0].text);
  assert.strictEqual(diffRefsInjectionResult.isError, true, "Optiolta näyttävä viite piti hylätä");

  await client.close();
  console.log("\nKaikki testit ajettu onnistuneesti.");
}

main().catch((err) => {
  console.error("Testi epäonnistui:", err);
  process.exit(1);
});
