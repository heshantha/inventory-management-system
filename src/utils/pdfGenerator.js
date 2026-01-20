import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDateTime } from './calculations';

/**
 * Generate a comprehensive sales report PDF
 * @param {Object} reportData - Report data including stats, products, etc.
 * @param {string} dateRange - Date range label (e.g., "Today", "Last 7 Days")
 * @param {Object} shopInfo - Shop information for header
 */
export const generateSalesReportPDF = (reportData, dateRange, shopInfo) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Colors
    const primaryColor = [59, 130, 246]; // Blue
    const textColor = [31, 41, 55]; // Gray-800
    const lightGray = [243, 244, 246]; // Gray-100
    const darkGray = [107, 114, 128]; // Gray-500

    // Header - Shop Information
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(shopInfo?.name || 'Sales Report', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (shopInfo?.address) {
        doc.text(shopInfo.address, pageWidth / 2, 23, { align: 'center' });
    }
    if (shopInfo?.phone) {
        doc.text(`Phone: ${shopInfo.phone}`, pageWidth / 2, 30, { align: 'center' });
    }

    yPosition = 50;

    // Report Title and Date Range
    doc.setTextColor(...textColor);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Sales Report', 14, yPosition);

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.text(`Period: ${dateRange}`, 14, yPosition + 7);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, yPosition + 14);

    yPosition += 25;

    // Key Metrics Section
    doc.setFillColor(...lightGray);
    doc.rect(14, yPosition, pageWidth - 28, 8, 'F');

    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('KEY METRICS', 16, yPosition + 5.5);

    yPosition += 12;

    // Metrics Table
    const metricsData = [
        ['Total Revenue', formatCurrency(reportData.totalRevenue || 0)],
        ['Total Sales', (reportData.totalSales || 0).toString()],
        ['Average Order Value', formatCurrency(reportData.averageOrderValue || 0)],
        ['Total Discounts', formatCurrency(reportData.totalDiscounts || 0)],
        ['Total Tax Collected', formatCurrency(reportData.totalTax || 0)],
    ];

    doc.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: metricsData,
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
        },
        bodyStyles: {
            fontSize: 10,
            textColor: textColor,
        },
        alternateRowStyles: {
            fillColor: lightGray,
        },
        margin: { left: 14, right: 14 },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
        },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Top Selling Products Section
    if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
    }

    doc.setFillColor(...lightGray);
    doc.rect(14, yPosition, pageWidth - 28, 8, 'F');

    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOP SELLING PRODUCTS', 16, yPosition + 5.5);

    yPosition += 12;

    if (reportData.topProducts && reportData.topProducts.length > 0) {
        const topProductsData = reportData.topProducts.map((product, index) => [
            `#${index + 1}`,
            product.name,
            product.quantity.toString(),
            formatCurrency(product.revenue),
        ]);

        doc.autoTable({
            startY: yPosition,
            head: [['Rank', 'Product Name', 'Units Sold', 'Revenue']],
            body: topProductsData,
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
            },
            bodyStyles: {
                fontSize: 9,
                textColor: textColor,
            },
            alternateRowStyles: {
                fillColor: lightGray,
            },
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 30, halign: 'center' },
                3: { cellWidth: 40, halign: 'right' },
            },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(...darkGray);
        doc.text('No sales data available for this period', 16, yPosition + 5);
        yPosition += 20;
    }

    // Payment Methods Breakdown
    if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
    }

    doc.setFillColor(...lightGray);
    doc.rect(14, yPosition, pageWidth - 28, 8, 'F');

    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('PAYMENT METHODS BREAKDOWN', 16, yPosition + 5.5);

    yPosition += 12;

    if (reportData.paymentMethodBreakdown && Object.keys(reportData.paymentMethodBreakdown).length > 0) {
        const paymentData = Object.entries(reportData.paymentMethodBreakdown).map(([method, data]) => [
            method.toUpperCase(),
            data.count.toString(),
            formatCurrency(data.total),
        ]);

        doc.autoTable({
            startY: yPosition,
            head: [['Payment Method', 'Transactions', 'Total Amount']],
            body: paymentData,
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
            },
            bodyStyles: {
                fontSize: 9,
                textColor: textColor,
            },
            alternateRowStyles: {
                fillColor: lightGray,
            },
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 40, halign: 'center' },
                2: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
            },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(...darkGray);
        doc.text('No payment data available', 16, yPosition + 5);
        yPosition += 20;
    }

    // Low Stock Alert Section
    if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
    }

    doc.setFillColor(...lightGray);
    doc.rect(14, yPosition, pageWidth - 28, 8, 'F');

    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('LOW STOCK ALERTS', 16, yPosition + 5.5);

    yPosition += 12;

    if (reportData.lowStockProducts && reportData.lowStockProducts.length > 0) {
        const lowStockData = reportData.lowStockProducts.map((product) => [
            product.name,
            product.sku || 'N/A',
            product.stock_quantity.toString(),
            product.min_stock_level.toString(),
        ]);

        doc.autoTable({
            startY: yPosition,
            head: [['Product Name', 'SKU', 'Current Stock', 'Min Level']],
            body: lowStockData,
            theme: 'grid',
            headStyles: {
                fillColor: [220, 38, 38], // Red for alert
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
            },
            bodyStyles: {
                fontSize: 9,
                textColor: textColor,
            },
            alternateRowStyles: {
                fillColor: [254, 226, 226], // Light red
            },
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 40 },
                2: { cellWidth: 30, halign: 'center', fontStyle: 'bold', textColor: [220, 38, 38] },
                3: { cellWidth: 30, halign: 'center' },
            },
        });

        yPosition = doc.lastAutoTable.finalY + 10;
    } else {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(34, 197, 94); // Green
        doc.text('✓ All products are adequately stocked', 16, yPosition + 5);
        yPosition += 20;
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...darkGray);
        doc.setFont(undefined, 'normal');
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
        doc.text(
            `Generated on ${new Date().toLocaleDateString()}`,
            14,
            pageHeight - 10
        );
    }

    return doc;
};

/**
 * Download the sales report PDF
 * @param {Object} reportData - Report data
 * @param {string} dateRange - Date range label
 * @param {Object} shopInfo - Shop information
 */
export const downloadSalesReportPDF = (reportData, dateRange, shopInfo) => {
    const pdf = generateSalesReportPDF(reportData, dateRange, shopInfo);

    // Generate filename
    const dateRangeSlug = dateRange.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Sales_Report_${dateRangeSlug}_${dateStr}.pdf`;

    // Download
    pdf.save(filename);
};
