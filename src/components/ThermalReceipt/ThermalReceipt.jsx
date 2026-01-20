import React, { useRef } from 'react';
import { useShop } from '../../contexts/ShopContext';
import { formatCurrency } from '../../utils/calculations';

const ThermalReceipt = ({ invoice, onClose }) => {
    const { currentShop } = useShop();
    const printRef = useRef();

    // Debug log to check shop data
    console.log('ThermalReceipt - currentShop:', currentShop);

    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '', 'width=302,height=auto');

        printWindow.document.write(`
            <html>
            <head>
                <title>Receipt - ${invoice.invoice_number}</title>
                <style>
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                        }
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        width: 80mm;
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 11px;
                        line-height: 1.3;
                        padding: 5mm;
                        background: white;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 8px;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 8px;
                    }
                    .shop-name {
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 2px;
                    }
                    .shop-info {
                        font-size: 9px;
                        margin-bottom: 1px;
                    }
                    .invoice-info {
                        margin: 8px 0;
                        font-size: 10px;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 6px;
                    }
                    .invoice-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 2px;
                    }
                    .items {
                        margin: 8px 0;
                    }
                    .item {
                        margin-bottom: 6px;
                        border-bottom: 1px dotted #ccc;
                        padding-bottom: 4px;
                    }
                    .item-name {
                        font-weight: bold;
                        margin-bottom: 2px;
                    }
                    .item-details {
                        display: flex;
                        justify-content: space-between;
                        font-size: 10px;
                    }
                    .totals {
                        margin-top: 8px;
                        border-top: 1px dashed #000;
                        padding-top: 6px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 3px;
                        font-size: 10px;
                    }
                    .total-row.grand-total {
                        font-size: 14px;
                        font-weight: bold;
                        margin-top: 4px;
                        padding-top: 4px;
                        border-top: 1px solid #000;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 10px;
                        padding-top: 8px;
                        border-top: 1px dashed #000;
                        font-size: 9px;
                    }
                    .thank-you {
                        font-weight: bold;
                        margin-bottom: 3px;
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        // Auto print after content loads
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
            if (onClose) onClose();
        }, 250);
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="flex flex-col items-center">
            {/* Preview */}
            <div
                ref={printRef}
                className="bg-white p-4"
                style={{
                    width: '80mm',
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: '11px',
                    lineHeight: '1.3',
                    border: '1px solid #ddd'
                }}
            >
                {/* Header */}
                <div className="header" style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                    <div className="shop-name" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px' }}>
                        {currentShop?.name || 'SmartStock POS'}
                    </div>
                    {currentShop?.address && (
                        <div className="shop-info" style={{ fontSize: '9px', marginBottom: '1px' }}>
                            {currentShop.address}
                        </div>
                    )}
                    {currentShop?.location && (
                        <div className="shop-info" style={{ fontSize: '9px', marginBottom: '1px' }}>
                            {currentShop.location}
                        </div>
                    )}
                    {currentShop?.phone && (
                        <div className="shop-info" style={{ fontSize: '9px', marginBottom: '1px' }}>
                            Tel: {currentShop.phone}
                        </div>
                    )}
                </div>

                {/* Invoice Info */}
                <div className="invoice-info" style={{ margin: '8px 0', fontSize: '10px', borderBottom: '1px dashed #000', paddingBottom: '6px' }}>
                    <div className="invoice-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Invoice:</span>
                        <strong>{invoice.invoice_number}</strong>
                    </div>
                    <div className="invoice-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Date:</span>
                        <span>{formatDate(invoice.created_at)}</span>
                    </div>
                    {invoice.customer_name && (
                        <div className="invoice-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>Customer:</span>
                            <span>{invoice.customer_name}</span>
                        </div>
                    )}
                    <div className="invoice-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Cashier:</span>
                        <span>{invoice.cashier_name}</span>
                    </div>
                </div>

                {/* Items */}
                <div className="items" style={{ margin: '8px 0' }}>
                    {invoice.items && invoice.items.map((item, index) => (
                        <div key={index} className="item" style={{ marginBottom: '6px', borderBottom: '1px dotted #ccc', paddingBottom: '4px' }}>
                            <div className="item-name" style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                                {item.name || item.product_name}
                            </div>
                            <div className="item-details" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                                <strong>{formatCurrency(item.total_price)}</strong>
                            </div>
                            {item.discount_amount > 0 && (
                                <div style={{ fontSize: '9px', color: '#666' }}>
                                    Discount: -{formatCurrency(item.discount_amount)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="totals" style={{ marginTop: '8px', borderTop: '1px dashed #000', paddingTop: '6px' }}>
                    <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '10px' }}>
                        <span>Subtotal:</span>
                        <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.discount_amount > 0 && (
                        <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '10px' }}>
                            <span>Discount:</span>
                            <span>-{formatCurrency(invoice.discount_amount)}</span>
                        </div>
                    )}
                    {invoice.tax_amount > 0 && (
                        <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '10px' }}>
                            <span>Tax:</span>
                            <span>{formatCurrency(invoice.tax_amount)}</span>
                        </div>
                    )}
                    <div className="total-row grand-total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #000' }}>
                        <span>TOTAL:</span>
                        <span>{formatCurrency(invoice.total_amount)}</span>
                    </div>
                    <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px' }}>
                        <span>Payment:</span>
                        <span style={{ textTransform: 'uppercase' }}>{invoice.payment_method}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="footer" style={{ textAlign: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #000', fontSize: '9px' }}>
                    <div className="thank-you" style={{ fontWeight: 'bold', marginBottom: '3px' }}>
                        THANK YOU!
                    </div>
                    <div>Please visit again</div>
                </div>
            </div>

            {/* Print Button */}
            <div className="mt-6 flex space-x-3">
                <button
                    onClick={handlePrint}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Receipt
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
};

export default ThermalReceipt;
