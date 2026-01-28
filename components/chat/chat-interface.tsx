"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import { Paperclip, ArrowUp, Square, Search, CheckCircle, MessageSquare, Loader2, Pin } from "lucide-react";
import { toast } from "sonner";
import { processProcessedFile } from "@/app/chat/actions";

type Message = {
    id: number;
    role: string;
    content: string;
    createdAt: string | null;
};

type ChatInterfaceProps = {
    conversationId: number;
    initialMessages: Message[];
    conversationTitle: string;
};

export function ChatInterface({ conversationId, initialMessages, conversationTitle }: ChatInterfaceProps) {
    const [input, setInput] = useState("");

    const initialMessagesMapped = initialMessages.map(m => ({
        id: m.id.toString(),
        role: m.role as "user" | "assistant",
        content: m.content,
        parts: [{ type: 'text' as const, text: m.content }],
        createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
    }));

    const { messages, sendMessage, status, setMessages } = useChat({
        id: conversationId.toString(),
        initialMessages: initialMessagesMapped,
    });

    const [isPinning, setIsPinning] = useState(false);
    const [showPinButton, setShowPinButton] = useState(false);

    // File Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await processProcessedFile(formData, conversationId);

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("An error occurred during upload");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        if (status === 'ready' && messages.length > 0) {
            const timer = setTimeout(() => setShowPinButton(true), 500); // Slight delay for effect
            return () => clearTimeout(timer);
        } else if (status === 'streaming' || status === 'submitted') {
            setShowPinButton(false);
        }
    }, [status, messages.length]);

    const handlePin = async () => {
        setIsPinning(true);
        try {
            const res = await fetch('/api/chat/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.skipped) {
                    toast.info("Conversation too short to pin.");
                } else {
                    toast.success("Conversation pinned to memory!");
                }
                setShowPinButton(false);
            } else {
                toast.error("Failed to pin conversation.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error pinning conversation.");
        } finally {
            setIsPinning(false);
        }
    };

    useEffect(() => {
        if (messages.length === 0 && initialMessages.length > 0) {
            setMessages(initialMessagesMapped);
        }
    }, [initialMessages, setMessages]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage({ text: input }, { body: { conversationId } });
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-landing-background via-landing-background to-landing-background-lighter overflow-hidden h-full relative">
            {/* Header */}
            <header className="h-14 border-b border-landing-border/50 flex items-center justify-between px-6 bg-landing-text-main/[0.02] backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-landing-primary animate-pulse" />
                        <h1 className="text-sm font-semibold text-landing-text-main tracking-tight">
                            {conversationTitle}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-landing-text-main/40 bg-landing-text-main/5 px-2 py-1 rounded-full">
                        Gemini 2.0
                    </span>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
                <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-20">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="size-12 bg-landing-text-main rounded-lg flex items-center justify-center mb-4 shadow-md">
                                    <MessageSquare className="size-6 text-landing-primary" />
                                </div>
                                <h2 className="text-lg font-semibold text-landing-text-main mb-1">
                                    Start the conversation
                                </h2>
                                <p className="text-sm text-landing-text-muted">
                                    Send a message to begin chatting.
                                </p>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id}>
                                {message.parts?.map((part, i) => {
                                    if (part.type === "text") {
                                        return message.role === "user" ? (
                                            <UserMessage key={`${message.id}-${i}`} text={part.text} />
                                        ) : (
                                            <AssistantMessage key={`${message.id}-${i}`} text={part.text} />
                                        );
                                    }
                                    if (part.type === "tool-invocation") {
                                        return (
                                            <ToolCall
                                                key={`${message.id}-${i}`}
                                                // @ts-ignore
                                                name={part.toolInvocation?.toolName || "Tool"}
                                                // @ts-ignore
                                                state={part.toolInvocation?.state || "call"}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        ))
                    )}

                    {/* Loading State */}
                    {(status === "submitted" || status === "streaming") && (
                        <LoadingIndicator />
                    )}

                    {/* Pin Button - Inline Fade In */}
                    <div className={cn(
                        "transition-all duration-1000 ease-in-out overflow-hidden flex-shrink-0",
                        showPinButton ? "opacity-100 max-h-20 translate-y-0" : "opacity-0 max-h-0 translate-y-4"
                    )}>
                        <div className="flex justify-start pl-10 pb-4 pt-2">
                            <button
                                onClick={handlePin}
                                disabled={isPinning}
                                className={cn(
                                    "group flex items-center gap-2 bg-landing-surface/50 border border-landing-border/50 hover:border-landing-primary/50 shadow-sm p-2 pr-4 rounded-full text-landing-text-main transition-all duration-300",
                                    isPinning && "animate-pulse cursor-wait"
                                )}
                                title="Pin conversation to memory"
                            >
                                <div className="size-6 bg-landing-primary/10 rounded-full flex items-center justify-center group-hover:bg-landing-primary group-hover:text-white transition-colors">
                                    <Pin className={cn("size-3.5 transition-transform group-hover:rotate-45", isPinning && "animate-spin")} />
                                </div>
                                <span className="text-[12px] font-medium text-landing-text-muted group-hover:text-landing-text-main transition-colors">
                                    {isPinning ? "Memorizing conversation..." : "Pin this to memory"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="px-6 pb-6 pt-4 shrink-0">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
                    <div className="relative bg-landing-surface border border-landing-border rounded-2xl flex items-end p-2 min-h-[56px] shadow-lg shadow-landing-text-main/5 focus-within:shadow-xl focus-within:shadow-landing-text-main/10 focus-within:border-landing-text-main/30 transition-all">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.txt,.md"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="p-3 text-landing-text-main/40 hover:text-landing-primary transition-colors rounded-lg hover:bg-landing-text-main/5"
                        >
                            {isUploading ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <Paperclip className="size-5" />
                            )}
                        </button>

                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-landing-text-main placeholder-landing-text-main/40 py-3 px-2 resize-none max-h-36 custom-scrollbar font-medium text-[14px]"
                            placeholder="Message Swiss Army AI..."
                            rows={1}
                        />

                        <div className="flex items-center gap-1.5 pr-1 pb-1">
                            <button
                                type="submit"
                                disabled={!input.trim() || status === "streaming"}
                                className={cn(
                                    "size-10 bg-landing-primary hover:bg-landing-primary-dark text-white rounded-xl flex items-center justify-center transition-all",
                                    (!input.trim() || status === "streaming") && "opacity-40 cursor-not-allowed"
                                )}
                            >
                                {status === "streaming" ? (
                                    <Square className="size-4" />
                                ) : (
                                    <ArrowUp className="size-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-landing-text-main/30 mt-3 font-medium">
                        Swiss Army AI can make mistakes. Verify important information.
                    </p>
                </form>
            </div>

        </div>
    );
}

function UserMessage({ text }: { text: string }) {
    return (
        <div className="flex justify-end mb-4">
            <div className="max-w-[80%] bg-landing-surface px-3 py-2 rounded-lg text-landing-text-main shadow-blocky border border-landing-border">
                <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap">{text}</p>
            </div>
        </div>
    );
}

function AssistantMessage({ text }: { text: string }) {
    return (
        <div className="flex gap-3 mb-4">
            <div className="size-7 shrink-0 bg-landing-text-main rounded-md flex items-center justify-center mt-0.5 shadow-sm">
                <svg className="size-3.5 text-landing-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2" />
                    <path d="M18 6h.01" />
                    <path d="M6 18h.01" />
                    <path d="M20.83 8.83a4 4 0 0 0-5.66-5.66l-12 12a4 4 0 1 0 5.66 5.66Z" />
                    <path d="M18 11.66V22a4 4 0 0 0 4-4V6" />
                </svg>
            </div>
            <div className="max-w-[80%] bg-landing-surface/50 px-3 py-2 rounded-lg border border-landing-border shadow-blocky">
                <p className="text-[14px] leading-relaxed text-landing-text-main whitespace-pre-wrap font-body font-medium">{text}</p>
            </div>
        </div>
    );
}

function ToolCall({ name, state }: { name: string; state: string }) {
    const isLoading = state === "partial-call" || state === "call";

    return (
        <div className="flex gap-3 mb-4">
            <div className="size-7 shrink-0" />
            <div className="flex-1">
                <div className="border border-landing-border rounded-lg overflow-hidden bg-landing-surface/40 relative">
                    {isLoading && <div className="shimmer absolute inset-0 pointer-events-none" />}
                    <div className="px-4 py-2.5 flex items-center gap-3 relative z-10">
                        {isLoading ? (
                            <Search className="size-4 text-landing-primary" />
                        ) : (
                            <CheckCircle className="size-4 text-landing-primary" />
                        )}
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-landing-text-main/70">
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
        <div className="flex gap-3 mb-4">
            <div className="size-7 shrink-0 bg-landing-text-main rounded-md flex items-center justify-center mt-0.5 shadow-sm">
                <svg className="size-3.5 text-landing-primary animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2" />
                    <path d="M18 6h.01" />
                    <path d="M6 18h.01" />
                    <path d="M20.83 8.83a4 4 0 0 0-5.66-5.66l-12 12a4 4 0 1 0 5.66 5.66Z" />
                    <path d="M18 11.66V22a4 4 0 0 0 4-4V6" />
                </svg>
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 text-landing-text-muted">
                    <div className="flex gap-1">
                        <span className="size-1.5 bg-landing-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="size-1.5 bg-landing-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="size-1.5 bg-landing-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[11px] font-semibold">Thinking...</span>
                </div>
            </div>
        </div>
    );
}
