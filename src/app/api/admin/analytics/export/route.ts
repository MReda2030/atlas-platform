import { NextRequest, NextResponse } from 'next/server';
import { ReportData, ReportFilters } from '@/app/admin/analytics/page';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportData, filters, reportType, format, exportAll } = body;

    console.log('Exporting admin report:', { reportType, format, exportAll });

    // If exportAll is true and no reportData provided, generate fresh data
    let dataToExport = reportData;
    if (exportAll && !reportData) {
      console.log('Generating fresh data for export all...');
      // Generate fresh report data using the analytics generation logic
      const generateResponse = await fetch(`${request.nextUrl.origin}/api/admin/analytics/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          filters,
          aggregation: 'daily',
          visualization: 'both'
        })
      });
      
      if (generateResponse.ok) {
        const result = await generateResponse.json();
        dataToExport = result.data;
      } else {
        throw new Error('Failed to generate data for export all');
      }
    }

    const exportLabel = exportAll ? 'ALL-DATA' : 'FILTERED';
    
    switch (format) {
      case 'pdf':
        return await exportToPDF(dataToExport, filters, reportType, exportLabel);
      case 'excel':
        return await exportToExcel(dataToExport, filters, reportType, exportLabel);
      case 'csv':
        return await exportToCSV(dataToExport, filters, reportType, exportLabel);
      default:
        return NextResponse.json({ error: 'Invalid export format' }, { status: 400 });
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}

async function exportToPDF(reportData: ReportData, filters: ReportFilters, reportType: string, exportLabel: string = 'FILTERED') {
  const doc = new jsPDF();
  const { overview, agentPerformance } = reportData;
  
  // Title
  doc.setFontSize(20);
  doc.text('ATLAS TRAVEL ANALYTICS REPORT', 20, 30);
  doc.setFontSize(16);
  doc.text(`${reportType.replace('_', ' ').toUpperCase()} (${exportLabel})`, 20, 45);
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
  doc.text(`Period: ${filters.dateRange.start} to ${filters.dateRange.end}`, 20, 65);
  if (exportLabel === 'ALL-DATA') {
    doc.text('Note: This export contains ALL available data (no filters applied)', 20, 75);
  }
  
  // Executive Summary
  doc.setFontSize(14);
  doc.text('EXECUTIVE SUMMARY', 20, 85);
  doc.setFontSize(10);
  doc.text(`Total Investment: $${overview.totalSpend.toLocaleString()}`, 20, 100);
  doc.text(`Total Deals: ${overview.totalDeals}`, 20, 110);
  doc.text(`Cost per Deal: $${overview.costPerDeal.toFixed(2)}`, 20, 120);
  doc.text(`Overall ROI: ${overview.roi.toFixed(1)}%`, 20, 130);
  doc.text(`Conversion Rate: ${overview.conversionRate.toFixed(1)}%`, 20, 140);
  doc.text(`Quality Score: ${overview.averageQualityScore.toFixed(1)}/5`, 20, 150);
  
  // Agent Performance Table
  const tableData = agentPerformance.map(agent => [
    agent.agentNumber,
    agent.agentName,
    `$${agent.totalSpend.toLocaleString()}`,
    agent.totalDeals.toString(),
    `$${agent.costPerDeal.toFixed(0)}`,
    `${agent.roi.toFixed(1)}%`,
    `${agent.conversionRate.toFixed(1)}%`,
    agent.qualityScore.toFixed(1)
  ]);
  
  autoTable(doc, {
    head: [['Agent #', 'Name', 'Spend', 'Deals', 'Cost/Deal', 'ROI', 'Conv. Rate', 'Quality']],
    body: tableData,
    startY: 170,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  const pdfBuffer = doc.output('arraybuffer');
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="atlas-analytics-${reportType}-${exportLabel}-${new Date().toISOString().split('T')[0]}.pdf"`
    }
  });
}

