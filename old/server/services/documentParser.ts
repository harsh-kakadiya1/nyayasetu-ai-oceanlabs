import * as path from "path";
import * as mammoth from "mammoth";

// Set up comprehensive polyfills for Node.js environment
if (typeof global !== 'undefined') {
  // Mock DOMMatrix for Node.js
  if (!(global as any).DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix {
      a: number; b: number; c: number; d: number; e: number; f: number;
      constructor() {
        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
      }
    };
  }
  
  // Mock DOMPoint for Node.js
  if (!(global as any).DOMPoint) {
    (global as any).DOMPoint = class DOMPoint {
      x: number; y: number; z: number; w: number;
      constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x; this.y = y; this.z = z; this.w = w;
      }
    };
  }
  
  // Mock other browser APIs that might be needed
  if (!(global as any).DOMRect) {
    (global as any).DOMRect = class DOMRect {
      x: number; y: number; width: number; height: number;
      constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x; this.y = y; this.width = width; this.height = height;
      }
    };
  }
}

export interface ParsedDocument {
  content: string;
  wordCount: number;
  filename?: string;
}

export async function parseTextBuffer(buffer: Buffer, filename: string): Promise<ParsedDocument> {
  try {
    const content = buffer.toString('utf-8');
    const wordCount = content.trim().split(/\s+/).length;
    
    return {
      content: content.trim(),
      wordCount,
      filename
    };
  } catch (error) {
    throw new Error(`Failed to parse text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parseDocxBuffer(buffer: Buffer, filename: string): Promise<ParsedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const content = result.value.trim();
    
    if (!content) {
      throw new Error("No text content found in DOCX file.");
    }
    
    const wordCount = content.split(/\s+/).length;
    
    return {
      content,
      wordCount,
      filename
    };
  } catch (error) {
    throw new Error(`Failed to parse DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parsePdfBuffer(buffer: Buffer, filename: string): Promise<ParsedDocument> {
  try {
    // Use pdf2json for reliable server-side PDF text extraction
    // Dynamically import pdf2json to avoid initialization issues
    const PDFParser = (await import('pdf2json')).default;
    
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(new Error(`PDF parsing failed: ${errData.parserError}`));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          let fullText = '';
          
          if (pdfData.Pages) {
            pdfData.Pages.forEach((page: any) => {
              if (page.Texts) {
                page.Texts.forEach((text: any) => {
                  if (text.R && text.R.length > 0) {
                    text.R.forEach((r: any) => {
                      if (r.T) {
                        try {
                          fullText += decodeURIComponent(r.T) + ' ';
                        } catch (e) {
                          // If decoding fails, use the raw text
                          fullText += r.T + ' ';
                        }
                      }
                    });
                  }
                });
                fullText += '\n';
              }
            });
          }
          
          const content = fullText.trim();
          
          if (!content || content.length < 10) {
            reject(new Error("No readable text content found in PDF file. The PDF might be image-based or corrupted."));
            return;
          }
          
          const wordCount = content.split(/\s+/).length;
          
          resolve({
            content,
            wordCount,
            filename
          });
        } catch (error) {
          reject(new Error(`Failed to process PDF content: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });
      
      // Parse the PDF buffer
      pdfParser.parseBuffer(buffer);
    });
    
  } catch (error) {
    console.error("PDF parsing error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Provide specific error messages based on error type
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('invalid pdf') || errorMessage.includes('not a pdf') || errorMessage.includes('invalid pdf structure')) {
        throw new Error("Invalid PDF file format. Please ensure the PDF is not password-protected and try again.");
      }
      
      if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
        throw new Error("This PDF is password-protected. Please remove the password or convert to DOCX/TXT format.");
      }
      
      if (errorMessage.includes('no readable text') || errorMessage.includes('no text')) {
        throw new Error("No readable text found in the PDF. This might be an image-based PDF. Please try converting to DOCX or TXT format.");
      }
      
      if (errorMessage.includes('timeout') || errorMessage.includes('too large')) {
        throw new Error("PDF parsing timed out. The file might be too large or complex. Please try a smaller PDF or convert to DOCX/TXT format.");
      }
      
      if (errorMessage.includes('corrupted') || errorMessage.includes('malformed')) {
        throw new Error("The PDF file appears to be corrupted or in an unsupported format. Please try converting to DOCX or TXT format.");
      }
    }
    
    // Generic fallback error message
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try converting your PDF to DOCX or TXT format, or copy and paste the text directly into the text input field.`);
  }
}

export async function parseUploadedDocument(file: Express.Multer.File): Promise<ParsedDocument> {
  const extension = path.extname(file.originalname).toLowerCase();
  
  try {
    switch (extension) {
      case '.txt':
        return await parseTextBuffer(file.buffer, file.originalname);
      case '.docx':
        return await parseDocxBuffer(file.buffer, file.originalname);
      case '.pdf':
        return await parsePdfBuffer(file.buffer, file.originalname);
      default:
        throw new Error(`Unsupported file type: ${extension}. Please use PDF, DOCX, or TXT files, or paste your text directly.`);
    }
  } catch (error) {
    throw error;
  }
}

export function parseTextContent(text: string): ParsedDocument {
  const content = text.trim();
  const wordCount = content.split(/\s+/).length;
  
  if (!content) {
    throw new Error("Document content is empty");
  }
  
  if (wordCount < 10) {
    throw new Error("Document is too short for meaningful analysis");
  }
  
  return {
    content,
    wordCount
  };
}