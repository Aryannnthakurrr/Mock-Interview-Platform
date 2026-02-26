import fs from 'fs';
import path from 'path';

const directoryPath = path.join(process.cwd(), 'src');

function replaceInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
        .replace(/indigo/g, 'cyan')
        .replace(/purple/g, 'blue')
        .replace(/pink/g, 'sky')
        .replace(/rose/g, 'sky')
        .replace(/amber/g, 'cyan')
        .replace(/orange/g, 'blue')
        .replace(/emerald/g, 'cyan')
        .replace(/teal/g, 'blue');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function traverseDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
            replaceInFile(fullPath);
        }
    });
}

traverseDirectory(directoryPath);
console.log('Done replacing colors.');
