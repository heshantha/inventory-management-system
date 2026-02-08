import React from 'react';
import { formatCurrency } from '../../utils/calculations';
import { downloadInvoicePDF } from '../../utils/pdfGenerator';
import { Download, Printer } from 'lucide-react';

const ServiceInvoice = ({ serviceData, shopData, customerData, onClose, type = 'garage' }) => {
    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // Map serviceData to invoice structure expected by generator
        const invoiceForPDF = {
            ...serviceData,
            invoice_number: serviceData.invoice_number || 'INV-0000', // ensure valid number
            created_at: serviceData.created_at || new Date().toISOString(),
            // Ensure customer info is passed from customerData if not in serviceData
            customer_name: serviceData.customer_name || customerData?.name,
            customer_phone: serviceData.customer_phone || customerData?.phone,
            customer_address: serviceData.customer_address || customerData?.address,
            // Items need to be in standard format
            items: serviceData.items_used || []
        };
        downloadInvoicePDF(invoiceForPDF, shopData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4 print:relative print:bg-white overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-auto print:shadow-none print:max-w-none print:mx-0">
                {/* Print Button - Hidden when printing */}
                <div className="p-3 md:p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
                    <h2 className="text-lg md:text-xl font-bold">Service Invoice</h2>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleDownload}
                            className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <Download size={16} />
                            <span className="hidden sm:inline">Download PDF</span>
                            <span className="sm:hidden">PDF</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <Printer size={16} />
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

                {/* Invoice Content - A4 Half Size Horizontal */}
                <div className="service-invoice p-3 md:p-6 lg:p-8 max-h-[80vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 md:mb-6 pb-3 md:pb-4 border-b-2 border-gray-300">
                        <div className="w-full sm:w-auto">
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">{shopData.name}</h1>
                            <p className="text-xs md:text-sm text-gray-600 mt-1">{shopData.address}</p>
                            <p className="text-xs md:text-sm text-gray-600">Phone: {shopData.phone}</p>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-primary-600">SERVICE INVOICE</h2>
                            <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
                                Date: {new Date(serviceData.created_at || Date.now()).toLocaleDateString()}
                            </p>
                            <p className="text-xs md:text-sm text-gray-600">
                                Time: {new Date(serviceData.created_at || Date.now()).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    {/* Customer & Device/Vehicle Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6">
                        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                            <h3 className="text-sm md:text-base font-semibold text-gray-700 mb-2">Customer Information</h3>
                            <p className="text-xs md:text-sm">
                                <span className="font-medium">Name:</span> {customerData?.name || 'Walk-in Customer'}
                            </p>
                            {customerData?.phone && (
                                <p className="text-xs md:text-sm">
                                    <span className="font-medium">Phone:</span> {customerData.phone}
                                </p>
                            )}
                        </div>
                        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                            <h3 className="text-sm md:text-base font-semibold text-gray-700 mb-2">
                                {type === 'repair' ? 'Device Information' : 'Vehicle Information'}
                            </h3>
                            <p className="text-xs md:text-sm">
                                <span className="font-medium">
                                    {type === 'repair' ? 'Device Details:' : 'Vehicle No:'}
                                </span> {serviceData.vehicle_number}
                            </p>
                            <p className="text-xs md:text-sm">
                                <span className="font-medium">Type:</span> {serviceData.vehicle_type}
                            </p>
                            {type === 'garage' && serviceData.mileage && (
                                <p className="text-xs md:text-sm">
                                    <span className="font-medium">Mileage:</span> {serviceData.mileage} km
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Service Details */}
                    <div className="mb-4 md:mb-6">
                        <div className="bg-primary-50 p-3 md:p-4 rounded-lg">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                <div>
                                    <p className="text-xs md:text-sm text-gray-600">Service Type</p>
                                    <p className="font-semibold text-base md:text-lg">{serviceData.service_type}</p>
                                </div>
                                {serviceData.service_warranty && (
                                    <div>
                                        <p className="text-xs md:text-sm text-gray-600">Warranty</p>
                                        <p className="font-semibold text-base md:text-lg">{serviceData.service_warranty}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items Used */}
                    {serviceData.items_used && serviceData.items_used.length > 0 && (
                        <div className="mb-4 md:mb-6">
                            <h3 className="text-sm md:text-base font-semibold text-gray-700 mb-2 md:mb-3">Parts & Items Used</h3>
                            <div className="overflow-x-auto -mx-3 md:mx-0">
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
                                        {serviceData.items_used.map((item, index) => (
                                            <tr key={index}>
                                                <td className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2">{item.name}</td>
                                                <td className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-center">{item.quantity}</td>
                                                <td className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-right">
                                                    {formatCurrency(item.unit_price)}
                                                </td>
                                                <td className="border border-gray-300 px-2 md:px-3 py-1.5 md:py-2 text-right font-semibold">
                                                    {formatCurrency(item.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pricing Summary */}
                    <div className="flex justify-end mb-4 md:mb-6">
                        <div className="w-full sm:w-80">
                            <div className="bg-gray-50 p-3 md:p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-xs md:text-sm">
                                    <span className="text-gray-600">Parts Total:</span>
                                    <span className="font-semibold">{formatCurrency(serviceData.parts_total)}</span>
                                </div>
                                {serviceData.service_charges > 0 && (
                                    <div className="flex justify-between text-xs md:text-sm">
                                        <span className="text-gray-600">Service Charges:</span>
                                        <span className="font-semibold">{formatCurrency(serviceData.service_charges)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs md:text-sm">
                                    <span className="text-gray-600">Labour Charges:</span>
                                    <span className="font-semibold">{formatCurrency(serviceData.labour_charges)}</span>
                                </div>
                                <div className="flex justify-between text-xs md:text-sm pt-2 border-t border-gray-300">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-semibold">
                                        {formatCurrency(
                                            serviceData.parts_total +
                                            serviceData.service_charges +
                                            serviceData.labour_charges
                                        )}
                                    </span>
                                </div>
                                {serviceData.discount_amount > 0 && (
                                    <div className="flex justify-between text-xs md:text-sm text-red-600">
                                        <span>Discount:</span>
                                        <span className="font-semibold">-{formatCurrency(serviceData.discount_amount)}</span>
                                    </div>
                                )}
                                {serviceData.tax_amount > 0 && (
                                    <div className="flex justify-between text-xs md:text-sm text-gray-800">
                                        <span>Tax:</span>
                                        <span className="font-semibold">{formatCurrency(serviceData.tax_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t-2 border-gray-800">
                                    <span className="text-base md:text-lg font-bold">Total Amount:</span>
                                    <span className="text-xl md:text-2xl font-bold text-primary-600">
                                        {formatCurrency(serviceData.total_amount)}
                                    </span>
                                </div>
                                {serviceData.payment_method && (
                                    <div className="flex justify-between text-xs md:text-sm text-gray-600 pt-2 border-t border-gray-200">
                                        <span>Payment Method:</span>
                                        <span className="capitalize font-medium">{serviceData.payment_method.replace('_', ' ')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
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

export default ServiceInvoice;
