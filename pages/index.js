import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import Link from "next/link";
import Date from "../components/date";
import utilStyles from "../styles/utils.module.css";
import { getSortedPostsData } from "../lib/posts";

export default function Home({ allPostsData }) {
    return (
        <Layout home>
            <Head>
                <title>{siteTitle}</title>
            </Head>
            <section className={utilStyles.headingMd}>
                <p>
                    Hey, welcome! I'm Vinicius and I'm a <b>Technical Leader</b>{" "}
                    and Solutions Architect at{" "}
                    <a href="https://www.riachuelo.com.br">
                        Riachuelo Fashion Stores
                    </a>
                    <br />I lead a team of 9 developers in a technical contexts.
                    My main reponsibilities are:
                    <ul>
                        <li>
                            Design and explain <b>Architectural Solutions</b>
                        </li>
                        <li>
                            Propose <b>standards</b> to be followed while we are
                            coding
                        </li>
                        <li>
                            Be aware of corporative{" "}
                            <b>architectural principles and standards</b> and
                            ensure that our team solutions agreed with it
                        </li>
                        <li>
                            Bring standards and corporative solutions{" "}
                            <b>together with other Technical Leaders</b>
                        </li>
                        <li>
                            Manage my time to also code something, being a
                            <b>hands on</b> Technical Leader
                        </li>
                    </ul>
                </p>
                <p>
                    (This is a sample website - you’ll be building a site like
                    this on{" "}
                    <a href="https://nextjs.org/learn">our Next.js tutorial</a>
                    .)
                </p>
            </section>
            <section
                className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}
            >
                <h2 className={utilStyles.headingLg}>Blog</h2>
                <ul className={utilStyles.list}>
                    {allPostsData.map(({ id, date, title }) => (
                        <li className={utilStyles.listItem} key={id}>
                            <Link href={`/posts/${id}`}>
                                <a>{title}</a>
                            </Link>
                            <br />
                            <small className={utilStyles.lightText}>
                                <Date dateString={date} />
                            </small>
                        </li>
                    ))}
                </ul>
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
