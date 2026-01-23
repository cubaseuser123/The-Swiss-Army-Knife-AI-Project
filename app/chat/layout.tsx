import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check authentication
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    // This layout uses fixed positioning to cover the root navbar
    return (
        <div className="fixed inset-0 z-50 bg-landing-background">
            {children}
        </div>
    );
}
