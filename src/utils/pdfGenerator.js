import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDateTime } from './calculations';

/**
 * Generate a comprehensive sales report PDF
 * @param {Object} reportData - Report data including stats, products, etc.
 * @param {string} dateRange - Date range label (e.g., "Today", "Last 7 Days")
 * @param {Object} shopInfo - Shop information for header
 */
export const generateSalesReportPDF = (reportData, dateRange, shopInfo, reportTitle = 'Sales Report') => {
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
    doc.text(shopInfo?.name || reportTitle, pageWidth / 2, 15, { align: 'center' });

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
    doc.text(reportTitle, 14, yPosition);

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
        ['Total Transactions', (reportData.totalSales || 0).toString()],
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
    const productsTitle = reportTitle.includes('Repair') ? 'TOP REPAIR SERVICES / PARTS' : 'TOP SELLING PRODUCTS';
    doc.text(productsTitle, 16, yPosition + 5.5);

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
            head: [['Rank', 'Item Name', 'Count', 'Revenue']],
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
        doc.text('No data available for this period', 16, yPosition + 5);
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
 * @param {string} reportTitle - Report title (e.g. Sales Report, Repair Report)
 */
export const downloadSalesReportPDF = (reportData, dateRange, shopInfo, reportTitle = 'Sales Report') => {
    const pdf = generateSalesReportPDF(reportData, dateRange, shopInfo, reportTitle);

    // Generate filename
    const dateRangeSlug = dateRange.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${reportTitle.replace(/\s+/g, '_')}_${dateRangeSlug}_${dateStr}.pdf`;

    // Download
    pdf.save(filename);
};
/**
 * Generate Invoice PDF
 * @param {Object} invoice - Invoice data
 * @param {Object} shopInfo - Shop information
 */
export const downloadInvoicePDF = (invoice, shopInfo) => {
    // A4 Landscape
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Centers content on the page (A5 size equivalent centered on A4 or just full A4 landscape)
    // We'll use full A4 landscape but styled nicely.

    // Header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(shopInfo?.name || 'Store Name', 15, 20);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(shopInfo?.address || 'Address', 15, 26);
    doc.text(`Phone: ${shopInfo?.phone || '-'}`, 15, 31);

    // Invoice Title & Details with Right Alignment
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(59, 130, 246); // Primary Blue
    doc.text('INVOICE', pageWidth - 15, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(`#${invoice.invoice_number}`, pageWidth - 15, 28, { align: 'right' });

    doc.setFont(undefined, 'normal');
    const dateStr = new Date(invoice.created_at || Date.now()).toLocaleDateString();
    const timeStr = new Date(invoice.created_at || Date.now()).toLocaleTimeString();
    doc.text(`Date: ${dateStr}`, pageWidth - 15, 34, { align: 'right' });
    doc.text(`Time: ${timeStr}`, pageWidth - 15, 39, { align: 'right' });

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 45, pageWidth - 15, 45);

    // Grid: Customer & Invoice Details
    const colWidth = (pageWidth - 30) / 2;

    // Customer Info (Left)
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.roundedRect(15, 50, colWidth - 5, 35, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Customer Information', 20, 58);

    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${invoice.customer_name || 'Walk-in Customer'}`, 20, 65);
    if (invoice.customer_phone) doc.text(`Phone: ${invoice.customer_phone}`, 20, 70);
    if (invoice.customer_address) doc.text(`Address: ${invoice.customer_address}`, 20, 75);

    // Invoice Meta (Right)
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.roundedRect(15 + colWidth + 5, 50, colWidth - 5, 35, 2, 2, 'F');

    doc.setFont(undefined, 'bold');
    doc.text('Invoice Details', 20 + colWidth + 5, 58);

    doc.setFont(undefined, 'normal');
    doc.text(`Seller: ${shopInfo?.owner_name || 'Admin'}`, 20 + colWidth + 5, 65);
    if (invoice.warranty) doc.text(`Warranty: ${invoice.warranty}`, 20 + colWidth + 5, 70);
    if (invoice.payment_method) doc.text(`Payment: ${invoice.payment_method.replace('_', ' ')}`, 20 + colWidth + 5, 75);

    // Items Table
    const tableStartY = 95;
    const items = invoice.items.map(item => [
        item.name || item.product_name,
        item.quantity.toString(),
        formatCurrency(item.unit_price),
        formatCurrency(item.total_price || (item.quantity * item.unit_price))
    ]);

    doc.autoTable({
        startY: tableStartY,
        head: [['Item', 'Qty', 'Unit Price', 'Total']],
        body: items,
        theme: 'plain',
        headStyles: {
            fillColor: [243, 244, 246],
            textColor: 0,
            fontStyle: 'bold',
            halign: 'left'
        },
        columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
        },
        styles: {
            fontSize: 10,
            cellPadding: 3,
            lineColor: [229, 231, 235],
            lineWidth: 0.1
        },
        margin: { left: 15, right: 15 }
    });

    // Totals Section
    const finalY = doc.lastAutoTable.finalY + 10;
    const totalsX = pageWidth - 80;

    doc.setFontSize(10);

    // Subtotal
    doc.text('Subtotal:', totalsX, finalY);
    doc.text(formatCurrency(invoice.subtotal || 0), pageWidth - 15, finalY, { align: 'right' });

    let currentY = finalY;

    // Discount
    if (invoice.discount_amount > 0) {
        currentY += 6;
        doc.setTextColor(220, 38, 38); // Red
        doc.text('Discount:', totalsX, currentY);
        doc.text(`-${formatCurrency(invoice.discount_amount)}`, pageWidth - 15, currentY, { align: 'right' });
    }

    // Tax
    if (invoice.tax_amount > 0) {
        currentY += 6;
        doc.setTextColor(0, 0, 0);
        doc.text('Tax:', totalsX, currentY);
        doc.text(formatCurrency(invoice.tax_amount), pageWidth - 15, currentY, { align: 'right' });
    }

    // Total
    currentY += 8;
    doc.setDrawColor(0, 0, 0);
    doc.line(totalsX, currentY - 4, pageWidth - 15, currentY - 4);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total Amount:', totalsX, currentY);
    doc.setTextColor(59, 130, 246);
    doc.text(formatCurrency(invoice.total_amount || 0), pageWidth - 15, currentY, { align: 'right' });

    // Payment Method in Summary
    if (invoice.payment_method) {
        currentY += 8;
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.setFont(undefined, 'normal');
        doc.text('Payment Method:', totalsX, currentY);
        doc.text(invoice.payment_method.toUpperCase(), pageWidth - 15, currentY, { align: 'right' });
    }

    // Footer
    const footerY = pageHeight - 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.text('Developed by HL Web Studio', pageWidth / 2, footerY, { align: 'center' });

    // Save
    doc.save(`Invoice_${invoice.invoice_number}.pdf`);
};
