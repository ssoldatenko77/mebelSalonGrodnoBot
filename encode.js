const fs = require('fs');

const raw = fs.readFileSync('./service-account.json', 'utf8');
const escaped = raw.replace(/\n/g, '\\n');
console.log(escaped);