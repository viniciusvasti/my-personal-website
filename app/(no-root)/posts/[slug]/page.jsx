import fs from "fs";
import Markdown from "markdown-to-jsx";
import path from "path";
import matter from "gray-matter";
import TagLabel from "../../../../components/tag-label";
import Date from "../../../../components/date";
import { getAllPostIds } from "../../../../lib/posts";
import Header from "../../../../components/header";

const postsDirectory = path.join(process.cwd(), "posts");

function getPostData(slug) {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    // Use gray-matter to parse the post metadata section
    return matter(fileContents);
}

export function generateStaticParams() {
    const postsIds = getAllPostIds();
    return postsIds.map((id) => ({
        slug: id,
    }));
}

export default function PostPage(props) {
    const slug = props.params.slug;
    const { data, content } = getPostData(slug);
    return (
        <div>
            <Header />
            <section>
                <h1 className="text-3xl font-bold text-slate-800 mb-1">
                    {data.title}
                </h1>
                <div className="space-x-1.5 mb-2">
                    {data.tags.split(",").map((tag) => (
                        <TagLabel key={tag}>{tag}</TagLabel>
                    ))}
                </div>
                <div className="text-sm font-light text-gray-400">
                    <Date dateString={data.date} />
                </div>
                <article className="prose lg:prose-xl">
                    <Markdown>{content}</Markdown>
                </article>
            </section>
        </div>
    );
}
