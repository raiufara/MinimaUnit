import { spawn } from 'node:child_process';
import process from 'node:process';

const baseUrl = 'http://127.0.0.1:4173';

function spawnCommand(command, args, options = {}) {
  return spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options
  });
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnCommand(command, args, options);

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
    });
  });
}

function runNpm(script) {
  if (process.platform === 'win32') {
    return runCommand('cmd', ['/c', 'npm', 'run', script]);
  }

  return runCommand('npm', ['run', script]);
}

function runNode(scriptPath, extraEnv = {}) {
  return runCommand(process.execPath, [scriptPath], {
    env: {
      ...process.env,
      ...extraEnv
    }
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.ok || response.status === 304) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for preview server at ${url}`);
}

async function stopPreview(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === 'win32' && child.pid) {
    await runCommand('taskkill', ['/PID', String(child.pid), '/T', '/F']).catch(() => {});
    return;
  }

  child.kill('SIGTERM');
}

async function main() {
  await runNpm('test');
  await runNpm('build');

  const previewChild =
    process.platform === 'win32'
      ? spawnCommand('cmd', ['/c', 'npm', 'run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'])
      : spawnCommand('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173']);

  try {
    await waitForServer(`${baseUrl}/era-age`);
    await runNode('scripts/smoke.mjs', { SMOKE_BASE_URL: baseUrl });
  } finally {
    await stopPreview(previewChild);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
