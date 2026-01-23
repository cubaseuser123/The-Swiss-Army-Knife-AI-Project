# Phase 1: Auth Migration & Foundation

## 📦 Installations

Run these commands in the project root:

```bash
# Install Better Auth
npm install better-auth

# Install additional dependencies (if not already present)
npm install drizzle-orm@^0.45.1 @neondatabase/serverless@^1.0.2 drizzle-kit@^0.31.8
```

---

## 📁 File Directory Structure

```
rag-chatbot/
├── lib/
│   ├── auth.ts                    [NEW]
│   ├── auth-client.ts             [NEW]
│   ├── db-schema.ts               [MODIFY]
│   ├── db-config.ts               [NO CHANGE]
│   ├── services/                  [NEW DIRECTORY]
│   │   ├── conversations.ts       [NEW]
│   │   └── messages.ts            [NEW]
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/
│   │   │       └── route.ts       [NEW]
│   │   └── conversations/
│   │       └── route.ts           [NEW]
│   ├── sign-in/
│   │   └── page.tsx               [NEW]
│   ├── sign-up/
│   │   └── page.tsx               [NEW]
│   ├── layout.tsx                 [MODIFY]
│   └── page.tsx                   [MODIFY]
├── components/
│   ├── session-provider.tsx       [NEW]
│   └── navigation.tsx             [MODIFY]
```

---

## 🗑️ Removals

### 1. Uninstall Clerk
```bash
npm uninstall @clerk/nextjs
```

### 2. Remove Clerk Imports

**File: `app/layout.tsx`**
```typescript
// REMOVE THESE LINES:
import { ClerkProvider } from "@clerk/nextjs";
```

**File: `components/navigation.tsx`**
```typescript
// REMOVE THESE LINES:
import { SignOutButton, SignedIn } from '@clerk/nextjs';
```

---

## ✏️ Modifications

### 1. Database Schema (`lib/db-schema.ts`)

**BEFORE:**
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { index, pgTable, serial, text, vector } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
},
    (table) => [
        index("embeddingIndex").using(
            "hnsw",
            table.embedding.op("vector_cosine_ops")
        ),
    ]
);

export type InsertDocument = typeof documents.$inferInsert;
export type SelectDocument = typeof documents.$inferSelect;
```

**AFTER:**
```typescript
import { index, pgTable, serial, text, vector, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

// Better Auth Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversations & Messages
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: serial("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rename documents → embeddings with new schema
export const embeddings = pgTable("embeddings", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 768 }),
  sourceType: text("source_type").notNull(), // 'document' | 'message'
  sourceId: serial("source_id").notNull(),
  conversationId: serial("conversation_id").references(() => conversations.id),
  metadata: jsonb("metadata"), // { filename, conversationTitle, date, etc }
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("embeddings_vector_idx").using(
    "hnsw",
    table.embedding.op("vector_cosine_ops")
  ),
  index("embeddings_user_idx").on(table.userId),
]);

// Workflow runs for LangGraph agents
export const workflowRuns = pgTable("workflow_runs", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  conversationId: serial("conversation_id").references(() => conversations.id),
  workflowType: text("workflow_type").notNull(), // 'research' | 'meeting_prep'
  status: text("status").notNull().default("running"), // 'running' | 'completed' | 'failed'
  input: jsonb("input").notNull(),
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Type exports
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type SelectConversation = typeof conversations.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type SelectMessage = typeof messages.$inferSelect;
export type InsertEmbedding = typeof embeddings.$inferInsert;
export type SelectEmbedding = typeof embeddings.$inferSelect;
```

---

### 2. App Layout (`app/layout.tsx`)

**BEFORE:**
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Navigation } from "@/components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Navigation />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

**AFTER:**
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { SessionProvider } from "@/components/session-provider";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swiss Army Knife AI",
  description: "Your personal AI productivity workspace",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider session={session}>
          <Navigation />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

### 3. Landing Page (`app/page.tsx`)

**BEFORE:**
```typescript
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold">Welcome to Rag Chatbot</h1>
        <p className="text-xl text-muted-foreground">
          Your personal assistant for document analysis. Sign in to start chatting or upload your documents.
        </p>
        <div className="flex gap-4 justify-center">
          <SignedOut>
            <SignInButton>
              <Button size="lg">Sign In</Button>
            </SignInButton>
            <SignUpButton>
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
```

**AFTER:**
```typescript
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold">Welcome to Swiss Army Knife AI</h1>
        <p className="text-xl text-muted-foreground">
          Your personal AI productivity workspace. Chat with documents, use 27+ tools, and let AI agents handle complex workflows.
        </p>
        <div className="flex gap-4 justify-center">
          {session ? (
            <Link href="/chat">
              <Button size="lg">Go to Chat</Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <Button size="lg">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline" size="lg">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Navigation Component (`components/navigation.tsx`)

**BEFORE:**
```typescript
import {
    SignOutButton,
    SignedIn,
} from '@clerk/nextjs';
import { Button } from './ui/button';

export const Navigation = () => {
    return (
        <nav className='border-b border-[var(--foreground)]/10"'>
            <div className='flex container h-16 items-center justify-between px-4 mx-auto'>
                <div className='text-xl font-semibold'>Rag Chatbot</div>

                <div className='flex gap-2'>
                    {/* SignedOut buttons removed as they are on the landing page */}

                    <SignedIn>
                        <SignOutButton>
                            <Button variant='outline'>Sign out</Button>
                        </SignOutButton>
                    </SignedIn>
                </div>

            </div>
        </nav>
    )
}
```

**AFTER:**
```typescript
"use client";

import { Button } from './ui/button';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

export const Navigation = () => {
    const { data: session, isPending } = useSession();

    const handleSignOut = async () => {
        const { signOut } = await import('@/lib/auth-client');
        await signOut();
    };

    return (
        <nav className='border-b border-[var(--foreground)]/10'>
            <div className='flex container h-16 items-center justify-between px-4 mx-auto'>
                <Link href="/" className='text-xl font-semibold'>
                    Swiss Army Knife AI
                </Link>

                <div className='flex gap-2 items-center'>
                    {!isPending && (
                        <>
                            {session ? (
                                <>
                                    <span className="text-sm text-muted-foreground">
                                        {session.user.email}
                                    </span>
                                    <Button onClick={handleSignOut} variant='outline'>
                                        Sign Out
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Link href="/sign-in">
                                        <Button variant='outline'>Sign In</Button>
                                    </Link>
                                    <Link href="/sign-up">
                                        <Button>Sign Up</Button>
                                    </Link>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
```

---

## ✨ New Code

### 1. Better Auth Server Config (`lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db-config";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

---

### 2. Better Auth Client (`lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;
```

---

### 3. Session Provider (`components/session-provider.tsx`)

> [!NOTE]
> Better Auth does NOT export a `SessionProvider` from `"better-auth/react"`. We use React's `createContext` to pass the server-fetched session to client components. For client-side reactive session state, use `useSession` from `@/lib/auth-client`.

```typescript
"use client";

import React, { createContext, useContext } from "react";
import type { Session } from "@/lib/auth";

const SessionContext = createContext<Session | null>(null);

// Hook to access server-fetched session in client components
export function useServerSession() {
  return useContext(SessionContext);
}

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}
```

---

### 4. Auth API Route (`app/api/auth/[...all]/route.ts`)

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

---

### 5. Sign In Page (`app/sign-in/page.tsx`)

> [!TIP]
> Uses shadcn/ui Card, Label, Input, and Button components. Install them with:
> `npx shadcn@latest add card label input button`

```typescript
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
      await signIn.email({
        email,
        password,
      });
      router.push("/chat");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/chat",
      });
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Welcome back to Swiss Army Knife AI</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={loading}>
            Google
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-primary hover:underline">Sign up</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

