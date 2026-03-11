import { copyFileSync, mkdirSync } from 'node:fs';
import { build } from 'esbuild';
import { GasPlugin } from 'esbuild-gas-plugin';

const outDir = 'dist';

async function main() {
  mkdirSync(outDir, { recursive: true });

  await build({
    entryPoints: ['src/gmail-to-slack.ts'],
    bundle: true,
    format: 'iife',
    target: 'es2020',
    outfile: `${outDir}/code.js`,
    plugins: [GasPlugin],
    logLevel: 'info',
  });

  copyFileSync('src/appsscript.json', `${outDir}/appsscript.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
