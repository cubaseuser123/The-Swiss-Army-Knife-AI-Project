import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundGrid } from "@/components/ui/background-grid";
import { FileText, Globe, Wrench, Bot, Code, Terminal, Database, Network, Lock, ArrowRight, Github } from "lucide-react";

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="text-landing-text-main selection:bg-landing-primary selection:text-landing-surface snap-y snap-proximity scroll-smooth">
      <BackgroundGrid />

      {/* Hero Section */}
      <main className="relative isolate overflow-hidden min-h-[90vh] flex flex-col justify-center snap-start">

        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-32 pb-10 lg:pt-40 lg:pb-16 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full border border-landing-border bg-landing-surface px-3 py-1 text-sm font-mono-custom text-landing-text-main shadow-sm relative z-10">
            <span className="flex h-2 w-2 rounded-full bg-landing-primary mr-2 animate-pulse" />
            v2.0 is now live
          </div>

          {/* Decorative Swiss Knife Background Element */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none z-0 rotate-[-15deg]">
            <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className="text-landing-text-main">
              <path d="M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2" />
              <path d="M18 6h.01" />
              <path d="M6 18h.01" />
              <path d="M20.83 8.83a4 4 0 0 0-5.66-5.66l-12 12a4 4 0 1 0 5.66 5.66Z" />
              <path d="M18 11.66V22a4 4 0 0 0 4-4V6" />
            </svg>
          </div>

          {/* Hero Title */}
          <h1 className="font-display text-6xl font-extrabold tracking-tight text-landing-text-main sm:text-8xl lg:text-9xl mb-8 leading-[0.9]">
            Choose Your <br />
            <span className="text-landing-primary relative inline-block">
              Weapon.
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-landing-primary opacity-30" preserveAspectRatio="none" viewBox="0 0 100 10">
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3" />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-xl sm:text-2xl text-landing-text-muted max-w-3xl font-light font-body">
            The all-in-one AI productivity platform featuring RAG pipelines, autonomous agents, and utility tools for modern engineering.
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-6 w-full max-w-md sm:max-w-none justify-center items-center">
            {session ? (
              <Link href="/chat" className="w-full sm:w-auto">
                <Button
                  className="w-full rounded bg-landing-text-main px-8 py-4 text-lg font-bold text-landing-surface hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_#FE4A23]"
                  size="lg"
                >
                  Go to Chat
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="w-full sm:w-auto">
                  <Button
                    className="w-full rounded bg-landing-text-main px-8 py-4 text-lg font-bold text-landing-surface hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_#FE4A23]"
                    size="lg"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 rounded border-2 border-landing-text-main bg-transparent px-8 py-4 text-lg font-medium text-landing-text-main hover:bg-landing-text-main hover:text-landing-surface transition-colors"
                    size="lg"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Code Terminal */}
          <div className="mt-16 w-full max-w-2xl font-mono-custom text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] rounded-lg overflow-hidden border border-gray-800">
            <div className="flex items-center justify-between bg-landing-text-main px-4 py-2 border-b border-[#333]">
              <div className="flex gap-2">
                <div className="size-3 rounded-full bg-[#ff5f57]" />
                <div className="size-3 rounded-full bg-[#febc2e]" />
                <div className="size-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs text-gray-400">bash</span>
            </div>
            <div className="flex items-center justify-between bg-[#242424] p-4 text-left">
              <p className="text-gray-300">
                <span className="text-landing-primary mr-2">$</span>
                npm create <span className="text-landing-surface font-bold">swiss-army-knife-ai</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-6 relative overflow-hidden z-10 snap-start">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="md:flex md:justify-center md:items-center mb-16">
            <div className="max-w-2xl text-center mx-auto">
              <h2 className="text-3xl font-display font-bold tracking-tight text-landing-text-main sm:text-5xl">The Arsenal</h2>
              <p className="mt-4 text-lg text-landing-text-muted font-body">Select the right mode for the mission. Modular, powerful, and ready to deploy.</p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: FileText, title: "Document Mode", desc: "Deep dive into PDFs & Docs with advanced RAG. Extract structured data instantly." },
              { Icon: Globe, title: "Web Mode", desc: "Live scraping & internet access. Bypass anti-bot measures for real-time data." },
              { Icon: Wrench, title: "Utility Mode", desc: "Calculators, formatters & specialized dev tools. The swiss knife for logic." },
              { Icon: Bot, title: "Agent Mode", desc: "Autonomous multi-step workflows powered by LangGraph. Give it a goal, watch it work." }
            ].map((feature, i) => (
              <div key={i} className="group relative flex flex-col justify-between h-full bg-landing-surface border-2 border-transparent p-6 transition-all hover:-translate-y-1 hover:border-landing-text-main hover:shadow-[6px_6px_0px_0px_#121212] rounded-xl">
                <div>
                  <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-[#EAE7DE] border-2 border-landing-border text-landing-text-main shadow-sm group-hover:border-landing-primary group-hover:text-landing-primary transition-colors">
                    <feature.Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-landing-text-main mb-2">{feature.title}</h3>
                  <p className="text-sm text-landing-text-muted font-mono-custom leading-relaxed">{feature.desc}</p>
                </div>
                <div className="mt-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
                  <ArrowRight className="w-5 h-5 text-landing-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <div className="py-8 relative z-10 snap-start">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-center text-xs font-mono-custom text-landing-primary-dark mb-10 uppercase tracking-[0.2em] font-bold">Built on the shoulders of giants</p>
          <div className="mx-auto grid max-w-lg grid-cols-2 items-center gap-x-8 gap-y-12 sm:max-w-xl sm:grid-cols-3 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5 text-[#333333]">
            {[
              { Icon: Code, name: "Next.js" },
              { Icon: Terminal, name: "Vercel AI" },
              { Icon: Database, name: "Neon" },
              { Icon: Network, name: "LangGraph" },
              { Icon: Lock, name: "Better Auth" }
            ].map((tech, i) => (
              <div key={i} className="flex flex-col items-center justify-center font-bold text-xl hover:text-landing-text-main transition-colors gap-2 font-body">
                <tech.Icon className="w-10 h-10" />
                <span>{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="relative isolate overflow-hidden py-12 z-10 snap-start">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center border-2 border-landing-text-main bg-landing-surface p-12 rounded-2xl shadow-[8px_8px_0px_0px_#121212] relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-landing-primary text-landing-surface font-bold px-4 py-1 rounded-full text-sm uppercase tracking-wide border border-landing-text-main">Ready to Deploy?</div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-landing-text-main sm:text-5xl mt-2">Upgrade your workflow</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-landing-text-muted font-mono-custom">Join thousands of developers building the future of AI. Open source and ready to deploy.</p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {session ? (
                <Link href="/chat">
                  <Button className="rounded bg-landing-text-main px-8 py-3.5 text-sm font-bold text-landing-surface shadow-lg hover:bg-landing-primary hover:text-landing-surface transition-all">
                    Go to Chat
                  </Button>
                </Link>
              ) : (
                <Link href="/sign-up">
                  <Button className="rounded bg-landing-text-main px-8 py-3.5 text-sm font-bold text-landing-surface shadow-lg hover:bg-landing-primary hover:text-landing-surface transition-all">
                    Get Started for Free
                  </Button>
                </Link>
              )}
              <a className="text-sm font-semibold leading-6 text-landing-text-main group flex items-center gap-1 hover:text-landing-primary transition-colors font-body" href="https://github.com">
                View on GitHub <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-[#E0B784] border-t border-landing-border/20 snap-start">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
          <p className="text-xs leading-5 text-landing-text-muted font-mono-custom text-center">© 2024 Swiss Army Knife AI, Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}