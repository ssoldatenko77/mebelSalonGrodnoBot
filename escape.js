// const fs = require('fs');

// const filePath = 'service-account.json';
// const outputPath = 'service-account.b64';

// const jsonBuffer = fs.readFileSync(filePath);
// const base64String = jsonBuffer.toString('base64');

// fs.writeFileSync(outputPath, base64String);

// console.log('Base64 записан в', outputPath);




const fs = require('fs');

const file = fs.readFileSync('service-account.json');
const b64 = Buffer.from(file).toString('base64');

fs.writeFileSync('escaped.txt', `GOOGLE_SERVICE_ACCOUNT_B64=${b64}`);