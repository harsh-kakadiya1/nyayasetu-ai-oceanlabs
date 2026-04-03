import DocumentUpload from "@/components/document-upload";
import AnalysisResults from "@/components/analysis-results";
import LoadingAnalysis from "@/components/loading-analysis";
import { ArrowRight, FileText, Clock, Eye, History, Upload, CheckCircle2, ShieldAlert, TimerReset, ScanSearch, MessageSquare } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import API_ENDPOINTS from "@/lib/api";
import AnalysisDetailModal from "@/components/analysis-detail-modal";

interface AnalysisData {
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

interface Analysis {
	id: string;
	documentId: string;
	summary: string;
	riskLevel: "high" | "medium" | "low";
	keyTerms: any;
	riskItems: any[];
	clauses: any[];
	recommendations: any[];
	wordCount: number;
	processingTime: string;
	createdAt: string;
}

export default function Dashboard() {
	const { analysisResult, isAnalyzing, setAnalysisResult, setIsAnalyzing } = useAnalysis();
	const { t } = useTranslation();
	const [showResults, setShowResults] = useState(false);
	const analysisStartTimeRef = useRef<number | null>(null);
	const hasShownToastRef = useRef(false);
	const MINIMUM_LOADING_TIME = 6000;
	const { toast } = useToast();

	// History state
	const [analyses, setAnalyses] = useState<Analysis[]>([]);
	const [historyLoading, setHistoryLoading] = useState(true);
	const [selectedHistoryItem, setSelectedHistoryItem] = useState<Analysis | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		fetchHistory();
	}, []);

	const fetchHistory = async () => {
		try {
			const response = await fetch(API_ENDPOINTS.history, {
				credentials: 'include',
			});
			if (response.ok) {
				const data = await response.json();
				setAnalyses(data || []);
			}
		} catch (error) {
			console.error('Failed to load history:', error);
		} finally {
			setHistoryLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});
	};

	const getRiskBadgeColor = (riskLevel: string) => {
		switch (riskLevel) {
			case 'high':
				return 'bg-red-100 text-red-700 border-red-200';
			case 'medium':
				return 'bg-amber-100 text-amber-700 border-amber-200';
			case 'low':
				return 'bg-emerald-100 text-emerald-700 border-emerald-200';
			default:
				return 'bg-gray-100 text-gray-700 border-gray-200';
		}
	};

	const handleHistoryClick = (analysis: Analysis) => {
		setSelectedHistoryItem(analysis);
		setModalOpen(true);
	};

	const handleAnalysisComplete = (result: AnalysisData) => {
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
					fetchHistory(); // Refresh history
				}, remaining);
			} else {
				setIsAnalyzing(false);
				setShowResults(true);
				fetchHistory();
			}
		} else {
			setTimeout(() => {
				setIsAnalyzing(false);
				setShowResults(true);
				fetchHistory();
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
				title: t("analysis.title"),
				description: t("common.success"),
			});
			hasShownToastRef.current = true;
		}
	}, [showResults, analysisResult, toast, t]);

	const stats = [
		{
			label: t("analysis.documentLength"),
			value: analysisResult?.analysis?.wordCount
				? `${analysisResult.analysis.wordCount.toLocaleString()}`
				: "--",
			icon: ScanSearch,
		},
		{
			label: t("analysis.riskLevel"),
			value: analysisResult?.analysis?.riskLevel
				? t(`analysis.${analysisResult.analysis.riskLevel}`)
				: "--",
			icon: ShieldAlert,
		},
		{
			label: t("analysis.processingTime"),
			value: analysisResult?.analysis?.processingTime || "--",
			icon: TimerReset,
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#f8f4ea] via-[#edf4f1] to-[#f4f8f7]">
			<div className={`flex h-screen transition-all duration-300 ${sidebarOpen ? '' : 'pl-0'}`}>
				{/* Sidebar Toggle Button (when closed) */}
				{!sidebarOpen && (
					<button
						onClick={() => setSidebarOpen(true)}
						className="fixed left-4 top-4 z-50 w-10 h-10 rounded-lg bg-[#1f565f] text-white flex items-center justify-center shadow-lg hover:bg-[#173f46] transition-colors"
					>
						<History className="h-5 w-5" />
					</button>
				)}

				{/* Left Sidebar - History - Sticky */}
				<aside className={`${sidebarOpen ? 'w-72' : 'w-0'} sticky top-0 h-screen flex-shrink-0 border-r border-[#2d575e]/15 bg-white/80 backdrop-blur-sm flex flex-col transition-all duration-300 overflow-hidden`}>
					{/* Sidebar Header with Toggle */}
					<div className="p-3 border-b border-[#2d575e]/10 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<History className="h-4 w-4 text-[#4a7379]" />
							<span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4a7379]">History</span>
						</div>
						<button
							onClick={() => setSidebarOpen(false)}
							className="w-8 h-8 rounded-lg hover:bg-[#eef8f5] flex items-center justify-center text-[#6b8a90] hover:text-[#1f565f] transition-colors"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
							</svg>
						</button>
					</div>

					{/* New Analysis Button - Top */}
					<div className="p-3 border-b border-[#2d575e]/10">
						<Button
							onClick={() => {
								setShowResults(false);
								setAnalysisResult(null);
							}}
							className="w-full h-10 rounded-xl bg-[#1f565f] hover:bg-[#173f46] text-white"
						>
							<Upload className="h-4 w-4 mr-2" />
							New Analysis
						</Button>
					</div>

					{/* History List */}
					<div className="flex-1 overflow-y-auto p-3">
						{historyLoading ? (
							<div className="space-y-2">
								{[...Array(4)].map((_, i) => (
									<div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
								))}
							</div>
						) : analyses.length === 0 ? (
							<div className="text-center py-8 px-4">
								<FileText className="mx-auto h-8 w-8 text-[#c4d4d6] mb-2" />
								<p className="text-xs text-[#7a9a9e]">No analyses yet</p>
							</div>
						) : (
							<div className="space-y-1">
								{analyses.map((analysis) => (
									<button
										key={analysis.id}
										onClick={() => handleHistoryClick(analysis)}
										className="w-full text-left p-3 rounded-xl hover:bg-[#eef8f5] transition-colors group"
									>
										<div className="flex items-start gap-2">
											<div className="mt-0.5">
												<FileText className="h-4 w-4 text-[#7a9a9e] group-hover:text-[#1f565f]" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm text-[#1d3b40] font-medium truncate">
													{analysis.summary.slice(0, 45)}...
												</p>
												<div className="flex items-center gap-2 mt-1">
													<span className="text-[10px] text-[#7a9a9e]">{formatDate(analysis.createdAt)}</span>
												</div>
											</div>
										</div>
									</button>
									))}
								</div>
							)}
						</div>
					</aside>

				{/* Main Content Area */}
				<main className="flex-1 overflow-y-auto">
					<div className="max-w-5xl mx-auto p-6 lg:p-8">
						{/* Header */}
						<div className="mb-6">
							<h1 className="font-display text-2xl font-semibold text-[#1d3b40]">
								{t("analysis.title")}
							</h1>
							<p className="text-sm text-[#6b8a90] mt-1">
								Upload a document to get AI-powered legal analysis
							</p>
						</div>

						{/* Stats Bar */}
						{showResults && analysisResult?.analysis && (
							<div className="mb-6 flex flex-wrap gap-3">
								{stats.map(({ label, value, icon: Icon }) => (
									<div
										key={label}
										className="flex items-center gap-3 px-4 py-2 rounded-full border border-[#2c5157]/12 bg-white/60"
									>
										<Icon className="h-4 w-4 text-[#1f565f]" />
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold text-[#1d3b40]">{value}</span>
											<span className="text-xs text-[#6b8a90]">{label}</span>
										</div>
									</div>
								))}
							</div>
						)}

						{/* Horizontal Upload Section */}
						{(!showResults || isAnalyzing) && (
							<section className="mb-6 rounded-2xl border border-[#2d575e]/15 bg-white/75 p-6 backdrop-blur-sm">
								<div className="flex items-start gap-4 mb-4">
									<div className="flex-shrink-0 rounded-lg bg-[#f6b26b]/20 p-2">
										<Upload className="h-5 w-5 text-[#f6b26b]" />
									</div>
									<div>
										<h2 className="font-display text-lg font-semibold text-[#1d3b40]">{t("upload.title")}</h2>
										<p className="text-sm text-[#6b8a90]">{t("welcome.description")}</p>
									</div>
								</div>

								{/* Horizontal Upload Component */}
								<div className="border-t border-[#2d575e]/10 pt-4">
									<DocumentUpload
										onAnalysisStart={handleAnalysisStart}
										onAnalysisComplete={handleAnalysisComplete}
										onAnalysisError={handleAnalysisError}
										isAnalyzing={isAnalyzing}
									/>
								</div>
							</section>
						)}

						{/* Analysis Results Section */}
						{isAnalyzing ? (
							<section className="rounded-2xl border border-[#284d54]/16 bg-white/90 p-6 shadow-lg">
								<LoadingAnalysis />
							</section>
							) : showResults && analysisResult && analysisResult.analysis ? (
							<section className="rounded-2xl border border-[#284d54]/16 bg-white/90 p-6 shadow-lg">
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center gap-2">
										<CheckCircle2 className="h-5 w-5 text-emerald-600" />
										<h2 className="font-display text-xl font-semibold text-[#1d3b40]">Analysis Results</h2>
									</div>
									{analysisResult.document?.filename && (
										<span className="text-sm text-[#6b8a90] bg-[#eef8f5] px-3 py-1 rounded-full">
											{analysisResult.document.filename}
										</span>
									)}
								</div>
								<AnalysisResults analysisData={analysisResult} />
							</section>
						) : (
							/* Empty State */
							<section className="rounded-2xl border border-dashed border-[#2e5960]/20 bg-gradient-to-br from-white/50 to-[#f9fffe] p-12 text-center">
								<div className="mx-auto mb-5 inline-flex rounded-2xl bg-gradient-to-br from-[#e7f6f1] to-[#f0f8f5] p-5">
									<FileText className="h-12 w-12 text-[#1f565f]" />
								</div>
								<h3 className="font-display text-xl font-semibold text-[#1f3d42]">
									{t("welcome.title")}
								</h3>
								<p className="mx-auto mt-3 max-w-md text-sm text-[#557980]">
									{t("welcome.description")}
								</p>
							</section>
						)}
					</div>
				</main>
			</div>

			{/* History Detail Modal */}
			<AnalysisDetailModal
				analysis={selectedHistoryItem}
				open={modalOpen}
				onOpenChange={setModalOpen}
			/>
		</div>
	);
}
