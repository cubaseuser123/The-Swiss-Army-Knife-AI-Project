'use client';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { Button } from './ui/button';
import { Github } from 'lucide-react';
import { useEffect, useState } from 'react';

const PocketKnifeIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2" />
        <path d="M18 6h.01" />
        <path d="M6 18h.01" />
        <path d="M20.83 8.83a4 4 0 0 0-5.66-5.66l-12 12a4 4 0 1 0 5.66 5.66Z" />
        <path d="M18 11.66V22a4 4 0 0 0 4-4V6" />
    </svg>
);


export const Navigation = () => {
    const { data: session, isPending } = useSession();
    const [isVisible, setIsVisible] = useState(true);
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleScroll = () => {
            setIsVisible(false);
            setIsScrolling(true);

            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setIsVisible(true);
                setIsScrolling(false);
            }, 500); // Reappear after 500ms of no scrolling
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
        };
    }, []);

    const handleSignOut = async () => {
        const { signOut } = await import('@/lib/auth-client');
        await signOut();
    }
    return (
        <div className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none">
            {/* Background Glow Snippet - User Requested Design with matched colors */}
            <div className={`absolute top-0 z-[-2] h-screen w-screen bg-transparent bg-[radial-gradient(100%_50%_at_50%_0%,rgba(254,74,35,0.13)_0,rgba(254,74,35,0)_50%,rgba(254,74,35,0)_100%)] transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}></div>

            <div
                className={`pointer-events-auto mt-6 flex items-center gap-6 px-6 py-3 rounded-full border border-landing-border/20 bg-landing-surface/80 backdrop-blur-xl shadow-lg shadow-black/5 ring-1 ring-white/10 mx-4 max-w-5xl w-full justify-between transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
                    }`}
            >
                <div className="flex items-center gap-3 group">
                    <div className="flex size-8 items-center justify-center rounded bg-landing-text-main text-landing-surface overflow-hidden hover:bg-landing-primary transition-colors">
                        <PocketKnifeIcon className="w-5 h-5 text-landing-surface" />
                    </div>
                    <Link href="/" className="text-lg font-display font-bold tracking-tight text-landing-text-main hidden sm:block">
                        Swiss Army Knife AI
                    </Link>
                </div>

                <nav className="flex items-center gap-6">
                    <a className="text-sm font-medium text-landing-text-muted hover:text-landing-primary transition-colors" href="/intro">Intro</a>
                    <a className="text-sm font-medium text-landing-text-muted hover:text-landing-primary transition-colors" href="/features">Features</a>
                    <a className="text-sm font-medium text-landing-text-muted hover:text-landing-primary transition-colors" href="#pricing">Blog</a>
                    <a className="text-sm font-medium text-landing-text-muted hover:text-landing-primary transition-colors" href="/status">Status</a>
                </nav>

                <div className="flex items-center gap-3">
                    <a className="hidden md:flex text-landing-text-muted hover:text-landing-text-main transition-colors" href="https://github.com/cubaseuser123/Rag-ChatBot-App-With-AI-SDK" target="_blank" rel="noopener noreferrer">
                        <Github className="h-5 w-5" />
                    </a>
                    {!isPending && (
                        <>
                            {session ? (
                                <>
                                    <span className="text-xs text-landing-text-muted hidden lg:block truncate max-w-[100px]">{session.user.email}</span>
                                    <Button
                                        onClick={handleSignOut}
                                        variant="ghost"
                                        size="sm"
                                        className="text-landing-text-main hover:text-landing-primary h-8"
                                    >
                                        Sign Out
                                    </Button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href='/sign-in'>
                                        <Button
                                            variant='ghost'
                                            size="sm"
                                            className="text-landing-text-muted hover:text-landing-text-main h-8 px-3"
                                        >
                                            Sign In
                                        </Button>
                                    </Link>
                                    <Link href='/sign-up'>
                                        <Button
                                            size="sm"
                                            className="rounded-full bg-landing-text-main text-landing-surface hover:bg-gray-800 h-8 px-4 text-xs font-bold"
                                        >
                                            Get Started
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}