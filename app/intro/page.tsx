import { BackgroundGrid } from "@/components/ui/background-grid";
import aboutData from "@/about_data.json";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Code, Database, Cpu, Layers, Terminal, Globe, Server } from "lucide-react";

// Helper to map tech stack to icons (optional, basic mapping)
const getIconForTech = (tech: string) => {
    const t = tech.toLowerCase();
    if (t.includes("next")) return <Globe className="w-4 h-4" />;
    if (t.includes("database") || t.includes("postgres")) return <Database className="w-4 h-4" />;
    if (t.includes("ai") || t.includes("model")) return <Cpu className="w-4 h-4" />;
    if (t.includes("api")) return <Server className="w-4 h-4" />;
    return <Code className="w-4 h-4" />;
};

export default function IntroPage() {
    const { about } = aboutData;

    return (
        <div className="min-h-screen text-landing-text-main selection:bg-landing-primary selection:text-landing-surface snap-y snap-proximity scroll-smooth relative">
            <BackgroundGrid />

            <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-32 pb-20 relative z-10">

                {/* Sections */}
                <div className="space-y-24">
                    {about.sections.map((section: any, index: number) => {
                        // Introduction Section
                        if (section.type === "introduction") {
                            return (
                                <section key={index} className="flex flex-col items-center text-center max-w-4xl mx-auto snap-start">
                                    <h1 className="font-display text-5xl font-extrabold tracking-tight text-landing-text-main sm:text-7xl mb-8">
                                        {section.title}
                                    </h1>
                                    <div className="space-y-6 text-xl sm:text-2xl text-landing-text-muted font-light font-body leading-relaxed">
                                        {section.content.map((p: string, i: number) => (
                                            <p key={i}>{p}</p>
                                        ))}
                                    </div>

                                    {/* Stats Grid integrated here for flow */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 w-full">
                                        {about.stats.map((stat: any, i: number) => (
                                            <Card key={i} className="bg-landing-surface border-2 border-landing-border hover:border-landing-text-main transition-colors text-center py-6">
                                                <div className="text-4xl font-mono-custom font-bold text-landing-primary mb-2">{stat.number}</div>
                                                <div className="text-sm font-bold text-landing-text-main uppercase tracking-wider mb-1">{stat.label}</div>
                                                <div className="text-xs text-landing-text-muted">{stat.description}</div>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            );
                        }

                        // Problem & Solution (Grid Layout)
                        if (section.type === "problem" || section.type === "solution") {
                            return (
                                <section key={index} className="grid md:grid-cols-12 gap-12 items-start snap-start py-8">
                                    <div className="md:col-span-4">
                                        <h2 className="text-3xl font-display font-bold text-landing-text-main border-l-4 border-landing-primary pl-6">
                                            {section.title}
                                        </h2>
                                    </div>
                                    <div className="md:col-span-8 bg-landing-surface/50 p-8 rounded-xl border border-landing-border/50 backdrop-blur-sm shadow-sm space-y-4">
                                        {section.content.map((p: string, i: number) => (
                                            <p key={i} className="text-lg text-landing-text-muted font-body leading-relaxed">{p}</p>
                                        ))}
                                    </div>
                                </section>
                            );
                        }

                        // Learning Section
                        if (section.type === "learning") {
                            return (
                                <section key={index} className="snap-start py-8">
                                    <div className="text-center mb-12">
                                        <h2 className="text-3xl font-display font-bold text-landing-text-main sm:text-5xl">{section.title}</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {section.technologies.map((tech: any, i: number) => (
                                            <div key={i} className="group p-6 bg-landing-surface border border-landing-border rounded-xl hover:shadow-[6px_6px_0px_0px_#121212] hover:border-landing-text-main transition-all">
                                                <h3 className="text-xl font-bold font-display text-landing-text-main mb-3 group-hover:text-landing-primary transition-colors">{tech.name}</h3>
                                                <p className="text-landing-text-muted text-sm leading-relaxed">{tech.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        }

                        // Tech Showcase
                        if (section.type === "tech-showcase") {
                            return (
                                <section key={index} className="snap-start py-8">
                                    <div className="text-center mb-12">
                                        <h2 className="text-3xl font-display font-bold text-landing-text-main sm:text-4xl">{section.title}</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {Object.entries(section.stack).map(([cat, items]: [string, any], i) => (
                                            <div key={i} className="space-y-4">
                                                <h3 className="font-mono-custom text-landing-primary uppercase tracking-widest text-sm font-bold border-b border-landing-border/20 pb-2">{cat}</h3>
                                                <ul className="space-y-2">
                                                    {items.map((item: string, j: number) => (
                                                        <li key={j} className="flex items-center text-landing-text-main font-medium">
                                                            <div className="mr-3 text-landing-text-muted opacity-50">{getIconForTech(cat)}</div>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        }




                        // Open Source / CTA
                        if (section.type === "open-source") {
                            return (
                                <section key={index} className="text-center py-16 snap-start">
                                    <h2 className="text-3xl font-display font-bold text-landing-text-main mb-6">{section.title}</h2>
                                    <div className="max-w-2xl mx-auto space-y-4 mb-8 text-lg text-landing-text-muted">
                                        {section.content.map((p: string, i: number) => (
                                            <p key={i}>{p}</p>
                                        ))}
                                    </div>
                                    <div className="flex justify-center gap-4">
                                        <a href="https://github.com/cubaseuser123/Rag-ChatBot-App-With-AI-SDK" target="_blank" rel="noopener noreferrer">
                                            <Button size="lg" className="rounded bg-landing-text-main px-8 py-6 text-lg font-bold text-landing-surface shadow-[4px_4px_0px_0px_#FE4A23] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#FE4A23] transition-all">
                                                {section.callToAction.primary}
                                                <ArrowRight className="ml-2 w-5 h-5" />
                                            </Button>
                                        </a>
                                    </div>
                                </section>
                            );
                        }

                        return null;
                    })}
                </div>



            </div>
        </div>
    );
}
