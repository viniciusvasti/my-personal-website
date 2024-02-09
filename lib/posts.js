import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isBefore } from "date-fns";

const postsDirectory = path.join(process.cwd(), "posts");

export function getAllPostsData() {
    // Get file names under /posts
    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames
        .filter((fileName) => fileName.indexOf(".md") > -1)
        .map((fileName) => {
            // Remove ".md" from file name to get id
            const id = fileName.replace(/\.md$/, "");

            // Read markdown file as string
            const fullPath = path.join(postsDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, "utf8");

            // Use gray-matter to parse the post metadata section
            const matterResult = matter(fileContents);

            // Combine the data with the id
            return {
                id,
                ...matterResult.data,
            };
        });

    return allPostsData;
}

export function getSortedPostsData(tag) {
    // Sort posts by date
    return getAllPostsData()
        .filter((posts) => (tag ? posts.tags.indexOf(tag) > -1 : true))
        .sort((a, b) => {
            if (isBefore(a.date, b.date)) {
                return 1;
            } else {
                return -1;
            }
        });
}

// export async function getPostData(id) {
//     const fullPath = path.join(postsDirectory, `${id}.md`);
//     const fileContents = fs.readFileSync(fullPath, "utf8");

//     // Use gray-matter to parse the post metadata section
//     const matterResult = matter(fileContents);

//     // Use remark to convert markdown into HTML string
//     const processedContent = await unified()
//         .use(markdown)
//         .use(highlight)
//         .use(images)
//         .use(html)
//         .process(matterResult.content);
//     const contentHtml = processedContent.toString();

//     // Combine the data with the id and contentHtml
//     return {
//         id,
//         contentHtml,
//         ...matterResult.data,
//     };
// }

export function getAllPostIds() {
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames.filter((fileName) => fileName.indexOf(".md") > -1).map((fileName) => fileName.replace(/\.md$/, ""));
}

// export function getAllPostsTags() {
//     const tags = getAllPostsData()
//         .map((post) => ({
//             tag: post.tags.split(","),
//         }))
//         .reduce((prev, curr) => [...prev, ...curr.tag], []);
//     const uniqueTags = Array.from(new Set(tags)).map((tag) => ({
//         params: {
//             tag,
//         },
//     }));

//     return uniqueTags;
// }
