import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import RiskAssessment from "./risk-assessment";
import QAChat from "./qa-chat";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
}

export default function AnalysisResults({ analysisData }: AnalysisResultsProps) {
  const { t } = useTranslation();
  const { document, analysis } = analysisData;
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
                              document.documentType || t("upload.documentType");

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Document Summary */}
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6 analysis-card" data-testid="card-document-summary">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-foreground" data-testid="text-summary-title">{t("analysis.summary")}</h3>
          <Badge variant="secondary" className="text-xs self-start sm:self-auto" data-testid="badge-document-type">
            {documentTypeDisplay}
          </Badge>
        </div>
        <div className="prose prose-sm max-w-none">
          <p className="text-sm sm:text-base text-foreground mb-3 sm:mb-4 leading-relaxed" data-testid="text-summary-content">
            {summaryText}
          </p>
          {summaryKeyTerms && Object.keys(summaryKeyTerms).length > 0 && (
            <div className="bg-accent/50 p-3 sm:p-4 rounded-md" data-testid="section-key-terms">
              <div className="flex items-center justify-between mb-2">
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
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6 analysis-card" data-testid="card-clauses-analysis">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4" data-testid="text-clauses-title">
          {t("analysis.clauses")}
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {analysis.clauses && analysis.clauses.length > 0 ? (
            analysis.clauses.map((clause: any, index: number) => (
              <div key={index} className="border border-border rounded-lg overflow-hidden" data-testid={`clause-item-${index}`}>
                <button
                  className="w-full p-3 sm:p-4 text-left bg-muted hover:bg-muted/80 transition-colors flex justify-between items-center"
                  onClick={() => toggleClause(index)}
                  data-testid={`button-toggle-clause-${index}`}
                >
                  <span className="font-medium text-sm sm:text-base text-foreground pr-2" data-testid={`text-clause-title-${index}`}>
                    {clause.title}
                  </span>
                  {expandedClauses.has(index) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {expandedClauses.has(index) && (
                  <div className="p-3 sm:p-4 bg-card border-t border-border" data-testid={`clause-content-${index}`}>
                    <div className="space-y-4">
                      <div className="min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-xs sm:text-sm font-medium text-foreground">Original Text</h5>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-7 px-2 text-xs ${
                                    copiedItems.has(`clause-original-${index}`) ? 'text-primary' : ''
                                  }`}
                                  onClick={() => copyToClipboard(clause.originalText, `clause-original-${index}`, 'Original clause text')}
                                  data-testid={`button-copy-original-${index}`}
                                  aria-label="Copy original clause text"
                                >
                                  {copiedItems.has(`clause-original-${index}`) ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 mr-1.5" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy original text to clipboard</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-xs text-muted-foreground bg-muted/50 p-2 sm:p-3 rounded leading-relaxed break-words" data-testid={`text-clause-original-${index}`}>
                          {clause.originalText}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-xs sm:text-sm font-medium text-foreground">Plain Language</h5>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-7 px-2 text-xs ${
                                    copiedItems.has(`clause-simplified-${index}`) ? 'text-primary' : ''
                                  }`}
                                  onClick={() => copyToClipboard(clause.simplifiedText, `clause-simplified-${index}`, 'Simplified clause text')}
                                  data-testid={`button-copy-simplified-${index}`}
                                  aria-label="Copy simplified clause text"
                                >
                                  {copiedItems.has(`clause-simplified-${index}`) ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 mr-1.5" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy simplified text to clipboard</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground leading-relaxed break-words" data-testid={`text-clause-simplified-${index}`}>
                          {clause.simplifiedText}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`w-full text-xs ${
                                copiedItems.has(`clause-full-${index}`) 
                                  ? 'border-primary text-primary bg-primary/5' 
                                  : ''
                              }`}
                              onClick={() => {
                                const fullClause = `Title: ${clause.title}\n\nOriginal Text:\n${clause.originalText}\n\nPlain Language:\n${clause.simplifiedText}`;
                                copyToClipboard(fullClause, `clause-full-${index}`, 'Full clause');
                              }}
                              data-testid={`button-copy-full-clause-${index}`}
                              aria-label="Copy full clause to clipboard"
                            >
                              {copiedItems.has(`clause-full-${index}`) ? (
                                <>
                                  <Check className="w-3.5 h-3.5 mr-2" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 mr-2" />
                                  Copy Full Clause
                                </>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy complete clause (title, original, and simplified text)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4" data-testid="text-no-clauses">
              {t("risk.noRisks")}
            </p>
          )}
        </div>
      </div>

      {/* Q&A Section */}
      <QAChat analysisId={analysis.id} documentContent={document.content} />

      {/* Action Recommendations */}
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6 analysis-card" data-testid="card-recommendations">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4" data-testid="text-recommendations-title">
          {t("analysis.recommendations")}
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {analysis.recommendations && analysis.recommendations.length > 0 ? (
            analysis.recommendations.map((rec: any, index: number) => (
              <div 
                key={index} 
                className="flex items-start space-x-3 p-3 sm:p-4 bg-accent/30 border border-accent rounded-lg"
                data-testid={`recommendation-item-${index}`}
              >
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-xs text-primary-foreground font-medium" data-testid={`text-rec-priority-${index}`}>
                    {rec.priority || index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm sm:text-base text-foreground mb-2" data-testid={`text-rec-title-${index}`}>
                    {rec.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed" data-testid={`text-rec-description-${index}`}>
                    {rec.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-recommendations">
              {t("risk.noRisks")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}