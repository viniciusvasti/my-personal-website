import Head from "next/head";
import Layout, { siteTitle } from "../../components/layout";
import TagLabel from "../../components/tagLabel";
import utilStyles from "../../styles/utils.module.css";

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
        <Layout>
            <Head>
                <title>{siteTitle}</title>
            </Head>
            <section className={utilStyles.headingMd}>
                <p>
                    Hey, welcome! I'm <b>Vinicius</b>. I'm a{" "}
                    <b>Software Engineer</b> and <b>Solutions Architect</b>{" "}
                    passionte about Software craftsmanship, desinging solutions
                    and, of course, coding.
                </p>
            </section>

            <section className={utilStyles.headingMd}>
                <p>
                    My main skills are focused on <b>backend</b> development. In
                    my day-to-day I'm working with{" "}
                    <SkillsLabel>Java</SkillsLabel>,{" "}
                    <SkillsLabel>NodeJS</SkillsLabel>,{" "}
                    <SkillsLabel>SQL</SkillsLabel>,{" "}
                    <SkillsLabel>Microservices</SkillsLabel>,{" "}
                    <SkillsLabel>Serverless</SkillsLabel>,{" "}
                    <SkillsLabel>API Gateway</SkillsLabel>,{" "}
                    <SkillsLabel>Cloud Computing (AWS)</SkillsLabel>,{" "}
                    <SkillsLabel>Terraform</SkillsLabel>
                    <br />
                    But I also like playing arount with <b>
                        frontend
                    </b> using <SkillsLabel>React.JS</SkillsLabel> and{" "}
                    <SkillsLabel>React Native</SkillsLabel>. By the way, this
                    site is built over <SkillsLabel>Next.JS</SkillsLabel>
                </p>
            </section>

            <section className={utilStyles.headingMd}>
                <p>
                    Currently, I'm a <b>Technical Leader</b> at{" "}
                    <a href="https://www.riachuelo.com.br">
                        Riachuelo Fashion Stores
                    </a>
                    <br />I lead a team of 9 developers in a technical contexts.
                    My main reponsibilities are:
                    <ul>
                        <li key="0">
                            Design and explain <b>Architectural Solutions</b>
                        </li>
                        <li key="1">
                            Propose <b>standards</b> to be followed while we are
                            coding
                        </li>
                        <li key="2">
                            Be aware of corporative{" "}
                            <b>architectural principles and standards</b> and
                            ensure that our team solutions agreed with it
                        </li>
                        <li key="3">
                            Bring standards and corporative solutions{" "}
                            <b>together with other Technical Leaders</b>
                        </li>
                        <li key="4">
                            Manage my time to also code something, being a{" "}
                            <b>hands on</b> Technical Leader
                        </li>
                    </ul>
                </p>
            </section>
        </Layout>
    );
}