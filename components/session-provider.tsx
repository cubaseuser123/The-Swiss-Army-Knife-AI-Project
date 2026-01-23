"use client";

import React, { createContext, useContext } from "react";
import type { Session } from "@/lib/auth";

const SessionContext = createContext<Session | null>(null);

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
