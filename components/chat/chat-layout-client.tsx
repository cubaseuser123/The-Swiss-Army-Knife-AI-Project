"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft, Home, LogOut, ChevronUp, Loader2, Pencil, Check, X } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Conversation = {
    id: number;
    title: string;
    createdAt: string;
    updatedAt: string;
};

type ChatContextType = {
    conversations: Conversation[];
    isLoading: boolean;
    refreshConversations: () => Promise<void>;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChatContext must be used within ChatLayoutClient");
    }
    return context;
}

export function ChatLayoutClient({ children }: { children: ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [userDrawerOpen, setUserDrawerOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const editInputRef = useRef<HTMLInputElement>(null);
    const pathname = usePathname();
    const router = useRouter();
    const currentConversationId = pathname.match(/\/chat\/(\d+)/)?.[1];
    const [chatToDelete, setChatToDelete] = useState<number | null>(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingId]);

    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = async () => {
        setIsCreating(true);
        try {
            const res = await fetch('/api/conversations', { method: 'POST' });
            if (res.ok) {
                const conversation = await res.json();
                setConversations(prev => [conversation, ...prev]);
                router.push(`/chat/${conversation.id}`);
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        setChatToDelete(id);
    };

    const handleConfirmDelete = async () => {
        if (!chatToDelete) return;

        try {
            const res = await fetch(`/api/conversations/${chatToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                setConversations(prev => prev.filter(c => c.id !== chatToDelete));
                if (currentConversationId === chatToDelete.toString()) {
                    router.push('/chat');
                }
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        } finally {
            setChatToDelete(null);
        }
    };

    const handleStartEdit = (e: React.MouseEvent, conv: Conversation) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingId(conv.id);
        setEditingTitle(conv.title);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingTitle("");
    };

    const handleSaveEdit = async (e: React.MouseEvent | React.FormEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (!editingTitle.trim()) {
            handleCancelEdit();
            return;
        }

        try {
            const res = await fetch(`/api/conversations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editingTitle.trim() }),
            });
            if (res.ok) {
                const updated = await res.json();
                setConversations(prev => prev.map(c => c.id === id ? updated : c));
            }
        } catch (error) {
            console.error('Error renaming conversation:', error);
        } finally {
            handleCancelEdit();
        }
    };

    const handleEditKeyDown = (e: React.KeyboardEvent, id: number) => {
        if (e.key === 'Enter') {
            handleSaveEdit(e, id);
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    const handleLogout = async () => {
        const { signOut } = await import('@/lib/auth-client');
        await signOut();
        router.push('/');
    };

    return (
        <ChatContext.Provider value={{ conversations, isLoading, refreshConversations: fetchConversations }}>
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <aside className={cn(
                    "bg-landing-surface-alt border-r border-landing-border flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out",
                    sidebarCollapsed ? "w-16" : "w-64"
                )}>
                    {/* Logo & Toggle */}
                    <div className="p-4 flex items-center justify-between">
                        <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center w-full")}>
                            <div className="size-8 bg-landing-text-main rounded-md flex items-center justify-center shadow-md shrink-0">
                                <svg className="size-4 text-landing-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2" />
                                    <path d="M18 6h.01" />
                                    <path d="M6 18h.01" />
                                    <path d="M20.83 8.83a4 4 0 0 0-5.66-5.66l-12 12a4 4 0 1 0 5.66 5.66Z" />
                                    <path d="M18 11.66V22a4 4 0 0 0 4-4V6" />
                                </svg>
                            </div>
                            {!sidebarCollapsed && (
                                <div className="flex flex-col">
                                    <span className="font-bold tracking-tight text-landing-text-main leading-none text-sm">
                                        SWISS ARMY
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-landing-text-main/50 leading-none mt-0.5">
                                        Knife AI
                                    </span>
                                </div>
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <button
                                onClick={() => setSidebarCollapsed(true)}
                                className="p-1.5 rounded-md hover:bg-landing-text-main/10 text-landing-text-main/50 hover:text-landing-text-main transition-colors"
                            >
                                <PanelLeftClose className="size-4" />
                            </button>
                        )}
                    </div>

                    {/* New Chat Button */}
                    <div className={cn("px-3 mb-6", sidebarCollapsed && "px-2")}>
                        <button
                            onClick={handleNewChat}
                            disabled={isCreating}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 bg-landing-primary text-white hover:brightness-110 transition-all rounded-md font-semibold text-xs shadow-blocky-dark btn-press disabled:opacity-50 disabled:cursor-not-allowed",
                                sidebarCollapsed ? "p-2.5" : "py-2.5 px-4"
                            )}
                        >
                            {isCreating ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Plus className="size-4" />
                            )}
                            {!sidebarCollapsed && <span>{isCreating ? "Creating..." : "New Chat"}</span>}
                        </button>
                    </div>

                    {/* Conversation List */}
                    <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1">
                        {!sidebarCollapsed && conversations.length > 0 && (
                            <div className="px-2 py-2 text-[9px] font-bold uppercase tracking-widest text-landing-text-main/40">
                                Recent
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="size-4 animate-spin text-landing-text-main/40" />
                            </div>
                        ) : conversations.length === 0 ? (
                            !sidebarCollapsed && (
                                <div className="px-2 py-4 text-[11px] text-landing-text-main/40 text-center">
                                    No conversations yet
                                </div>
                            )
                        ) : (
                            conversations.map((conv) => (
                                editingId === conv.id ? (
                                    // Editing mode
                                    <div
                                        key={conv.id}
                                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-landing-text-main/10"
                                    >
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onKeyDown={(e) => handleEditKeyDown(e, conv.id)}
                                            className="flex-1 bg-landing-surface border border-landing-border rounded px-2 py-1 text-[13px] text-landing-text-main focus:outline-none focus:border-landing-primary"
                                        />
                                        <button
                                            onClick={(e) => handleSaveEdit(e, conv.id)}
                                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                        >
                                            <Check className="size-3.5" />
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-1 text-landing-text-main/50 hover:bg-landing-text-main/10 rounded transition-colors"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    // Normal mode
                                    <Link
                                        key={conv.id}
                                        href={`/chat/${conv.id}`}
                                        className={cn(
                                            "group relative flex items-center gap-2.5 rounded-md text-sm cursor-pointer transition-colors",
                                            sidebarCollapsed ? "justify-center p-2.5" : "px-2.5 py-2",
                                            currentConversationId === conv.id.toString()
                                                ? "bg-landing-text-main/10 text-landing-text-main"
                                                : "text-landing-text-main/60 hover:bg-landing-text-main/5 hover:text-landing-text-main"
                                        )}
                                        title={sidebarCollapsed ? conv.title : undefined}
                                    >
                                        <MessageSquare className="size-4 shrink-0" />
                                        {!sidebarCollapsed && (
                                            <>
                                                <span className={cn(
                                                    "truncate text-[13px] flex-1",
                                                    currentConversationId === conv.id.toString() && "font-medium"
                                                )}>
                                                    {conv.title}
                                                </span>
                                                <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleStartEdit(e, conv)}
                                                        className="p-1 hover:text-landing-primary rounded transition-colors"
                                                    >
                                                        <Pencil className="size-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, conv.id)}
                                                        className="p-1 hover:text-red-500 rounded transition-colors"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </Link>
                                )
                            ))
                        )}
                    </nav>

                    {/* User Profile */}
                    <div className={cn("border-t border-landing-border mt-auto relative", sidebarCollapsed ? "p-2" : "p-3")}>
                        {/* User Drawer */}
                        {userDrawerOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setUserDrawerOpen(false)}
                                />
                                <div className={cn(
                                    "absolute bottom-full left-0 right-0 mb-2 bg-landing-surface border border-landing-border rounded-lg shadow-xl z-50 overflow-hidden",
                                    sidebarCollapsed ? "mx-1" : "mx-2"
                                )}>
                                    <div className="p-1">
                                        <Link
                                            href="/"
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-landing-text-main hover:bg-landing-text-main/5 transition-colors"
                                            onClick={() => setUserDrawerOpen(false)}
                                        >
                                            <Home className="size-4 text-landing-text-main/60" />
                                            {!sidebarCollapsed && <span>Back to Home</span>}
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="size-4" />
                                            {!sidebarCollapsed && <span>Log out</span>}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            onClick={() => setUserDrawerOpen(!userDrawerOpen)}
                            className={cn(
                                "w-full flex items-center gap-2.5 rounded-md hover:bg-landing-text-main/5 cursor-pointer transition-colors",
                                sidebarCollapsed ? "justify-center p-2" : "p-2",
                                userDrawerOpen && "bg-landing-text-main/5"
                            )}
                        >
                            <div className="size-7 rounded-md bg-landing-text-main flex items-center justify-center font-bold text-[10px] text-landing-primary shadow-sm shrink-0">
                                U
                            </div>
                            {!sidebarCollapsed && (
                                <>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[13px] font-semibold text-landing-text-main truncate">User</p>
                                        <p className="text-[9px] text-landing-text-main/50 font-medium uppercase tracking-wider">Free Plan</p>
                                    </div>
                                    <ChevronUp className={cn(
                                        "size-4 text-landing-text-main/40 transition-transform",
                                        userDrawerOpen && "rotate-180"
                                    )} />
                                </>
                            )}
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col bg-gradient-to-br from-landing-background via-landing-background to-landing-background-lighter overflow-hidden">
                    {/* Toggle button when collapsed */}
                    {sidebarCollapsed && (
                        <div className="absolute top-4 left-20 z-10">
                            <button
                                onClick={() => setSidebarCollapsed(false)}
                                className="p-1.5 rounded-md bg-landing-surface border border-landing-border shadow-sm hover:bg-landing-text-main/5 text-landing-text-main/50 hover:text-landing-text-main transition-colors"
                            >
                                <PanelLeft className="size-4" />
                            </button>
                        </div>
                    )}
                    {children}
                </main>
            </div>

            <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this conversation? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setChatToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ChatContext.Provider >
    );
}