### 6. Sign Up Page (`app/sign-up/page.tsx`)

> [!TIP]
> Uses the same shadcn/ui components as Sign In page.

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
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

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signUp.email({
        email,
        password,
        name,
      });
      router.push("/chat");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Create your Swiss Army Knife AI account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

### 7. Conversations Service (`lib/services/conversations.ts`)

```typescript
import { db } from "@/lib/db-config";
import { conversations, type InsertConversation } from "@/lib/db-schema";
import { eq, desc } from "drizzle-orm";

export async function createConversation(userId: number, title: string = "New Chat") {
  const [conversation] = await db
    .insert(conversations)
    .values({ userId, title })
    .returning();
  
  return conversation;
}

export async function getConversations(userId: number) {
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversation(id: number, userId: number) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  
  if (conversation && conversation.userId !== userId) {
    throw new Error("Unauthorized");
  }
  
  return conversation;
}

export async function updateConversationTitle(id: number, title: string) {
  const [updated] = await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(conversations.id, id))
    .returning();
  
  return updated;
}

export async function deleteConversation(id: number, userId: number) {
  const conversation = await getConversation(id, userId);
  
  await db
    .delete(conversations)
    .where(eq(conversations.id, id));
  
  return conversation;
}
```

---

### 8. Messages Service (`lib/services/messages.ts`)

```typescript
import { db } from "@/lib/db-config";
import { messages, type InsertMessage } from "@/lib/db-schema";
import { eq, desc } from "drizzle-orm";

export async function saveMessage(message: InsertMessage) {
  const [saved] = await db
    .insert(messages)
    .values(message)
    .returning();
  
  return saved;
}

export async function getMessages(conversationId: number) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}
```

---

### 9. Conversations API (`app/api/conversations/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createConversation, getConversations } from "@/lib/services/conversations";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await getConversations(session.user.id);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await createConversation(session.user.id);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
```

---

## 🔧 Environment Variables

Add these to your `.env.local`:

```bash
# Existing
NEON_DATABASE_URL=your_existing_neon_url

# New - Better Auth
NEXT_PUBLIC_APP_URL=http://localhost:3000

# New - Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Existing - Keep this
GOOGLE_API_KEY=your_google_api_key
```

---

## 🚀 Migration Steps

1. **Install dependencies:**
   ```bash
   npm install better-auth
   npm uninstall @clerk/nextjs
   ```

2. **Update database schema** (copy new schema to `lib/db-schema.ts`)

3. **Run migrations:**
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit push
   ```

4. **Create all new files** as listed in "New Code" section

5. **Update existing files** as listed in "Modifications" section

6. **Remove Clerk code** as listed in "Removals" section

7. **Test:**
   - Sign up with email/password
   - Sign in
   - Verify session persists
   - Check Neon DB has user data

---

## ✅ Verification Checklist

- [ ] Better Auth installed
- [ ] Clerk uninstalled
- [ ] Database schema updated
- [ ] Migrations run successfully
- [ ] Sign up page works
- [ ] Sign in page works
- [ ] Google OAuth works (if configured)
- [ ] Session persists across page refreshes
- [ ] User data appears in Neon DB
- [ ] Navigation shows user email when signed in
- [ ] Sign out works
