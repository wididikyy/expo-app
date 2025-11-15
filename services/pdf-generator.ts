import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SintaAnalysisResult } from './sinta-service';

interface ReportData {
  journalTitle: string;
  analysisDate: Date;
  analysis: SintaAnalysisResult;
}

export const generatePDFReport = async (data: ReportData): Promise<string> => {
  try {
    const html = generateReportHTML(data);
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    return uri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generateAndShareReport = async (data: ReportData) => {
  try {
    const pdfUri = await generatePDFReport(data);
    
    // FIXED: Just share the PDF directly without moving it
    // The Print.printToFileAsync already saves to a temporary location
    
    // Share the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share SINTA Analysis Report',
        UTI: 'com.adobe.pdf',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

    return pdfUri;
  } catch (error) {
    console.error('Error sharing report:', error);
    throw error;
  }
};

const generateReportHTML = (data: ReportData): string => {
  const { journalTitle, analysisDate, analysis } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SINTA Analysis Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: #fff;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #007AFF;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #007AFF;
      margin-bottom: 10px;
    }
    
    .report-title {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    
    .report-date {
      font-size: 12px;
      color: #666;
    }
    
    .journal-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .journal-title {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }
    
    .analysis-date {
      font-size: 14px;
      color: #666;
    }
    
    .score-section {
      background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .sinta-level {
      font-size: 42px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .metrics {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
    }
    
    .metric {
      text-align: center;
    }
    
    .metric-value {
      font-size: 36px;
      font-weight: bold;
      display: block;
    }
    
    .metric-label {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 5px;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #007AFF;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #E5E5EA;
    }
    
    .section-content {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
    }
    
    .list-item {
      padding: 12px 0;
      border-bottom: 1px solid #E5E5EA;
    }
    
    .list-item:last-child {
      border-bottom: none;
    }
    
    .item-bullet {
      display: inline-block;
      width: 24px;
      height: 24px;
      background: #007AFF;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      margin-right: 10px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .warning-bullet {
      background: #FF9800;
    }
    
    .success-bullet {
      background: #34C759;
    }
    
    .detail-section {
      background: white;
      border: 1px solid #E5E5EA;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .detail-title {
      font-size: 14px;
      font-weight: bold;
      color: #007AFF;
      margin-bottom: 10px;
    }
    
    .detail-content {
      font-size: 13px;
      color: #555;
      line-height: 1.6;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #E5E5EA;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .footer-logo {
      font-weight: bold;
      color: #007AFF;
      font-size: 14px;
      margin-bottom: 5px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">📱 SintaScan AI</div>
    <div class="report-title">Journal Analysis Report</div>
    <div class="report-date">Generated on ${analysisDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}</div>
  </div>

  <div class="journal-info">
    <div class="journal-title">${journalTitle}</div>
    <div class="analysis-date">Analyzed: ${analysisDate.toLocaleDateString('id-ID')}</div>
  </div>

  <div class="score-section">
    <div class="sinta-level">⭐ ${analysis.sintaLevel}</div>
    <div class="metrics">
      <div class="metric">
        <span class="metric-value">${analysis.publishabilityScore}</span>
        <span class="metric-label">Publishability Score</span>
      </div>
      <div class="metric">
        <span class="metric-value">${analysis.completeness}%</span>
        <span class="metric-label">Completeness</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">⚠️ Issues & Weaknesses</div>
    <div class="section-content">
      ${analysis.weaknesses.map((weakness: any, idx: number) => `
        <div class="list-item">
          <span class="item-bullet warning-bullet">${idx + 1}</span>
          ${weakness}
        </div>
      `).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">💡 Improvement Suggestions</div>
    <div class="section-content">
      ${analysis.suggestions.map((suggestion: any, idx: any) => `
        <div class="list-item">
          <span class="item-bullet success-bullet">✓</span>
          ${suggestion}
        </div>
      `).join('')}
    </div>
  </div>

  <div class="page-break"></div>

  <div class="section">
    <div class="section-title">📋 Detailed Analysis</div>
    
    <div class="detail-section">
      <div class="detail-title">Title & Keywords</div>
      <div class="detail-content">${analysis.detailedAnalysis.title}</div>
    </div>

    <div class="detail-section">
      <div class="detail-title">Abstract</div>
      <div class="detail-content">${analysis.detailedAnalysis.abstract}</div>
    </div>

    <div class="detail-section">
      <div class="detail-title">Methodology</div>
      <div class="detail-content">${analysis.detailedAnalysis.methodology}</div>
    </div>

    <div class="detail-section">
      <div class="detail-title">Results & Discussion</div>
      <div class="detail-content">${analysis.detailedAnalysis.results}</div>
    </div>

    <div class="detail-section">
      <div class="detail-title">References</div>
      <div class="detail-content">${analysis.detailedAnalysis.references}</div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-logo">SintaScan AI</div>
    <div>Powered by Google Gemini AI</div>
    <div>This report is generated automatically and should be used as a reference only.</div>
  </div>
</body>
</html>
  `;
};

// Generate simple text summary
export const generateTextSummary = (data: ReportData): string => {
  const { journalTitle, analysisDate, analysis } = data;
  
  return `
SINTA ANALYSIS REPORT
=====================

Journal: ${journalTitle}
Date: ${analysisDate.toLocaleDateString('id-ID')}

PREDICTION
----------
SINTA Level: ${analysis.sintaLevel}
Publishability Score: ${analysis.publishabilityScore}/100
Completeness: ${analysis.completeness}%

ISSUES FOUND (${analysis.weaknesses.length})
-------------
${analysis.weaknesses.map((w: any, i: number) => `${i + 1}. ${w}`).join('\n')}

SUGGESTIONS (${analysis.suggestions.length})
-----------
${analysis.suggestions.map((s: any, i: number) => `${i + 1}. ${s}`).join('\n')}

DETAILED ANALYSIS
-----------------

Title & Keywords:
${analysis.detailedAnalysis.title}

Abstract:
${analysis.detailedAnalysis.abstract}

Methodology:
${analysis.detailedAnalysis.methodology}

Results:
${analysis.detailedAnalysis.results}

References:
${analysis.detailedAnalysis.references}

---
Generated by SintaScan AI
Powered by Google Gemini
  `.trim();
};