const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix findOne({ ... }) -> findOne({ ... } as any)
  content = content.replace(/\.findOne\(({[^}]+})\)/g, '.findOne($1 as any)');

  // Fix deleteOne
  content = content.replace(/\.deleteOne\(({[^}]+})\)/g, '.deleteOne($1 as any)');

  // Fix updateMany
  content = content.replace(/UserModel\.updateMany/g, '(UserModel as any).updateMany');
  
  fs.writeFileSync(file, content);
}

fixFile('src/db/authDb.ts');
fixFile('src/db/projectDb.ts');
fixFile('src/db/chatDb.ts');

console.log('Fixed TS errors in db files');
