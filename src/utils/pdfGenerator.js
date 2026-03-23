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
    // Determine PDF format based on shop setting
    const sz = shopInfo?.invoice_size || 'half_a4';
    let orientation = 'landscape';
    let format = 'a4';

    if (sz === 'thermal') {
        orientation = 'portrait';
        format = [80, 200]; // 80mm width, auto height approximated
    } else if (sz === 'half_a4') {
        orientation = 'landscape';
        format = 'a5'; // A5 is Half A4
    } else if (sz === 'a4_portrait') {
        orientation = 'portrait';
        format = 'a4';
    } else if (sz === 'a4_landscape') {
        orientation = 'landscape';
        format = 'a4';
    }

    const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format
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

/**
 * Generate Invoice PDF as Blob (for WhatsApp share).
 * Layout matches the on-screen Service Center invoice exactly:
 *   INVOICE label | Logo+Shop header | Large No. | Customer/Date row
 *   10-row bordered table | Subtotal/Discount(red)/Tax/Total | Signatures
 */
export const generateInvoicePDFBlob = (invoice, shopInfo) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210
    const margin    = 12;
    const contentW  = pageWidth - margin * 2;           // 186

    // Number formatter without currency prefix e.g. "2,500.00"
    const fmt = (n) => Number(n || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    // Parse hex color -> RGB array
    const hexStr = (shopInfo?.invoice_header_color || '#1e3a8a').replace('#', '');
    const HC = [
        parseInt(hexStr.substring(0, 2), 16),
        parseInt(hexStr.substring(2, 4), 16),
        parseInt(hexStr.substring(4, 6), 16),
    ];

    // Shop initials
    const shopName = shopInfo?.name || 'SHOP';
    const wds = shopName.trim().split(/\s+/).filter(Boolean);
    const initials = wds.length >= 3
        ? (wds[0][0] + wds[1][0] + wds[2][0]).toUpperCase()
        : wds.length === 2
            ? (wds[0][0] + wds[1][0]).toUpperCase()
            : shopName.slice(0, 3).toUpperCase();

    let y = margin;

    // ── "INVOICE" label top-right ──
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', pageWidth - margin, y + 4, { align: 'right' });

    y += 6;

    // ── Colored logo box ──
    const logoSz = 22;
    doc.setFillColor(...HC);
    doc.rect(margin, y, logoSz, logoSz, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(initials, margin + logoSz / 2, y + logoSz / 2 + 2, { align: 'center' });

    // ── Shop name + address + contact ──
    const sX = margin + logoSz + 5;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...HC);
    doc.text(shopName.toUpperCase(), sX, y + 7);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(50, 50, 50);
    let dY = y + 13;
    if (shopInfo?.address) { doc.text(shopInfo.address, sX, dY); dY += 5; }
    const cp = [
        shopInfo?.phone ? `Hot Line: ${shopInfo.phone}` : null,
        shopInfo?.email ? `Email: ${shopInfo.email}` : null,
    ].filter(Boolean).join('   ');
    if (cp) doc.text(cp, sX, dY);

    y += logoSz + 9;

    // ── Invoice number (large, right-aligned) ──
    const invNo = String(invoice.invoice_number || '').replace(/^INV[-\s]*/i, '');
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`No : ${invNo}`, pageWidth - margin, y, { align: 'right' });

    y += 10;

    // ── Customer Name + Date row ──
    const invDate = invoice.created_at ? new Date(invoice.created_at) : null;
    const dateStr = invDate ? invDate.toLocaleDateString('en-GB') : '';

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.setFont(undefined, 'bold');
    const custLabel = 'Customer Name : ';
    doc.text(custLabel, margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.customer_name || 'Walk-in Customer', margin + doc.getTextWidth(custLabel), y);

    const dX = pageWidth / 2 + 5;
    doc.setFont(undefined, 'bold');
    const dateLabel = 'Date : ';
    doc.text(dateLabel, dX, y);
    doc.setFont(undefined, 'normal');
    doc.text(dateStr, dX + doc.getTextWidth(dateLabel), y);

    y += 7;

    // ── Items table: NO | ITEM | QUANTITY | RATE | AMOUNT (10 fixed rows) ──
    const rowH = 8;
    const cNo = 12, cQty = 24, cRate = 33, cAmt = 38;
    const cItem = contentW - cNo - cQty - cRate - cAmt;

    const xNo   = margin;
    const xItem = xNo   + cNo;
    const xQty  = xItem + cItem;
    const xRate = xQty  + cQty;
    const xAmt  = xRate + cRate;
    const pad   = 1.5;

    // Header row
    const headerY = y;
    doc.setFillColor(...HC);
    doc.rect(margin, headerY, contentW, rowH, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    const hMid = headerY + rowH / 2 + 1.5;

    doc.text('No',       xNo   + pad,         hMid);
    doc.text('Item',     xItem + pad,          hMid);
    doc.text('Quantity', xQty  + cQty  / 2,   hMid, { align: 'center' });
    doc.text('Rate',     xRate + cRate - pad,  hMid, { align: 'right' });
    doc.text('Amount',   xAmt  + cAmt  - pad,  hMid, { align: 'right' });

    // 10 data rows
    const items = invoice.items || [];
    doc.setDrawColor(190, 190, 190);
    doc.setLineWidth(0.2);

    for (let i = 0; i < 10; i++) {
        const item = items[i];
        const rY   = headerY + rowH * (i + 1);
        const tY   = rY + rowH / 2 + 1.5;

        doc.setFillColor(255, 255, 255);
        doc.rect(margin, rY, contentW, rowH, 'FD');

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(String(i + 1), xNo + pad, tY);

        if (item) {
            const qty  = Number(item.quantity    || 0);
            const rate = Number(item.unit_price  || 0);
            const amt  = Number(item.total_price ?? (qty * rate));

            // Truncate item name if too wide
            const maxW = cItem - pad * 2;
            let nm = String(item.name || item.product_name || '');
            while (nm.length > 1 && doc.getTextWidth(nm) > maxW) nm = nm.slice(0, -1);
            if (nm !== String(item.name || item.product_name || '')) nm += '..';

            doc.text(nm,        xItem + pad,          tY);
            doc.text(String(qty), xQty + cQty  / 2,  tY, { align: 'center' });
            doc.text(fmt(rate), xRate + cRate - pad,  tY, { align: 'right' });
            doc.text(fmt(amt),  xAmt  + cAmt  - pad,  tY, { align: 'right' });
        } else {
            doc.text('0.00', xAmt + cAmt - pad, tY, { align: 'right' });
        }
    }

    // Draw vertical column separator lines spanning full table (header + 10 rows)
    const tableTop    = headerY;
    const tableBottom = headerY + rowH * 11;
    doc.setDrawColor(190, 190, 190);
    doc.setLineWidth(0.2);
    [xItem, xQty, xRate, xAmt].forEach(xCol => {
        doc.line(xCol, tableTop, xCol, tableBottom);
    });

    y = headerY + rowH * 11 + 10;

    // ── Totals block (right-aligned) ──
    const tLX = pageWidth - margin - 72;
    const tVX = pageWidth - margin;

    const subtotal = Number(invoice.subtotal ?? invoice.total_amount ?? 0);
    const discount = Number(invoice.discount_amount || 0);
    const tax      = Number(invoice.tax_amount      || 0);
    const total    = Number(invoice.total_amount    || 0);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Subtotal', tLX, y);
    doc.text(fmt(subtotal), tVX, y, { align: 'right' });

    if (discount > 0) {
        y += 7;
        doc.setTextColor(220, 38, 38);
        doc.text('Discount', tLX, y);
        doc.text(`- ${fmt(discount)}`, tVX, y, { align: 'right' });
    }

    if (tax > 0) {
        y += 7;
        doc.setTextColor(0, 0, 0);
        doc.text('Tax', tLX, y);
        doc.text(fmt(tax), tVX, y, { align: 'right' });
    }

    y += 7;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(tLX, y - 2, tVX, y - 2);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Total', tLX, y + 4);
    doc.text(fmt(total), tVX, y + 4, { align: 'right' });

    // ── Signature lines ──
    y += 22;
    const sigW = 60;
    doc.setLineWidth(0.3);
    doc.setDrawColor(130, 130, 130);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);

    doc.line(margin, y, margin + sigW, y);
    doc.text('Authorized Signature', margin + sigW / 2, y + 5, { align: 'center' });

    doc.line(pageWidth - margin - sigW, y, pageWidth - margin, y);
    doc.text('Customer Signature', pageWidth - margin - sigW / 2, y + 5, { align: 'center' });

    return doc.output('blob');
};