async function exportToExcel(reportData: ReportData, filters: ReportFilters, reportType: string, exportLabel: string = 'FILTERED') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Analytics Report');
  const { overview, agentPerformance } = reportData;
  
  // Title and metadata
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = 'ATLAS TRAVEL ANALYTICS REPORT';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A2:H2');
  worksheet.getCell('A2').value = `${reportType.replace('_', ' ').toUpperCase()} (${exportLabel})`;
  worksheet.getCell('A2').font = { size: 14, bold: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  worksheet.getCell('A3').value = `Generated: ${new Date().toLocaleDateString()}`;
  worksheet.getCell('A4').value = `Period: ${filters.dateRange.start} to ${filters.dateRange.end}`;
  
  // Executive Summary
  worksheet.getCell('A6').value = 'EXECUTIVE SUMMARY';
  worksheet.getCell('A6').font = { bold: true };
  
  worksheet.getCell('A7').value = 'Total Investment:';
  worksheet.getCell('B7').value = `$${overview.totalSpend.toLocaleString()}`;
  worksheet.getCell('A8').value = 'Total Deals:';
  worksheet.getCell('B8').value = overview.totalDeals;
  worksheet.getCell('A9').value = 'Cost per Deal:';
  worksheet.getCell('B9').value = `$${overview.costPerDeal.toFixed(2)}`;
  worksheet.getCell('A10').value = 'Overall ROI:';
  worksheet.getCell('B10').value = `${overview.roi.toFixed(1)}%`;
  
  // Agent Performance Table
  worksheet.getCell('A12').value = 'AGENT PERFORMANCE ANALYSIS';
  worksheet.getCell('A12').font = { bold: true };
  
  const headers = ['Agent #', 'Name', 'Total Spend', 'Deals', 'Cost/Deal', 'ROI %', 'Conv. Rate %', 'Quality'];
  const headerRow = worksheet.getRow(14);
  headers.forEach((header, index) => {
    headerRow.getCell(index + 1).value = header;
    headerRow.getCell(index + 1).font = { bold: true };
    headerRow.getCell(index + 1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2980B9' }
    };
    headerRow.getCell(index + 1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
  });
  
  // Agent data rows
  agentPerformance.forEach((agent, index) => {
    const row = worksheet.getRow(15 + index);
    row.getCell(1).value = agent.agentNumber;
    row.getCell(2).value = agent.agentName;
    row.getCell(3).value = agent.totalSpend;
    row.getCell(4).value = agent.totalDeals;
    row.getCell(5).value = agent.costPerDeal;
    row.getCell(6).value = agent.roi;
    row.getCell(7).value = agent.conversionRate;
    row.getCell(8).value = agent.qualityScore;
  });
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 15;
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="atlas-analytics-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx"`
    }
  });
}

async function exportToCSV(reportData: ReportData, filters: ReportFilters, reportType: string, exportLabel: string = 'FILTERED') {
  const csvContent = generateCSV(reportData, filters, reportType);
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="atlas-analytics-${reportType}-${new Date().toISOString().split('T')[0]}.csv"`
    }
  });
}

function generatePDFContent(reportData: ReportData, filters: ReportFilters, reportType: string): string {
  const { overview, agentPerformance } = reportData;
  
  return `
ATLAS TRAVEL ANALYTICS REPORT
${reportType.replace('_', ' ').toUpperCase()}
Generated: ${new Date().toLocaleDateString()}
Period: ${filters.dateRange.start} to ${filters.dateRange.end}

========================================
EXECUTIVE SUMMARY
========================================

Total Investment: $${overview.totalSpend.toLocaleString()}
Total Deals Closed: ${overview.totalDeals}
Cost per Deal: $${overview.costPerDeal.toFixed(2)}
Overall ROI: ${overview.roi.toFixed(1)}%
Conversion Rate: ${overview.conversionRate.toFixed(1)}%
Average Quality Score: ${overview.averageQualityScore.toFixed(1)}/5

========================================
AGENT PERFORMANCE ANALYSIS
========================================

${agentPerformance.map((agent, index) => `
${index + 1}. Agent ${agent.agentNumber} - ${agent.agentName}
   Total Spend: $${agent.totalSpend.toLocaleString()}
   Deals Closed: ${agent.totalDeals}
   Cost per Deal: $${agent.costPerDeal.toFixed(2)}
   ROI: ${agent.roi.toFixed(1)}%
   Conversion Rate: ${agent.conversionRate.toFixed(1)}%
   Quality Score: ${agent.qualityScore.toFixed(1)}/5
   
   Country Breakdown:
${agent.countryBreakdown.map(country => 
   `   - ${country.country}: $${country.spend.toLocaleString()} spend, ${country.deals} deals, ${country.roi.toFixed(1)}% ROI`
).join('\n')}
`).join('\n')}

========================================
FILTERS APPLIED
========================================

Date Range: ${filters.dateRange.start} to ${filters.dateRange.end}
Target Countries: ${filters.targetCountries.length > 0 ? filters.targetCountries.join(', ') : 'All'}
Branches: ${filters.branches.length > 0 ? filters.branches.join(', ') : 'All'}
Sales Agents: ${filters.salesAgents.length > 0 ? `${filters.salesAgents.length} selected` : 'All'}
Platforms: ${filters.platforms.length > 0 ? filters.platforms.join(', ') : 'All'}
${filters.minROI ? `Minimum ROI: ${filters.minROI}%` : ''}
${filters.minConversionRate ? `Minimum Conversion Rate: ${filters.minConversionRate}%` : ''}

========================================
METHODOLOGY
========================================

This report uses the "magic" Date + Agent + Country matching methodology 
described in the Atlas specification. ROI calculations are based on:

1. Media spend data from campaign reports
2. Sales data from deal closure reports  
3. Matching records by date, agent, and target country
4. Assumed average revenue of $500 per deal for ROI calculations

========================================
GENERATED BY ATLAS ANALYTICS SYSTEM
Report ID: ${reportType}-${Date.now()}
========================================
`;
}

