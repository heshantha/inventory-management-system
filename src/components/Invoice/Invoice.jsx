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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:relative print:bg-white">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 print:shadow-none print:max-w-none print:mx-0">
                {/* Print Button - Hidden when printing */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center print:hidden">
                    <h2 className="text-xl font-bold">Invoice Preview</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Download size={18} />
                            Download PDF
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                        >
                            <Printer size={18} />
                            Print
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Invoice Content - A4 Half Size Horizontal Layout */}
                <div className="service-invoice p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{currentShop?.name || 'Store Name'}</h1>
                            <p className="text-gray-600 mt-1">{currentShop?.address || 'Store Address'}</p>
                            <p className="text-gray-600">Phone: {currentShop?.phone || 'Phone Number'}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-primary-600">INVOICE</h2>
                            <p className="font-semibold text-gray-800 mt-1">#{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-600 mt-2">
                                Date: {new Date(invoice.created_at || Date.now()).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                                Time: {new Date(invoice.created_at || Date.now()).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    {/* Customer & Info */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-700 mb-2">Customer Information</h3>
                            <p className="text-sm">
                                <span className="font-medium">Name:</span> {invoice.customer_name || 'Walk-in Customer'}
                            </p>
                            {invoice.customer_phone && (
                                <p className="text-sm">
                                    <span className="font-medium">Phone:</span> {invoice.customer_phone}
                                </p>
                            )}
                            {invoice.customer_address && (
                                <p className="text-sm">
                                    <span className="font-medium">Address:</span> {invoice.customer_address}
                                </p>
                            )}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-700 mb-2">Invoice Details</h3>
                            {invoice.warranty && (
                                <p className="text-sm mb-1">
                                    <span className="font-medium">Warranty:</span> {invoice.warranty}
                                </p>
                            )}
                            <p className="text-sm">
                                <span className="font-medium">Seller:</span> {currentShop?.owner_name || 'Admin'}
                            </p>
                            {invoice.payment_method && (
                                <p className="text-sm capitalize">
                                    <span className="font-medium">Payment:</span> {invoice.payment_method.replace('_', ' ')}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-6">
                        <table className="w-full border border-gray-300">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">Item</th>
                                    <th className="border border-gray-300 px-3 py-2 text-center text-sm">Qty</th>
                                    <th className="border border-gray-300 px-3 py-2 text-right text-sm">Unit Price</th>
                                    <th className="border border-gray-300 px-3 py-2 text-right text-sm">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border border-gray-300 px-3 py-2 text-sm">
                                            <div className="font-medium">{item.name}</div>
                                            {item.sku && <div className="text-xs text-gray-500">{item.sku}</div>}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.quantity}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">
                                            {formatCurrency(item.total_price || (item.quantity * item.unit_price))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pricing Summary */}
                    <div className="flex justify-end mb-6">
                        <div className="w-80">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                                </div>
                                {invoice.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Discount:</span>
                                        <span className="font-semibold">-{formatCurrency(invoice.discount_amount)}</span>
                                    </div>
                                )}
                                {invoice.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm text-gray-800">
                                        <span>Tax:</span>
                                        <span className="font-semibold">{formatCurrency(invoice.tax_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t-2 border-gray-800">
                                    <span className="text-lg font-bold">Total Amount:</span>
                                    <span className="text-2xl font-bold text-primary-600">
                                        {formatCurrency(invoice.total_amount)}
                                    </span>
                                </div>
                                {invoice.payment_method && (
                                    <div className="flex justify-between text-sm text-gray-600 pt-2 border-t border-gray-200">
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

