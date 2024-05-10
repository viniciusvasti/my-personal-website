import Link from "next/link";
import Date from "../components/date";
import TagLabel from "../components/tag-label";
import { getSortedPostsData } from "../lib/posts";
import Header from "../components/header";

const PostList = ({ className, children }) => {
    return <div className={className}>{children}</div>;
};

const PostListItem = ({ id, title, date, tags, backgroundColor = "white" }) => {
    return (
        <div className={`flex flex-col justify-between gap-2 w-full border border-slate-200 rounded-md bg-${backgroundColor} shadow-md p-4`}>
            <span>
                <Link href={`/posts/${id}`}>
                    <h2 className="text-lg font-bold text-slate-500 hover:underline">
                        {title}
                    </h2>
                </Link>
                <div className="space-x-1.5">
                    {tags.map((tag) => (
                        <TagLabel key={tag}>{tag}</TagLabel>
                    ))}
                </div>
            </span>
            <small className="text-xs font-light text-slate-400">
                <Date dateString={date} />
            </small>
        </div>
    );
};

export default function Home() {
    const allPostsData = getSortedPostsData();
    return (
        <section className="text-xl">
            <Header home={true} />
            <PostList className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PostListItem
                    id="the-biggest-challenge-i-faced-in-my-career"
                    title="The biggest challenge I've faced in my career"
                    date="2024-05-08"
                    tags={["career", "tech-lead"]}
                    backgroundColor="yellow-50"
                />
                {allPostsData
                    .filter(
                        ({ id }) =>
                            id !== "the-biggest-challenge-i-faced-in-my-career"
                    )
                    .map(({ id, date, title, tags }, index) => (
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
    );
}
