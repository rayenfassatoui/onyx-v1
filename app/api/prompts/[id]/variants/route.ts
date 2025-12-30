import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, vaults } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface Variant {
	title: string;
	content: string;
	description: string;
	approach: string;
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;
	const body = await request.json();
	const { count = 3, focus } = body as {
		count?: number;
		focus?: "shorter" | "detailed" | "creative" | "technical";
	};

	// Get user's vault
	const [vault] = await db
		.select()
		.from(vaults)
		.where(eq(vaults.id, session.vaultId));

	if (!vault) {
		return NextResponse.json({ error: "Vault not found" }, { status: 404 });
	}

	// Get user's API key and model
	const userApiKey = vault.openrouterApiKey;
	const userModel = vault.aiModel || "openai/gpt-4o-mini";

	// Get the prompt
	const [prompt] = await db
		.select()
		.from(prompts)
		.where(and(eq(prompts.id, id), eq(prompts.vaultId, vault.id)));

	if (!prompt) {
		return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
	}

	if (!userApiKey) {
		// Return mock variants when API key is not configured
		const mockVariants: Variant[] = [
			{
				title: "Concise Version",
				content: prompt.content.split('.').slice(0, 2).join('.') + '.',
				description: "A shorter, more focused version of the original prompt",
				approach: "Removed redundant instructions and focused on core request",
			},
			{
				title: "Detailed Version", 
				content: `${prompt.content}\n\nPlease provide:\n1. A comprehensive response\n2. Examples where applicable\n3. Step-by-step explanation if needed`,
				description: "An expanded version with more specific instructions",
				approach: "Added structured output requirements and clarifications",
			},
			{
				title: "Role-Based Version",
				content: `You are an expert assistant. ${prompt.content}\n\nRespond in a professional, helpful manner.`,
				description: "Added a clear role definition for better context",
				approach: "Defined AI role and communication style",
			},
		];

		return NextResponse.json({ 
			variants: mockVariants.slice(0, count),
			note: "These are template variants. Configure your OpenRouter API key in Settings for AI-generated variants."
		});
	}

	try {
		let focusInstruction = "";
		switch (focus) {
			case "shorter":
				focusInstruction = "Focus on making the variants more concise and efficient while preserving the core intent.";
				break;
			case "detailed":
				focusInstruction = "Focus on adding more detail, context, and specificity to improve results.";
				break;
			case "creative":
				focusInstruction = "Focus on creative approaches and unique angles while maintaining the core purpose.";
				break;
			case "technical":
				focusInstruction = "Focus on technical precision and structured outputs.";
				break;
			default:
				focusInstruction = "Create diverse variants that explore different approaches to achieving the same goal.";
		}

		const systemPrompt = `You are an expert prompt engineer. Generate ${count} alternative versions of the given prompt. ${focusInstruction}

Return your variants as a JSON array with this exact structure:
[
  {
    "title": "Variant title",
    "content": "The full variant prompt content",
    "description": "Brief description of what makes this variant different",
    "approach": "The strategy used (e.g., 'more concise', 'added examples', 'role-focused')"
  }
]

Each variant should:
1. Preserve the core intent of the original prompt
2. Be complete and ready to use
3. Have a distinct approach or improvement
4. Maintain any variable placeholders ({{variable}}) from the original`;

		const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${userApiKey}`,
				"HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
				"X-Title": "Onyx Prompt Vault",
			},
			body: JSON.stringify({
				model: userModel,
				messages: [
					{ role: "system", content: systemPrompt },
					{
						role: "user",
						content: `Generate ${count} variants of this prompt:\n\nTitle: ${prompt.title}\n\nOriginal Content:\n${prompt.content}`,
					},
				],
				temperature: 0.7,
				max_tokens: 2000,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			console.error("OpenRouter error:", error);
			return NextResponse.json(
				{ error: "Variant generation failed" },
				{ status: 500 }
			);
		}

		const data = await response.json();
		const content = data.choices[0]?.message?.content;

		if (!content) {
			return NextResponse.json(
				{ error: "No variants returned" },
				{ status: 500 }
			);
		}

		// Parse JSON from response
		let variants: Variant[];
		try {
			const jsonMatch = content.match(/\[[\s\S]*\]/);
			if (jsonMatch) {
				variants = JSON.parse(jsonMatch[0]);
			} else {
				throw new Error("No JSON array found in response");
			}
		} catch (parseError) {
			console.error("Parse error:", parseError);
			return NextResponse.json(
				{ error: "Failed to parse AI response" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ variants });
	} catch (error) {
		console.error("Variant generation error:", error);
		return NextResponse.json(
			{ error: "Variant generation failed" },
			{ status: 500 }
		);
	}
}
