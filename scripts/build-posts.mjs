import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const SOURCES_DIR = 'markdown-sources';
const GA_ID = 'UA-127645120-1';

// Legacy posts not in markdown-sources (date format: YYYY-MM-DD)
const LEGACY_POSTS = [
    { date: '2018-12-27', title: 'What Price the Bay', slug: 'costofliving' },
    { date: '2018-10-16', title: 'Dependent typing considered unreadable', slug: 'readability' },
];

const postTemplate = (title, description, content) => `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta name="Description" content="${description}">
        <title>${title}</title>
        <!-- Global site tag (gtag.js) - Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
        <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
        </script>
        <style>
            .bg{background-color: black}
            .txt{color: white}
            .ft{text-align:center;position:relative;width:100%;bottom:0;padding-bottom:.9em}
            .np{display:flex;flex-direction:row;justify-content:space-between;padding-bottom:.5em;font-style:italic}
            pre{background-color:#333333;padding:1em;overflow-x:auto}
            code{background-color:#333333;padding:0.2em 0.4em}
            pre code{padding:0}
            a,p,strong,code,li,td,th,h1,h2,h3,h4{color: white}
            li{padding-bottom:.5em}
            body{display:flex;flex-direction:column;align-items:center;padding:0 1em}
            article{max-width:800px;width:100%}
            table{border-collapse:collapse;width:100%;margin:1em 0}
            th,td{border:1px solid #555;padding:0.5em;text-align:left}
            th{background-color:#222}
            hr{border-color:#555;width:100%}
        </style>
    </head>
    <body class="bg">
        <article>
            ${content}
        </article>
    </body>
    <footer class="ft txt">
        <div class="np"><a href="../about/">About</a> Contact: rot13 of orggrefpnyr@cebgbaznvy.pbz <a href="../">Home</a></div>
    </footer>
</html>
`;

const homeTemplate = (postListHtml) => `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta name="Description" content="The blog's home page">
        <title>Not a type system</title>
        <!-- Global site tag (gtag.js) - Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
        <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
        </script>
        <style>
            .bg{background-color: black}
            .txt{color: white}
            .dt{width:4em;flex-shrink:0;padding-bottom:.9em;color: white}
            .ft{text-align:center;position:fixed;width:99%;bottom:0;padding-bottom:.9em}
            .np{display:flex;flex-direction:row;justify-content:space-between;padding-bottom:.5em;font-style:italic}
            a,p{color: white}
            body{display:flex;flex-direction:column;align-items:right;}
            div{display:flex}
        </style>
    </head>
    <body class="bg">
${postListHtml}
    </body>
    <footer class="ft txt">
            <div class="np"><a href="./about/">About</a> Contact: rot13 of orggrefpnyr@cebgbaznvy.pbz</div>
    </footer>
</html>
`;

function formatDate(date) {
    // Handle both Date objects and YYYY-MM-DD strings
    if (date instanceof Date) {
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const year = String(date.getUTCFullYear()).slice(-2);
        return `${month}/${day}/${year}`;
    }
    const [year, month, day] = date.split('-');
    return `${month}/${day}/${year.slice(-2)}`;
}

function buildPosts() {
    const files = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.md'));
    const posts = [];

    for (const file of files) {
        const filePath = path.join(SOURCES_DIR, file);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter, content } = matter(raw);

        const title = frontmatter.title || file.replace('.md', '');
        const description = frontmatter.description || title;
        const slug = frontmatter.slug || file.replace('.md', '');
        const date = frontmatter.date || '1970-01-01';

        posts.push({ date, title, slug });

        const html = marked(content);
        const page = postTemplate(title, description, html);

        const outDir = path.join('.', slug);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'index.html'), page);

        console.log(`Built: ${slug}/index.html`);
    }

    // Combine with legacy posts and sort by date (newest first)
    const allPosts = [...posts, ...LEGACY_POSTS].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    // Generate home page
    const postListHtml = allPosts.map(p =>
        `        <div>\n            <div class="dt">${formatDate(p.date)}</div>\n            <a href="./${p.slug}/">${p.title}</a>\n        </div>`
    ).join('\n');

    fs.writeFileSync('index.html', homeTemplate(postListHtml));
    console.log('Built: index.html');
}

buildPosts();
