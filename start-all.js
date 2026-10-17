import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================================');
console.log(' Starting MAHADBT Scholarship Management System');
console.log('========================================================');
console.log(' Backend Server:  http://localhost:5000');
console.log(' Frontend Client: http://localhost:5173');
console.log('========================================================\n');

// 1. Start Backend
const backend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// 2. Start Frontend
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit();
});

process.on('exit', () => {
  backend.kill();
  frontend.kill();
});
