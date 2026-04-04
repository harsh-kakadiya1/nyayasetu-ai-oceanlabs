import DocumentUpload from "@/components/document-upload";
import AnalysisResults from "@/components/analysis-results";
import LoadingAnalysis from "@/components/loading-analysis";
import { FileText, History, Upload, CheckCircle2, Trash2, AlertTriangle, X } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import API_ENDPOINTS from "@/lib/api";
import HistoryAnalysisResults from "@/components/history-analysis-results";

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
	const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : true));
	const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [historyToDelete, setHistoryToDelete] = useState<Analysis | null>(null);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 1024) {
				setSidebarOpen(true);
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		fetchHistory();
	}, []);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const oauth = params.get("oauth");

		if (oauth === "existing-account") {
			toast({
				title: "Account already exists",
				description: "You were signed in with your existing Google account.",
			});
		} else if (oauth === "account-created") {
			toast({
				title: "Google account linked",
				description: "Your account was created successfully.",
			});
		}

		if (oauth) {
			params.delete("oauth");
			params.delete("auth");
			const nextSearch = params.toString();
			const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
			window.history.replaceState({}, "", nextUrl);
		}
	}, [toast]);

	useEffect(() => {
		const handleHistoryCleared = () => {
			setAnalyses([]);
			setSelectedHistoryItem(null);
			fetchHistory();
		};

		window.addEventListener("history:cleared", handleHistoryCleared);
		return () => window.removeEventListener("history:cleared", handleHistoryCleared);
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

	const handleHistoryClick = (analysis: Analysis) => {
		setSelectedHistoryItem(analysis);
		setShowResults(true);
		setAnalysisResult(null);
		if (typeof window !== "undefined" && window.innerWidth < 1024) {
			setSidebarOpen(false);
		}
	};

	const handleDeleteHistoryItem = (analysis: Analysis) => {
		setHistoryToDelete(analysis);
		setDeleteDialogOpen(true);
	};

	const handleConfirmDeleteHistoryItem = async () => {
		if (!historyToDelete) return;
		const analysisId = historyToDelete.id;

		try {
			setDeletingHistoryId(analysisId);
			const response = await fetch(API_ENDPOINTS.historyItem(analysisId), {
				method: "DELETE",
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error("Failed to delete history item");
			}

			setAnalyses((prev) => prev.filter((item) => item.id !== analysisId));
			if (selectedHistoryItem?.id === analysisId) {
				setSelectedHistoryItem(null);
				setShowResults(false);
			}

			setDeleteDialogOpen(false);
			setHistoryToDelete(null);

			toast({
				title: "Deleted",
				description: "History item removed successfully",
			});
		} catch (error) {
			console.error("Failed to delete history item:", error);
			toast({
				title: "Delete failed",
				description: "Could not delete this history item",
				variant: "destructive",
			});
		} finally {
			setDeletingHistoryId(null);
		}
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

	return (
		<div className="min-h-[calc(100dvh-68px)] bg-gradient-to-br from-[#f8f4ea] via-[#edf4f1] to-[#f4f8f7]">
			<div className="relative flex min-h-[calc(100dvh-68px)]">
				{sidebarOpen && (
					<button
						type="button"
						onClick={() => setSidebarOpen(false)}
						className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px] lg:hidden"
						aria-label="Close history panel"
					/>
				)}

				{!sidebarOpen && (
					<button
						onClick={() => setSidebarOpen(true)}
						className="fixed bottom-5 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-lg bg-[#1f565f] text-white shadow-[0_10px_24px_rgba(23,63,70,0.35)] transition-colors hover:bg-[#173f46] lg:bottom-auto lg:right-auto lg:left-4 lg:top-24"
						aria-label="Open history panel"
					>
						<History className="h-5 w-5" />
					</button>
				)}

				<aside className={`${sidebarOpen ? "translate-x-0 lg:w-72" : "-translate-x-full pointer-events-none lg:pointer-events-auto lg:translate-x-0 lg:w-0"} fixed inset-y-[68px] left-0 z-50 flex w-[86vw] max-w-[320px] flex-shrink-0 flex-col overflow-hidden border-r border-[#2d575e]/15 bg-white/90 shadow-2xl backdrop-blur-sm transition-all duration-300 lg:relative lg:inset-y-0 lg:left-auto lg:z-auto lg:max-w-none lg:bg-white/70 lg:shadow-none`}>
					<div className="flex items-center justify-between border-b border-[#2d575e]/10 px-4 py-3">
						<div className="flex items-center gap-2">
							<History className="h-4 w-4 text-[#4a7379]" />
							<span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4a7379]">History</span>
						</div>
						<button onClick={() => setSidebarOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b8a90] transition-colors hover:bg-[#eef8f5] hover:text-[#1f565f]">
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
					</div>

					<div className="border-b border-[#2d575e]/10 px-4 py-3">
						<Button
							onClick={() => {
								setShowResults(false);
								setAnalysisResult(null);
								setSelectedHistoryItem(null);
								if (typeof window !== "undefined" && window.innerWidth < 1024) {
									setSidebarOpen(false);
								}
							}}
							className="h-10 w-full rounded-xl bg-[#1f565f] text-white hover:bg-[#173f46]"
						>
							<Upload className="mr-2 h-4 w-4" />
							{t("analysis.newAnalysis")}
						</Button>
					</div>

					<div className="flex-1 overflow-y-auto px-3 py-3">
						{historyLoading ? (
							<div className="space-y-2">
								{[...Array(4)].map((_, index) => (
									<div key={index} className="h-14 animate-pulse rounded-lg bg-gray-100/80" />
								))}
							</div>
						) : analyses.length === 0 ? (
							<div className="px-4 py-8 text-center">
								<FileText className="mx-auto mb-2 h-8 w-8 text-[#c4d4d6]" />
								<p className="text-xs text-[#7a9a9e]">{t("history.empty")}</p>
							</div>
						) : (
							<div className="space-y-1">
								{analyses.map((analysis) => (
									<div key={analysis.id} className="group flex items-start gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-[#eef8f5]">
										<button
											onClick={() => handleHistoryClick(analysis)}
											className="flex min-w-0 flex-1 items-start gap-2 rounded-lg px-1 py-1 text-left"
										>
											<FileText className="mt-0.5 h-4 w-4 text-[#7a9a9e] group-hover:text-[#1f565f]" />
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium text-[#1d3b40]">{analysis.summary.slice(0, 45)}...</p>
												<p className="mt-1 text-[10px] text-[#7a9a9e]">{formatDate(analysis.createdAt)}</p>
											</div>
										</button>
										<button
											type="button"
											onClick={() => handleDeleteHistoryItem(analysis)}
											disabled={deletingHistoryId === analysis.id}
											className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[#7f989d] opacity-100 transition-colors hover:bg-[#f7dede] hover:text-[#c0392b] sm:opacity-0 sm:group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
											aria-label="Delete history item"
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</aside>

				<main className="min-w-0 flex-1 overflow-y-auto">
					<div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
						<div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							{(!showResults || isAnalyzing) && !selectedHistoryItem && (
								<div>
									<h1 className="font-display text-2xl font-semibold text-[#1d3b40]">{t("analysis.title")}</h1>
									<p className="mt-1 text-sm text-[#6b8a90]">{t("analysis.subtitle")}</p>
								</div>
							)}
							{selectedHistoryItem && (
								<div>
									<h1 className="font-display text-2xl font-semibold text-[#1d3b40]">Analysis History</h1>
									<p className="mt-1 text-sm text-[#6b8a90]">Viewing previous analysis from {new Date(selectedHistoryItem.createdAt).toLocaleDateString()}</p>
								</div>
							)}
						</div>

						{(!showResults || isAnalyzing) && !selectedHistoryItem && (
							<section className="mb-6">
								<DocumentUpload onAnalysisStart={handleAnalysisStart} onAnalysisComplete={handleAnalysisComplete} onAnalysisError={handleAnalysisError} isAnalyzing={isAnalyzing} />
							</section>
						)}

						{isAnalyzing ? (
							<section>
								<LoadingAnalysis />
							</section>
						) : showResults && analysisResult?.analysis ? (
							<section className="space-y-3">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-5 w-5 text-emerald-600" />
									<h2 className="font-display text-xl font-semibold text-[#1d3b40]">{t("analysis.results")}</h2>
								</div>
								{analysisResult.document?.filename && <p className="text-sm text-[#6b8a90]">{analysisResult.document.filename}</p>}
								<AnalysisResults analysisData={analysisResult} />
							</section>
						) : selectedHistoryItem ? (
							<section className="space-y-3">
								<div className="flex items-center gap-2">
									<History className="h-5 w-5 text-blue-600" />
									<h2 className="font-display text-xl font-semibold text-[#1d3b40]">History Analysis Results</h2>
								</div>
								<HistoryAnalysisResults analysis={selectedHistoryItem} />
							</section>
						) : (
							<section className="py-8">
								<h3 className="font-display text-xl font-semibold text-[#1f3d42]">{t("welcome.title")}</h3>
								<p className="mt-3 max-w-md text-sm text-[#557980]">{t("welcome.description")}</p>
							</section>
						)}
					</div>
				</main>

				{deleteDialogOpen && historyToDelete && (
					<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 sm:items-center">
						<div className="w-full max-w-md rounded-2xl border border-red-100 bg-white shadow-2xl overflow-hidden">
							<div className="flex items-center justify-between border-b border-red-100 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4">
								<div className="flex items-center gap-2">
									<AlertTriangle className="h-5 w-5 text-red-600" />
									<h3 className="text-base font-semibold text-[#1d3b40]">Delete History Item</h3>
								</div>
								<button
									type="button"
									onClick={() => {
										setDeleteDialogOpen(false);
										setHistoryToDelete(null);
									}}
									disabled={!!deletingHistoryId}
									className="rounded-md p-1 text-gray-500 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
									aria-label="Close delete confirmation"
								>
									<X className="h-4 w-4" />
								</button>
							</div>

							<div className="space-y-4 px-5 py-5">
								<p className="text-sm text-[#35565c]">
									This action will permanently delete this analysis and all related chat messages.
								</p>
								<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
									This cannot be undone.
								</div>
								<div className="rounded-lg border border-[#2d575e]/15 bg-[#f7fbf9] px-3 py-2">
									<p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b8a90]">Selected item</p>
									<p className="mt-1 text-sm text-[#1f3d42] line-clamp-2">{historyToDelete.summary}</p>
								</div>
							</div>

							<div className="flex gap-3 border-t border-[#2d575e]/12 bg-[#fbfdfc] px-5 py-4">
								<button
									type="button"
									onClick={() => {
										setDeleteDialogOpen(false);
										setHistoryToDelete(null);
									}}
									disabled={!!deletingHistoryId}
									className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleConfirmDeleteHistoryItem}
									disabled={!!deletingHistoryId}
									className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{deletingHistoryId ? "Deleting..." : "Delete"}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
