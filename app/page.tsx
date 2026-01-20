import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Welcome to Rag Chatbot
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
          Your personal assistant for document analysis. Sign in to start chatting or upload your documents.
        </p>

        <div className="flex gap-4 justify-center">
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="lg">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="outline" size="lg">Sign Up</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/chat">
              <Button size="lg">Go to Chat</Button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}