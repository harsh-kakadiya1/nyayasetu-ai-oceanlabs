import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Eye } from "lucide-react";
import API_ENDPOINTS from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AnalysisDetailModal from "./analysis-detail-modal";

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
  const { toast } = useToast();

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
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={() => handleViewAnalysis(analysis)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
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
    </>
  );
}