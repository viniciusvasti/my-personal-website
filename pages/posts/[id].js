import React, { useEffect } from "react";
import Head from "next/head";
import Layout from "../../components/layout";
import Date from "../../components/date";
import TagLabel from "../../components/tagLabel";
import utilStyles from "../../styles/utils.module.css";
import { getAllPostIds, getPostData } from "../../lib/posts";


export default function Post({ postData }) {
    return (
        <Layout>
            <Head>
                <title>{postData.title}</title>
                <link
                    rel="stylesheet"
                    href="//cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.3.2/build/styles/default.min.css"
                ></link>
            </Head>
            <article>
                <h1 className={utilStyles.headingXl}>{postData.title}</h1>
                <div className={utilStyles.lightText}>
                    <Date dateString={postData.date} />
                </div>
                {postData.tags.split(",").map((tag) => (
                    <>
                        <TagLabel backgroundColor="#AAA" textColor="#EEE">
                            {tag}
                        </TagLabel>{" "}
                    </>
                ))}
                <div
                    dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
                />
            </article>
        </Layout>
    );
}

export async function getStaticPaths() {
    const paths = getAllPostIds();
    return {
        paths,
        fallback: false,
    };
}

export async function getStaticProps({ params }) {
    const postData = await getPostData(params.id);
    return {
        props: {
            postData,
        },
    };
}
