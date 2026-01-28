import { index, pgTable, serial, text, vector, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";

// Better Auth tables - use text IDs as Better Auth generates string IDs
export const users = pgTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    name: text("name").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const sessions = pgTable("sessions", {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id).notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const verifications = pgTable("verifications", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(), // Previously 'token'
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// App tables - can keep serial IDs
export const conversations = pgTable("conversations", {
    id: serial('id').primaryKey(),
    userId: text("user_id").references(() => users.id).notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});

export const messages = pgTable("messages", {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id").references(() => conversations.id),
    role: text("role").notNull(),
    content: text("content").notNull(),
    toolCalls: jsonb("tool_calls"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const embeddings = pgTable("embeddings", {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => users.id).notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    conversationId: integer("conversation_id").references(() => conversations.id),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
    index("embeddings_vextoe_idx").using(
        "hnsw",
        table.embedding.op("vector_cosine_ops")
    ),
    index("embeddings_source_idx").on(table.sourceType, table.sourceId)
])

export const workflowsRuns = pgTable("workflow_runs", {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => users.id).notNull(),
    conversationId: integer("conversation_id").references(() => conversations.id),
    workflowType: text("workflow_type").notNull(),
    status: text("status").notNull(),
    input: jsonb("input"),
    result: jsonb("result"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
});

export type InserUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type SelectConversation = typeof conversations.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type SelectMessage = typeof messages.$inferInsert;
export type InsertEmbedding = typeof embeddings.$inferInsert;
export type SelectEmbedding = typeof embeddings.$inferInsert;
