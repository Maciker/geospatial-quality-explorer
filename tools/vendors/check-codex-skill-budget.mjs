#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = process.cwd();
const skillsRoot = join(root, '.agents/skills');
const budget = Number(process.env.CODEX_SKILL_INDEX_BUDGET || 8000);
const fail = (message) => {
  console.error(`Codex skill budget check failed: ${message}`);
  process.exitCode = 1;
};

const parseFrontmatter = (content) => {
  if (!content.startsWith('---\n')) return {};
  const end = content.indexOf('\n---', 4);
  if (end === -1) return {};
  const raw = content.slice(4, end).trim();
  const data = {};
  for (const line of raw.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    data[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return data;
};

if (!existsSync(skillsRoot)) fail('missing .agents/skills. Run pnpm ai:sync first.');
const skillDirs = existsSync(skillsRoot)
  ? readdirSync(skillsRoot).map((entry) => join(skillsRoot, entry)).filter((path) => statSync(path).isDirectory()).sort()
  : [];
const entries = [];
for (const dir of skillDirs) {
  const skillMd = join(dir, 'SKILL.md');
  if (!existsSync(skillMd)) {
    fail(`missing ${skillMd.replace(`${root}/`, '')}`);
    continue;
  }
  const data = parseFrontmatter(readFileSync(skillMd, 'utf8'));
  const name = data.name || basename(dir);
  const description = data.description || '';
  if (!description) fail(`${name} has no description`);
  entries.push(`${name}\n${description}\n${skillMd.replace(`${root}/`, '')}`);
}
const indexSize = Buffer.byteLength(entries.join('\n'), 'utf8');
if (indexSize > budget) fail(`initial skill index is ${indexSize} bytes, above ${budget}. Shorten descriptions or disable redundant skills for Codex.`);
console.log(`Codex skill index estimate: ${indexSize}/${budget} bytes across ${entries.length} skills`);
