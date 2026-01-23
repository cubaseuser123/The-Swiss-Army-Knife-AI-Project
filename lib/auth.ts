import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db-config";
import * as schema from "./db-schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications,
        },
    }),
    emailAndPassword: {
        enabled: true,
    },
    // TODO: Enable Google OAuth later
    // socialProviders: {
    //     google: {
    //         clientId: process.env.GOOGLE_CLIENT_ID!,
    //         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //     },
    // },
});

export type Session = typeof auth.$Infer.Session;