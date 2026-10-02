const fs = require('fs');
let code = fs.readFileSync('build.js', 'utf-8');

code = code.replace(
    /\.replace\(\/\\\{\\\{content\\\}\\\}\/g,\s*htmlContent\);/,
    `.replace(/\\{\\{content\\}\\}/g, htmlContent)\n                .replace(/\\{\\{avatar\\}\\}/g, avatarHtml);`
);

fs.writeFileSync('build.js', code);
console.log('updated build.js');
