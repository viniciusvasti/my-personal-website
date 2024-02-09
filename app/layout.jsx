import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const name = "Vinícius A dos Santos";

export const metadata = {
    title: {
        default: "vinisantos.dev",
        template: "%s | vinisantos.dev",
    },
    description: "Day-to-day life and coding as a Software Engineer",
    icons: {
        icon: "/images/profile2.jpg",
    },
    openGraph: {
        type: "website",
        url: "https://vinisantos.dev/",
        title: "vinisantos.dev",
        description: "Day-to-day life and coding as a Software Engineer",
        images: [
            {
                url: "/images/profile2.jpg",
                width: 200,
                height: 200,
                alt: "vinisantos.dev",
            },
        ],
    },
};

export default function RootLayout({ children }) {
    const home = false;
    return (
        <html lang="en">
            <body className={inter.className}>
                {/* margin: 3rem auto 6rem; */}
                <div className="max-w-4xl px-4 my-6 mx-auto">
                    <main>{children}</main>
                    {!home && (
                        <div className="mt-12">
                            <Link
                                href="/"
                                className="text-blue-400 hover:underline"
                            >
                                ← Back to home
                            </Link>
                        </div>
                    )}
                    <footer>
                        <div className="text-center mt-6 py-6 border-t border-slate-400 text-slate-400">
                            <h3>By {name}</h3>
                        </div>
                    </footer>
                </div>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
