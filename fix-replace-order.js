const fs = require('fs');
let code = fs.readFileSync('build.js', 'utf-8');

code = code.replace(
    /let articleHtml = articleTemplate\s*\.replace\(\/\\\{\\\{base_path\\\}\\\}\/g, '\.\.\/\.\.\/'\)/,
    `let articleHtml = articleTemplate.replace(/\\{\\{avatar\\}\\}/g, avatarHtml)\n                .replace(/\\{\\{base_path\\}\\}/g, '../../')`
);
code = code.replace(
    /\.replace\(\/\\\{\\\{avatar\\\}\\\}\/g, avatarHtml\);/,
    `;`
);

// also for indexHtml and aboutHtml
code = code.replace(
    /let indexHtml = indexTemplate\s*\.replace\(\/\\\{\\\{base_path\\\}\\\}\/g, ''\)\s*\.replace\(\/\\\{\\\{avatar\\\}\\\}\/g,\s*avatarHtml\)/,
    `let indexHtml = indexTemplate.replace(/\\{\\{avatar\\}\\}/g, avatarHtml).replace(/\\{\\{base_path\\}\\}/g, '')`
);

code = code.replace(
    /let aboutHtml = aboutTemplate\s*\.replace\(\/\\\{\\\{base_path\\\}\\\}\/g, ''\)\s*\.replace\(\/\\\{\\\{avatar\\\}\\\}\/g, avatarHtml\)/,
    `let aboutHtml = aboutTemplate.replace(/\\{\\{avatar\\}\\}/g, avatarHtml).replace(/\\{\\{base_path\\}\\}/g, '')`
);

fs.writeFileSync('build.js', code);
console.log('Fixed replace order');
