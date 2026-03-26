import fs from 'node:fs/promises';
import path from 'node:path';

const requiredFiles = ['public/favicon.ico', 'public/favicon.svg', 'public/favicon-tiny.svg'];

async function main() {
  for (const file of requiredFiles) {
    const resolved = path.resolve(file);

    try {
      const stat = await fs.stat(resolved);
      if (!stat.isFile()) {
        throw new Error(`${file} is not a file`);
      }
    } catch (error) {
      throw new Error(`Required favicon asset is missing: ${file}`, { cause: error });
    }
  }

  console.log('[favicon] Verified committed favicon assets.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
