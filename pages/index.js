import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import TagLabel from "../components/tagLabel";
import Link from "next/link";
import Date from "../components/date";
import utilStyles from "../styles/utils.module.css";
import { getSortedPostsData } from "../lib/posts";

const PostList = ({ children }) => {
    return <div>{children}</div>;
};

const PostListItem = ({ id, title, date, tags }) => {
    return (
        <Link href={`/posts/${id}`}>
            <div className={utilStyles.listItem}>
                {title}
                <br />
                <small className={utilStyles.lightText}>
                    <Date dateString={date} />
                </small>{" "}
                {tags.split(",").map((tag) => (
                    <>
                        <TagLabel backgroundColor="#AAA" textColor="#EEE">
                            {tag}
                        </TagLabel>{" "}
                    </>
                ))}
            </div>
        </Link>
    );
};

export default function Home({ allPostsData }) {
    return (
        <Layout home>
            <Head>
                <title>{siteTitle}</title>
            </Head>
            <section
                className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}
            >
                <h2 className={utilStyles.headingLg}>Blog</h2>
                <PostList className={utilStyles.list}>
                    {allPostsData.map(({ id, date, title, tags }) => (
                        <PostListItem
                            id={id}
                            title={title}
                            date={date}
                            tags={tags}
                        />
                    ))}
                </PostList>
            </section>
        </Layout>
    );
}

export async function getStaticProps() {
    const allPostsData = getSortedPostsData();
    return {
        props: {
            allPostsData,
        },
    };
}
