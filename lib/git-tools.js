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

  return log.all.map((c) => ({
    hash: c.hash.slice(0, 7),
    date: c.date,
    author: c.author_name,
    message: c.message,
  }));
}

/**
 * Hakee yhden commitin koko diffin.
 */
async function getCommitDiff(repoPath, commitHash) {
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

  return log.all.map((c) => ({
    hash: c.hash.slice(0, 7),
    date: c.date,
    author: c.author_name,
    message: c.message,
  }));
}

module.exports = { searchCommits, getCommitDiff, getFileHistory };
