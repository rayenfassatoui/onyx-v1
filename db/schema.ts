import { relations } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	json,
	pgTable,
	text,
	timestamp,
	uuid,
	primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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

export const usersRelations = relations(users, ({ one, many }) => ({
	vault: one(vaults),
	groupMemberships: many(groupMembers),
	notifications: many(notifications),
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
	recentAiModels: json("recent_ai_models").$type<string[]>().default([]),
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
	shares: many(sharedPrompts),
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
// Groups
// ============================================================================

export const groups = pgTable(
	"groups",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: text("name").notNull(),
		description: text("description"),
		creatorId: uuid("creator_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("groups_creator_id_idx").on(table.creatorId),
	],
);

export const groupsRelations = relations(groups, ({ one, many }) => ({
	creator: one(users, {
		fields: [groups.creatorId],
		references: [users.id],
	}),
	members: many(groupMembers),
	sharedPrompts: many(sharedPrompts),
}));

// ============================================================================
// Group Members (Junction Table)
// ============================================================================

export const groupMembers = pgTable(
	"group_members",
	{
		groupId: uuid("group_id")
			.notNull()
			.references(() => groups.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: text("role").notNull().default("member"), // 'admin' or 'member'
		joinedAt: timestamp("joined_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.groupId, table.userId] }),
		index("group_members_group_id_idx").on(table.groupId),
		index("group_members_user_id_idx").on(table.userId),
	],
);

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
	group: one(groups, {
		fields: [groupMembers.groupId],
		references: [groups.id],
	}),
	user: one(users, {
		fields: [groupMembers.userId],
		references: [users.id],
	}),
}));

// ============================================================================
// Shared Prompts
// ============================================================================

export const sharedPrompts = pgTable(
	"shared_prompts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		promptId: uuid("prompt_id")
			.notNull()
			.references(() => prompts.id, { onDelete: "cascade" }),
		sharedById: uuid("shared_by_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		sharedWithUserId: uuid("shared_with_user_id")
			.references(() => users.id, { onDelete: "cascade" }),
		sharedWithGroupId: uuid("shared_with_group_id")
			.references(() => groups.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("shared_prompts_prompt_id_idx").on(table.promptId),
		index("shared_prompts_shared_by_id_idx").on(table.sharedById),
		index("shared_prompts_shared_with_user_id_idx").on(table.sharedWithUserId),
		index("shared_prompts_shared_with_group_id_idx").on(table.sharedWithGroupId),
		// Constraint: Either sharedWithUserId OR sharedWithGroupId must be set, not both
		check(
			"share_target_check",
			sql`(shared_with_user_id IS NOT NULL AND shared_with_group_id IS NULL) OR (shared_with_user_id IS NULL AND shared_with_group_id IS NOT NULL)`
		),
	],
);

export const sharedPromptsRelations = relations(sharedPrompts, ({ one }) => ({
	prompt: one(prompts, {
		fields: [sharedPrompts.promptId],
		references: [prompts.id],
	}),
	sharedBy: one(users, {
		fields: [sharedPrompts.sharedById],
		references: [users.id],
	}),
	sharedWithUser: one(users, {
		fields: [sharedPrompts.sharedWithUserId],
		references: [users.id],
	}),
	sharedWithGroup: one(groups, {
		fields: [sharedPrompts.sharedWithGroupId],
		references: [groups.id],
	}),
}));

// ============================================================================
// Notifications
// ============================================================================

export const notifications = pgTable(
	"notifications",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: text("type").notNull(), // 'prompt_shared', 'group_invite', etc.
		title: text("title").notNull(),
		message: text("message"),
		metadata: json("metadata").$type<Record<string, unknown>>(),
		read: boolean("read").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("notifications_user_id_idx").on(table.userId),
		index("notifications_user_id_read_idx").on(table.userId, table.read),
		index("notifications_created_at_idx").on(table.createdAt),
	],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
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

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;

export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;

export type SharedPrompt = typeof sharedPrompts.$inferSelect;
export type NewSharedPrompt = typeof sharedPrompts.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
