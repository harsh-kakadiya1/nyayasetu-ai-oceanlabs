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
		<div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
			<div className={`flex h-screen transition-all duration-300 ${sidebarOpen ? '' : 'pl-0'}`}>
				{/* Sidebar Toggle Button (when closed) */}
				{!sidebarOpen && (
					<button
						onClick={() => setSidebarOpen(true)}
						className="fixed left-4 top-20 z-50 w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-lg hover:shadow-blue-500/50 transition-all"
					>
						<History className="h-5 w-5" />
					</button>
				)}

				{/* Left Sidebar - History - Sticky */}
				<aside className={`${sidebarOpen ? 'w-72' : 'w-0'} sticky top-0 h-screen flex-shrink-0 border-r border-white/10 bg-gray-950/80 backdrop-blur-sm flex flex-col transition-all duration-300 overflow-hidden`}>
					{/* Sidebar Header with Toggle */}
					<div className="p-4 border-b border-white/10 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<History className="h-4 w-4 text-cyan-400" />
							<span className="text-xs font-semibold uppercase tracking-widest text-gray-300">History</span>
						</div>
						<button
							onClick={() => setSidebarOpen(false)}
							className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
							</svg>
						</button>
					</div>

					{/* New Analysis Button - Top */}
					<div className="p-4 border-b border-white/10">
						<Button
							onClick={() => {
								setShowResults(false);
								setAnalysisResult(null);
							}}
							className="w-full h-10 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/50 text-white transition-all"
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
									<div key={i} className="h-14 bg-gray-800/50 rounded-lg animate-pulse" />
								))}
							</div>
						) : analyses.length === 0 ? (
							<div className="text-center py-8 px-4">
								<FileText className="mx-auto h-8 w-8 text-gray-600 mb-2" />
								<p className="text-xs text-gray-500">No analyses yet</p>
							</div>
						) : (
							<div className="space-y-1">
								{analyses.map((analysis) => (
									<button
										key={analysis.id}
										onClick={() => handleHistoryClick(analysis)}
										className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors group"
									>
										<div className="flex items-start gap-2">
											<div className="mt-0.5">
												<FileText className="h-4 w-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm text-white font-medium truncate">
													{analysis.summary.slice(0, 45)}...
												</p>
												<div className="flex items-center gap-2 mt-1">
													<span className="text-[10px] text-gray-500">{formatDate(analysis.createdAt)}</span>
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
						<div className="mb-8">
							<h1 className="font-display text-3xl font-bold text-white">
								{t("analysis.title")}
							</h1>
							<p className="text-base text-gray-400 mt-2">
								Upload a document to get AI-powered legal analysis
							</p>
						</div>

						{/* Stats Bar */}
						{showResults && analysisResult?.analysis && (
							<div className="mb-8 flex flex-wrap gap-3">
								{stats.map(({ label, value, icon: Icon }) => (
									<div
										key={label}
										className="flex items-center gap-3 px-4 py-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 transition-all"
									>
										<Icon className="h-4 w-4 text-cyan-400" />
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold text-white">{value}</span>
											<span className="text-xs text-gray-400">{label}</span>
										</div>
									</div>
								))}
							</div>
						)}

						{/* Horizontal Upload Section */}
						{(!showResults || isAnalyzing) && (
							<section className="mb-8 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 backdrop-blur-sm">
								<div className="flex items-start gap-4 mb-6">
									<div className="flex-shrink-0 rounded-lg bg-blue-500/20 p-2">
										<Upload className="h-5 w-5 text-blue-400" />
									</div>
									<div>
										<h2 className="font-display text-lg font-semibold text-white">{t("upload.title")}</h2>
										<p className="text-sm text-gray-400">{t("welcome.description")}</p>
									</div>
								</div>

								{/* Horizontal Upload Component */}
								<div className="border-t border-white/10 pt-6">
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
							<section className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 backdrop-blur-sm">
								<LoadingAnalysis />
							</section>
							) : showResults && analysisResult && analysisResult.analysis ? (
							<section className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 backdrop-blur-sm">
								<div className="flex items-center justify-between mb-6">
									<div className="flex items-center gap-2">
										<CheckCircle2 className="h-5 w-5 text-emerald-500" />
										<h2 className="font-display text-xl font-semibold text-white">Analysis Results</h2>
									</div>
									{analysisResult.document?.filename && (
										<span className="text-sm text-gray-300 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
											{analysisResult.document.filename}
										</span>
									)}
								</div>
								<AnalysisResults analysisData={analysisResult} />
							</section>
						) : (
							/* Empty State */
							<section className="rounded-xl border border-dashed border-white/10 bg-gradient-to-br from-white/5 to-transparent p-12 text-center">
								<div className="mx-auto mb-6 inline-flex rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-5">
									<FileText className="h-12 w-12 text-cyan-400" />
								</div>
								<h3 className="font-display text-xl font-semibold text-white">
									{t("welcome.title")}
								</h3>
								<p className="mx-auto mt-3 max-w-md text-sm text-gray-400">
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
