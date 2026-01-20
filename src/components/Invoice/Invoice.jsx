import React from 'react';
import { useShop } from '../../contexts/ShopContext';
import { formatCurrency } from '../../utils/calculations';

const Invoice = ({ invoice, onClose }) => {
    const { currentShop } = useShop();

    if (!invoice) return null;

    const printInvoice = () => {
        window.print();
    };

    return (
        <div className="invoice-container">
            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        margin: 0.5cm;
                    }
                    * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    /* Hide everything except invoice */
                   
                    /* Ensure invoice container is visible and positioned */
                    .invoice-container {
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        visibility: visible !important;
                    }
                    .invoice-container * {
                        visibility: visible !important;
                    }
                    .invoice-container > div {
                        margin: 0 !important;
                        padding: 1cm !important;
                        max-width: 100% !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="max-w-4xl mx-auto bg-white p-4 print-page">
                {/* Header */}
                <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">INVOICE</h1>
                    <p className="text-xl text-gray-600">Invoice #{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Date: {new Date(invoice.created_at || Date.now()).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>

                {/* Company & Customer Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">From</h3>
                        <div className="text-gray-800">
                            <p className="font-bold text-lg">{currentShop?.name || 'Your Business Name'}</p>
                            <p className="text-sm">{currentShop?.address || '123 Business Street'}</p>
                            <p className="text-sm">{currentShop?.location || 'City, State'}</p>
                            <p className="text-sm">Phone: {currentShop?.phone || '(123) 456-7890'}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
                        <div className="text-gray-800">
                            {invoice.customer_name ? (
                                <>
                                    <p className="font-bold text-lg">{invoice.customer_name}</p>
                                    {invoice.customer_phone && <p className="text-sm">Phone: {invoice.customer_phone}</p>}
                                    {invoice.customer_email && <p className="text-sm">Email: {invoice.customer_email}</p>}
                                    {invoice.customer_address && <p className="text-sm">{invoice.customer_address}</p>}
                                </>
                            ) : (
                                <p className="font-bold text-lg">Walk-in Customer</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-3 px-2 font-semibold text-gray-700">Item</th>
                            <th className="text-center py-3 px-2 font-semibold text-gray-700">Qty</th>
                            <th className="text-right py-3 px-2 font-semibold text-gray-700">Price</th>
                            <th className="text-right py-3 px-2 font-semibold text-gray-700">Discount</th>
                            <th className="text-right py-3 px-2 font-semibold text-gray-700">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items && invoice.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="py-3 px-2">
                                    <div className="font-medium text-gray-800">{item.name || item.product_name || 'Product'}</div>
                                    {item.sku && <div className="text-xs text-gray-500">{item.sku}</div>}
                                </td>
                                <td className="text-center py-3 px-2 text-gray-700">{item.quantity}</td>
                                <td className="text-right py-3 px-2 text-gray-700">{formatCurrency(item.unit_price)}</td>
                                <td className="text-right py-3 px-2 text-red-600">
                                    {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '-'}
                                </td>
                                <td className="text-right py-3 px-2 font-semibold text-gray-800">
                                    {formatCurrency(item.total_price || (item.quantity * item.unit_price - (item.discount_amount || 0)))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                    <div className="w-64">
                        <div className="flex justify-between py-2 text-gray-700">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.discount_amount > 0 && (
                            <div className="flex justify-between py-2 text-red-600">
                                <span>Discount:</span>
                                <span>-{formatCurrency(invoice.discount_amount)}</span>
                            </div>
                        )}
                        {invoice.tax_amount > 0 && (
                            <div className="flex justify-between py-2 text-gray-700">
                                <span>Tax:</span>
                                <span>{formatCurrency(invoice.tax_amount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-3 border-t-2 border-gray-300 font-bold text-lg text-gray-800">
                            <span>Total:</span>
                            <span className="text-primary-600">{formatCurrency(invoice.total_amount)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-sm text-gray-600">
                            <span>Payment Method:</span>
                            <span className="uppercase font-medium">{invoice.payment_method}</span>
                        </div>
                        {invoice.warranty && (
                            <div className="flex justify-between py-2 text-sm text-gray-600">
                                <span>Warranty:</span>
                                <span className="font-medium">{invoice.warranty}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-gray-300 text-gray-600 text-sm">
                    <p className="mb-2">Thank you for your business!</p>
                    <p>For any inquiries, please contact us at {currentShop?.email || 'support@yourbusiness.com'}</p>
                </div>

                {/* Action Buttons - Hidden when printing */}
                <div className="mt-6 flex justify-center space-x-3 no-print">
                    <button
                        onClick={printInvoice}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Invoice
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
        </div>
    );
};

export default Invoice;
