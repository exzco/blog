const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { marked }   = require('marked');
const matter       = require('gray-matter');

// ─── 配置 ─────────────────────────────────────────────────────────────────────
const CONFIG = {
    postsDir:    path.join(__dirname, 'posts'),
    distDir:     path.join(__dirname, 'dist'),
    templateDir: path.join(__dirname, 'template'),
};

// ─── 简单 HTML 压缩（去注释、合并空白行） ─────────────────────────────────────
function minifyHtml(html) {
    return html
        // 移除 HTML 注释（不含条件注释）
        .replace(/<!--(?!\[)[\s\S]*?-->/g, '')
        // 多个连续空行合并为一个
        .replace(/(\r?\n){3,}/g, '\n\n')
        // 去掉行尾多余空格
        .replace(/[ \t]+(\r?\n)/g, '$1')
        // 去掉 HTML 标签间多余的空白（保守处理，只针对块级标签间换行）
        .replace(/>\s{2,}</g, '> <')
        .trim();
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function mkdirSync(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** 复制目录下所有非 .md 文件（图片等资源） */
function copyAssets(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) return;
    mkdirSync(destDir);
    fs.readdirSync(srcDir, { withFileTypes: true }).forEach(entry => {
        if (entry.isFile() && !entry.name.endsWith('.md')) {
            fs.copyFileSync(
                path.join(srcDir, entry.name),
                path.join(destDir, entry.name)
            );
        }
    });
}

/** 为 H2/H3/H4 添加锚点 id */
function addHeadingIds(html) {
    const counters = {};
    return html.replace(/<(h2|h3|h4)([^>]*)>([\s\S]*?)<\/\1>/gi, (_, tag, attrs, inner) => {
        const text = inner.replace(/<[^>]+>/g, '').trim();
        const slug = slugify(text);
        counters[slug] = (counters[slug] || 0) + 1;
        const id = counters[slug] > 1 ? `${slug}-${counters[slug]}` : slug;
        return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
    });
}

/** 从带锚点的 HTML 内容生成 TOC */
function generateToc(html) {
    const regex = /<(h2|h3|h4)[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/\1>/gi;
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
        return `<a href="#${item.id}" class="toc-link block py-1 hover:text-cactus-link transition-colors ${paddingClass}">${escapeHtml(item.text)}</a>`;
    }).join('\n');
}

function slugify(text) {
    return text.toLowerCase()
        .replace(/[\s\u3000]+/g, '-')
        .replace(/[^\w\u4e00-\u9fff\-]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatFullDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr || '';
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/** 从文件夹名 YYYY-MM-DD-* 提取日期 */
function dateFromFolderName(name) {
    const m = name.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
}

/** 递归查找所有含 .md 文件的最浅目录（文章目录）*/
function findArticleDirs(dir, depth = 0) {
    if (depth > 6) return [];
    const results = [];
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (e) { return []; }

    const mdFiles = entries.filter(e => e.isFile() && e.name.endsWith('.md'));
    if (mdFiles.length > 0) {
        const mdFile = mdFiles.find(e => e.name === 'index.md') || mdFiles[0];
        return [{ dir, mdPath: path.join(dir, mdFile.name) }];
    }
    for (const entry of entries) {
        if (entry.isDirectory())
            results.push(...findArticleDirs(path.join(dir, entry.name), depth + 1));
    }
    return results;
}

function getYear(dateStr) {
    const d = new Date(dateStr);
    return isNaN(d) ? '未知' : String(d.getFullYear());
}

function getMonthDay(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getAvatarHtml(distDir) {
    const exts = ['jpg','jpeg','png','webp','gif','svg'];
    for (const ext of exts) {
        const src = path.join(__dirname, 'template', `avatar.${ext}`);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(distDir, `avatar.${ext}`));
            return `<img src="{{base_path}}avatar.${ext}" alt="avatar" class="w-full h-full object-cover">`;
        }
    }
    return `<span class="text-4xl" role="img" aria-label="avatar">🐱</span>`;
}

// ─── 配置 marked ──────────────────────────────────────────────────────────────
marked.setOptions({ gfm: true, breaks: false });

// ─── 主流程 ───────────────────────────────────────────────────────────────────
function main() {
    console.log('🔨 开始构建博客...');

    // 确保 posts 目录存在
    if (!fs.existsSync(CONFIG.postsDir)) {
        fs.mkdirSync(CONFIG.postsDir, { recursive: true });
        console.log('📁 已创建 posts/ 目录');
    }

    // 不再彻底删除整个 dist，只确保必要目录存在
    mkdirSync(CONFIG.distDir);
    mkdirSync(path.join(CONFIG.distDir, 'posts'));

    // ── 获取模板及 CSS 源码的最新修改时间 ──
    let maxTemplateMtime = 0;
    const templateFiles = [
        path.join(CONFIG.templateDir, 'article.html'),
        path.join(CONFIG.templateDir, 'index.html'),
        path.join(CONFIG.templateDir, 'about.html'),
        path.join(__dirname, 'src', 'input.css')
    ];
    templateFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const mtime = fs.statSync(file).mtimeMs;
            if (mtime > maxTemplateMtime) maxTemplateMtime = mtime;
        }
    });

    // ── Step 1: 用 Tailwind CLI 生成最小化 CSS (增量判断) ──
    const distCssPath = path.join(CONFIG.distDir, 'style.css');
    let needBuildCss = true;
    if (fs.existsSync(distCssPath)) {
        const cssMtime = fs.statSync(distCssPath).mtimeMs;
        if (cssMtime > maxTemplateMtime) {
            needBuildCss = false; // 模板及 CSS 源码未改变，无需重构
        }
    }

    if (needBuildCss) {
        console.log('🎨 构建 Tailwind CSS...');
        try {
            execSync(
                `npx tailwindcss -i src/input.css -o dist/style.css --minify`,
                { cwd: __dirname, stdio: 'pipe' }
            );
            const cssSize = (fs.statSync(distCssPath).size / 1024).toFixed(1);
            console.log(`✅ Tailwind CSS → dist/style.css (${cssSize} KB)`);
        } catch (e) {
            console.error('❌ Tailwind CSS 构建失败:', e.stderr?.toString() || e.message);
            process.exit(1);
        }
    } else {
        console.log('⚡ CSS 未发生变更，跳过构建');
    }

    // ── Step 2: 读取模板 ──
    const articleTemplate = fs.readFileSync(path.join(CONFIG.templateDir, 'article.html'), 'utf-8');
    const indexTemplate   = fs.readFileSync(path.join(CONFIG.templateDir, 'index.html'),   'utf-8');
    const aboutTemplate   = fs.readFileSync(path.join(CONFIG.templateDir, 'about.html'),   'utf-8');

    // ── Step 3: 扫描并生成文章页 (增量判断) ──
    const posts = [];
    let buildCount = 0;
    let skipCount = 0;

    // 递归查找所有文章目录
    const avatarHtml = getAvatarHtml(CONFIG.distDir);
    const articleDirs = findArticleDirs(CONFIG.postsDir);

    for (const article of articleDirs) {
        const folderName = path.basename(article.dir);
        const raw = fs.readFileSync(article.mdPath, 'utf-8');

        // 解析 Front Matter
        const { data: fm, content: mdContent } = matter(raw);
        let title = (fm.title || '').trim();
        if (!title) {
            title = folderName.replace(/^\d{4}-\d{2}-\d{2}-?/, '');
        }

        let date = '';
        const rawDate = fm.published || fm.date;
        if (rawDate) {
            date = formatFullDate(rawDate);
        } else {
            const fallbackDate = dateFromFolderName(folderName);
            if (fallbackDate) date = fallbackDate;
        }
        const description = (fm.description || '').trim();
        const slug = folderName;

        posts.push({ title, date, description, slug, year: getYear(date) });

        // ── 检查文章源文件及同级资源的最新修改时间 ──
        let maxSourceMtime = 0;
        fs.readdirSync(article.dir).forEach(file => {
            const filePath = path.join(article.dir, file);
            const mtime = fs.statSync(filePath).mtimeMs;
            if (mtime > maxSourceMtime) maxSourceMtime = mtime;
        });

        // ── 检查已生成的文章 HTML 是否是最新的 ──
        const postDistDir = path.join(CONFIG.distDir, 'posts', slug);
        const distHtmlPath = path.join(postDistDir, 'index.html');
        let needBuildHtml = true;

        if (fs.existsSync(distHtmlPath)) {
            const htmlMtime = fs.statSync(distHtmlPath).mtimeMs;
            // 只有当生成的文件比源文件新，且比文章模板新时，才跳过构建
            if (htmlMtime > maxSourceMtime && htmlMtime > maxTemplateMtime) {
                needBuildHtml = false;
            }
        }

        if (needBuildHtml) {
            // MD → HTML → 加锚点 → 生成 TOC
            let htmlContent = marked.parse(mdContent);
            htmlContent = addHeadingIds(htmlContent);
            const toc = generateToc(htmlContent);

            // 注入模板
            let articleHtml = articleTemplate.replace(/\{\{avatar\}\}/g, avatarHtml)
                .replace(/\{\{base_path\}\}/g, '../../')
                .replace(/\{\{slug\}\}/g,        slug)
                .replace(/\{\{title\}\}/g,       escapeHtml(title))
                .replace(/\{\{description\}\}/g, escapeHtml(description))
                .replace(/\{\{date\}\}/g,         date)
                .replace(/\{\{toc\}\}/g,          toc)
                .replace(/\{\{content\}\}/g, htmlContent)
                ;

            // 压缩 HTML
            articleHtml = minifyHtml(articleHtml);

            // 写出到目标目录
            mkdirSync(postDistDir);
            fs.writeFileSync(distHtmlPath, articleHtml, 'utf-8');

            // 复制同目录下的图片等资源
            copyAssets(article.dir, postDistDir);

            buildCount++;
            console.log(`🔨 重新构建：posts/${folderName}/index.html`);
        } else {
            skipCount++;
        }
    }

    // 按日期降序排列
    posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    
    // ── Step 4: 生成 index.html ───────────────────────────────────────────────
    const archiveList = generateArchiveList(posts);
    let indexHtml = indexTemplate.replace(/\{\{avatar\}\}/g, avatarHtml).replace(/\{\{base_path\}\}/g, '')
        .replace(/\{\{archive_list\}\}/g,  archiveList);
    indexHtml = minifyHtml(indexHtml);
    fs.writeFileSync(path.join(CONFIG.distDir, 'index.html'), indexHtml, 'utf-8');
    console.log('✅ 主页：index.html');

    // ── Step 5: 生成 about.html ───────────────────────────────────────────────
    let aboutHtml = aboutTemplate.replace(/\{\{avatar\}\}/g, avatarHtml).replace(/\{\{base_path\}\}/g, '');
    aboutHtml = minifyHtml(aboutHtml);
    fs.writeFileSync(path.join(CONFIG.distDir, 'about.html'), aboutHtml, 'utf-8');
    console.log('✅ 关于页：about.html');

    // ── 汇报 ─────────────────────────────────────────────────────────────────
    const distFiles = countDistSize(CONFIG.distDir);
    console.log(`\n🎉 构建完成！共 ${posts.length} 篇文章，输出 ${distFiles.count} 个文件，总计 ${distFiles.kb} KB`);
    console.log(`📁 输出目录：${CONFIG.distDir}`);
}

/** 生成按年分组的归档 HTML */
function generateArchiveList(posts) {
    if (posts.length === 0) return '<p class="text-sm text-cactus-meta text-center">暂无文章</p>';

    return posts.map(post => `
    <li class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-2">
      <div class="text-cactus-meta font-mono text-sm whitespace-nowrap min-w-[6rem]">
        <time datetime="${post.date}">${post.date}</time>
      </div>
      <a href="posts/${post.slug}/index.html" class="text-cactus-link hover:underline underline-offset-4 decoration-cactus-link transition-colors">${escapeHtml(post.title)}</a>
    </li>`).join('');
}

/** 统计 dist 总文件数和大小 */
function countDistSize(dir) {
    let count = 0, bytes = 0;
    function walk(d) {
        fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
            if (e.isDirectory()) walk(path.join(d, e.name));
            else { count++; bytes += fs.statSync(path.join(d, e.name)).size; }
        });
    }
    walk(dir);
    return { count, kb: (bytes / 1024).toFixed(1) };
}

main();
