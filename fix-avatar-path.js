const fs = require('fs');
let code = fs.readFileSync('build.js', 'utf-8');

code = code.replace(
    /return \`<img src="avatar\.\$\{ext\}" alt="avatar" class="w-full h-full object-cover">\`;/,
    `return \`<img src="{{base_path}}avatar.\${ext}" alt="avatar" class="w-full h-full object-cover">\`;`
);

fs.writeFileSync('build.js', code);
console.log('Fixed avatar path in build.js');
