const fs = require('fs');
let code = fs.readFileSync('build.js', 'utf-8');

// Remove the old avatarHtml definition
code = code.replace(/const avatarHtml = getAvatarHtml\(CONFIG\.distDir\);\n/, '');

// Add it before generating articles
code = code.replace(
    /const articleDirs = findArticleDirs\(CONFIG\.postsDir\);\n/,
    `const avatarHtml = getAvatarHtml(CONFIG.distDir);\n    const articleDirs = findArticleDirs(CONFIG.postsDir);\n`
);

fs.writeFileSync('build.js', code);
console.log('fixed avatarHtml definition location');
