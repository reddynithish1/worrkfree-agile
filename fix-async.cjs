const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Make all endpoint handlers async just in case
content = content.replace(
  /app\.(get|post|patch|delete)\("([^"]+)", (authenticateToken, )?\((req(: any)?, res(: any)?)\) => {/g,
  'app.$1("$2", $3async ($4) => {'
);

fs.writeFileSync('server.ts', content);
console.log('Replaced successfully');
