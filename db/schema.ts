import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	primaryKey,
} from "drizzle-orm/pg-core";

// ============================================================================
// Users
// ============================================================================

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	email: text("email").notNull().unique(),
	passcodeHash: text("passcode_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
	vault: one(vaults),
}));

// ============================================================================
// Vaults
// ============================================================================

export const vaults = pgTable("vaults", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" })
		.unique(),
	name: text("name").notNull().default("My Vault"),
	// AI Settings - stored encrypted in production
	openrouterApiKey: text("openrouter_api_key"),
	aiModel: text("ai_model").default("openai/gpt-4o-mini"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const vaultsRelations = relations(vaults, ({ one, many }) => ({
	user: one(users, {
		fields: [vaults.userId],
		references: [users.id],
	}),
	prompts: many(prompts),
	tags: many(tags),
}));

// ============================================================================
// Tags
// ============================================================================

export const tags = pgTable(
	"tags",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		vaultId: uuid("vault_id")
			.notNull()
			.references(() => vaults.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		color: text("color").notNull().default("#6366f1"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("tags_vault_id_idx").on(table.vaultId),
	],
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
	vault: one(vaults, {
		fields: [tags.vaultId],
		references: [vaults.id],
	}),
	promptTags: many(promptTags),
}));

// ============================================================================
// Prompts
// ============================================================================

export const prompts = pgTable(
	"prompts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		vaultId: uuid("vault_id")
			.notNull()
			.references(() => vaults.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		description: text("description").default(""),
		content: text("content").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("prompts_vault_id_idx").on(table.vaultId),
		index("prompts_title_idx").on(table.title),
		index("prompts_created_at_idx").on(table.createdAt),
		index("prompts_updated_at_idx").on(table.updatedAt),
	],
);

export const promptsRelations = relations(prompts, ({ one, many }) => ({
	vault: one(vaults, {
		fields: [prompts.vaultId],
		references: [vaults.id],
	}),
	versions: many(promptVersions),
	promptTags: many(promptTags),
}));

// ============================================================================
// Prompt Versions
// ============================================================================

export const promptVersions = pgTable(
	"prompt_versions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		promptId: uuid("prompt_id")
			.notNull()
			.references(() => prompts.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		description: text("description").default(""),
		content: text("content").notNull(),
		versionNumber: integer("version_number").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("prompt_versions_prompt_id_idx").on(table.promptId),
		index("prompt_versions_version_number_idx").on(table.versionNumber),
	],
);

export const promptVersionsRelations = relations(promptVersions, ({ one }) => ({
	prompt: one(prompts, {
		fields: [promptVersions.promptId],
		references: [prompts.id],
	}),
}));

// ============================================================================
// Prompt Tags (Junction Table)
// ============================================================================

export const promptTags = pgTable(
	"prompt_tags",
	{
		promptId: uuid("prompt_id")
			.notNull()
			.references(() => prompts.id, { onDelete: "cascade" }),
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
		assignedAt: timestamp("assigned_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.promptId, table.tagId] }),
		index("prompt_tags_prompt_id_idx").on(table.promptId),
		index("prompt_tags_tag_id_idx").on(table.tagId),
	],
);

export const promptTagsRelations = relations(promptTags, ({ one }) => ({
	prompt: one(prompts, {
		fields: [promptTags.promptId],
		references: [prompts.id],
	}),
	tag: one(tags, {
		fields: [promptTags.tagId],
		references: [tags.id],
	}),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Vault = typeof vaults.$inferSelect;
export type NewVault = typeof vaults.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;

export type PromptVersion = typeof promptVersions.$inferSelect;
export type NewPromptVersion = typeof promptVersions.$inferInsert;

export type PromptTag = typeof promptTags.$inferSelect;
export type NewPromptTag = typeof promptTags.$inferInsert;
