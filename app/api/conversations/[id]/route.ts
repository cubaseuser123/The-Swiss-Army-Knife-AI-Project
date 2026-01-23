import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { deleteConversation, updateConversation } from "@/lib/services/conversations";

type Props = {
    params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, { params }: Props) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const conversationId = parseInt(id, 10);

        if (isNaN(conversationId)) {
            return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
        }

        await deleteConversation(conversationId, session.user.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        if (error instanceof Error && error.message === "Conversation not found") {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request, { params }: Props) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const conversationId = parseInt(id, 10);

        if (isNaN(conversationId)) {
            return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
        }

        const body = await request.json();
        const { title } = body;

        if (!title || typeof title !== "string") {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const updated = await updateConversation(conversationId, session.user.id, title.trim());

        if (!updated) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating conversation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
