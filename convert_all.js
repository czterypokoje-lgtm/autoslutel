const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'public/images');
const exts = ['.png', '.jpg', '.jpeg', '.avif'];

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

const renamedFiles = [];

async function processAll() {
    const filesToProcess = [];
    walkSync(dir, function(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        if (exts.includes(ext)) {
            filesToProcess.push(filePath);
        }
    });

    for (const fullPath of filesToProcess) {
        const parsed = path.parse(fullPath);
        const targetWebpPath = path.join(parsed.dir, parsed.name + '.webp');
        const tempPath = path.join(parsed.dir, 'temp_' + parsed.name + '.webp');
        
        console.log(`Processing ${fullPath}...`);
        try {
            await sharp(fullPath)
                .webp({ quality: 75 })
                .toFile(tempPath);
            
            fs.renameSync(tempPath, targetWebpPath);
            fs.unlinkSync(fullPath);
            
            const oldRel = path.relative(dir, fullPath).replace(/\\/g, '/');
            const newRel = path.relative(dir, targetWebpPath).replace(/\\/g, '/');
            renamedFiles.push({ old: oldRel, new: newRel });
            console.log(`Success: ${newRel}`);
        } catch (err) {
            console.error(`Error processing ${fullPath}:`, err);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    }
    
    fs.writeFileSync('renames.json', JSON.stringify(renamedFiles, null, 2));
    console.log(`Done. Saved ${renamedFiles.length} renames to renames.json`);
}

processAll();
