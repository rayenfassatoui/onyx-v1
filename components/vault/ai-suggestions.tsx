"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Sparkles,
	Loader2,
	CheckCircle2,
	AlertCircle,
	Lightbulb,
	Target,
	Layout,
	Shield,
	User,
	RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
	clarity: { score: number; suggestions: string[] };
	structure: { score: number; suggestions: string[] };
	specificity: { score: number; suggestions: string[] };
	constraints: { present: boolean; suggestions: string[] };
	roleDefinition: { present: boolean; suggestions: string[] };
	overallScore: number;
	summary: string;
}

interface Variant {
	title: string;
	content: string;
	description: string;
	approach: string;
}

interface AISuggestionsProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	promptId: string;
	promptTitle: string;
	promptContent: string;
	onApplyVariant: (content: string) => void;
}

export function AISuggestions({
	open,
	onOpenChange,
	promptId,
	promptTitle,
	promptContent,
	onApplyVariant,
}: AISuggestionsProps) {
	const [activeTab, setActiveTab] = React.useState("analysis");
	const [isAnalyzing, setIsAnalyzing] = React.useState(false);
	const [isGenerating, setIsGenerating] = React.useState(false);
	const [analysis, setAnalysis] = React.useState<AnalysisResult | null>(null);
	const [variants, setVariants] = React.useState<Variant[]>([]);
	const [selectedVariant, setSelectedVariant] = React.useState<number | null>(null);

	const runAnalysis = async () => {
		setIsAnalyzing(true);
		setAnalysis(null);

		try {
			const res = await fetch(`/api/prompts/${promptId}/analyze`, {
				method: "POST",
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Analysis failed");
			}

			const data = await res.json();
			setAnalysis(data.analysis);
		} catch (error) {
			console.error("Analysis error:", error);
			toast.error(error instanceof Error ? error.message : "Analysis failed");
		} finally {
			setIsAnalyzing(false);
		}
	};

	const generateVariants = async (focus?: string) => {
		setIsGenerating(true);
		setVariants([]);

		try {
			const res = await fetch(`/api/prompts/${promptId}/variants`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ count: 3, focus }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Generation failed");
			}

			const data = await res.json();
			setVariants(data.variants);
		} catch (error) {
			console.error("Variant error:", error);
			toast.error(error instanceof Error ? error.message : "Generation failed");
		} finally {
			setIsGenerating(false);
		}
	};

	React.useEffect(() => {
		if (open && !analysis && !isAnalyzing) {
			runAnalysis();
		}
	}, [open]);

	const getScoreColor = (score: number) => {
		if (score >= 8) return "text-green-500";
		if (score >= 6) return "text-yellow-500";
		return "text-red-500";
	};

	const getScoreBg = (score: number) => {
		if (score >= 8) return "bg-green-500";
		if (score >= 6) return "bg-yellow-500";
		return "bg-red-500";
	};

	const handleApplyVariant = () => {
		if (selectedVariant !== null && variants[selectedVariant]) {
			onApplyVariant(variants[selectedVariant].content);
			toast.success("Variant applied - remember to save!");
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xl max-h-[70vh]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />
						AI Assistant
					</DialogTitle>
					<DialogDescription>
						Get AI-powered analysis and suggestions for "{promptTitle}"
					</DialogDescription>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="analysis">Analysis</TabsTrigger>
						<TabsTrigger value="variants">Variants</TabsTrigger>
					</TabsList>

					<TabsContent value="analysis" className="mt-4">
						{isAnalyzing ? (
							<div className="flex flex-col items-center justify-center py-12">
								<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
								<p className="text-sm text-muted-foreground">Analyzing prompt...</p>
							</div>
						) : analysis ? (
							<ScrollArea className="h-[400px] pr-4">
								<div className="space-y-6">
									{/* Overall Score */}
									<div className="text-center p-4 rounded-lg bg-muted">
										<div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
											{analysis.overallScore}/10
										</div>
										<p className="text-sm text-muted-foreground mt-1">Overall Score</p>
									</div>

									<p className="text-sm">{analysis.summary}</p>

									<Separator />

									{/* Clarity */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Lightbulb className="h-4 w-4" />
												<span className="font-medium">Clarity</span>
											</div>
											<Badge variant="outline" className={getScoreColor(analysis.clarity.score)}>
												{analysis.clarity.score}/10
											</Badge>
										</div>
										<Progress value={analysis.clarity.score * 10} className="h-2" />
										{analysis.clarity.suggestions.length > 0 && (
											<ul className="text-sm text-muted-foreground space-y-1 mt-2">
												{analysis.clarity.suggestions.map((s, i) => (
													<li key={i} className="flex items-start gap-2">
														<span className="text-primary">•</span>
														{s}
													</li>
												))}
											</ul>
										)}
									</div>

									{/* Structure */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Layout className="h-4 w-4" />
												<span className="font-medium">Structure</span>
											</div>
											<Badge variant="outline" className={getScoreColor(analysis.structure.score)}>
												{analysis.structure.score}/10
											</Badge>
										</div>
										<Progress value={analysis.structure.score * 10} className="h-2" />
										{analysis.structure.suggestions.length > 0 && (
											<ul className="text-sm text-muted-foreground space-y-1 mt-2">
												{analysis.structure.suggestions.map((s, i) => (
													<li key={i} className="flex items-start gap-2">
														<span className="text-primary">•</span>
														{s}
													</li>
												))}
											</ul>
										)}
									</div>

									{/* Specificity */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Target className="h-4 w-4" />
												<span className="font-medium">Specificity</span>
											</div>
											<Badge variant="outline" className={getScoreColor(analysis.specificity.score)}>
												{analysis.specificity.score}/10
											</Badge>
										</div>
										<Progress value={analysis.specificity.score * 10} className="h-2" />
										{analysis.specificity.suggestions.length > 0 && (
											<ul className="text-sm text-muted-foreground space-y-1 mt-2">
												{analysis.specificity.suggestions.map((s, i) => (
													<li key={i} className="flex items-start gap-2">
														<span className="text-primary">•</span>
														{s}
													</li>
												))}
											</ul>
										)}
									</div>

									{/* Constraints */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Shield className="h-4 w-4" />
												<span className="font-medium">Constraints</span>
											</div>
											{analysis.constraints.present ? (
												<Badge variant="outline" className="text-green-500">
													<CheckCircle2 className="h-3 w-3 mr-1" />
													Present
												</Badge>
											) : (
												<Badge variant="outline" className="text-yellow-500">
													<AlertCircle className="h-3 w-3 mr-1" />
													Missing
												</Badge>
											)}
										</div>
										{analysis.constraints.suggestions.length > 0 && (
											<ul className="text-sm text-muted-foreground space-y-1 mt-2">
												{analysis.constraints.suggestions.map((s, i) => (
													<li key={i} className="flex items-start gap-2">
														<span className="text-primary">•</span>
														{s}
													</li>
												))}
											</ul>
										)}
									</div>

									{/* Role Definition */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<User className="h-4 w-4" />
												<span className="font-medium">Role Definition</span>
											</div>
											{analysis.roleDefinition.present ? (
												<Badge variant="outline" className="text-green-500">
													<CheckCircle2 className="h-3 w-3 mr-1" />
													Present
												</Badge>
											) : (
												<Badge variant="outline" className="text-yellow-500">
													<AlertCircle className="h-3 w-3 mr-1" />
													Missing
												</Badge>
											)}
										</div>
										{analysis.roleDefinition.suggestions.length > 0 && (
											<ul className="text-sm text-muted-foreground space-y-1 mt-2">
												{analysis.roleDefinition.suggestions.map((s, i) => (
													<li key={i} className="flex items-start gap-2">
														<span className="text-primary">•</span>
														{s}
													</li>
												))}
											</ul>
										)}
									</div>
								</div>
							</ScrollArea>
						) : (
							<div className="flex flex-col items-center justify-center py-12">
								<AlertCircle className="h-8 w-8 text-muted-foreground mb-4" />
								<p className="text-sm text-muted-foreground">
									Failed to analyze. Click to retry.
								</p>
								<Button variant="outline" size="sm" className="mt-4" onClick={runAnalysis}>
									<RefreshCw className="mr-2 h-4 w-4" />
									Retry
								</Button>
							</div>
						)}
					</TabsContent>

					<TabsContent value="variants" className="mt-4">
						{!variants.length && !isGenerating ? (
							<div className="flex flex-col items-center justify-center py-12">
								<Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
								<p className="text-sm text-muted-foreground mb-4">
									Generate alternative versions of your prompt
								</p>
								<div className="flex flex-wrap gap-2 justify-center">
									<Button size="sm" onClick={() => generateVariants()}>
										Generate Variants
									</Button>
									<Button size="sm" variant="outline" onClick={() => generateVariants("shorter")}>
										Shorter
									</Button>
									<Button size="sm" variant="outline" onClick={() => generateVariants("detailed")}>
										More Detailed
									</Button>
									<Button size="sm" variant="outline" onClick={() => generateVariants("creative")}>
										Creative
									</Button>
								</div>
							</div>
						) : isGenerating ? (
							<div className="flex flex-col items-center justify-center py-12">
								<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
								<p className="text-sm text-muted-foreground">Generating variants...</p>
							</div>
						) : (
							<ScrollArea className="h-[400px] pr-4">
								<div className="space-y-4">
									{variants.map((variant, index) => (
										<div
											key={index}
											className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
												selectedVariant === index
													? "border-primary bg-primary/5"
													: "border-border hover:border-primary/50"
											}`}
											onClick={() => setSelectedVariant(index)}
											onKeyDown={(e) => e.key === "Enter" && setSelectedVariant(index)}
										>
											<div className="flex items-start justify-between mb-2">
												<h4 className="font-medium">{variant.title}</h4>
												<Badge variant="secondary">{variant.approach}</Badge>
											</div>
											<p className="text-sm text-muted-foreground mb-3">
												{variant.description}
											</p>
											<pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">
												{variant.content.slice(0, 300)}
												{variant.content.length > 300 && "..."}
											</pre>
										</div>
									))}

									<div className="flex justify-center pt-4">
										<Button variant="outline" size="sm" onClick={() => generateVariants()}>
											<RefreshCw className="mr-2 h-4 w-4" />
											Regenerate
										</Button>
									</div>
								</div>
							</ScrollArea>
						)}
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
					{activeTab === "variants" && selectedVariant !== null && (
						<Button onClick={handleApplyVariant}>
							Apply Selected Variant
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
