import Head from "next/head";
import Layout, { siteTitle } from "../../components/layout";
import TagLabel from "../../components/tagLabel";
import Link from "next/link";
import Date from "../../components/date";
import utilStyles from "../../styles/utils.module.css";
import { getSortedPostsData, getAllPostsTags } from "../../lib/posts";

const PostList = ({ className, children }) => {
    return <div className={className}>{children}</div>;
};

const PostListItem = ({ id, title, date, tags }) => {
    return (
        <Link href={`/posts/${id}`}>
            <div className={utilStyles.listItem}>
                <div>{title}</div>
                <div>
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
            </div>
        </Link>
    );
};

export default function Home({ allPostsData, tag }) {
    return (
        <Layout home>
            <Head>
                <title>{siteTitle}</title>
            </Head>
            <TagLabel backgroundColor="#AAA" textColor="#EEE">
                {tag}
            </TagLabel>
            <section
                className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}
            >
                <PostList className={utilStyles.list}>
                    {allPostsData.map(({ id, date, title, tags }, index) => (
                        <PostListItem
                            key={index}
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

export async function getStaticPaths() {
    const paths = getAllPostsTags();
    return {
        paths,
        fallback: false,
    };
}

export async function getStaticProps({ params }) {
    const allPostsData = getSortedPostsData(params.tag);
    return {
        props: {
            allPostsData,
            tag: params.tag,
        },
    };
}
