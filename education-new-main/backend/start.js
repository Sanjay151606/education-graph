const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const port = process.env.PORT || 8000;
const host = '0.0.0.0';

console.log(`[Backend Runner] Starting BrainGraph FastAPI backend on ${host}:${port}...`);

const venvWin = path.join(__dirname, 'venv', 'Scripts', 'python.exe');
const venvUnix = path.join(__dirname, 'venv', 'bin', 'python');

let pythonBin = process.platform === 'win32' ? 'python' : 'python3';
if (process.platform === 'win32' && fs.existsSync(venvWin)) {
  pythonBin = venvWin;
} else if (process.platform !== 'win32' && fs.existsSync(venvUnix)) {
  pythonBin = venvUnix;
}

const args = ['-m', 'uvicorn', 'app.main:app', '--host', host, '--port', String(port)];

const child = spawn(pythonBin, args, {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) }
});

child.on('error', (err) => {
  console.warn(`[Backend Runner] Primary python command (${pythonBin}) failed, falling back to system python:`, err.message);
  const fallback = spawn(process.platform === 'win32' ? 'python' : 'python3', args, {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) }
  });
  fallback.on('exit', (code) => process.exit(code || 0));
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
