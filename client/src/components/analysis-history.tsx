import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Eye, Trash2, X, AlertTriangle } from "lucide-react";
import API_ENDPOINTS from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AnalysisDetailModal from "./analysis-detail-modal";
import { useTranslation } from "react-i18next";

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

export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<Analysis | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      console.log('[History] Fetching analysis history...');
      const response = await fetch(API_ENDPOINTS.history, {
        credentials: 'include',
      });
      console.log('[History] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[History] Fetched analyses:', data);
        setAnalyses(data || []);
        setError(null);
      } else if (response.status === 401) {
        console.warn('[History] Not authenticated');
        setError('Please log in to view history');
      } else {
        const errorData = await response.text();
        console.error('[History] Error response:', errorData);
        setError('Failed to load history');
      }
    } catch (error) {
      console.error('[History] Fetch error:', error);
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleViewAnalysis = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setModalOpen(true);
    console.log('Opening modal for analysis:', analysis.id);
  };

  const handleDeleteClick = (analysis: Analysis) => {
    setAnalysisToDelete(analysis);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!analysisToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(API_ENDPOINTS.historyItem(analysisToDelete.id), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete analysis');
      }

      // Remove the deleted analysis from the list
      setAnalyses(analyses.filter(a => a.id !== analysisToDelete.id));
      setDeleteDialogOpen(false);
      setAnalysisToDelete(null);

      toast({
        title: t('common.success'),
        description: t('history.deleteSuccess'),
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: t('common.error'),
        description: t('history.deleteFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>Loading your previous analyses...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>Error loading history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-red-500">{error}</p>
            <Button 
              onClick={fetchHistory} 
              variant="outline" 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>Your previous analyses will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No analyses yet. Upload a document to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>Your previous document analyses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getRiskBadgeColor(analysis.riskLevel)}>
                      {analysis.riskLevel.toUpperCase()} RISK
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {analysis.wordCount} words
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                    {analysis.summary}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {analysis.processingTime}
                    </div>
                    <span>{formatDate(analysis.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewAnalysis(analysis)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(analysis)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <AnalysisDetailModal
        analysis={selectedAnalysis}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Custom Delete Disclaimer Modal */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-0 animate-in fade-in duration-200">
          <div className="w-full max-w-md mx-auto transform transition-all animate-in zoom-in-95 slide-in-from-bottom-8 sm:slide-in-from-bottom-0">
            <div className="bg-gradient-to-b from-white to-white rounded-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              
              {/* Close Button - Top Right */}
              <button
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 z-10"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>

              {/* Danger Icon Header */}
              <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 px-6 py-8 text-center border-b border-red-100">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-red-100 rounded-full">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {t('history.deleteConfirmTitle')}
                </h2>
                <p className="text-sm text-gray-600">
                  {t('history.deleteConfirmDescription')}
                </p>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                
                {/* Red Warning Band */}
                <div className="relative bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-4 text-white shadow-lg overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <AlertTriangle className="h-32 w-32 absolute -right-8 -top-8" />
                  </div>
                  <div className="relative flex gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-50 mb-1">
                        {t('history.deleteWarning')}
                      </p>
                      <p className="text-sm text-red-100">
                        All associated chat messages and analysis data will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document Info */}
                {analysisToDelete && (
                  <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block">
                      📄 Preview
                    </p>
                    <p className="text-sm text-gray-700 font-medium">
                      {analysisToDelete.summary.substring(0, 100)}
                      {analysisToDelete.summary.length > 100 ? '...' : ''}
                    </p>
                  </div>
                )}

                {/* Checklist */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3 text-gray-700">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-red-600">✓</span>
                    </div>
                    <span>This action <strong>cannot be undone</strong></span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-700">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-red-600">✓</span>
                    </div>
                    <span>All chat history will be <strong>deleted</strong></span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-700">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-red-600">✓</span>
                    </div>
                    <span>Data will be <strong>permanently removed</strong> from our servers</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <button
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setAnalysisToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('history.deleteCancel')}
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('history.deleting')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      <span>{t('history.deleteButton')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}