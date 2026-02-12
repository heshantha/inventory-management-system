import React from 'react';
import { useShop } from '../../contexts/ShopContext';
import { formatCurrency } from '../../utils/calculations';
import { downloadInvoicePDF } from '../../utils/pdfGenerator';
import { Download, Printer, X } from 'lucide-react';

const Invoice = ({ invoice, onClose }) => {
    const { currentShop } = useShop();

    if (!invoice) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        downloadInvoicePDF(invoice, currentShop);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4 print:relative print:bg-white">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col print:shadow-none print:max-w-none print:max-h-none">
                {/* Print Button - Hidden when printing */}
                <div className="p-3 md:p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden flex-shrink-0">
                    <h2 className="text-lg md:text-xl font-bold">Invoice Preview</h2>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleDownload}
                            className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline">Download PDF</span>
                            <span className="sm:hidden">PDF</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <Printer size={18} />
                            Print
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm md:text-base"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Invoice Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <div className="service-invoice p-4 md:p-6 lg:p-8">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 md:mb-6 pb-3 md:pb-4 border-b-2 border-gray-300">
                            <div className="w-full sm:w-auto">
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">{currentShop?.name || 'Store Name'}</h1>
                                <p className="text-xs md:text-sm text-gray-600 mt-1">{currentShop?.address || 'Store Address'}</p>
                                <p className="text-xs md:text-sm text-gray-600">Phone: {currentShop?.phone || 'Phone Number'}</p>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto">
                                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-primary-600">INVOICE</h2>
                                <p className="font-semibold text-gray-800 mt-1">#{invoice.invoice_number}</p>
                                <p className="text-xs md:text-sm text-gray-600 mt-2">
                                    Date: {new Date(invoice.created_at || Date.now()).toLocaleDateString()}
                                </p>
                                <p className="text-xs md:text-sm text-gray-600">
                                    Time: {new Date(invoice.created_at || Date.now()).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>

                        {/* Customer & Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6">
                            <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                                <h3 className="text-sm md:text-base font-semibold text-gray-700 mb-2">Customer Information</h3>
                                <p className="text-xs md:text-sm">
                                    <span className="font-medium">Name:</span> {invoice.customer_name || 'Walk-in Customer'}
                                </p>
                                {invoice.customer_phone && (
                                    <p className="text-xs md:text-sm">
                                        <span className="font-medium">Phone:</span> {invoice.customer_phone}
                                    </p>
                                )}
                                {invoice.customer_address && (
                                    <p className="text-xs md:text-sm">
                                        <span className="font-medium">Address:</span> {invoice.customer_address}
                                    </p>
                                )}
                            </div>
                            <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                                <h3 className="text-sm md:text-base font-semibold text-gray-700 mb-2">Invoice Details</h3>
                                {invoice.warranty && (
                                    <p className="text-xs md:text-sm mb-1">
                                        <span className="font-medium">Warranty:</span> {invoice.warranty}
                                    </p>
                                )}
                                <p className="text-xs md:text-sm">
                                    <span className="font-medium">Seller:</span> {currentShop?.owner_name || 'Admin'}
                                </p>
                                {invoice.payment_method && (
                                    <p className="text-xs md:text-sm capitalize">
                                        <span className="font-medium">Payment:</span> {invoice.payment_method.replace('_', ' ')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-4 md:mb-6 overflow-x-auto -mx-4 md:mx-0">
                            <table className="w-full border border-gray-300 text-xs md:text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-left">Item</th>
                                        <th className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-center">Qty</th>
                                        <th className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-right">Unit Price</th>
                                        <th className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2">
                                                <div className="font-medium">{item.name}</div>
                                                {item.sku && <div className="text-xs text-gray-500">{item.sku}</div>}
                                            </td>
                                            <td className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-center">{item.quantity}</td>
                                            <td className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-right">
                                                {formatCurrency(item.unit_price)}
                                            </td>
                                            <td className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-right font-semibold">
                                                {formatCurrency(item.total_price || (item.quantity * item.unit_price))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pricing Summary */}
                        <div className="flex justify-end mb-4 md:mb-6">
                            <div className="w-full sm:w-80">
                                <div className="bg-gray-50 p-3 md:p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between text-xs md:text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                                    </div>
                                    {invoice.discount_amount > 0 && (
                                        <div className="flex justify-between text-xs md:text-sm text-red-600">
                                            <span>Discount:</span>
                                            <span className="font-semibold">-{formatCurrency(invoice.discount_amount)}</span>
                                        </div>
                                    )}
                                    {invoice.tax_amount > 0 && (
                                        <div className="flex justify-between text-xs md:text-sm text-gray-800">
                                            <span>Tax:</span>
                                            <span className="font-semibold">{formatCurrency(invoice.tax_amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t-2 border-gray-800">
                                        <span className="text-base md:text-lg font-bold">Total Amount:</span>
                                        <span className="text-xl md:text-2xl font-bold text-primary-600">
                                            {formatCurrency(invoice.total_amount)}
                                        </span>
                                    </div>
                                    {invoice.payment_method && (
                                        <div className="flex justify-between text-xs md:text-sm text-gray-600 pt-2 border-t border-gray-200">
                                            <span>Payment Method:</span>
                                            <span className="capitalize font-medium">{invoice.payment_method.replace('_', ' ')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t-2 border-gray-300 pt-4 mt-8 text-center">
                            <p className="text-sm text-gray-600">Thank you for your business!</p>
                            <p className="text-xs text-gray-400 mt-2">
                                Developed by HL Web Studio
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                    
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    
                    .service-invoice {
                        width: 100%;
                        height: 100%;
                        page-break-after: avoid;
                    }
                }
            `}</style>
        </div>
    );
};

export default Invoice;

