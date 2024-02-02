import fs from "fs";
import Markdown from "markdown-to-jsx";
import path from "path";
import matter from "gray-matter";
import TagLabel from "../../../../components/tag-label";
import Date from "../../../../components/date";
import { getAllPostIds } from "../../../../lib/posts";
import Header from "../../../../components/header";
import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

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

function Code({ className, children }) {
    const language = className?.replace("lang-", "");
    return language ? (
        <SyntaxHighlighter
            language={language}
            style={{
                ...a11yDark,
                hljs: {
                    display: "block",
                    overflowX: "auto",
                    background: "transparent",
                    color: "#f8f8f2",
                    padding: "0em",
                    margin: "0",
                },
            }}
        >
            {children}
        </SyntaxHighlighter>
    ) : (
        <span className="font-mono bg-slate-300 text-cyan-700 px-1 py-0.5 rounded-md prose-code:m-1">
            {children}
        </span>
    );
}

export default function PostPage(props) {
    const slug = props.params.slug;
    const { data, content } = getPostData(slug);
    return (
        <div>
            <Header />
            <section className="flex flex-col items-left">
                <h1 className="text-3xl font-bold text-slate-800 mb-1">
                    {data.title}
                </h1>
                <div className="space-x-1.5 mb-2">
                    {data.tags.map((tag) => (
                        <TagLabel key={tag}>{tag}</TagLabel>
                    ))}
                </div>
                <div className="text-sm font-light text-gray-400">
                    <Date dateString={data.date} />
                </div>
                <article className="prose prose-indigo max-w-none sm:prose-lg lg:prose-lg prose-pre:rounded-xl prose-hr:mt-7 prose-hr:mb-7">
                    <Markdown
                        options={{
                            enforceAtxHeadings: true,
                            overrides: {
                                code: Code,
                            },
                        }}
                    >
                        {content}
                    </Markdown>
                </article>
            </section>
        </div>
    );
}
