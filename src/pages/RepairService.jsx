import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import ServiceInvoice from '../components/invoices/ServiceInvoice';
import { Wrench, Plus, Trash2, Printer, X, Monitor, Cpu, DollarSign, Search, ArrowLeft, User, Smartphone, Package } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const RepairService = () => {
    const { user } = useAuth();
    const { shopId, currentShop } = useShop();
    const navigate = useNavigate();

    // Form states
    const [selectedServices, setSelectedServices] = useState([]);
    const [currentServiceSelection, setCurrentServiceSelection] = useState('');

    // Device Information
    const [deviceModel, setDeviceModel] = useState(''); // Maps to vehicle_number
    const [serialNumber, setSerialNumber] = useState(''); // Will be appended to vehicle_number
    const [deviceType, setDeviceType] = useState(''); // Maps to vehicle_type

    // Costs
    const [serviceCharges, setServiceCharges] = useState(0);
    const [labourCharges, setLabourCharges] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Items used from inventory
    const [itemsUsed, setItemsUsed] = useState([]);

    // Data states
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Invoice state
    const [showInvoice, setShowInvoice] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const [invoiceCustomerData, setInvoiceCustomerData] = useState(null);

    // Repair Service types management
    const defaultServiceTypes = [];
    const [customServiceTypes, setCustomServiceTypes] = useState([]);
    const [showAddServiceModal, setShowAddServiceModal] = useState(false);
    const [newServiceType, setNewServiceType] = useState('');

    // Device types
    // Device types
    const [customDeviceTypes, setCustomDeviceTypes] = useState([]);
    const [showAddDeviceTypeModal, setShowAddDeviceTypeModal] = useState(false);
    const [newDeviceType, setNewDeviceType] = useState('');

    useEffect(() => {
        if (shopId) {
            loadData();
        }
        // Load custom service types from localStorage
        loadCustomServiceTypes();
        loadCustomDeviceTypes();
    }, [shopId]);

    const loadCustomDeviceTypes = () => {
        try {
            const saved = localStorage.getItem('custom_device_types');
            if (saved) {
                setCustomDeviceTypes(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading custom device types:', error);
        }
    };

    const saveCustomDeviceTypes = (types) => {
        try {
            localStorage.setItem('custom_device_types', JSON.stringify(types));
            setCustomDeviceTypes(types);
        } catch (error) {
            console.error('Error saving custom device types:', error);
        }
    };

    const handleAddDeviceType = () => {
        if (newDeviceType.trim()) {
            const trimmed = newDeviceType.trim();
            if (!customDeviceTypes.includes(trimmed)) {
                const updated = [...customDeviceTypes, trimmed];
                saveCustomDeviceTypes(updated);
            }
            setNewDeviceType('');
            setShowAddDeviceTypeModal(false);
        }
    };

    const loadCustomServiceTypes = () => {
        try {
            const saved = localStorage.getItem('custom_repair_types'); // Changed key
            if (saved) {
                setCustomServiceTypes(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading custom repair types:', error);
        }
    };

    const saveCustomServiceTypes = (types) => {
        try {
            localStorage.setItem('custom_repair_types', JSON.stringify(types)); // Changed key
            setCustomServiceTypes(types);
        } catch (error) {
            console.error('Error saving custom repair types:', error);
        }
    };

    const handleAddServiceType = () => {
        if (newServiceType.trim()) {
            const trimmed = newServiceType.trim();
            // Check if it already exists in available types
            const allTypes = [...defaultServiceTypes, ...customServiceTypes];
            if (!allTypes.includes(trimmed)) {
                const updated = [...customServiceTypes, trimmed];
                saveCustomServiceTypes(updated);
            }

            // Add to selected services if not already selected
            if (!selectedServices.some(s => s.type === trimmed)) {
                setSelectedServices([...selectedServices, { type: trimmed, warranty: '' }]);
            }

            setNewServiceType('');
            setShowAddServiceModal(false);
        }
    };

    // Combine default and custom service types
    const allServiceTypes = [...defaultServiceTypes, ...customServiceTypes];

    const loadData = async () => {
        const [productsData, customersData] = await Promise.all([
            api.products.getAll(shopId),
            api.customers.getAll(shopId),
        ]);
        setProducts(productsData);
        setCustomers(customersData);
    };

    const addItemUsed = () => {
        setItemsUsed([
            ...itemsUsed,
            { product_id: '', name: '', quantity: 1, unit_price: 0, total: 0 },
        ]);
    };

    const [taxRate, setTaxRate] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    // Persistence for Tax and Payment Method
    useEffect(() => {
        const savedTax = localStorage.getItem('repair_tax_rate');
        if (savedTax) setTaxRate(parseFloat(savedTax));

        const savedPayment = localStorage.getItem('repair_payment_method');
        if (savedPayment) setPaymentMethod(savedPayment);
    }, []);

    useEffect(() => {
        localStorage.setItem('repair_tax_rate', taxRate.toString());
    }, [taxRate]);

    useEffect(() => {
        localStorage.setItem('repair_payment_method', paymentMethod);
    }, [paymentMethod]);

    const calculateTotals = () => {
        const partsTotal = itemsUsed.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        // Ensure strictly numbers
        const serviceTotal = parseFloat(serviceCharges) || 0;
        const labourTotal = parseFloat(labourCharges) || 0;
        const discountTotal = parseFloat(discount) || 0;

        const subtotal = partsTotal + serviceTotal + labourTotal;
        const totalAfterDiscount = Math.max(0, subtotal - discountTotal);

        const taxAmount = totalAfterDiscount * (taxRate / 100);
        const total = totalAfterDiscount + taxAmount;

        return {
            partsTotal,
            serviceCharges: serviceTotal,
            labourCharges: labourTotal,
            subtotal,
            discount: discountTotal,
            taxAmount,
            total
        };
    };

    const removeItemUsed = (index) => {
        setItemsUsed(itemsUsed.filter((_, i) => i !== index));
    };

    const updateItemUsed = (index, field, value) => {
        const updated = [...itemsUsed];

        if (field === 'product_id') {
            // Compare as strings to handle both number and string IDs
            const product = products.find(p => String(p.id) === String(value));
            if (product) {
                updated[index] = {
                    ...updated[index],
                    product_id: product.id,
                    name: product.name,
                    unit_price: product.selling_price,
                    total: product.selling_price * updated[index].quantity,
                };
            }
        } else if (field === 'quantity') {
            updated[index].quantity = parseInt(value) || 0;
            updated[index].total = updated[index].unit_price * updated[index].quantity;
        }

        setItemsUsed(updated);
    };

    const handleCompleteService = async () => {
        // Validation
        if (selectedServices.length === 0) {
            alert('Please select at least one repair/service type');
            return;
        }
        if (!deviceModel) {
            alert('Please enter Device Model');
            return;
        }
        if (!deviceType) {
            alert('Please select Device Type');
            return;
        }

        setLoading(true);

        try {
            const totals = calculateTotals();

            // Construct Vehicle Number logic for Device Model + Serial
            const combinedDeviceIdentifier = serialNumber
                ? `${deviceModel} (SN: ${serialNumber})`
                : deviceModel;

            // Prepare items for the sales record (Parts + Service Info)
            const saleItems = [
                // 1. Parts Used
                ...itemsUsed.map(item => ({
                    product_id: item.product_id,
                    name: item.name,
                    quantity: parseInt(item.quantity) || 0,
                    unit_price: parseFloat(item.unit_price) || 0,
                    total_price: parseFloat(item.total) || 0
                })),
                // 2. Service Charges (as a line item)
                {
                    product_id: null, // No stock impact
                    name: `Service Charges: ${selectedServices.map(s => s.type).join(', ')}`,
                    quantity: 1,
                    unit_price: totals.serviceCharges,
                    total_price: totals.serviceCharges
                },
                // 3. Labour Charges (if any, though field removed from UI, keeping for data integrity)
                totals.labourCharges > 0 ? {
                    product_id: null,
                    name: 'Labour / Technician Fee',
                    quantity: 1,
                    unit_price: totals.labourCharges,
                    total_price: totals.labourCharges
                } : null,
                // 4. Device Metadata (Stored as a $0 item to appear in history/receipts)
                {
                    product_id: null,
                    name: `Device: ${combinedDeviceIdentifier} (${deviceType})`,
                    quantity: 1,
                    unit_price: 0,
                    total_price: 0
                }
            ].filter(Boolean); // Remove nulls

            const saleData = {
                shop_id: shopId,
                user_id: user.id,
                customer_id: selectedCustomer?.id || null,
                subtotal: totals.subtotal,
                discount_amount: totals.discount,
                tax_amount: totals.taxAmount,
                total_amount: totals.total,
                payment_method: paymentMethod,
                items: saleItems
            };

            console.log('Saving Repair Job:', saleData);

            // Call API to create sale (this handles stock update for parts internally if configured, 
            // but api.sales.create logic usually handles it. 
            // NOTE: Original Garage code manually updated stock. 
            // api.sales.create in supabaseService DOES update stock for items with product_id.
            // So we DO NOT need manual stock update here anymore.)

            const result = await api.sales.create(saleData);

            if (result.success) {
                // Prepare data for the existing ServiceInvoice component
                const invoiceServiceData = {
                    ...saleData,
                    vehicle_number: combinedDeviceIdentifier, // Mapped for invoice
                    vehicle_type: deviceType,
                    service_type: selectedServices.map(s => s.type).join(', '),
                    service_warranty: selectedServices
                        .map(s => s.warranty ? `${s.type}: ${s.warranty}` : null)
                        .filter(Boolean)
                        .join('; '),
                    created_at: new Date().toISOString(),
                    invoice_number: result.invoice_number || 'PENDING',
                    parts_total: totals.partsTotal,
                    service_charges: totals.serviceCharges,
                    labour_charges: totals.labourCharges,
                    tax_amount: totals.taxAmount, // Explicitly pass for service invoice
                    payment_method: paymentMethod,
                    items_used: itemsUsed // Pass raw parts for separate section in invoice
                };

                // Store customer data for invoice
                setInvoiceCustomerData(selectedCustomer);

                // Store invoice data and show invoice
                setInvoiceData(invoiceServiceData);
                setShowInvoice(true);

                // Reset form (keep Tax and Payment Method settings)
                resetForm();
            } else {
                alert(`Error saving job: ${result.message}`);
            }
        } catch (error) {
            console.error('Error completing repair job:', error);
            alert('Error completing repair job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedServices([]);
        setCurrentServiceSelection('');
        setDeviceModel('');
        setSerialNumber('');
        setDeviceType('');
        setServiceCharges(0);
        setLabourCharges(0);
        setDiscount(0);
        setSelectedCustomer(null);
        setItemsUsed([]);
        // Do NOT reset taxRate or paymentMethod (persist user preference)
        // Ensure Device Type persists default is handled by component mount but we can reset to empty or keep
        // keeping current behavior (controlled by state initialization)
    };

    const totals = calculateTotals();

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="mb-6 p-6 pb-0">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <Monitor className="mr-3" size={32} />
                    Repair & Service Job
                </h1>
                <p className="text-gray-600 mt-1">Manage device repairs and service jobs</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto px-6">
                {/* Left Panel - Repair Details */}
                <div className="lg:col-span-2 space-y-6 pb-6">
                    {/* Repair Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Repair Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Service Types & Warranties */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Repair Type & Warranty *
                                </label>

                                {/* Selected Services List */}
                                {selectedServices.length > 0 && (
                                    <div className="space-y-3 mb-4">
                                        {selectedServices.map((service, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex-1 font-medium text-gray-800">
                                                    {service.type}
                                                </div>
                                                <div className="w-48">
                                                    <input
                                                        type="text"
                                                        placeholder="Warranty (e.g. 30 Days)"
                                                        value={service.warranty}
                                                        onChange={(e) => {
                                                            const updated = [...selectedServices];
                                                            updated[index].warranty = e.target.value;
                                                            setSelectedServices(updated);
                                                        }}
                                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newServices = [...selectedServices];
                                                        newServices.splice(index, 1);
                                                        setSelectedServices(newServices);
                                                    }}
                                                    className="text-gray-400 hover:text-red-600 p-1"
                                                    title="Remove service"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Service Control */}
                                <div className="flex gap-2">
                                    <select
                                        value={currentServiceSelection}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value && !selectedServices.some(s => s.type === value)) {
                                                setSelectedServices([...selectedServices, { type: value, warranty: '' }]);
                                            }
                                            setCurrentServiceSelection('');
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select Repair Type...</option>
                                        {allServiceTypes.map((type) => (
                                            <option
                                                key={type}
                                                value={type}
                                                disabled={selectedServices.some(s => s.type === type)}
                                            >
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddServiceModal(true)}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1"
                                        title="Add new repair type"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Customer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer (Optional)
                                </label>
                                <select
                                    value={selectedCustomer?.id || ''}
                                    onChange={(e) => {
                                        const customer = customers.find((c) => c.id === e.target.value);
                                        setSelectedCustomer(customer);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">Walk-in Customer</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name} - {customer.phone}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Device Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Device Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Device Model */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Device Model *
                                </label>
                                <input
                                    type="text"
                                    value={deviceModel}
                                    onChange={(e) => setDeviceModel(e.target.value)}
                                    placeholder="e.g., iPhone 13 Pro, Dell XPS 15"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            {/* Serial Number / IMEI */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Serial Number / IMEI
                                </label>
                                <input
                                    type="text"
                                    value={serialNumber}
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                    placeholder="e.g. SN12345678"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Device Type */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Device Type *
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={deviceType}
                                        onChange={(e) => setDeviceType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">Select Device Type</option>
                                        {customDeviceTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddDeviceTypeModal(true)}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1"
                                        title="Add new device type"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Used */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Parts / Items Used</h2>
                            <button
                                onClick={addItemUsed}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                <span>Add Part</span>
                            </button>
                        </div>

                        {itemsUsed.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No parts added yet</p>
                        ) : (
                            <div className="space-y-3">
                                {itemsUsed.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                        <div className="col-span-5">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Part / Product
                                            </label>
                                            <select
                                                value={item.product_id}
                                                onChange={(e) => updateItemUsed(index, 'product_id', e.target.value)}
                                                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="">Select Part</option>
                                                {products.map((product) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name} - {formatCurrency(product.selling_price)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Qty
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItemUsed(index, 'quantity', e.target.value)}
                                                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Price
                                            </label>
                                            <input
                                                type="text"
                                                value={formatCurrency(item.unit_price)}
                                                readOnly
                                                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Total
                                            </label>
                                            <input
                                                type="text"
                                                value={formatCurrency(item.total)}
                                                readOnly
                                                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <button
                                                onClick={() => removeItemUsed(index)}
                                                className="w-full px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Pricing & Summary */}
                <div className="lg:w-3/3 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-0">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">

                            Pricing Summary
                        </h2>

                        <div className="space-y-3">
                            {/* Parts Total */}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Parts Total</span>
                                <span className="font-medium text-gray-800">{formatCurrency(totals.partsTotal)}</span>
                            </div>

                            {/* Service Charges Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Service Charges
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={serviceCharges}
                                        onChange={(e) => setServiceCharges(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>

                            {/* Discount Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>

                            {/* Tax Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tax (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            {/* Payment Method Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Final Calculations */}
                            <div className="pt-4 border-t border-gray-200 space-y-2">
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(totals.subtotal)}</span>
                                </div>
                                {totals.discount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-red-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(totals.discount)}</span>
                                    </div>
                                )}
                                {totals.taxAmount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-gray-800">
                                        <span>Tax ({taxRate}%)</span>
                                        <span>{formatCurrency(totals.taxAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-2">
                                    <span>Total Amount</span>
                                    <span className="text-2xl font-bold text-primary-600">{formatCurrency(totals.total)}</span>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full mt-4 py-3 text-lg"
                                onClick={handleCompleteService}
                                disabled={loading}
                            >
                                {loading ? (
                                    'Processing...'
                                ) : (
                                    <>

                                        Complete Job & Print
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Invoice Modal */}
            {showInvoice && invoiceData && (
                <ServiceInvoice
                    serviceData={invoiceData}
                    shopData={currentShop}
                    customerData={invoiceCustomerData}
                    onClose={() => setShowInvoice(false)}
                    type="repair"
                />
            )}

            {/* Add Service Type Modal */}
            {showAddServiceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Repair Type</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Repair Type Name
                            </label>
                            <input
                                type="text"
                                value={newServiceType}
                                onChange={(e) => setNewServiceType(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddServiceType();
                                    }
                                }}
                                placeholder="e.g., Chip Replacement"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowAddServiceModal(false);
                                    setNewServiceType('');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddServiceType}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Add Type
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Device Type Modal */}
            {
                showAddDeviceTypeModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Device Type</h2>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Device Type Name
                                </label>
                                <input
                                    type="text"
                                    value={newDeviceType}
                                    onChange={(e) => setNewDeviceType(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddDeviceType();
                                        }
                                    }}
                                    placeholder="e.g., Tablet"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowAddDeviceTypeModal(false);
                                        setNewDeviceType('');
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddDeviceType}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    Add Type
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default RepairService;
