"use client";

import { useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";

export default function ChatPage() {
    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <header className="h-14 border-b border-landing-border/50 flex items-center justify-between px-6 bg-landing-text-main/[0.02] backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-landing-primary animate-pulse" />
                        <h1 className="text-sm font-semibold text-landing-text-main tracking-tight">
                            New Chat
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-landing-text-main/40 bg-landing-text-main/5 px-2 py-1 rounded-full">
                        Gemini 2.0
                    </span>
                </div>
            </header>

            {/* Empty State */}
            <div className="flex-1 flex items-center justify-center px-6 py-6">
                <div className="flex flex-col items-center justify-center text-center max-w-md">
                    <div className="size-16 bg-landing-text-main rounded-xl flex items-center justify-center mb-6 shadow-lg">
                        <svg className="size-8 text-landing-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2" />
                            <path d="M18 6h.01" />
                            <path d="M6 18h.01" />
                            <path d="M20.83 8.83a4 4 0 0 0-5.66-5.66l-12 12a4 4 0 1 0 5.66 5.66Z" />
                            <path d="M18 11.66V22a4 4 0 0 0 4-4V6" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-landing-text-main mb-2">
                        Welcome to Swiss Army AI
                    </h2>
                    <p className="text-landing-text-muted mb-8 text-sm leading-relaxed">
                        Your all-in-one AI assistant for documents, research, and productivity.
                        Click <strong>New Chat</strong> in the sidebar to start a conversation.
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <div className="flex items-center gap-3 p-3 bg-landing-surface rounded-lg border border-landing-border">
                            <MessageSquare className="size-5 text-landing-primary" />
                            <span className="text-[13px] font-medium text-landing-text-main">Chat with AI</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-landing-surface rounded-lg border border-landing-border">
                            <Sparkles className="size-5 text-landing-primary" />
                            <span className="text-[13px] font-medium text-landing-text-main">RAG Search</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
