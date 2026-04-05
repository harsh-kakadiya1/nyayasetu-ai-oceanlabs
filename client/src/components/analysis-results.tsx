import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SaveToggle } from "@/components/ui/save-toggle";
import { jsPDF } from "jspdf";
import RiskAssessment from "./risk-assessment";
import QAChat from "./qa-chat";
import { ChevronDown, ChevronRight, Copy, Check, Share2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import API_ENDPOINTS from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PdfFontStyle = "normal" | "bold" | "italic" | "bolditalic";

interface AnalysisData {
  document: {
    id: string;
    filename?: string;
    content: string;
    documentType?: string;
  };
  analysis: {
    id: string;
    summary: any;
    riskLevel: "high" | "medium" | "low";
    keyTerms: any;
    riskItems: any[];
    clauses: any[];
    recommendations: any[];
    wordCount: number;
    processingTime: string;
  };
}

interface AnalysisResultsProps {
  analysisData: AnalysisData;
  showChat?: boolean;
  allowShare?: boolean;
}

export default function AnalysisResults({
  analysisData,
  showChat = true,
  allowShare = true,
}: AnalysisResultsProps) {
  const { t } = useTranslation();
  const { document: documentData, analysis } = analysisData;
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading' | 'success' | 'saved'>('idle');
  const [isSharing, setIsSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Clean markdown formatting (remove ** markers)
  const cleanMarkdown = (text: string): string => {
    if (!text) return '';
    return text.replace(/\*\*/g, '');
  };

  // Handle status changes from SaveToggle
  const handleDownloadStatusChange = useCallback(async (status: 'idle' | 'loading' | 'success' | 'saved') => {
    setDownloadStatus(status);
    
    if (status === 'loading') {
      try {
        // Generate PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - 2 * margin;
        let yPosition = margin;

        // Helper function to add text with word wrapping
        const addWrappedText = (text: string, x: number, y: number, maxW: number, fontSize: number, fontStyle: PdfFontStyle = 'normal') => {
          pdf.setFontSize(fontSize);
          pdf.setFont('helvetica', fontStyle);
          const lines = pdf.splitTextToSize(text, maxW);
          pdf.text(lines, x, y);
          return y + (lines.length * fontSize * 0.35);
        };

        const summaryText = typeof analysis.summary === 'object' ? analysis.summary.summary : analysis.summary;
        const documentFileName = documentData.filename || 'Document';

        // Title
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Legal Document Analysis Report', margin, yPosition);
        yPosition += 15;

        // Metadata
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Document: ${documentFileName}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Processing Time: ${analysis.processingTime}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Word Count: ${analysis.wordCount}`, margin, yPosition);
        yPosition += 12;

        // Risk Level Badge
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        const riskColor = analysis.riskLevel === 'high' ? [220, 38, 38] : analysis.riskLevel === 'medium' ? [245, 158, 11] : [34, 197, 94];
        pdf.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
        pdf.text(`Risk Level: ${analysis.riskLevel.toUpperCase()}`, margin, yPosition);
        pdf.setTextColor(0, 0, 0);
        yPosition += 12;

        // Summary Section
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Summary', margin, yPosition);
        yPosition += 8;

        yPosition = addWrappedText(cleanMarkdown(summaryText), margin, yPosition, maxWidth, 10);
        yPosition += 12;

        // Key Terms
        const summaryKeyTerms = (typeof analysis.summary === 'object' && analysis.summary.keyTerms)
          ? analysis.summary.keyTerms
          : analysis.keyTerms;

        if (summaryKeyTerms && Object.keys(summaryKeyTerms).length > 0) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Key Terms', margin, yPosition);
          yPosition += 8;

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          Object.entries(summaryKeyTerms).forEach(([key, value]) => {
            if (value) {
              const termText = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${String(value)}`;
              yPosition = addWrappedText(termText, margin + 5, yPosition, maxWidth - 5, 9);
            }
          });
          yPosition += 10;
        }

        // Risk Items
        if (analysis.riskItems && analysis.riskItems.length > 0) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Risk Assessment', margin, yPosition);
          yPosition += 8;

          pdf.setFontSize(9);
          analysis.riskItems.forEach((item: any) => {
            // Check if we need a new page
            if (yPosition > pageHeight - margin - 10) {
              pdf.addPage();
              yPosition = margin;
            }

            pdf.setFont('helvetica', 'bold');
            const riskColor = item.level === 'high' ? [220, 38, 38] : item.level === 'medium' ? [245, 158, 11] : [34, 197, 94];
            pdf.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
            yPosition = addWrappedText(`• ${cleanMarkdown(item.title)}`, margin + 5, yPosition, maxWidth - 5, 9, 'bold');
            
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            yPosition = addWrappedText(cleanMarkdown(item.description), margin + 10, yPosition, maxWidth - 10, 8);
            yPosition += 5;
          });
          yPosition += 5;
        }

        // Recommendations
        if (analysis.recommendations && analysis.recommendations.length > 0) {
          // Check if we need a new page
          if (yPosition > pageHeight - margin - 30) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text('Recommendations', margin, yPosition);
          yPosition += 8;

          pdf.setFontSize(9);
          analysis.recommendations.forEach((rec: any, index: number) => {
            // Check if we need a new page
            if (yPosition > pageHeight - margin - 10) {
              pdf.addPage();
              yPosition = margin;
            }

            pdf.setFont('helvetica', 'bold');
            yPosition = addWrappedText(`${index + 1}. ${cleanMarkdown(rec.title)}`, margin + 5, yPosition, maxWidth - 5, 9, 'bold');
            
            pdf.setFont('helvetica', 'normal');
            yPosition = addWrappedText(cleanMarkdown(rec.description), margin + 10, yPosition, maxWidth - 10, 8);
            yPosition += 5;
          });
        }

        // Save PDF
        pdf.save(`analysis-report-${new Date().getTime()}.pdf`);

        toast({
          title: "Report downloaded",
          description: "Your analysis report has been downloaded as PDF.",
        });
      } catch (error) {
        console.error("Download error:", error);
        toast({
          title: "Download failed",
          description: "Failed to download the report. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [analysis, documentData.filename, toast]);

  const handleShareAnalysis = useCallback(async () => {
    if (!analysis.id || isSharing) {
      return;
    }

    setIsSharing(true);

    try {
      const response = await fetch(API_ENDPOINTS.analysis.share(analysis.id), {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({ error: "Failed to create share link" }));
        throw new Error(errorPayload.error || "Failed to create share link");
      }

      const payload = await response.json() as {
        shareUrl?: string;
        sharePath?: string;
        shareToken?: string;
      };

      const fallbackPath = payload.sharePath || (payload.shareToken ? `/shared/${encodeURIComponent(payload.shareToken)}` : "");
      const shareUrl = payload.shareUrl || (fallbackPath ? `${window.location.origin}${fallbackPath}` : "");

      if (!shareUrl) {
        throw new Error("Share link is unavailable");
      }

      let copied = false;
      try {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } catch (copyError) {
        console.warn("Clipboard copy failed:", copyError);
      }

      if (copied) {
        setShareCopied(true);
        toast({
          title: t("analysis.shareLinkReady", { defaultValue: "Share link ready" }),
          description: t("analysis.shareLinkCopied", { defaultValue: "Public link copied to clipboard" }),
        });

        setTimeout(() => setShareCopied(false), 2200);
      } else {
        window.prompt(t("analysis.copyShareLinkPrompt", { defaultValue: "Copy this public link:" }), shareUrl);
        toast({
          title: t("analysis.shareLinkReady", { defaultValue: "Share link ready" }),
          description: t("analysis.shareLinkCreated", { defaultValue: "Public link created" }),
        });
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : t("analysis.shareFailed", { defaultValue: "Failed to create share link" });

      toast({
        title: t("analysis.shareFailed", { defaultValue: "Share failed" }),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  }, [analysis.id, isSharing, t, toast]);

  const toggleClause = (index: number) => {
    const newExpanded = new Set(expandedClauses);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedClauses(newExpanded);
  };

  const copyToClipboard = async (text: string, itemId: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemId));
      
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });

      // Reset the check icon after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Handle both string and object summary formats
  const summaryText = typeof analysis.summary === 'object' ? analysis.summary.summary : analysis.summary;
  // Only use keyTerms from summary if available, otherwise fallback to analysis.keyTerms
  const summaryKeyTerms = (typeof analysis.summary === 'object' && analysis.summary.keyTerms)
    ? analysis.summary.keyTerms
    : analysis.keyTerms;
  const documentTypeDisplay = (typeof analysis.summary === 'object' ? analysis.summary.documentType : null) || 
                              documentData.documentType || t("upload.documentType");

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Download Report Button */}
      <div className="flex flex-wrap items-center justify-end gap-2 pb-1">
        {allowShare && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareAnalysis}
            disabled={isSharing}
            className="h-10 rounded-full border-[#2d575e]/20 bg-white/70 px-4 text-sm font-semibold text-[#1f4f57] hover:bg-[#eef8f5]"
            data-testid="button-share-analysis"
          >
            {shareCopied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
            {shareCopied
              ? t("analysis.linkCopied", { defaultValue: "Link copied" })
              : isSharing
                ? t("analysis.sharing", { defaultValue: "Sharing..." })
                : t("analysis.share", { defaultValue: "Share" })}
          </Button>
        )}
        <SaveToggle
          size="sm"
          idleText="Save"
          savedText="Saved"
          loadingDuration={1200}
          successDuration={1000}
          onStatusChange={handleDownloadStatusChange}
        />
      </div>

      {/* Document Summary */}
      <div className="analysis-card" data-testid="card-document-summary">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-foreground" data-testid="text-summary-title">{t("analysis.summary")}</h3>
          <Badge variant="secondary" className="text-xs self-start sm:self-auto" data-testid="badge-document-type">
            {documentTypeDisplay}
          </Badge>
        </div>
        <div className="prose prose-sm max-w-none">
          <p className="text-sm sm:text-base text-foreground mb-3 sm:mb-4 leading-relaxed" data-testid="text-summary-content">
            {cleanMarkdown(summaryText)}
          </p>
          {summaryKeyTerms && Object.keys(summaryKeyTerms).length > 0 && (
            <div className="pt-2" data-testid="section-key-terms">
              <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="font-medium text-sm sm:text-base text-foreground" data-testid="text-key-terms-title">{t("analysis.keyTerms")}</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs ${
                          copiedItems.has('all-key-terms') ? 'text-primary' : ''
                        }`}
                        onClick={() => {
                          const allTerms = Object.entries(summaryKeyTerms)
                            .filter(([_, value]) => value)
                            .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
                            .join('\n');
                          copyToClipboard(allTerms, 'all-key-terms', 'All key terms');
                        }}
                        data-testid="button-copy-all-terms"
                        aria-label="Copy all key terms to clipboard"
                      >
                        {copiedItems.has('all-key-terms') ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1.5" />
                            Copy All
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy all key terms to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-2">
                {Object.entries(summaryKeyTerms).map(([key, value]) => {
                  if (!value) return null;
                  const termText = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${String(value)}`;
                  const itemId = `key-term-${key}`;
                  const isCopied = copiedItems.has(itemId);
                  return (
                    <li key={key} className="break-words flex items-start justify-between gap-2 group" data-testid={`text-key-term-${key}`}>
                      <span className="flex-1 min-w-0">• {termText}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 p-0 flex-shrink-0 transition-all ${
                                isMobile || isCopied
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-100'
                              } ${isCopied ? 'text-primary' : ''}`}
                              onClick={() => copyToClipboard(termText, itemId, `${key.charAt(0).toUpperCase() + key.slice(1)} term`)}
                              data-testid={`button-copy-term-${key}`}
                              aria-label={`Copy ${key} term to clipboard`}
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isCopied ? 'Copied!' : 'Copy to clipboard'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Risk Assessment */}
      <RiskAssessment riskItems={analysis.riskItems} riskLevel={analysis.riskLevel} />

      {/* Key Clauses Analysis */}
      <div className="analysis-card" data-testid="card-clauses-analysis">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4" data-testid="text-clauses-title">
          {t("analysis.clauses")}
        </h3>
        <div className="space-y-4">
          {analysis.clauses && analysis.clauses.length > 0 ? (
            analysis.clauses.map((clause: any, index: number) => (
              <div key={index} className="rounded-xl border-l-2 border-[#2f5960]/20 pl-4 transition-colors hover:bg-[#eef8f5]/80" data-testid={`clause-item-${index}`}>
                <button
                  className="group flex w-full cursor-pointer items-center justify-between rounded-lg py-2 pr-2 text-left transition-colors"
                  onClick={() => toggleClause(index)}
                  data-testid={`button-toggle-clause-${index}`}
                >
                  <span className="pr-2 text-sm font-medium text-[#1d3b40] transition-colors group-hover:text-[#1f565f] sm:text-base" data-testid={`text-clause-title-${index}`}>
                    {cleanMarkdown(clause.title)}
                  </span>
                  {expandedClauses.has(index) ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-[#5c7d82] transition-colors group-hover:text-[#1f565f]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#5c7d82] transition-colors group-hover:text-[#1f565f]" />
                  )}
                </button>
                {expandedClauses.has(index) && (
                  <div className="mt-3 space-y-3" data-testid={`clause-content-${index}`}>
                    <div>
                      <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h5 className="text-xs font-medium text-foreground sm:text-sm">Original Text</h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 text-xs ${copiedItems.has(`clause-original-${index}`) ? 'text-primary' : ''}`}
                          onClick={() => copyToClipboard(clause.originalText, `clause-original-${index}`, 'Original clause text')}
                          data-testid={`button-copy-original-${index}`}
                          aria-label="Copy original clause text"
                        >
                          {copiedItems.has(`clause-original-${index}`) ? (
                            <>
                              <Check className="mr-1.5 h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground break-words sm:text-sm" data-testid={`text-clause-original-${index}`}>
                        {cleanMarkdown(clause.originalText)}
                      </p>
                    </div>
                    <div>
                      <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h5 className="text-xs font-medium text-foreground sm:text-sm">Plain Language</h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 text-xs ${copiedItems.has(`clause-simplified-${index}`) ? 'text-primary' : ''}`}
                          onClick={() => copyToClipboard(clause.simplifiedText, `clause-simplified-${index}`, 'Simplified clause text')}
                          data-testid={`button-copy-simplified-${index}`}
                          aria-label="Copy simplified clause text"
                        >
                          {copiedItems.has(`clause-simplified-${index}`) ? (
                            <>
                              <Check className="mr-1.5 h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm leading-relaxed text-[#1d3b40] break-words" data-testid={`text-clause-simplified-${index}`}>
                        {cleanMarkdown(clause.simplifiedText)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`w-full text-xs ${copiedItems.has(`clause-full-${index}`) ? 'border-primary text-primary bg-primary/5' : ''}`}
                      onClick={() => {
                        const fullClause = `Title: ${clause.title}\n\nOriginal Text:\n${clause.originalText}\n\nPlain Language:\n${clause.simplifiedText}`;
                        copyToClipboard(fullClause, `clause-full-${index}`, 'Full clause');
                      }}
                      data-testid={`button-copy-full-clause-${index}`}
                      aria-label="Copy full clause to clipboard"
                    >
                      {copiedItems.has(`clause-full-${index}`) ? (
                        <>
                          <Check className="mr-2 h-3.5 w-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Copy Full Clause
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground" data-testid="text-no-clauses">
              {t("risk.noRisks")}
            </p>
          )}
        </div>
      </div>

      {showChat && (
        <div className="my-2 border-y border-[#2d575e]/12 py-5" data-testid="section-qa-chat">
          <QAChat analysisId={analysis.id} documentContent={documentData.content} />
        </div>
      )}

      {/* Action Recommendations */}
      <div className="analysis-card" data-testid="card-recommendations">
        <h3 className="mb-3 sm:mb-4 text-base font-semibold text-foreground sm:text-lg" data-testid="text-recommendations-title">
          {t("analysis.recommendations")}
        </h3>
        <div className="space-y-4">
          {analysis.recommendations && analysis.recommendations.length > 0 ? (
            analysis.recommendations.map((rec: any, index: number) => (
              <div key={index} className="flex items-start space-x-3 border-l-2 border-[#2f5960]/20 pl-4" data-testid={`recommendation-item-${index}`}>
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                  <span className="text-xs font-medium text-primary-foreground" data-testid={`text-rec-priority-${index}`}>
                    {rec.priority || index + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="mb-2 text-sm font-medium text-foreground sm:text-base" data-testid={`text-rec-title-${index}`}>
                    {cleanMarkdown(rec.title)}
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm" data-testid={`text-rec-description-${index}`}>
                    {cleanMarkdown(rec.description)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground" data-testid="text-no-recommendations">
              {t("risk.noRisks")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}