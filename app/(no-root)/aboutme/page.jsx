import Header from "../../../components/header";
import TagLabel from "../../../components/tag-label";

const SkillsLabel = ({ type, children }) => {
    return (
        <TagLabel
            backgroundColor={type === "soft" ? "green" : "red"}
            textColor="white"
        >
            {children}
        </TagLabel>
    );
};

export default function Post() {
    return (
        <div>
            <Header home={true} />
            <section className="text-lg">
                Hey, welcome! I'm <b>Vinicius</b>. I'm a{" "}
                <b>Full Stack Software Engineer</b> with a strong Backend
                background and over 12 years of experience. During the last 6
                years of my career, I've been building scalable web Apps and
                Services, running on the cloud and React.JS web apps. The
                majority of the Web Services I built were well-architected REST
                APIs, applying concepts like horizontal scalability, caching,
                security, observability, and so on. Sometimes implementing a
                Microservices architecture (when it makes sense) and applying
                the underlying patterns that come with it like API Gateway,
                Event-Driven, Saga Pattern, and Service Discovery, among
                others..
            </section>

            <section className="text-lg">
                My main skills are focused on <b>backend</b> development. In my
                daily activities I play around with{" "}
                <SkillsLabel>Java</SkillsLabel>,{" "}
                <SkillsLabel>NodeJS</SkillsLabel>,{" "}
                <SkillsLabel>SQL</SkillsLabel>,{" "}
                <SkillsLabel>Microservices</SkillsLabel>,{" "}
                <SkillsLabel>Serverless</SkillsLabel>,{" "}
                <SkillsLabel>API Gateway</SkillsLabel>,{" "}
                <SkillsLabel>Cloud Computing (AWS)</SkillsLabel>,{" "}
                <SkillsLabel>Terraform</SkillsLabel>
                <br />
                But I also like <b>frontend</b> development and I usually choose{" "}
                <SkillsLabel>React.JS</SkillsLabel> and{" "}
                <SkillsLabel>React Native</SkillsLabel> for this. By the way,
                this site is built with <SkillsLabel>Next.JS</SkillsLabel>
            </section>
        </div>
    );
}
