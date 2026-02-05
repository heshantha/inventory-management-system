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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:relative print:bg-white">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 print:shadow-none print:max-w-none print:mx-0">
                {/* Print Button - Hidden when printing */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center print:hidden">
                    <h2 className="text-xl font-bold">Service Invoice</h2>
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

                {/* Invoice Content - A4 Half Size Horizontal */}
                <div className="service-invoice p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{shopData.name}</h1>
                            <p className="text-gray-600 mt-1">{shopData.address}</p>
                            <p className="text-gray-600">Phone: {shopData.phone}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-primary-600">SERVICE INVOICE</h2>
                            <p className="text-sm text-gray-600 mt-2">
                                Date: {new Date(serviceData.created_at || Date.now()).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                                Time: {new Date(serviceData.created_at || Date.now()).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    {/* Customer & Device/Vehicle Information */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-700 mb-2">Customer Information</h3>
                            <p className="text-sm">
                                <span className="font-medium">Name:</span> {customerData?.name || 'Walk-in Customer'}
                            </p>
                            {customerData?.phone && (
                                <p className="text-sm">
                                    <span className="font-medium">Phone:</span> {customerData.phone}
                                </p>
                            )}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-700 mb-2">
                                {type === 'repair' ? 'Device Information' : 'Vehicle Information'}
                            </h3>
                            <p className="text-sm">
                                <span className="font-medium">
                                    {type === 'repair' ? 'Device Details:' : 'Vehicle No:'}
                                </span> {serviceData.vehicle_number}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Type:</span> {serviceData.vehicle_type}
                            </p>
                            {type === 'garage' && serviceData.mileage && (
                                <p className="text-sm">
                                    <span className="font-medium">Mileage:</span> {serviceData.mileage} km
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Service Details */}
                    <div className="mb-6">
                        <div className="bg-primary-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Service Type</p>
                                    <p className="font-semibold text-lg">{serviceData.service_type}</p>
                                </div>
                                {serviceData.service_warranty && (
                                    <div>
                                        <p className="text-sm text-gray-600">Warranty</p>
                                        <p className="font-semibold text-lg">{serviceData.service_warranty}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items Used */}
                    {serviceData.items_used && serviceData.items_used.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 mb-3">Parts & Items Used</h3>
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
                                    {serviceData.items_used.map((item, index) => (
                                        <tr key={index}>
                                            <td className="border border-gray-300 px-3 py-2 text-sm">{item.name}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.quantity}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                                                {formatCurrency(item.unit_price)}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">
                                                {formatCurrency(item.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pricing Summary */}
                    <div className="flex justify-end mb-6">
                        <div className="w-80">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Parts Total:</span>
                                    <span className="font-semibold">{formatCurrency(serviceData.parts_total)}</span>
                                </div>
                                {serviceData.service_charges > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Service Charges:</span>
                                        <span className="font-semibold">{formatCurrency(serviceData.service_charges)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Labour Charges:</span>
                                    <span className="font-semibold">{formatCurrency(serviceData.labour_charges)}</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
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
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Discount:</span>
                                        <span className="font-semibold">-{formatCurrency(serviceData.discount_amount)}</span>
                                    </div>
                                )}
                                {serviceData.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm text-gray-800">
                                        <span>Tax:</span>
                                        <span className="font-semibold">{formatCurrency(serviceData.tax_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t-2 border-gray-800">
                                    <span className="text-lg font-bold">Total Amount:</span>
                                    <span className="text-2xl font-bold text-primary-600">
                                        {formatCurrency(serviceData.total_amount)}
                                    </span>
                                </div>
                                {serviceData.payment_method && (
                                    <div className="flex justify-between text-sm text-gray-600 pt-2 border-t border-gray-200">
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
