import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, vaults } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface AnalysisResult {
	clarity: {
		score: number;
		suggestions: string[];
	};
	structure: {
		score: number;
		suggestions: string[];
	};
	specificity: {
		score: number;
		suggestions: string[];
	};
	constraints: {
		present: boolean;
		suggestions: string[];
	};
	roleDefinition: {
		present: boolean;
		suggestions: string[];
	};
	overallScore: number;
	summary: string;
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

	// Get user's vault with AI settings
	const [vault] = await db
		.select()
		.from(vaults)
		.where(eq(vaults.id, session.vaultId));

	if (!vault) {
		return NextResponse.json({ error: "Vault not found" }, { status: 404 });
	}

	// Get the prompt
	const [prompt] = await db
		.select()
		.from(prompts)
		.where(and(eq(prompts.id, id), eq(prompts.vaultId, vault.id)));

	if (!prompt) {
		return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
	}

	// Check if user has configured their API key
	if (!vault.openrouterApiKey) {
		// Return a basic analysis without AI when API key is not configured
		const basicAnalysis: AnalysisResult = {
			clarity: {
				score: 7,
				suggestions: [
					"Consider being more specific about the expected output format",
					"Add examples to clarify your expectations",
				],
			},
			structure: {
				score: 7,
				suggestions: [
					"Consider breaking down complex instructions into numbered steps",
					"Use clear section headers for different parts of the prompt",
				],
			},
			specificity: {
				score: 6,
				suggestions: [
					"Add more context about your specific use case",
					"Define any technical terms or jargon",
				],
			},
			constraints: {
				present: prompt.content.toLowerCase().includes("must") || prompt.content.toLowerCase().includes("should"),
				suggestions: [
					"Add constraints like word limits or format requirements",
					"Specify what the response should NOT include",
				],
			},
			roleDefinition: {
				present: prompt.content.toLowerCase().includes("you are") || prompt.content.toLowerCase().includes("act as"),
				suggestions: [
					"Define a clear role for the AI (e.g., 'You are an expert...')",
					"Specify the expertise level and perspective",
				],
			},
			overallScore: 7,
			summary: "This is a basic analysis. Add your OpenRouter API key in Settings to enable AI-powered detailed analysis.",
		};

		return NextResponse.json({ analysis: basicAnalysis });
	}

	// Use user's API key and model
	const userApiKey = vault.openrouterApiKey;
	const userModel = vault.aiModel || "openai/gpt-4o-mini";

	try {
		const systemPrompt = `You are an expert prompt engineer. Analyze the following prompt template and provide detailed feedback. Return your analysis as a JSON object with this exact structure:
{
  "clarity": {
    "score": <1-10>,
    "suggestions": ["suggestion1", "suggestion2"]
  },
  "structure": {
    "score": <1-10>,
    "suggestions": ["suggestion1", "suggestion2"]
  },
  "specificity": {
    "score": <1-10>,
    "suggestions": ["suggestion1", "suggestion2"]
  },
  "constraints": {
    "present": <true/false>,
    "suggestions": ["suggestion1", "suggestion2"]
  },
  "roleDefinition": {
    "present": <true/false>,
    "suggestions": ["suggestion1", "suggestion2"]
  },
  "overallScore": <1-10>,
  "summary": "Brief overall assessment"
}

Evaluate:
- Clarity: How clear and unambiguous is the prompt?
- Structure: Is the prompt well-organized with clear sections?
- Specificity: Does the prompt provide enough specific details?
- Constraints: Does the prompt define boundaries and limitations?
- Role Definition: Does the prompt clearly define the AI's role?

Be constructive and specific in your suggestions.`;

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
						content: `Analyze this prompt:\n\nTitle: ${prompt.title}\n\nContent:\n${prompt.content}`,
					},
				],
				temperature: 0.3,
				max_tokens: 1000,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			console.error("OpenRouter error:", error);
			return NextResponse.json(
				{ error: "AI analysis failed" },
				{ status: 500 }
			);
		}

		const data = await response.json();
		const content = data.choices[0]?.message?.content;

		if (!content) {
			return NextResponse.json(
				{ error: "No analysis returned" },
				{ status: 500 }
			);
		}

		// Parse JSON from response (handle potential markdown code blocks)
		let analysis: AnalysisResult;
		try {
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				analysis = JSON.parse(jsonMatch[0]);
			} else {
				throw new Error("No JSON found in response");
			}
		} catch (parseError) {
			console.error("Parse error:", parseError);
			return NextResponse.json(
				{ error: "Failed to parse AI response" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ analysis });
	} catch (error) {
		console.error("AI analysis error:", error);
		return NextResponse.json(
			{ error: "AI analysis failed" },
			{ status: 500 }
		);
	}
}
