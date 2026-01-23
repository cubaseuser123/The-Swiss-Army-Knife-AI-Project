import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatLayoutClient } from "@/components/chat/chat-layout-client";

export default async function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    return (
        <div className="fixed inset-0 z-50 bg-landing-background">
            <ChatLayoutClient>{children}</ChatLayoutClient>
        </div>
    );
}
