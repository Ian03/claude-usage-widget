// Some shell environments (notably the Claude Code sandbox and various build
// pipelines) set ELECTRON_RUN_AS_NODE=1, which forces the electron binary into
// pure-Node mode — no `app`, no BrowserWindow, no main process. Strip it
// before launching the real GUI.
delete process.env.ELECTRON_RUN_AS_NODE;
delete process.env.ATOM_SHELL_INTERNAL_RUN_AS_NODE;

const { spawn } = require('child_process');
const electronPath = require('electron');

const args = ['.', ...process.argv.slice(2)];
const child = spawn(electronPath, args, {
  stdio: 'inherit',
  env: process.env,
  windowsHide: false,
});

child.on('close', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('Failed to launch Electron:', err);
  process.exit(1);
});
