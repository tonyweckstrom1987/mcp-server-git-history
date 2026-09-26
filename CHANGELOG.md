# Changelog

Kaikki tähän projektiin tehdyt merkittävät muutokset dokumentoidaan tähän tiedostoon.

Muoto perustuu [Keep a Changelogiin](https://keepachangelog.com/fi/1.0.0/), ja versiointi noudattaa [Semantic Versioningia](https://semver.org/lang/fi/).

## [Unreleased]

### Lisätty

- `blame_file(filePath, startLine?, endLine?)` — rivikohtainen `git blame`: kuka ja missä commitissa kirjoitti kunkin rivin.
- `get_contributors(limit?)` — yhteenveto committaajista ja heidän commit-määristään (`git shortlog -sn`).
- `get_diff_between_refs(fromRef, toRef, filePath?)` — diffi kahden commitin, branchin tai tagin välillä, valinnaisesti rajattuna yhteen tiedostoon.
- Testit uusille työkaluille `test/manual-test.js`-tiedostoon, mukaan lukien argument injection -suojaus tiedostopoluille ja viitteille.
- README: esimerkkikutsut kaikille työkaluille sekä asennusohje Cursoriin.
