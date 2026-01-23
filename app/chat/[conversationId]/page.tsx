import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getConversation } from "@/lib/services/conversations";
import { getMessages } from "@/lib/services/messages";
import { ChatInterface } from "@/components/chat/chat-interface";

type Props = {
    params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: Props) {
    const { conversationId } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const id = parseInt(conversationId);
    if (isNaN(id)) {
        notFound();
    }

    try {
        const conversation = await getConversation(id, session.user.id);
        if (!conversation) {
            notFound();
        }

        const messages = await getMessages(id);

        return (
            <ChatInterface
                conversationId={id}
                initialMessages={messages}
                conversationTitle={conversation.title}
            />
        );
    } catch (error) {
        notFound();
    }
}
