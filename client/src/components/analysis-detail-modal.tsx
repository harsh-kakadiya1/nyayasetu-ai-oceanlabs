import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";

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

interface AnalysisDetailModalProps {
  analysis: Analysis | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const parseJsonString = (str: string): any => {
  try {
    return typeof str === 'string' ? JSON.parse(str) : str;
  } catch {
    return str;
  }
};

export default function AnalysisDetailModal({ analysis, open, onOpenChange }: AnalysisDetailModalProps) {
  if (!analysis) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return null;
    }
  };

  const renderRiskItem = (item: any) => {
    const parsed = parseJsonString(item);
    if (typeof parsed === 'string') {
      return parsed;
    }
    if (parsed.level || parsed.title || parsed.description) {
      return (
        <div className="space-y-2">
          {parsed.title && (
            <div>
              <p className="font-semibold text-red-900">{parsed.title}</p>
            </div>
          )}
          {parsed.description && (
            <p className="text-sm text-red-800 leading-relaxed">{parsed.description}</p>
          )}
          {parsed.section && (
            <p className="text-xs text-red-700 italic">Section: {parsed.section}</p>
          )}
        </div>
      );
    }
    return JSON.stringify(parsed);
  };

  const renderClause = (clause: any) => {
    const parsed = parseJsonString(clause);
    if (typeof parsed === 'string') {
      return parsed;
    }
    if (parsed.title || parsed.originalText || parsed.simplifiedText) {
      return (
        <div className="space-y-2">
          {parsed.title && (
            <p className="font-semibold text-blue-900">{parsed.title}</p>
          )}
          {parsed.simplifiedText && (
            <p className="text-sm text-blue-800 leading-relaxed">{parsed.simplifiedText}</p>
          )}
          {parsed.originalText && !parsed.simplifiedText && (
            <p className="text-sm text-blue-800 leading-relaxed">{parsed.originalText}</p>
          )}
          {parsed.section && (
            <p className="text-xs text-blue-700 italic">Section: {parsed.section}</p>
          )}
        </div>
      );
    }
    return JSON.stringify(parsed);
  };

  const renderRecommendation = (rec: any) => {
    const parsed = parseJsonString(rec);
    if (typeof parsed === 'string') {
      return parsed;
    }
    if (parsed.title || parsed.description) {
      return (
        <div className="space-y-2">
          {parsed.title && (
            <p className="font-semibold text-amber-900">{parsed.title}</p>
          )}
          {parsed.description && (
            <p className="text-sm text-amber-800 leading-relaxed">{parsed.description}</p>
          )}
          {parsed.actionType && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs bg-amber-50">
                {parsed.actionType}
              </Badge>
            </div>
          )}
        </div>
      );
    }
    return JSON.stringify(parsed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getRiskIcon(analysis.riskLevel)}
              <span>Analysis Details - {analysis.riskLevel.toUpperCase()} Risk</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 uppercase tracking-wide font-semibold mb-2">Word Count</p>
                <p className="text-2xl font-bold text-blue-900">{analysis.wordCount.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-700 uppercase tracking-wide font-semibold mb-2">Processing Time</p>
                <p className="text-2xl font-bold text-purple-900">{analysis.processingTime}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-700 uppercase tracking-wide font-semibold mb-2">Analyzed On</p>
                <p className="text-sm font-bold text-slate-900">
                  {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-lg text-slate-900 mb-3">📋 Summary</h3>
              <p className="text-slate-700 leading-relaxed text-base">{analysis.summary}</p>
            </div>

            {/* Key Terms */}
            {analysis.keyTerms && Object.keys(analysis.keyTerms).length > 0 && (
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-3">🏷️ Key Terms</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysis.keyTerms).map(([key, value]: any) => (
                    <Badge key={key} variant="outline" className="text-sm py-1">
                      <span className="font-semibold">{key}:</span>
                      <span className="ml-1">{Array.isArray(value) ? value.join(", ") : String(value)}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Items */}
            {analysis.riskItems && analysis.riskItems.length > 0 && (
              <div>
                <h3 className="font-bold text-lg text-red-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Items ({analysis.riskItems.length})
                </h3>
                <div className="space-y-3">
                  {analysis.riskItems.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      {renderRiskItem(item)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clauses */}
            {analysis.clauses && analysis.clauses.length > 0 && (
              <div>
                <h3 className="font-bold text-lg text-blue-900 mb-3">📄 Key Clauses ({analysis.clauses.length})</h3>
                <div className="space-y-3">
                  {analysis.clauses.map((clause: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      {renderClause(clause)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <h3 className="font-bold text-lg text-amber-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Recommendations ({analysis.recommendations.length})
                </h3>
                <div className="space-y-3">
                  {analysis.recommendations.map((rec: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      {renderRecommendation(rec)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
