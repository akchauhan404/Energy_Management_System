import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendRoot = path.resolve(__dirname, '../..');

function runPythonScript(scriptRelativePath, payload) {
  const pythonScript = path.join(
    backendRoot,
    'python',
    scriptRelativePath
  );

  return new Promise((resolve, reject) => {
    const pythonCommand =
      process.platform === 'win32'
        ? 'python'
        : 'python3';

    const pythonProcess = spawn(
      pythonCommand,
      [pythonScript],
      {
        cwd: backendRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      }
    );

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('error', (error) => {
      reject(
        new Error(
          `Failed to start Python inference process: ${error.message}`
        )
      );
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Python inference process exited with code ${code}. ` +
            `${stderr.trim()}`
          )
        );
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        reject(
          new Error(
            `Invalid JSON returned by Python inference process. ` +
            `stdout: ${stdout.trim()}`
          )
        );
      }
    });

    pythonProcess.stdin.write(JSON.stringify(payload));
    pythonProcess.stdin.end();
  });
}

export function runPythonInference(payload) {
  return runPythonScript(
    path.join('forecast', 'inference.py'),
    payload
  );
}

export function runPpoInference(payload) {
  return runPythonScript(
    path.join('ppo', 'inference.py'),
    payload
  );
}