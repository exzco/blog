const fs = require('fs');

let buildJs = fs.readFileSync('build.js', 'utf-8');

// replace generateArchiveList
const oldGenerateArchiveList = `function generateArchiveList(posts) {
    if (posts.length === 0) return '<p class="text-sm text-zinc-400 mt-8 text-center">暂无文章</p>';

    const byYear = {};
    for (const post of posts) {
        const y = post.year || '未知';
        (byYear[y] = byYear[y] || []).push(post);
    }

    return Object.keys(byYear).sort((a, b) => b - a).map(year => \`
<section class="mt-10">
  <h2 class="text-2xl font-bold text-zinc-950 mb-4">\${year}</h2>
  \${byYear[year].map(post => \`
  <div class="article-row">
    <span class="article-date">\${getMonthDay(post.date)}</span>
    <a href="posts/\${post.slug}/index.html" class="article-title">\${escapeHtml(post.title)}</a>
  </div>\`).join('')}
</section>\`).join('');
}`;

const newGenerateArchiveList = `function generateArchiveList(posts) {
    if (posts.length === 0) return '<p class="text-sm text-cactus-meta text-center">暂无文章</p>';

    return posts.map(post => \`
    <li class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-2">
      <div class="text-cactus-meta font-mono text-sm whitespace-nowrap min-w-[6rem]">
        <time datetime="\${post.date}">\${post.date}</time>
      </div>
      <a href="posts/\${post.slug}/index.html" class="text-cactus-link hover:underline underline-offset-4 decoration-cactus-link transition-colors">\${escapeHtml(post.title)}</a>
    </li>\`).join('');
}`;

buildJs = buildJs.replace(oldGenerateArchiveList, newGenerateArchiveList);

fs.writeFileSync('build.js', buildJs);
console.log('Replaced generateArchiveList in build.js');
