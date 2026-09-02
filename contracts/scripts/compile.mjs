// 编译 contracts/src/*.sol -> contracts/out/<Name>.json（含 abi 与 bytecode）
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import solc from 'solc';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');
const outDir = join(root, 'out');

const sources = {};
for (const file of readdirSync(srcDir).filter((f) => f.endsWith('.sol'))) {
  sources[file] = { content: readFileSync(join(srcDir, file), 'utf8') };
}

const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((e) => e.severity === 'error');
for (const e of output.errors ?? []) console.log(e.formattedMessage);
if (errors.length) process.exit(1);

mkdirSync(outDir, { recursive: true });
const abis = {};
for (const [file, contracts] of Object.entries(output.contracts)) {
  for (const [name, c] of Object.entries(contracts)) {
    writeFileSync(
      join(outDir, `${name}.json`),
      JSON.stringify({ abi: c.abi, bytecode: `0x${c.evm.bytecode.object}` }, null, 2),
    );
    abis[name] = c.abi;
    console.log(`compiled ${file}:${name}`);
  }
}

// 同步 ABI 给前端，避免手抄导致的漂移
const appLib = join(root, '..', 'app', 'src', 'lib');
if (existsSync(appLib)) {
  const body = ['DaziEscrow', 'DaziSBT']
    .map((n) => `export const ${n.toLowerCase()}Abi = ${JSON.stringify(abis[n], null, 2)} as const;`)
    .join('\n\n');
  writeFileSync(join(appLib, 'abi.ts'), `// 由 contracts/scripts/compile.mjs 生成，不要手改\n\n${body}\n`);
  console.log('exported abi -> app/src/lib/abi.ts');
}

