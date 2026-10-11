// Compile without executing browser code. uBlock resources carry a non-JS first line.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let count = 0;

function validateDirectory(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            validateDirectory(filename);
        } else if (entry.name.endsWith('.js')) {
            const source = fs.readFileSync(filename, 'utf8')
                .replace(/^[^\r\n]+ text\/javascript\r?\n/, '\n');
            new vm.Script(source, { filename: path.relative(root, filename) });
            count++;
        }
    }
}

validateDirectory(root);
console.log(`Syntax OK: ${count} JavaScript files`);