function generateExcelCSV(reportData: ReportData, filters: ReportFilters, reportType: string): string {
  const { overview, agentPerformance } = reportData;
  
  const rows = [
    // Header with report info
    ['ATLAS TRAVEL ANALYTICS REPORT'],
    [reportType.replace('_', ' ').toUpperCase()],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [`Period: ${filters.dateRange.start} to ${filters.dateRange.end}`],
    [],
    
    // Executive Summary
    ['EXECUTIVE SUMMARY'],
    ['Metric', 'Value'],
    ['Total Investment', `$${overview.totalSpend.toLocaleString()}`],
    ['Total Deals', overview.totalDeals.toString()],
    ['Cost per Deal', `$${overview.costPerDeal.toFixed(2)}`],
    ['Overall ROI', `${overview.roi.toFixed(1)}%`],
    ['Conversion Rate', `${overview.conversionRate.toFixed(1)}%`],
    ['Average Quality Score', `${overview.averageQualityScore.toFixed(1)}/5`],
    [],
    
    // Agent Performance Table
    ['AGENT PERFORMANCE ANALYSIS'],
    ['Agent Number', 'Agent Name', 'Total Spend', 'Deals Closed', 'Cost per Deal', 'ROI %', 'Conversion Rate %', 'Quality Score'],
    
    // Agent data rows
    ...agentPerformance.map(agent => [
      agent.agentNumber,
      agent.agentName,
      agent.totalSpend.toFixed(2),
      agent.totalDeals.toString(),
      agent.costPerDeal.toFixed(2),
      agent.roi.toFixed(1),
      agent.conversionRate.toFixed(1),
      agent.qualityScore.toFixed(1)
    ]),
    
    [],
    ['COUNTRY BREAKDOWN BY TOP AGENT'],
    ['Country', 'Spend', 'Deals', 'ROI %'],
    
    // Country breakdown for top agent
    ...(agentPerformance.length > 0 ? agentPerformance[0].countryBreakdown.map(country => [
      country.country,
      country.spend.toFixed(2),
      country.deals.toString(),
      country.roi.toFixed(1)
    ]) : []),
    
    [],
    ['FILTERS APPLIED'],
    ['Filter Type', 'Value'],
    ['Date Range', `${filters.dateRange.start} to ${filters.dateRange.end}`],
    ['Target Countries', filters.targetCountries.length > 0 ? filters.targetCountries.join('; ') : 'All'],
    ['Branches', filters.branches.length > 0 ? filters.branches.join('; ') : 'All'],
    ['Sales Agents', filters.salesAgents.length > 0 ? `${filters.salesAgents.length} selected` : 'All'],
    ['Platforms', filters.platforms.length > 0 ? filters.platforms.join('; ') : 'All'],
    ['Minimum ROI', filters.minROI ? `${filters.minROI}%` : 'None'],
    ['Minimum Conversion Rate', filters.minConversionRate ? `${filters.minConversionRate}%` : 'None']
  ];
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function generateCSV(reportData: ReportData, filters: ReportFilters, reportType: string): string {
  const { agentPerformance } = reportData;
  
  const headers = [
    'Agent Number',
    'Agent Name', 
    'Total Spend',
    'Deals Closed',
    'Cost per Deal',
    'ROI Percentage',
    'Conversion Rate',
    'Quality Score'
  ];
  
  const rows = [
    headers,
    ...agentPerformance.map(agent => [
      agent.agentNumber,
      agent.agentName,
      agent.totalSpend.toFixed(2),
      agent.totalDeals.toString(),
      agent.costPerDeal.toFixed(2),
      agent.roi.toFixed(1),
      agent.conversionRate.toFixed(1),
      agent.qualityScore.toFixed(1)
    ])
  ];
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}