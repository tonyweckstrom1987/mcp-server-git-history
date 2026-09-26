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

/**
 * Muuttaa git-arvon turvalliseksi: hylkää tyhjän tai optiolta näyttävän (alkaa "-") arvon,
 * jotta sitä ei voi käyttää argument injectioniin git-komennossa.
 */
function assertSafeArg(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.startsWith("-")) {
    throw new Error(`Virheellinen ${label}: ${value}`);
  }
}

/**
 * Parsii "git blame --line-porcelain" -tulosteen. --line-porcelain toistaa kaikki
 * otsikkokentät (author, author-time, summary, ...) jokaiselle riville erikseen,
 * joten jokainen lohko voidaan tulkita itsenäisesti ilman commit-välimuistia.
 */
function parseBlamePorcelain(raw) {
  const lines = raw.split("\n");
  const result = [];
  let i = 0;
  while (i < lines.length) {
    const header = lines[i];
    if (!header) {
      i++;
      continue;
    }
    const headerMatch = header.match(/^([0-9a-f]{40})\s+\d+\s+(\d+)/);
    if (!headerMatch) {
      i++;
      continue;
    }
    const [, hash, finalLine] = headerMatch;
    i++;
    const entry = { line: Number(finalLine), hash: hash.slice(0, 7) };
    while (i < lines.length && !lines[i].startsWith("\t")) {
      const line = lines[i];
      const sp = line.indexOf(" ");
      const key = sp === -1 ? line : line.slice(0, sp);
      const value = sp === -1 ? "" : line.slice(sp + 1);
      if (key === "author") entry.author = value;
      else if (key === "author-time") entry.date = new Date(Number(value) * 1000).toISOString();
      else if (key === "summary") entry.message = value;
      i++;
    }
    entry.content = i < lines.length ? lines[i].slice(1) : "";
    i++;
    result.push(entry);
  }
  return result;
}

/**
 * Hakee tiedoston rivikohtaisen blame-tiedon: kuka ja missä commitissa kunkin rivin viimeksi kirjoitti.
 */
async function blameFile(repoPath, filePath, options = {}) {
  assertSafeArg(filePath, "tiedostopolku");
  const git = await assertRepo(repoPath);

  const args = ["blame", "--line-porcelain"];
  const { startLine, endLine } = options;
  if (startLine != null || endLine != null) {
    if (!startLine || !endLine) {
      throw new Error("startLine ja endLine pitää antaa yhdessä.");
    }
    args.push("-L", `${startLine},${endLine}`);
  }
  args.push("--", filePath);

  let raw;
  try {
    raw = await git.raw(args);
  } catch (err) {
    throw new Error(`Tiedoston ${filePath} blame epäonnistui: ${err.message}`);
  }

  return parseBlamePorcelain(raw);
}

/**
 * Hakee yhteenvedon committaajista: kuinka monta commitia kukin on tehnyt (git shortlog -sn).
 */
async function getContributors(repoPath, limit = 20) {
  const git = await assertRepo(repoPath);
  const raw = await git.raw(["shortlog", "-sn", "HEAD"]);

  const contributors = raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      return match ? { commits: Number(match[1]), author: match[2] } : null;
    })
    .filter(Boolean);

  return contributors.slice(0, limit);
}

/**
 * Hakee diffin kahden commitin/branchin/tagin välillä, valinnaisesti rajattuna yhteen tiedostoon.
 */
async function getDiffBetweenRefs(repoPath, fromRef, toRef, filePath) {
  assertSafeArg(fromRef, "lähtöviite (fromRef)");
  assertSafeArg(toRef, "kohdeviite (toRef)");
  if (filePath != null) {
    assertSafeArg(filePath, "tiedostopolku");
  }

  const git = await assertRepo(repoPath);
  const args = [fromRef, toRef];
  if (filePath) {
    args.push("--", filePath);
  }

  try {
    const diff = await git.diff(args);
    if (!diff) {
      return `Ei eroja välillä ${fromRef}..${toRef}${filePath ? ` (tiedosto: ${filePath})` : ""}.`;
    }
    return diff;
  } catch (err) {
    throw new Error(`Diffin haku epäonnistui (${fromRef}..${toRef}): ${err.message}`);
  }
}

module.exports = {
  searchCommits,
  getRecentCommits,
  getCommitDiff,
  getFileHistory,
  blameFile,
  getContributors,
  getDiffBetweenRefs,
};
