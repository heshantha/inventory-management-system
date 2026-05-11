import React, { useState } from 'react';
import { formatCurrency } from '../../utils/calculations';
import { generateInvoicePDFBlob } from '../../utils/pdfGenerator';
import { Printer, Download } from 'lucide-react';

// Get initials from shop name (e.g. "Nevil Windscreen Center" -> "NWC")
const getShopInitials = (name) => {
    if (!name || typeof name !== 'string') return 'SHOP';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 3) return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
    if (words.length === 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 3).toUpperCase();
};

const formatInvoiceNo = (invoiceNo) => {
    if (!invoiceNo) return '—';
    return String(invoiceNo).replace(/^INV[-\s]*/i, '');
};

const Invoice = ({ invoice, onClose, currentShop }) => {

    if (!invoice) return null;

    const isNevilWindscreen = currentShop?.business_type === 'Nevil Windscreen Center';
    const isServiceCenter = (currentShop?.business_type || '').toLowerCase() === 'service center';
    const hideCustomerCopy = Boolean(invoice?.hide_customer_copy);
    const invoiceHeaderColor = currentShop?.invoice_header_color || '#1e3a8a';
    const invoiceTitleColor = currentShop?.invoice_title_color || '#1e3a8a';
    const invoiceParagraphColor = currentShop?.invoice_paragraph_color || '#1f2937';
    const invoiceLogoUrl = currentShop?.invoice_logo_url || '';
    const invoiceDate = invoice?.created_at ? new Date(invoice.created_at) : null;
    const dateStr = invoiceDate
        ? invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
        : '—';
    const formatAmountNoPrefix = (amount) => Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const [sharing, setSharing] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsApp = async () => {
        setSharing(true);
        try {
            const pdfBlob = generateInvoicePDFBlob(invoice, currentShop);
            const fileName = `Invoice_${invoice.invoice_number || 'invoice'}.pdf`;
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

            // Try native Web Share API (works on mobile / Android Chrome / iOS Safari)
            if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    files: [pdfFile],
                    title: `Invoice ${invoice.invoice_number}`,
                    text: `Invoice from ${currentShop?.name || 'Our Store'}`,
                });
            } else {
                // Fallback: download the PDF (user can then share manually from downloads)
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                // Open WhatsApp Web after download so user can attach the file
                setTimeout(() => {
                    window.open('https://web.whatsapp.com', '_blank');
                }, 500);
                alert('PDF downloaded! Please attach it in the WhatsApp window that just opened.');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                alert('Could not share the invoice. Please try printing instead.');
            }
        } finally {
            setSharing(false);
        }
    };

    const handleDownload = () => {
        setSharing(true);
        try {
            const pdfBlob = generateInvoicePDFBlob(invoice, currentShop);
            const fileName = `Invoice_${invoice.invoice_number || 'invoice'}.pdf`;
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Could not download the invoice PDF.');
        } finally {
            setSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4 print:relative print:bg-white">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col print:shadow-none print:max-w-none print:max-h-none">
                {/* Print Button - Hidden when printing */}
                <div className="p-3 md:p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden flex-shrink-0">
                    <h2 className="text-lg md:text-xl font-bold">Invoice Preview</h2>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleWhatsApp}
                            disabled={sharing}
                            className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span className="hidden sm:inline">{sharing ? 'Wait...' : 'Share on WhatsApp'}</span>
                            <span className="sm:hidden">{sharing ? 'Wait...' : 'WhatsApp'}</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={sharing}
                            className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline">{sharing ? 'Wait...' : 'Download PDF'}</span>
                            <span className="sm:hidden">{sharing ? 'Wait...' : 'Download'}</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <Printer size={18} />
                            <span className="hidden sm:inline">Print</span>
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
                    <div className={`service-invoice p-4 md:p-6 lg:p-8 ${isNevilWindscreen ? 'nevil-invoice' : ''} ${isServiceCenter ? 'service-center-invoice' : ''}`}>
                        {isServiceCenter ? (
                            /* --- Service Center layout (NB Auto Spa style) --- */
                            <>
                            <div className="text-right">
                            <h2 className="text-1xl font-bold leading-none mb-2" >INVOICE</h2>
                            </div>
                             
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-20 h-20 rounded-lg flex items-center justify-center text-white font-bold text-xl overflow-hidden color-print-bg"
                                            style={{ backgroundColor: invoiceHeaderColor }}
                                        >
                                            {invoiceLogoUrl ? (
                                                <img src={invoiceLogoUrl} alt="Invoice Logo" className="w-full h-full object-contain bg-white" />
                                            ) : (
                                                getShopInitials(currentShop?.name)
                                            )}
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold leading-tight" style={{ color: invoiceTitleColor }}>
                                                {(currentShop?.name || 'SERVICE CENTER').toUpperCase()}
                                            </h1>
                               
                                            <p className="text-sm" style={{ color: invoiceParagraphColor }}>
                                                {currentShop?.address || ''}
                                            </p>
                                            <p className="text-sm" style={{ color: invoiceParagraphColor }}>
                                                Hot Line: {currentShop?.phone || '—'}
                                                {currentShop?.phone2 ? `   Tel: ${currentShop.phone2}` : ''}
                                                {currentShop?.email ? `   Email: ${currentShop.email}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                 
                                </div>
                                <div className="text-right">
                                       
                                        <p className="text-3xl font-bold mt-3 leading-none" style={{ color: invoiceParagraphColor }}>
                                            No : {formatInvoiceNo(invoice.invoice_number)}
                                        </p>
                                    </div>
                                <div className="grid grid-cols-2 gap-4 my-4 text-xl font-semibold" style={{ color: invoiceParagraphColor }}>
                                    <div>
                                        <p>Customer Name : <span className="font-normal">{invoice.customer_name || 'Walk-in Customer'}</span></p>
                                    </div>
                                    <div>
                                        <p>Date : <span className="font-normal">{invoiceDate ? invoiceDate.toLocaleDateString('en-GB') : '—'}</span></p>
                                    </div>
                                </div>

                                {/* Warranty — shown only when present (Garage/Repair bills) */}
                                {invoice.warranty && (
                                    <div className="mb-2 text-sm font-semibold border border-gray-300 rounded px-3 py-2" style={{ color: invoiceParagraphColor }}>
                                        <span className="text-gray-500 font-normal">Warranty : </span>
                                        {invoice.warranty}
                                    </div>
                                )}

                                <div className="overflow-x-auto mt-2">
                                    <table className="w-full border border-gray-400 text-sm">
                                        <thead className="color-print-bg">
                                            <tr>
                                                <th className="border border-gray-400 px-2 py-1 text-left font-bold w-[8%] text-white" style={{ backgroundColor: invoiceHeaderColor || '#9f1d1d' }}>No</th>
                                                <th className="border border-gray-400 px-2 py-1 text-left font-bold w-[42%] text-white" style={{ backgroundColor: invoiceHeaderColor || '#9f1d1d' }}>Item</th>
                                                <th className="border border-gray-400 px-2 py-1 text-center font-bold w-[14%] text-white" style={{ backgroundColor: invoiceHeaderColor || '#9f1d1d' }}>Quantity</th>
                                                <th className="border border-gray-400 px-2 py-1 text-center font-bold w-[16%] text-white" style={{ backgroundColor: invoiceHeaderColor || '#9f1d1d' }}>Rate</th>
                                                <th className="border border-gray-400 px-2 py-1 text-center font-bold w-[20%] text-white" style={{ backgroundColor: invoiceHeaderColor || '#9f1d1d' }}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from({ length: 10 }, (_, index) => {
                                                const item = invoice?.items?.[index];
                                                const qty = Number(item?.quantity || 0);
                                                const rate = Number(item?.unit_price || 0);
                                                const amount = Number(item?.total_price ?? (qty * rate));
                                                return (
                                                    <tr key={index}>
                                                        <td className="border border-gray-400 px-2 py-1 h-8 align-middle">{index + 1}</td>
                                                        <td className="border border-gray-400 px-2 py-1 h-8 align-middle">{item?.name || item?.product_name || ''}</td>
                                                        <td className="border border-gray-400 px-2 py-1 h-8 text-center align-middle">{item ? qty : ''}</td>
                                                        <td className="border border-gray-400 px-2 py-1 h-8 text-right align-middle">{item ? formatAmountNoPrefix(rate) : ''}</td>
                                                        <td className="border border-gray-400 px-2 py-1 h-8 text-right align-middle">{item ? formatAmountNoPrefix(amount) : '0.00'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals breakdown: Subtotal, Discount, Tax, Total */}
                                <div className="flex justify-end mt-3 mb-2">
                                    <div className="min-w-[220px] text-sm" style={{ color: invoiceParagraphColor }}>
                                        <div className="flex justify-between items-center py-1 border-b border-gray-300">
                                            <span>Subtotal</span>
                                            <span className="font-semibold ml-8">{formatAmountNoPrefix(invoice.subtotal ?? invoice.total_amount)}</span>
                                        </div>
                                        {Number(invoice.discount_amount) > 0 && (
                                            <div className="flex justify-between items-center py-1 border-b border-gray-300 text-red-600">
                                                <span>Discount</span>
                                                <span className="font-semibold">- {formatAmountNoPrefix(invoice.discount_amount)}</span>
                                            </div>
                                        )}
                                        {Number(invoice.tax_amount) > 0 && (
                                            <div className="flex justify-between items-center py-1 border-b border-gray-300">
                                                <span>Tax</span>
                                                <span className="font-semibold">{formatAmountNoPrefix(invoice.tax_amount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center py-1 font-bold text-base">
                                            <span>Total</span>
                                            <span>{formatAmountNoPrefix(invoice.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10 mt-8 text-lg" style={{ color: invoiceParagraphColor }}>
                                    <div className="text-center">
                                        <div className="border-b border-gray-500 mb-2 h-10"></div>
                                        <p className="font-semibold">Authorized Signature</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="border-b border-gray-500 mb-2 h-10"></div>
                                        <p className="font-semibold">Customer Signature</p>
                                    </div>
                                </div>
                            </>
                        ) : isNevilWindscreen ? (
                            /* --- Nevil Windscreen Center invoice layout (match reference image) --- */
                            <>
                                {/* Company block: Logo | Company name, address, tel, email — then blue line only */}
                                <div className="flex items-start gap-2 mb-0 pb-2 border-b-2" style={{ borderColor: invoiceHeaderColor }}>
                                    <div
                                        className="w-12 h-12 nevil-blue-bg flex items-center justify-center text-white font-bold text-lg rounded flex-shrink-0 overflow-hidden"
                                        style={{ backgroundColor: invoiceHeaderColor }}
                                    >
                                        {invoiceLogoUrl ? (
                                            <img
                                                src={invoiceLogoUrl}
                                                alt="Invoice Logo"
                                                className="w-full h-full object-contain bg-white"
                                            />
                                        ) : (
                                            getShopInitials(currentShop?.name)
                                        )}
                                    </div>
                                    <div>
                                        <h1 className="text-lg md:text-xl font-bold leading-tight" style={{ color: invoiceTitleColor }}>
                                            {(currentShop?.name || 'Nevil Windscreen Center').toUpperCase()}
                                        </h1>
                                        <p className="text-[10px] md:text-xs mt-0.5" style={{ color: invoiceParagraphColor }}>
                                            {currentShop?.address || ''}
                                        </p>
                                        <p className="text-[10px] md:text-xs" style={{ color: invoiceParagraphColor }}>
                                            Tel: {[currentShop?.phone, currentShop?.phone2, currentShop?.phone3].filter(Boolean).join(' / ') || '—'}
                                        </p>
                                        {currentShop?.email && (
                                            <p className="text-[10px] md:text-xs" style={{ color: invoiceParagraphColor }}>{currentShop.email}</p>
                                        )}
                                    </div>
                                </div>

                                {/* TO: (left) | CUSTOMER COPY + INVOICE details (right) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 mb-2">
                                    <div>
                                        <p className="text-xs font-bold mb-0.5" style={{ color: invoiceParagraphColor }}>TO:</p>
                                        <p className="text-xs font-medium" style={{ color: invoiceParagraphColor }}>{invoice.customer_name || 'Walk-in Customer'}</p>
                                        {invoice.customer_address && (
                                            <p className="text-[10px]" style={{ color: invoiceParagraphColor }}>{invoice.customer_address.split(',').map(s => s.trim()).join(', ')}</p>
                                        )}
                                        {invoice.customer_phone && (
                                            <p className="text-[10px]" style={{ color: invoiceParagraphColor }}>{invoice.customer_phone}</p>
                                        )}
                                    </div>
                                    <div className="text-left sm:text-right space-y-1">
                                        {!hideCustomerCopy && (
                                            <div className="flex justify-end">
                                                <span
                                                    className="text-white px-3 py-1.5 text-xs font-bold rounded inline-block"
                                                    style={{ backgroundColor: invoiceHeaderColor }}
                                                >
                                                    CUSTOMER COPY
                                                </span>
                                            </div>
                                        )}
                                        <h2 className="text-base font-bold" style={{ color: invoiceTitleColor }}>INVOICE</h2>
                                        <div className="text-[10px] md:text-xs space-y-0.5" style={{ color: invoiceParagraphColor }}>
                                            <p>JOB BY: 00000</p>
                                            <p>USER: {invoice.cashier_name || currentShop?.owner_name || '—'}</p>
                                            <p>DATE: {dateStr}</p>
                                            <p>INVOICE NO: {formatInvoiceNo(invoice.invoice_number)}</p>


                                            {currentShop?.vat_reg_no && <p>V.A.T Reg. No.: {currentShop.vat_reg_no}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Warranty — shown only when present */}
                                {invoice.warranty && (
                                    <div className="text-[10px] md:text-xs mb-2 border border-gray-300 rounded px-2 py-1" style={{ color: invoiceParagraphColor }}>
                                        <span className="font-bold">Warranty : </span>{invoice.warranty}
                                    </div>
                                )}

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
                                                        <td className="border border-gray-400 px-1 py-0.5">
                                                            {item.sku || item.code || item.name || item.product_name || '—'}
                                                        </td>
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

                                {/* Dealer tagline (above blue footer) */}
                                <p className="text-[10px] md:text-xs text-center mt-2 mb-1" style={{ color: invoiceParagraphColor }}>
                                    Dealers in japanes high Quality Windscreen, Door & sode Glasses, All Type of Beading and Motor Spare Parts Accessories
                                </p>

                                {/* Blue box with disclaimer text */}
                                <div
                                    className="text-white px-2 py-1.5 text-[10px] text-center font-medium rounded mt-2"
                                    style={{ backgroundColor: invoiceHeaderColor }}
                                >
                                    GOODS ONCE SOLD WILL NOT BE ACCEPTED AFTER 14 DAYS, CUT BEADINGS & ELECTRICAL ITEMS WILL NOT BE ACCEPTED.
                                </div>
                            </>
                        ) : (
                            /* --- Default invoice layout --- */
                            <>
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 md:mb-6 pb-3 md:pb-4 border-b-2" style={{ borderColor: invoiceHeaderColor }}>
                                    <div className="w-full sm:w-auto">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div
                                                className="w-10 h-10 rounded flex items-center justify-center text-white text-sm font-bold overflow-hidden"
                                                style={{ backgroundColor: invoiceHeaderColor }}
                                            >
                                                {invoiceLogoUrl ? (
                                                    <img src={invoiceLogoUrl} alt="Invoice Logo" className="w-full h-full object-contain bg-white" />
                                                ) : (
                                                    getShopInitials(currentShop?.name)
                                                )}
                                            </div>
                                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: invoiceTitleColor }}>
                                                {currentShop?.name || 'Store Name'}
                                            </h1>
                                        </div>
                                        <p className="text-xs md:text-sm mt-1" style={{ color: invoiceParagraphColor }}>{currentShop?.address || 'Store Address'}</p>
                                        <p className="text-xs md:text-sm" style={{ color: invoiceParagraphColor }}>
                                            Phone: {[currentShop?.phone, currentShop?.phone2, currentShop?.phone3].filter(Boolean).join(' / ') || 'Phone Number'}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right w-full sm:w-auto">
                                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold" style={{ color: invoiceTitleColor }}>INVOICE</h2>
                                        <p className="font-semibold mt-1" style={{ color: invoiceParagraphColor }}>#{formatInvoiceNo(invoice.invoice_number)}</p>
                                        <p className="text-xs md:text-sm mt-2" style={{ color: invoiceParagraphColor }}>
                                            Date: {invoiceDate ? invoiceDate.toLocaleDateString() : '—'}
                                        </p>
                                        <p className="text-xs md:text-sm" style={{ color: invoiceParagraphColor }}>
                                            Time: {invoiceDate ? invoiceDate.toLocaleTimeString() : '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6">
                                    <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                                        <h3 className="text-sm md:text-base font-semibold mb-2" style={{ color: invoiceTitleColor }}>Customer Information</h3>
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
                                        <h3 className="text-sm md:text-base font-semibold mb-2" style={{ color: invoiceTitleColor }}>Invoice Details</h3>
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
                                        <thead style={{ backgroundColor: invoiceHeaderColor }}>
                                            <tr>
                                                <th className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-left text-white">Item</th>
                                                <th className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-center text-white">Qty</th>
                                                <th className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-right text-white">Unit Price</th>
                                                <th className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-right text-white">Total</th>
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
                                                <span className="text-xl md:text-2xl font-bold" style={{ color: invoiceTitleColor }}>
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
                                    <p className="font-bold text-sm md:text-base" style={{ color: invoiceTitleColor }}>{currentShop?.name}</p>
                                    <p className="text-xs md:text-sm" style={{ color: invoiceParagraphColor }}>{currentShop?.address}</p>
                                    <p className="text-xs md:text-sm" style={{ color: invoiceParagraphColor }}>
                                        Tel: {[currentShop?.phone, currentShop?.phone2, currentShop?.phone3].filter(Boolean).join(' / ')}
                                    </p>
                                    <p className="text-[10px] md:text-xs mt-2" style={{ color: invoiceParagraphColor }}>Thank you for your business!</p>
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

                        /* Page setup */
                        @page {
                            size: ${(() => {
                                const sz = currentShop?.invoice_size || 'half_a4';
                                if (sz === 'thermal')       return '80mm auto';
                                if (sz === 'half_a4')       return '210mm 148mm';
                                if (sz === 'a4_portrait')   return 'A4';
                                if (sz === 'a4_landscape')  return 'A4 landscape';
                                return '210mm 148mm'; // default Half A4
                            })()};
                            margin: ${['a4_portrait', 'a4_landscape'].includes(currentShop?.invoice_size) ? '10mm' : currentShop?.invoice_size === 'thermal' ? '2mm' : '5mm'};
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
                            padding: ${currentShop?.invoice_size === 'thermal' ? '2mm' : currentShop?.invoice_size === 'half_a4' ? '5mm' : '10mm'} !important;
                        }

                        /* Half A4 / thermal — compact layout */
                        ${(currentShop?.invoice_size === 'half_a4' || currentShop?.invoice_size === 'thermal') ? `
                            .service-invoice {
                                width: ${currentShop?.invoice_size === 'thermal' ? '80mm' : '210mm'} !important;
                                max-height: ${currentShop?.invoice_size === 'thermal' ? 'auto' : '148mm'} !important;
                                overflow: hidden;
                                box-sizing: border-box;
                            }
                            .service-invoice h1 { font-size: ${currentShop?.invoice_size === 'thermal' ? '12px' : '16px'} !important; margin-bottom: 2px !important; }
                            .service-invoice h2 { font-size: ${currentShop?.invoice_size === 'thermal' ? '11px' : '14px'} !important; margin: 2px 0 !important; }
                            .service-invoice h3 { font-size: ${currentShop?.invoice_size === 'thermal' ? '10px' : '12px'} !important; margin: 2px 0 !important; }
                            .service-invoice p, .service-invoice span, .service-invoice div { font-size: ${currentShop?.invoice_size === 'thermal' ? '9px' : '10px'} !important; line-height: 1.2 !important; }
                            .service-invoice th, .service-invoice td { padding: 2px 4px !important; font-size: ${currentShop?.invoice_size === 'thermal' ? '8px' : '9px'} !important; }
                            .service-invoice .mb-4, .service-invoice .mb-6 { margin-bottom: 4px !important; }
                            .service-invoice .mt-4, .service-invoice .mt-8 { margin-top: 4px !important; }
                            .service-invoice .p-4, .service-invoice .p-6, .service-invoice .p-8 { padding: 0 !important; }
                            .service-invoice .gap-3 { gap: 4px !important; }
                        ` : ''}

                        /* A4 Portrait / Landscape — full page fill */
                        ${['a4_portrait', 'a4_landscape'].includes(currentShop?.invoice_size) ? `
                            .service-invoice {
                                width: 100% !important;
                                min-height: 100% !important;
                                height: 100% !important;
                                padding: 10mm !important;
                                box-sizing: border-box;
                                overflow: visible;
                            }
                            .service-invoice .nevil-blue-bg { background: ${invoiceHeaderColor} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .service-invoice h1 { color: ${invoiceTitleColor} !important; }
                            .service-invoice .color-print-bg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        ` : ''}
                    }
                `
            }} />
        </div>
    );
};

export default Invoice;

