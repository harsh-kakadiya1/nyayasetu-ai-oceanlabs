import DocumentUpload from "@/components/document-upload";
import AnalysisResults from "@/components/analysis-results";
import LoadingAnalysis from "@/components/loading-analysis";
import AnalysisHistory from "@/components/analysis-history";
import { ArrowRight, FileText, ScanSearch, ShieldAlert, TimerReset, History, Upload, CheckCircle2 } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface DocumentAnalysis {
	document: {
		id: string;
		filename?: string;
		content: string;
		documentType?: string;
	};
	analysis: {
		id: string;
		summary: string;
		riskLevel: "high" | "medium" | "low";
		keyTerms: any;
		riskItems: any[];
		clauses: any[];
		recommendations: any[];
		wordCount: number;
		processingTime: string;
	};
}

export default function Dashboard() {
	const { analysisResult, isAnalyzing, setAnalysisResult, setIsAnalyzing } = useAnalysis();
	const [activeTab, setActiveTab] = useState("analyze");
	const [showResults, setShowResults] = useState(false);
	const analysisStartTimeRef = useRef<number | null>(null);
	const hasShownToastRef = useRef(false);
	const MINIMUM_LOADING_TIME = 6000;
	const { toast } = useToast();

	const handleAnalysisComplete = (result: DocumentAnalysis) => {
		if (!result || !result.analysis) {
			console.error("Invalid analysis result:", result);
			handleAnalysisError();
			return;
		}
		
		setAnalysisResult(result);
		
		if (analysisStartTimeRef.current) {
			const elapsed = Date.now() - analysisStartTimeRef.current;
			const remaining = Math.max(0, MINIMUM_LOADING_TIME - elapsed);
			
			if (remaining > 0) {
				setTimeout(() => {
					setIsAnalyzing(false);
					setShowResults(true);
				}, remaining);
			} else {
				setIsAnalyzing(false);
				setShowResults(true);
			}
		} else {
			setTimeout(() => {
				setIsAnalyzing(false);
				setShowResults(true);
			}, MINIMUM_LOADING_TIME);
		}
	};

	const handleAnalysisStart = () => {
		setIsAnalyzing(true);
		setAnalysisResult(null);
		setShowResults(false);
		hasShownToastRef.current = false;
		analysisStartTimeRef.current = Date.now();
	};

	const handleAnalysisError = () => {
		setIsAnalyzing(false);
		setShowResults(false);
		hasShownToastRef.current = false;
		analysisStartTimeRef.current = null;
	};

	useEffect(() => {
		if (showResults && analysisResult && !hasShownToastRef.current) {
			toast({
				title: "Analysis Complete",
				description: "Your document has been successfully analyzed.",
			});
			hasShownToastRef.current = true;
		}
	}, [showResults, analysisResult, toast]);

	const stats = [
		{
			label: "Words scanned",
			value: analysisResult?.analysis?.wordCount
				? `${analysisResult.analysis.wordCount.toLocaleString()}`
				: "--",
			icon: ScanSearch,
		},
		{
			label: "Risk level",
			value: analysisResult?.analysis?.riskLevel
				? `${analysisResult.analysis.riskLevel.charAt(0).toUpperCase()}${analysisResult.analysis.riskLevel.slice(1)}`
				: "Pending",
			icon: ShieldAlert,
		},
		{
			label: "Processing time",
			value: analysisResult?.analysis?.processingTime || "Awaiting",
			icon: TimerReset,
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#f8f4ea] via-[#edf4f1] to-[#f4f8f7] pb-10">
			<main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-10">
				{/* Header Section */}
				<section className="mb-8 rounded-3xl border border-[#2d575e]/15 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
					<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4a7379]">Dashboard workspace</p>
							<h1 className="font-display mt-2 text-2xl font-semibold text-[#1d3b40] sm:text-3xl">
								Analyze documents with strategic context
							</h1>
						</div>
						{showResults && analysisResult?.analysis && (
							<div className="flex items-center gap-2 rounded-full border border-[#2f5960]/20 bg-gradient-to-r from-[#eef8f5] to-[#f5fcfa] px-4 py-2">
								<CheckCircle2 className="h-4 w-4 text-[#1f565f]" />
								<span className="text-sm font-medium text-[#2b5359]">
									Latest: {analysisResult.document?.filename || "Text Input"}
								</span>
							</div>
						)}
					</div>

					{/* Stats Grid */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						{stats.map(({ label, value, icon: Icon }) => (
							<div 
								key={label} 
								className="rounded-2xl border border-[#2c5157]/12 bg-gradient-to-br from-white to-[#f9fffe] p-5 hover:shadow-md transition-shadow"
							>
								<div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-[#e8f7f2] to-[#f0f8f5] p-2 text-[#1f565f]">
									<Icon className="h-5 w-5" />
								</div>
								<p className="font-display text-2xl font-semibold text-[#1d3b40]">{value}</p>
								<p className="mt-1 text-sm text-[#547980]">{label}</p>
							</div>
						))}
					</div>
				</section>

				{/* Tab Navigation */}
				<div className="mb-6 flex gap-2 border-b border-[#2d575e]/15">
					<button
						onClick={() => setActiveTab("analyze")}
						className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all border-b-2 ${
							activeTab === "analyze"
								? "border-[#1f565f] text-[#1f565f]"
								: "border-transparent text-[#6b8a90] hover:text-[#4a7379]"
						}`}
					>
						<Upload className="h-4 w-4" />
						New Analysis
					</button>
					<button
						onClick={() => setActiveTab("history")}
						className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all border-b-2 ${
							activeTab === "history"
								? "border-[#1f565f] text-[#1f565f]"
								: "border-transparent text-[#6b8a90] hover:text-[#4a7379]"
						}`}
					>
						<History className="h-4 w-4" />
						History
					</button>
				</div>

				{/* Tab Content */}
				<div>
					{activeTab === "analyze" ? (
						<div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
							{/* Left Sidebar */}
							<aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
								{/* Upload Card */}
								<div className="rounded-3xl border border-[#22484f]/20 bg-gradient-to-br from-[#1f4a52] to-[#1a3d45] p-6 text-[#e7fff8] shadow-xl">
									<div className="flex items-start gap-3 mb-3">
										<div className="flex-shrink-0 rounded-lg bg-[#f6b26b]/20 p-2">
											<Upload className="h-5 w-5 text-[#f6b26b]" />
										</div>
										<div>
											<p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b9e9db]">Quick Upload</p>
											<h2 className="font-display text-xl font-semibold text-white">Bring your contract in</h2>
										</div>
									</div>
									<p className="text-sm leading-relaxed text-[#d0f4ea]">
										Choose a file or paste text, then let AI map obligations, penalties, and risky clauses.
									</p>
								</div>

								{/* Upload Component */}
								<div className="rounded-3xl border border-[#1f474d]/15 bg-white/90 p-4 shadow-lg">
									<DocumentUpload
										onAnalysisStart={handleAnalysisStart}
										onAnalysisComplete={handleAnalysisComplete}
										onAnalysisError={handleAnalysisError}
										isAnalyzing={isAnalyzing}
									/>
								</div>

								{/* Tip Card */}
								<div className="rounded-2xl border border-[#284d54]/20 bg-gradient-to-br from-[#f5fcfa] to-[#f9fffe] p-4">
									<p className="font-semibold text-[#1f565f] text-sm">💡 Pro Tip</p>
									<p className="mt-2 text-sm text-[#41656b] leading-relaxed">
										Use "detailed" for negotiation prep and "brief" for quick screening.
									</p>
								</div>
							</aside>

							{/* Right Content Area */}
							<section className="space-y-5">
								{isAnalyzing ? (
									<div className="rounded-3xl border border-[#284d54]/16 bg-white/90 p-6 shadow-lg">
										<LoadingAnalysis />
									</div>
								) : showResults && analysisResult && analysisResult.analysis ? (
									<div className="rounded-3xl border border-[#284d54]/16 bg-white/90 p-6 shadow-lg">
										<AnalysisResults analysisData={analysisResult} />
									</div>
								) : (
									<div className="rounded-3xl border border-dashed border-[#2e5960]/20 bg-gradient-to-br from-white/50 to-[#f9fffe] p-12 text-center shadow-sm">
										<div className="mx-auto mb-5 inline-flex rounded-2xl bg-gradient-to-br from-[#e7f6f1] to-[#f0f8f5] p-5">
											<FileText className="h-12 w-12 text-[#1f565f]" />
										</div>
										<h3 className="font-display text-2xl font-semibold text-[#1f3d42]">
											Ready to analyze
										</h3>
										<p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#557980]">
											Upload a legal document to receive risk ratings, clause summaries, and practical next-step suggestions.
										</p>
										<div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#2f5960]/20 bg-gradient-to-r from-[#f0f9f6] to-[#f5fcfa] px-5 py-2">
											<span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2d5860]">Get started</span>
											<ArrowRight className="h-4 w-4 text-[#1f565f]" />
										</div>
									</div>
								)}
							</section>
						</div>
					) : (
						<div className="rounded-3xl border border-[#284d54]/16 bg-white/90 p-6 shadow-lg">
							<AnalysisHistory />
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
