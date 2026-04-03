import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { UploadCloud, FileText, AlertCircle, Crown, ScanSearch, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DocumentUploadProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: any) => void;
  onAnalysisError: () => void;
  isAnalyzing: boolean;
}

export default function DocumentUpload({ 
  onAnalysisStart, 
  onAnalysisComplete, 
  onAnalysisError,
  isAnalyzing 
}: DocumentUploadProps) {
  const { t, i18n } = useTranslation();
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("auto-detect");
  const [summaryLength, setSummaryLength] = useState("standard");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, updateTokens } = useAuth();

  const handleFileSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'text/plain', // TXT
      'application/pdf' // PDF
    ];
    
    if (file.size > maxSize) {
      toast({
        title: t('upload.fileTooLarge'),
        description: t('upload.fileTooLargeDesc'),
        variant: "destructive",
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('upload.invalidFileType'),
        description: t('upload.invalidFileTypeDesc'),
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setTextContent(""); // Clear text input when file is selected
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !textContent.trim()) {
      toast({
        title: t('upload.uploadError'),
        description: t('upload.uploadErrorDesc'),
        variant: "destructive",
      });
      return;
    }

    if ((user?.tokens ?? 0) <= 0) {
      setIsSubscriptionOpen(true);
      return;
    }

    onAnalysisStart();

    try {
      let response;

      if (selectedFile) {
        // Handle file upload
        console.log(`[UPLOAD] Uploading file: ${selectedFile.name}`);
        const formData = new FormData();
        formData.append('document', selectedFile);
        formData.append('documentType', documentType);
        formData.append('summaryLength', summaryLength);
        formData.append('language', i18n.language);

        response = await fetch(API_ENDPOINTS.documents.upload, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        });
        console.log(`[UPLOAD] Upload response status: ${response.status}`);
      } else {
        // Handle text analysis
        console.log('[UPLOAD] Analyzing text content');
        response = await fetch(API_ENDPOINTS.documents.analyzeText, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            content: textContent,
            documentType: documentType === 'auto-detect' ? undefined : documentType,
            summaryLength,
            language: i18n.language,
          }),
        });
        console.log(`[UPLOAD] Analysis response status: ${response.status}`);
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const statusCode = response.status;
        const errorMessage = error.error || 'Analysis failed';
        if (statusCode === 402 || error.code === 'TOKENS_EXHAUSTED') {
          updateTokens(0);
          setIsSubscriptionOpen(true);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[UPLOAD] ✓ Analysis successful');
      if (typeof result.remainingTokens === 'number') {
        updateTokens(result.remainingTokens);
      }
      onAnalysisComplete(result);

      // Reset form
      setSelectedFile(null);
      setTextContent("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error) {
      console.error("[UPLOAD] ✗ Analysis error:", error);
      onAnalysisError();
      
      // Check for specific error types
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let toastTitle = t('upload.analysisError');
      let toastDescription = t('upload.analysisErrorDesc');

      if (errorMessage.includes('No tokens remaining')) {
        return;
      }
      
      if (errorMessage.includes('overloaded') || errorMessage.includes('503')) {
        toastTitle = t('upload.serviceUnavailable');
        toastDescription = t('upload.serviceUnavailableDesc');
      } else if (errorMessage.includes('Failed to fetch')) {
        toastTitle = t('upload.connectionError');
        toastDescription = t('upload.connectionErrorDesc');
      } else if (errorMessage.includes('timeout')) {
        toastTitle = t('upload.timeoutError');
        toastDescription = t('upload.timeoutErrorDesc');
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isSubscriptionOpen} onOpenChange={setIsSubscriptionOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-[#1f565f]/15 bg-white p-6 shadow-[0_20px_40px_rgba(31,86,95,0.15)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-[#1f3c41]">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              Subscription Required
            </DialogTitle>
            <DialogDescription className="text-sm text-[#5f8187] mt-2">
              You have used all 3 free tokens. Subscribe to continue analyzing documents.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-[#1f565f]/15 bg-gradient-to-br from-[#f8f5f0] to-[#f0f7f4] p-4 text-sm">
            <p className="text-[#6b8a90]">Remaining tokens:</p>
            <p className="text-2xl font-bold text-[#1f3c41] mt-1">{user?.tokens ?? 0}</p>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              className="w-full h-11 rounded-lg bg-gradient-to-r from-[#1f565f] to-[#173f46] text-white font-semibold hover:from-[#173f46] hover:to-[#0f2b31] shadow-[0_4px_12px_rgba(31,86,95,0.15)] transition-all duration-300"
              onClick={() => {
                setIsSubscriptionOpen(false);
                window.location.href = "/#pricing";
              }}
            >
              View Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 mb-4 sm:mb-6" data-testid="card-document-upload">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-[#1f3c41]" data-testid="text-upload-title">{t('upload.title')}</h3>
          <p className="text-sm text-[#6b8a90] mt-1">Choose a file or paste text to analyze</p>
        </div>
      
      {/* File Upload Area */}
      <div 
        className={`document-upload-area p-6 sm:p-8 text-center cursor-pointer transition-all border-2 rounded-xl min-h-[140px] sm:min-h-[160px] flex flex-col justify-center ${
          isDragOver 
            ? 'border-[#1f565f] bg-[#e8f7f2] text-[#1f565f]' 
            : 'border-dashed border-[#1f565f]/30 bg-[#f8f5f0] hover:border-[#1f565f]/50 hover:bg-[#f0f7f4] text-inherit'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        data-testid="area-file-drop"
      >
        <UploadCloud className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 ${isDragOver ? 'text-[#1f565f]' : 'text-[#1f565f]/60'}`} />
        {selectedFile ? (
          <>
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-emerald-100 mx-auto mb-3">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
            </div>
            <p className="text-sm sm:text-base font-semibold mb-1 sm:mb-2 px-2" data-testid="text-selected-file">
              {selectedFile.name}
            </p>
            <p className="text-xs sm:text-sm text-[#6b8a90]">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
            </p>
          </>
        ) : (
          <>
            <p className="text-sm sm:text-base font-semibold mb-1 px-2" data-testid="text-drop-instruction">{t('upload.dragAndDrop')}</p>
            <p className="text-xs sm:text-sm text-[#6b8a90] mb-3 px-2">{t('upload.orClickToSelect')}</p>
            <p className="text-[11px] sm:text-xs text-[#6b8a90] px-2" data-testid="text-file-requirements">
              {(() => {
                const formatsText = t('upload.supportedFormats');
                const parts = formatsText.split(/(PDF|DOCX|TXT)/);
                return parts.map((part, index) => 
                  ['PDF', 'DOCX', 'TXT'].includes(part) ? (
                    <span key={index} className="font-semibold text-[#1f565f]">{part}</span>
                  ) : (
                    <span key={index}>{part}</span>
                  )
                );
              })()} • Max 10MB
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleFileInputChange}
          data-testid="input-file-upload"
        />
      </div>

      {/* Text Input Alternative */}
      <div className="pt-1">
        <Label htmlFor="text-input" className="block text-sm font-semibold text-[#1f3c41] mb-2">
          {t('upload.pasteText')}
        </Label>
        <Textarea
          id="text-input"
          className="w-full h-28 sm:h-36 p-3 sm:p-4 resize-none text-sm border-[#1f565f]/30 rounded-lg focus:border-[#1f565f] focus:ring-[#1f565f]/20 focus-visible:ring-[#1f565f]/20 placeholder:text-[#a0b3b6]"
          placeholder={t('upload.textPlaceholder')}
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          disabled={!!selectedFile}
          data-testid="textarea-document-content"
        />
        {selectedFile && (
          <p className="text-xs text-[#7f9a9f] mt-2">
            Text input is disabled when a file is selected. Remove the file to use text input.
          </p>
        )}
      </div>

      {/* Analysis Options */}
      <div className="mt-5 sm:mt-6 space-y-4 p-4 sm:p-5 rounded-xl bg-[#f8f5f0] border border-[#1f565f]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f8187]">Analysis Settings</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="summary-length" className="block text-sm font-semibold text-[#1f3c41] mb-2">
              {t('upload.summaryLength')}
            </Label>
            <Select value={summaryLength} onValueChange={setSummaryLength}>
              <SelectTrigger className="h-10 text-sm border-[#1f565f]/20 rounded-lg" data-testid="select-summary-length">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brief">{t('upload.brief')}</SelectItem>
                <SelectItem value="standard">{t('upload.standard')}</SelectItem>
                <SelectItem value="detailed">{t('upload.detailed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="document-type" className="block text-sm font-semibold text-[#1f3c41] mb-2">
              {t('upload.documentType')}
            </Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="h-10 text-sm border-[#1f565f]/20 rounded-lg" data-testid="select-document-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto-detect">{t('upload.autoDetect')}</SelectItem>
                <SelectItem value="rental-agreement">{t('upload.rental')}</SelectItem>
                <SelectItem value="employment-contract">{t('upload.employment')}</SelectItem>
                <SelectItem value="service-agreement">{t('upload.nda')}</SelectItem>
                <SelectItem value="purchase-agreement">{t('upload.terms')}</SelectItem>
                <SelectItem value="other">{t('upload.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

        <Button 
          className="w-full mt-6 h-11 rounded-lg bg-gradient-to-r from-[#1f565f] to-[#173f46] text-white font-semibold hover:from-[#173f46] hover:to-[#0f2b31] shadow-[0_4px_12px_rgba(31,86,95,0.15)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleAnalyze}
          disabled={isAnalyzing || (!selectedFile && !textContent.trim())}
          data-testid="button-analyze-document"
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="loading-dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
              {t('upload.analyzing')}
            </div>
          ) : (
            <>
              <ScanSearch className="w-4 h-4 mr-2" />
              {t('upload.analyze')}
            </>
          )}
        </Button>
      </div>
    </>
  );
}
