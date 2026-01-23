"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, FileText, List, BarChart2, Code, Trash2, Settings, Paperclip, ArrowUp, Square, Search, CheckCircle } from "lucide-react";

// Mock data for sidebar
const mockConversations = [
    { id: 1, title: "Drafting RFP", icon: FileText },
    { id: 2, title: "Meeting Summary", icon: List },
    { id: 3, title: "Competitor Analysis", icon: BarChart2 },
    { id: 4, title: "Auth Logic Debug", icon: Code },
];

export default function ChatPage() {
    const [input, setInput] = useState("");
    const pathname = usePathname();
    const currentConversationId = pathname.match(/\/chat\/(\d+)/)?.[1];

    const { messages, sendMessage, status } = useChat({
        api: "/api/chat",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage({ text: input });
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-landing-surface-alt border-r border-landing-border flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)]">
                {/* Logo */}
                <div className="p-6 flex items-center gap-3">
                    <div className="size-9 bg-landing-text-main rounded flex items-center justify-center shadow-lg">
                        <svg className="size-5 text-landing-primary" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold tracking-tighter text-landing-text-main leading-none text-lg">
                            SWISS ARMY
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-landing-text-main/60 leading-none mt-1">
                            Knife AI
                        </span>
                    </div>
                </div>

                {/* New Chat Button */}
                <div className="px-4 mb-8">
                    <Link href="/chat">
                        <button className="w-full flex items-center justify-center gap-2 bg-landing-primary text-white hover:brightness-110 transition-all py-3 rounded-none font-bold uppercase tracking-widest text-xs shadow-blocky-dark btn-press">
                            <Plus className="size-4" />
                            <span>New Chat</span>
                        </button>
                    </Link>
                </div>

                {/* Conversation List */}
                <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-landing-text-main/40">
                        Recent Activity
                    </div>

                    {mockConversations.map((conv) => {
                        const Icon = conv.icon;
                        return (
                            <div
                                key={conv.id}
                                className={cn(
                                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors",
                                    currentConversationId === conv.id.toString()
                                        ? "bg-landing-text-main/10 text-landing-text-main"
                                        : "text-landing-text-main/70 hover:bg-landing-text-main/5"
                                )}
                            >
                                <Icon className="size-4 text-landing-text-main/60" />
                                <span className={cn(
                                    "truncate pr-6",
                                    currentConversationId === conv.id.toString() && "font-semibold"
                                )}>
                                    {conv.title}
                                </span>
                                <button className="absolute right-2 opacity-0 group-hover:opacity-100 hover:text-landing-primary transition-opacity">
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-landing-border mt-auto bg-landing-text-main/5">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-landing-text-main/5 cursor-pointer transition-colors">
                        <div className="size-9 rounded bg-landing-text-main flex items-center justify-center font-bold text-xs text-landing-primary shadow-sm">
                            U
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-landing-text-main truncate">User</p>
                            <p className="text-[10px] text-landing-text-main/50 font-black uppercase tracking-wider">Free Plan</p>
                        </div>
                        <Settings className="size-5 text-landing-text-main/40" />
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col bg-landing-background overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-landing-border flex items-center justify-between px-8 bg-landing-background/50 backdrop-blur-sm z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-landing-text-main/40">
                            Project
                        </span>
                        <h1 className="text-sm font-bold text-landing-text-main tracking-tight">
                            DOCUMENT INTELLIGENCE
                        </h1>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
                        {messages.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <EmptyState />
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div key={message.id}>
                                    {message.parts.map((part, i) => {
                                        switch (part.type) {
                                            case "text":
                                                return message.role === "user" ? (
                                                    <UserMessage key={`${message.id}-${i}`} text={part.text} />
                                                ) : (
                                                    <AssistantMessage key={`${message.id}-${i}`} text={part.text} />
                                                );
                                            case "tool-invocation":
                                                return (
                                                    <ToolCall
                                                        key={`${message.id}-${i}`}
                                                        // @ts-ignore - AI SDK types
                                                        name={part.toolInvocation?.toolName || "Tool"}
                                                        // @ts-ignore
                                                        state={part.toolInvocation?.state || "call"}
                                                    />
                                                );
                                            default:
                                                return null;
                                        }
                                    })}
                                </div>
                            ))
                        )}

                        {/* Loading State */}
                        {(status === "submitted" || status === "streaming") && (
                            <LoadingIndicator />
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-8 shrink-0">
                    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
                        <div className="relative bg-landing-surface border-2 border-landing-border rounded-none flex items-end p-2 min-h-[64px] shadow-blocky-lg focus-within:shadow-[8px_8px_0px_rgba(18,18,18,0.1)] focus-within:border-landing-text-main transition-all">
                            <button
                                type="button"
                                className="p-4 text-landing-text-main/40 hover:text-landing-primary transition-colors"
                            >
                                <Paperclip className="size-5" />
                            </button>

                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-landing-text-main placeholder-landing-text-main/30 py-4 px-2 resize-none max-h-48 custom-scrollbar font-semibold text-[15px]"
                                placeholder="Ask the Swiss Army AI anything..."
                                rows={1}
                            />

                            <div className="flex items-center gap-2 pr-2 pb-2">
                                <button
                                    type="submit"
                                    disabled={!input.trim() || status === "streaming"}
                                    className={cn(
                                        "size-12 bg-landing-primary hover:brightness-110 text-white rounded-none flex items-center justify-center transition-all shadow-blocky-dark btn-press",
                                        (!input.trim() || status === "streaming") && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {status === "streaming" ? (
                                        <Square className="size-5" />
                                    ) : (
                                        <ArrowUp className="size-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                            <p className="text-[10px] text-landing-text-main/30 uppercase tracking-[0.2em] font-black">
                                Powered by Gemini 2.0
                            </p>
                            <p className="text-[10px] text-landing-text-main/30 uppercase tracking-[0.2em] font-black">
                                Verify all outputs
                            </p>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="size-16 bg-landing-text-main rounded flex items-center justify-center mb-6 shadow-lg">
                <svg className="size-8 text-landing-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-landing-text-main mb-2">
                Start a conversation
            </h2>
            <p className="text-landing-text-muted mb-6 max-w-md">
                Ask anything, upload documents, or let the AI search your knowledge base.
            </p>
        </div>
    );
}

function UserMessage({ text }: { text: string }) {
    return (
        <div className="flex justify-end mb-6">
            <div className="max-w-[80%] bg-landing-surface px-6 py-4 rounded-none text-landing-text-main shadow-blocky border border-landing-border">
                <p className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap">{text}</p>
            </div>
        </div>
    );
}

function AssistantMessage({ text }: { text: string }) {
    return (
        <div className="flex gap-6 mb-6">
            <div className="size-10 shrink-0 bg-landing-text-main rounded flex items-center justify-center mt-1 shadow-md">
                <svg className="size-5 text-landing-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            </div>
            <div className="flex-1 text-[15px] leading-relaxed text-landing-text-main">
                <p className="whitespace-pre-wrap">{text}</p>
            </div>
        </div>
    );
}

function ToolCall({ name, state }: { name: string; state: string }) {
    const isLoading = state === "partial-call" || state === "call";

    return (
        <div className="flex gap-6 mb-6">
            <div className="size-10 shrink-0" />
            <div className="flex-1">
                <div className="border-2 border-landing-border rounded-none overflow-hidden bg-landing-surface/40 grid-texture relative">
                    {isLoading && <div className="shimmer absolute inset-0 pointer-events-none" />}
                    <div className="px-5 py-3.5 flex items-center gap-4 relative z-10">
                        {isLoading ? (
                            <Search className="size-5 text-landing-primary" />
                        ) : (
                            <CheckCircle className="size-5 text-landing-primary" />
                        )}
                        <span className="text-xs font-black uppercase tracking-[0.15em] text-landing-text-main/80">
                            {isLoading ? `Searching knowledge base...` : `Found relevant documents`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoadingIndicator() {
    return (
        <div className="flex gap-6 mb-6">
            <div className="size-10 shrink-0 bg-landing-text-main rounded flex items-center justify-center mt-1 shadow-md">
                <svg className="size-5 text-landing-primary animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 text-landing-text-muted">
                    <div className="flex gap-1">
                        <span className="size-2 bg-landing-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="size-2 bg-landing-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="size-2 bg-landing-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.15em]">Thinking...</span>
                </div>
            </div>
        </div>
    );
}
