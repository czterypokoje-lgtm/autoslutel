import fs from 'fs';
import path from 'path';

const dir = '/Users/ik/Desktop/autosleutel24';
const oldFile = ' bmwreklam324.png';
const newFile = 'bmw_1serie_sleutel_bijmaken_amsterdam_0.png';

const oldPath = path.join(dir, oldFile);
const newPath = path.join(dir, newFile);

if (fs.existsSync(oldPath)) {
  fs.renameSync(oldPath, newPath);
  console.log('Renamed successfully');
} else {
  console.log('File not found:', oldPath);
}
