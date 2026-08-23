const fs = require('fs');
const path = require('path');

const renames = JSON.parse(fs.readFileSync('renames.json', 'utf8'));
const srcDir = path.join(__dirname, 'src');
const configDir = path.join(__dirname, 'config');
const dataDir = path.join(__dirname, 'data');
const componentsDir = path.join(__dirname, 'components');

function walkSync(currentDirPath, callback) {
    if (!fs.existsSync(currentDirPath)) return;
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            if (/\.(ts|tsx|css|js|json)$/.test(filePath)) {
                callback(filePath);
            }
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

function processDir(dir) {
    walkSync(dir, function(filePath) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        for (const rename of renames) {
            const oldName = '/images/' + rename.old;
            const newName = '/images/' + rename.new;
            if (content.includes(oldName)) {
                content = content.split(oldName).join(newName);
                changed = true;
            }
        }
        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated', filePath);
        }
    });
}

processDir(srcDir);
processDir(configDir);
processDir(dataDir);
processDir(componentsDir);
console.log('Done updating references.');
