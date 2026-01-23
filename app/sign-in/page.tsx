"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

import { BackgroundGrid } from "@/components/ui/background-grid";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signIn.email({ email, password });
            router.push("/chat");
        } catch (err: any) {
            setError(err.message || "Failed to sign in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 text-landing-text-main selection:bg-landing-primary selection:text-landing-surface relative overflow-hidden">
            <BackgroundGrid />
            <Card className="w-full max-w-md bg-landing-surface border-2 border-landing-text-main shadow-[8px_8px_0px_0px_#121212] relative z-10">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-display font-bold text-landing-text-main">Sign In</CardTitle>
                    <CardDescription className="text-landing-text-muted font-body">Welcome back to Swiss Army Knife AI</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm font-mono-custom border border-destructive/20">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-display font-bold">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="bg-landing-background border-landing-border focus:ring-landing-primary font-mono-custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="font-display font-bold">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="bg-landing-background border-landing-border focus:ring-landing-primary font-mono-custom"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-landing-text-main text-landing-surface hover:bg-landing-primary font-bold shadow-md transition-all" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t border-landing-border/20 pt-6">
                    <p className="text-sm text-landing-text-muted font-mono-custom">
                        Don't have an account?{" "}
                        <Link href="/sign-up" className="text-landing-primary hover:text-landing-text-main font-bold hover:underline transition-colors">Sign up</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
