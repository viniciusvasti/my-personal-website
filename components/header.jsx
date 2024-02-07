import Image from "next/image";
import Link from "next/link";

const name = "Vinícius A dos Santos";

const SocialLink = ({ url, img, imgAlt, size }) => (
    <a
        className="mr-1 ml-1 bg-gray-50 p-1 rounded-md"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
    >
        <Image width={size} height={size} src={img} alt={imgAlt} />
    </a>
);

const Header = ({ home }) => {
    return (
        <header className="py-8 px-8 flex flex-col items-center bg-gradient-to-r from-slate-900 to-slate-700 gap-2 rounded-md mb-6">
            {home ? (
                <>
                    <Image
                        src="/images/profile2.jpeg"
                        className="w-32 h-32 rounded-full border-2"
                        width={128}
                        height={128}
                        alt={name}
                    />
                    <h1 className="text-4xl font-bold mb-1 text-gray-50">
                        {name}
                    </h1>
                </>
            ) : (
                <>
                    <Link href="/">
                        <Image
                            src="/images/profile2.jpeg"
                            width={96}
                            height={96}
                            className="w-24 h-24 rounded-full border-2"
                            alt={name}
                        />
                    </Link>
                    <Link href="/" className="text-inherit">
                        <h2 className="text-2xl font-semibold text-gray-50">
                            {name}
                        </h2>
                    </Link>
                </>
            )}
            <div>
                <Link
                    href="/about-me"
                    className="text-slate-300 hover:underline hover:text-blue-400"
                >
                    About Me
                </Link>
                <span className="mx-2 text-slate-300">•</span>
                <Link
                    href="mailto:vinicius.vas.ti+from-blog@gmail.com"
                    className="text-slate-300 hover:underline hover:text-blue-400"
                >
                    Email Me
                </Link>
            </div>
            <div className="flex items-center">
                <SocialLink
                    img="/images/linkedin.svg"
                    imgAlt="LinkedIn"
                    url="https://www.linkedin.com/in/vinicius-vas-ti/"
                    size={home ? 32 : 20}
                />
                <SocialLink
                    img="/images/github.svg"
                    imgAlt="GitHub"
                    url="https://github.com/viniciusvasti/"
                    size={home ? 32 : 20}
                />
                <SocialLink
                    img="/images/email.svg"
                    imgAlt="Email"
                    url="mailto:vinicius.vas.ti+from-blog@gmail.com"
                    size={home ? 32 : 20}
                />
            </div>
        </header>
    );
};

export default Header;
