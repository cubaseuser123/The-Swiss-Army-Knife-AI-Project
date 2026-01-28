"use client";

import { useState, useRef } from "react";
import { MessageSquare, Sparkles, Paperclip, Loader2, Send } from "lucide-react";
import { processProcessedFile } from "./actions";
import { toast } from "sonner";
// Assuming sonner or similar is used, if not we will use simple alert or add it. 
// Given the project seems to have consistent UI components, I'll attempt to use standard UI if available, 
// or minimal state if not. The previous page used Alert/AlertTitle, but toast is better for chat.
// I will check if 'sonner' or 'react-hot-toast' is in package.json later, for now I'll use local state for messages if needed.
// Actually, I'll use the existing Alert/Card pattern if I must, but for chat, inline feedback is best.
// I'll stick to simple state for now to be safe.

export default function ChatPage() {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await processProcessedFile(formData);

            if (result.success) {
                // simple alert for now, ideally upgrade to toast
                alert(result.message || "File uploaded successfully!");
            } else {
                alert(result.error || "Failed to upload file.");
            }
        } catch (error) {
            console.error("Upload error", error);
            alert("An error occurred during upload.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full relative">
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

            {/* Main Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto">
                {/* Empty State */}
                <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-12 px-6">
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
                        Upload documents or start typing to begin.
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

            {/* Input Area - Fixed at bottom */}
            <div className="p-4 border-t border-landing-border/50 bg-background/80 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto flex items-end gap-2 bg-landing-surface border border-landing-border/50 rounded-xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-landing-primary/20 transition-all">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={`p-2 rounded-lg hover:bg-landing-text-main/5 text-landing-text-muted transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Upload PDF"
                    >
                        {isUploading ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : (
                            <Paperclip className="size-5" />
                        )}
                    </button>

                    <textarea
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-2 text-sm text-landing-text-main placeholder:text-landing-text-muted/50"
                        placeholder="Type a message..."
                        rows={1}
                    />

                    <button
                        className="p-2 rounded-lg bg-landing-primary text-white hover:bg-landing-primary/90 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Send className="size-4" />
                    </button>
                </div>
                <div className="max-w-3xl mx-auto mt-2 text-center">
                    <p className="text-[10px] text-landing-text-muted">
                        AI can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>
    );
}
