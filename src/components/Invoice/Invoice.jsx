import React from 'react';
import { formatCurrency } from '../../utils/calculations';
import { downloadInvoicePDF } from '../../utils/pdfGenerator';
import { Download, Printer, X } from 'lucide-react';

// Get initials from shop name (e.g. "Nevil Windscreen Center" -> "NWC")
const getShopInitials = (name) => {
    if (!name || typeof name !== 'string') return 'SHOP';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 3) return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
    if (words.length === 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 3).toUpperCase();
};

const Invoice = ({ invoice, onClose, currentShop }) => {

    if (!invoice) return null;

    const isNevilWindscreen = currentShop?.business_type === 'Nevil Windscreen Center';
    const invoiceDate = new Date(invoice.created_at || Date.now());
    const dateStr = invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

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
                    <div className={`service-invoice p-4 md:p-6 lg:p-8 ${isNevilWindscreen ? 'nevil-invoice' : ''}`}>
                        {isNevilWindscreen ? (
                            /* --- Nevil Windscreen Center invoice layout --- */
                            <>
                                {/* Top header: Logo | Company name | CUSTOMER COPY */}
                                <div className="flex items-start justify-between gap-2 mb-1 border-b-2 border-blue-800 pb-2">
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="w-12 h-12 nevil-blue-bg flex items-center justify-center text-white font-bold text-lg rounded">
                                            {getShopInitials(currentShop?.name)}
                                        </div>
                                        <div>
                                            <h1 className="text-lg md:text-xl font-bold text-[#1e3a8a] leading-tight">
                                                {(currentShop?.name || 'Nevil Windscreen Center').toUpperCase()}
                                            </h1>
                                            <p className="text-[10px] md:text-xs text-gray-700 mt-0.5">
                                                {currentShop?.address || ''}
                                            </p>
                                            <p className="text-[10px] md:text-xs text-gray-700">
                                                Tel: {[currentShop?.phone, currentShop?.phone2, currentShop?.phone3].filter(Boolean).join(' / ') || '—'}
                                            </p>
                                            {currentShop?.email && (
                                                <p className="text-[10px] md:text-xs text-gray-700">{currentShop.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="nevil-blue-bg text-white px-3 py-1.5 text-xs font-bold rounded flex-shrink-0">
                                        CUSTOMER COPY
                                    </div>
                                </div>

                                {/* TO: and INVOICE details row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 mb-2">
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 mb-0.5">TO:</p>
                                        <p className="text-xs font-medium">{invoice.customer_name || 'Walk-in Customer'}</p>
                                        {invoice.customer_address && (
                                            <p className="text-[10px] text-gray-700">{invoice.customer_address.split(',').map(s => s.trim()).join(', ')}</p>
                                        )}
                                        {invoice.customer_phone && (
                                            <p className="text-[10px] text-gray-700">{invoice.customer_phone}</p>
                                        )}
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <h2 className="text-base font-bold text-[#1e3a8a]">INVOICE</h2>
                                        <div className="text-[10px] md:text-xs space-y-0.5 text-gray-800">
                                            <p>JOB BY: 00000</p>
                                            <p>USER: {invoice.cashier_name || currentShop?.owner_name || '—'}</p>
                                            <p>DATE: {dateStr}</p>
                                            <p>INVOICE NO: {invoice.invoice_number || '—'}</p>

                                            {currentShop?.vat_reg_no && <p>V.A.T Reg. No.: {currentShop.vat_reg_no}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Items table: S.No., CODE, DESCRIPTION, QTY., RATE, VALUE, DISC%, AMOUNT */}
                                <div className="overflow-x-auto -mx-1 mb-2">
                                    <table className="w-full border border-gray-400 text-[10px] md:text-xs">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border border-gray-400 px-1 py-0.5 text-left">S.No.</th>
                                                <th className="border border-gray-400 px-1 py-0.5 text-left">CODE</th>
                                                <th className="border border-gray-400 px-1 py-0.5 text-left">DESCRIPTION</th>
                                                <th className="border border-gray-400 px-1 py-0.5 text-center">QTY.</th>
                                                <th className="border border-gray-400 px-1 py-0.5 text-right">RATE</th>
                                                <th className="border border-gray-400 px-1 py-0.5 text-right">VALUE</th>
                                                <th className="border border-gray-400 px-1 py-0.5 text-center">DISC%</th>
                                                <th className="border border-gray-400 px-1 py-0.5 text-right">AMOUNT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoice.items.map((item, index) => {
                                                const value = (item.quantity || 0) * (item.unit_price || 0);
                                                const discAmount = item.discount_amount || 0;
                                                const discPct = value > 0 ? ((discAmount / value) * 100).toFixed(0) : '0';
                                                const amount = item.total_price ?? (value - discAmount);
                                                return (
                                                    <tr key={index}>
                                                        <td className="border border-gray-400 px-1 py-0.5">{index + 1}</td>
                                                        <td className="border border-gray-400 px-1 py-0.5">{item.sku || '—'}</td>
                                                        <td className="border border-gray-400 px-1 py-0.5">{item.name || item.product_name || '—'}</td>
                                                        <td className="border border-gray-400 px-1 py-0.5 text-center">{Number(item.quantity)}</td>
                                                        <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(item.unit_price)}</td>
                                                        <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(value)}</td>
                                                        <td className="border border-gray-400 px-1 py-0.5 text-center">{discPct}</td>
                                                        <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(amount)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals - 2 rows like reference: Value of Goods, then TOTAL Rs. */}
                                <div className="flex justify-end mb-2">
                                    <div className="min-w-[140px] text-right">
                                        <div className="flex justify-between items-center gap-6 border-b border-gray-400 pb-0.5 mb-0.5">
                                            <span className="text-xs">Value of Goods</span>
                                            <span className="text-xs font-semibold">{formatCurrency(invoice.total_amount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-6 border-b border-gray-400 pb-0.5">
                                            <span className="text-xs font-bold">TOTAL Rs.</span>
                                            <span className="text-xs font-bold">{formatCurrency(invoice.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Signature row placeholder */}
                                <div className="flex justify-between text-[10px] mt-2 mb-2 border-t border-gray-300 pt-2">
                                    <div><span className="font-semibold">Prepared By</span><div className="h-4 border-b border-gray-400 w-24 mt-0.5" /></div>
                                    <div><span className="font-semibold">Checked By</span><div className="h-4 border-b border-gray-400 w-24 mt-0.5" /></div>
                                    <div><span className="font-semibold">Received in good condition</span><div className="h-4 border-b border-gray-400 w-28 mt-0.5" /></div>
                                </div>

                                {/* Text before blue line */}
                                <p className="text-[12px] text-gray-700 text-center mt-2 mb-1">
                                   Dealers in japanes high Quality WIndscreen,   Door & sode Glasses, All Type of Beading and Motor Spare Parts Accessories
                                </p>

                                {/* Blue box with disclaimer text */}
                                <div className="nevil-blue-bg text-white px-2 py-1.5 text-[10px] text-center font-medium rounded mt-2">
                                    GOODS ONCE SOLD WILL NOT BE ACCEPTED AFTER 14 DAYS, CUT BEADINGS & ELECTRICAL ITEMS WILL NOT BE ACCEPTED.
                                </div>
                            </>
                        ) : (
                            /* --- Default invoice layout --- */
                            <>
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 md:mb-6 pb-3 md:pb-4 border-b-2 border-gray-300">
                                    <div className="w-full sm:w-auto">
                                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">{currentShop?.name || 'Store Name'}</h1>
                                        <p className="text-xs md:text-sm text-gray-600 mt-1">{currentShop?.address || 'Store Address'}</p>
                                        <p className="text-xs md:text-sm text-gray-600">
                                            Phone: {[currentShop?.phone, currentShop?.phone2, currentShop?.phone3].filter(Boolean).join(' / ') || 'Phone Number'}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right w-full sm:w-auto">
                                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-primary-600">INVOICE</h2>
                                        <p className="font-semibold text-gray-800 mt-1">#{invoice.invoice_number}</p>
                                        <p className="text-xs md:text-sm text-gray-600 mt-2">
                                            Date: {invoiceDate.toLocaleDateString()}
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-600">
                                            Time: {invoiceDate.toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>

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

                                <div className="mt-4 md:mt-8 pt-4 border-t-2 border-gray-200 text-center">
                                    <p className="font-bold text-gray-800 text-sm md:text-base">{currentShop?.name}</p>
                                    <p className="text-gray-600 text-xs md:text-sm">{currentShop?.address}</p>
                                    <p className="text-gray-600 text-xs md:text-sm">
                                        Tel: {[currentShop?.phone, currentShop?.phone2, currentShop?.phone3].filter(Boolean).join(' / ')}
                                    </p>
                                    <p className="text-gray-500 text-[10px] md:text-xs mt-2">Thank you for your business!</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @media print {
                        /* Hide everything by default */
                        body * {
                            visibility: hidden;
                        }

                        /* Page setup - Nevil uses full A4; others use half or landscape */
                        @page {
                            size: ${currentShop?.business_type === 'Nevil Windscreen Center' ? 'A4' : ['Service Center', 'Computer Shop'].includes(currentShop?.business_type) ? '210mm 148mm' : 'A4 landscape'};
                            margin: ${currentShop?.business_type === 'Nevil Windscreen Center' ? '10mm' : '0'};
                        }

                        html, body {
                            height: 100%;
                            overflow: hidden !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }

                        /* Make invoice visible and positioned */
                        .service-invoice, .service-invoice * {
                            visibility: visible;
                        }

                        .service-invoice {
                            position: fixed;
                            left: 0;
                            top: 0;
                            width: 100%;
                            margin: 0;
                            z-index: 9999;
                            background: white;
                            padding: ${currentShop?.business_type === 'Nevil Windscreen Center' ? '0' : ['Service Center', 'Computer Shop', 'Nevil Windscreen Center'].includes(currentShop?.business_type) ? '5mm' : '10mm'} !important;
                        }
                        
                        /* Nevil Windscreen Center - full A4 page fill */
                        ${currentShop?.business_type === 'Nevil Windscreen Center' ? `
                            .service-invoice.nevil-invoice {
                                width: 100% !important;
                                min-height: 100% !important;
                                height: 100% !important;
                                padding: 10mm !important;
                                box-sizing: border-box;
                            }
                            .service-invoice .nevil-blue-bg { background: #1e3a8a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .service-invoice.nevil-invoice h1 { color: #1e3a8a !important; }
                        ` : ''}
                        
                        /* Service Center & Computer Shop (compact ticket) */
                        ${['Service Center', 'Computer Shop'].includes(currentShop?.business_type) ? `
                            .service-invoice {
                                width: 210mm !important;
                                height: 148mm !important;
                                max-height: 148mm !important;
                                overflow: hidden;
                                padding: 5mm !important;
                            }
                            .service-invoice h1 { font-size: 16px !important; margin-bottom: 2px !important; }
                            .service-invoice h2 { font-size: 14px !important; margin: 2px 0 !important; }
                            .service-invoice h3 { font-size: 12px !important; margin: 2px 0 !important; }
                            .service-invoice p, .service-invoice span, .service-invoice div { font-size: 10px !important; line-height: 1.2 !important; }
                            .service-invoice th, .service-invoice td { padding: 2px 4px !important; font-size: 9px !important; }
                            .service-invoice .mb-4, .service-invoice .mb-6 { margin-bottom: 4px !important; }
                            .service-invoice .mt-4, .service-invoice .mt-8 { margin-top: 4px !important; }
                            .service-invoice .p-4, .service-invoice .p-6, .service-invoice .p-8 { padding: 0 !important; }
                            .service-invoice .gap-3 { gap: 4px !important; }
                        ` : ''}
                    }
                `
            }} />
        </div>
    );
};

export default Invoice;

