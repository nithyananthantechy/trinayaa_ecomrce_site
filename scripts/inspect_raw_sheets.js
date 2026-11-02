import fs from 'node:fs';

const s1 = JSON.parse(fs.readFileSync('data/Sheet1.json', 'utf8'));
const s2 = JSON.parse(fs.readFileSync('data/Sheet2.json', 'utf8'));

console.log('Sheet 1 first 5 rows:');
for (let i = 0; i < Math.min(5, s1.length); i++) {
  console.log(JSON.stringify(s1[i]));
}

console.log('\nSheet 2 first 5 rows:');
for (let i = 0; i < Math.min(5, s2.length); i++) {
  console.log(JSON.stringify(s2[i]));
}

