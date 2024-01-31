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
    const postData = getPostData(slug);
    return (
        <div>
            <Header />
            <article>
                <h1 className="text-3xl font-extrabold mb-1">
                    {postData.data.title}
                </h1>
                <div className="text-gray-400">
                    <Date dateString={postData.data.date} />
                </div>
                {postData.data.tags.split(",").map((tag) => (
                    <span key={tag}>
                        <TagLabel backgroundColor="#AAA" textColor="#EEE">
                            {tag}
                        </TagLabel>{" "}
                    </span>
                ))}
                <article className="prose lg:prose-xl">
                    <Markdown>{postData.content}</Markdown>
                </article>
            </article>
        </div>
    );
}
