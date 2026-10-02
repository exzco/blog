const fs = require('fs');

let buildJs = fs.readFileSync('build.js', 'utf-8');

const oldToc = `function generateToc(html) {
    const regex = /<(h2|h3|h4)[^>]*id="([^"]*)"[^>]*>([\\s\\S]*?)<\\/\\1>/gi;
    const items = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
        items.push({
            level: match[1],
            id: match[2],
            text: match[3].replace(/<[^>]+>/g, '').trim()
        });
    }
    if (items.length === 0) return '<p class="text-xs text-zinc-400 px-3">暂无目录</p>';
    return items.map(item => {
        let levelClass = '';
        if (item.level === 'h3') levelClass = 'toc-h3';
        else if (item.level === 'h4') levelClass = 'toc-h4';
        return \`<a href="#\${item.id}" class="toc-link \${levelClass} flex items-center px-3 py-1.5 text-xs font-medium text-zinc-500 rounded-md hover:bg-zinc-100 hover:text-zinc-950 transition-colors">\${escapeHtml(item.text)}</a>\`;
    }).join('\\n');
}`;

const newToc = `function generateToc(html) {
    const regex = /<(h2|h3|h4)[^>]*id="([^"]*)"[^>]*>([\\s\\S]*?)<\\/\\1>/gi;
    const items = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
        items.push({
            level: match[1],
            id: match[2],
            text: match[3].replace(/<[^>]+>/g, '').trim()
        });
    }
    if (items.length === 0) return '<p class="text-xs text-cactus-meta opacity-50">暂无目录</p>';
    return items.map(item => {
        let paddingClass = '';
        if (item.level === 'h3') paddingClass = 'pl-3';
        else if (item.level === 'h4') paddingClass = 'pl-6';
        return \`<a href="#\${item.id}" class="toc-link block py-1 hover:text-cactus-link transition-colors \${paddingClass}">\${escapeHtml(item.text)}</a>\`;
    }).join('\\n');
}`;

buildJs = buildJs.replace(oldToc, newToc);

fs.writeFileSync('build.js', buildJs);
console.log('Replaced generateToc in build.js');
