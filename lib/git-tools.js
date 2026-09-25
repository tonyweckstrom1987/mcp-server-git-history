const simpleGit = require("simple-git");

function getGit(repoPath) {
  return simpleGit(repoPath);
}

async function assertRepo(repoPath) {
  const git = getGit(repoPath);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(`${repoPath} ei ole Git-repositorio.`);
  }
  return git;
}

// Muuttaa simple-gitin commit-olion tiiviiksi yhteenvedoksi.
function toSummary(c) {
  return {
    hash: c.hash.slice(0, 7),
    date: c.date,
    author: c.author_name,
    message: c.message,
  };
}

/**
 * Etsii commiteja joiden viesti sisältää hakusanan.
 */
async function searchCommits(repoPath, query, limit = 20) {
  const git = await assertRepo(repoPath);
  const log = await git.log({
    "--grep": query,
    "-i": null, // case-insensitive
    maxCount: limit,
  });

  return log.all.map(toSummary);
}

/**
 * Hakee uusimmat commitit ilman hakusanaa.
 */
async function getRecentCommits(repoPath, limit = 10) {
  const git = await assertRepo(repoPath);
  const log = await git.log({ maxCount: limit });
  return log.all.map(toSummary);
}

/**
 * Hakee yhden commitin koko diffin.
 */
async function getCommitDiff(repoPath, commitHash) {
  // Tarkistetaan myös täällä, koska funktiota voi kutsua ilman server.js:n zod-validointia.
  if (!/^[0-9a-f]{4,64}$/i.test(commitHash)) {
    throw new Error(`Virheellinen commit-hash: ${commitHash}`);
  }
  const git = await assertRepo(repoPath);
  try {
    return await git.show([commitHash]);
  } catch (err) {
    throw new Error(`Commitia ${commitHash} ei löytynyt: ${err.message}`);
  }
}

/**
 * Hakee tiedoston muutoshistorian - kuka muokkasi, milloin ja miksi (commit-viesti).
 */
async function getFileHistory(repoPath, filePath, limit = 20) {
  const git = await assertRepo(repoPath);
  const log = await git.log({
    file: filePath,
    maxCount: limit,
  });

  if (log.all.length === 0) {
    throw new Error(`Tiedostolle ${filePath} ei löytynyt historiaa (väärä polku, tai tiedostoa ei seurata Gitissä).`);
  }

  return log.all.map(toSummary);
}

module.exports = { searchCommits, getRecentCommits, getCommitDiff, getFileHistory };
