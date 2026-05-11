import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import Button from '../components/common/Button';
import ServiceInvoice from '../components/invoices/ServiceInvoice';
import Toast from '../components/common/Toast';
import { Wrench, Plus, Trash2, Printer, X, Settings, Edit2, Upload, Download } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const Garage = () => {
    const { user } = useAuth();
    const { shopId, currentShop } = useShop();
    const normalizedBusinessType = (currentShop?.business_type || '').toLowerCase();
    const isNevilWindscreen = currentShop?.business_type === 'Nevil Windscreen Center';
    const isRepairServiceLabel = normalizedBusinessType === 'service center' || isNevilWindscreen;
    const servicePageTitle = isRepairServiceLabel ? 'Repair Service' : 'Garage Service';

    // Form states
    const [selectedServices, setSelectedServices] = useState([]);
    const [currentServiceSelection, setCurrentServiceSelection] = useState('');
    // serviceWarranty removed as it's now per-service
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [mileage, setMileage] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [serviceCharges, setServiceCharges] = useState(0);
    const [labourCharges, setLabourCharges] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    // Items used from inventory
    const [itemsUsed, setItemsUsed] = useState([]);

    // Data states
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stockErrors, setStockErrors] = useState({});

    // Invoice state
    const [showInvoice, setShowInvoice] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const [invoiceCustomerData, setInvoiceCustomerData] = useState(null);

    // Service types management
    const defaultServiceTypes = [
        'Oil Change',
        'Brake Service',
        'Engine Repair',
        'Tire Service',
        'AC Repair',
        'Battery Replacement',
        'General Maintenance',
    ];
    // customServiceTypes: [{ type: string, defaultWarranty: string }]
    const [customServiceTypes, setCustomServiceTypes] = useState([]);
    const [showAddServiceModal, setShowAddServiceModal] = useState(false);
    const [showManageServiceTypesModal, setShowManageServiceTypesModal] = useState(false);
    const [newServiceType, setNewServiceType] = useState('');
    const [newServiceWarranty, setNewServiceWarranty] = useState('');
    const [editingServiceTypeIndex, setEditingServiceTypeIndex] = useState(null);
    const [editingServiceTypeName, setEditingServiceTypeName] = useState('');
    const [editingServiceWarranty, setEditingServiceWarranty] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Vehicle types
    const vehicleTypes = [
        'Car',
        'Van',
        'Truck',
        'Motorcycle',
        'SUV',
        'Bus',
        'Three-Wheeler',
    ];

    useEffect(() => {
        if (shopId) {
            loadData();
        }
        // Load custom service types for this user+shop combination
        loadCustomServiceTypes();
    }, [shopId, user?.id]);

    const getServiceTypeStorageKey = () => {
        return `custom_service_types_shop_${shopId || 'default'}_user_${user?.id || 'guest'}`;
    };

    const loadCustomServiceTypes = () => {
        try {
            const saved = localStorage.getItem(getServiceTypeStorageKey());
            if (saved) {
                const parsed = JSON.parse(saved);
                // Migrate old string[] format to object[] format
                const migrated = parsed.map(item =>
                    typeof item === 'string' ? { type: item, defaultWarranty: '' } : item
                );
                setCustomServiceTypes(migrated);
            } else {
                setCustomServiceTypes([]);
            }
        } catch (error) {
            console.error('Error loading custom service types:', error);
        }
    };

    const saveCustomServiceTypes = (types) => {
        try {
            localStorage.setItem(getServiceTypeStorageKey(), JSON.stringify(types));
            setCustomServiceTypes(types);
        } catch (error) {
            console.error('Error saving custom service types:', error);
        }
    };

    // --- CSV Export ---
    const handleExportServiceTypesCSV = () => {
        const allForExport = [
            ...(isNevilWindscreen ? [] : defaultServiceTypes.map(t => ({ type: t, defaultWarranty: '' }))),
            ...customServiceTypes,
        ];
        const rows = [['Service Type', 'Default Warranty'], ...allForExport.map(s => [s.type, s.defaultWarranty || ''])];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'service_types.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- CSV Import ---
    const handleImportServiceTypesCSV = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target.result;
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                // Skip header row
                const dataLines = lines[0]?.toLowerCase().includes('service type') ? lines.slice(1) : lines;
                const imported = [];
                dataLines.forEach(line => {
                    const parts = line.match(/(?:"([^"]*(?:""[^"]*)*)"|([^,]+))(?:,|$)/g) || [];
                    const clean = parts.map(p => p.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim());
                    const typeName = clean[0];
                    const warranty = clean[1] || '';
                    if (typeName) imported.push({ type: typeName, defaultWarranty: warranty });
                });
                // Merge: keep existing, add new
                const existingTypes = customServiceTypes.map(s => s.type);
                const newOnes = imported.filter(s => !existingTypes.includes(s.type) && !defaultServiceTypes.includes(s.type));
                // Update defaultWarranty for existing ones
                const updated = customServiceTypes.map(s => {
                    const found = imported.find(i => i.type === s.type);
                    return found ? { ...s, defaultWarranty: found.defaultWarranty } : s;
                });
                saveCustomServiceTypes([...updated, ...newOnes]);
                setToast({ show: true, message: `Imported ${imported.length} service types!`, type: 'success' });
            } catch (err) {
                setToast({ show: true, message: 'Failed to parse CSV file', type: 'error' });
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleAddServiceType = () => {
        if (newServiceType.trim()) {
            const trimmed = newServiceType.trim();
            const warranty = newServiceWarranty.trim();
            const allTypeNames = [...defaultServiceTypes, ...customServiceTypes.map(s => s.type)];
            if (!allTypeNames.includes(trimmed)) {
                saveCustomServiceTypes([...customServiceTypes, { type: trimmed, defaultWarranty: warranty }]);
            }
            if (!selectedServices.some(s => s.type === trimmed)) {
                setSelectedServices([...selectedServices, { type: trimmed, warranty }]);
            }
            setNewServiceType('');
            setNewServiceWarranty('');
            setShowAddServiceModal(false);
            setToast({ show: true, message: 'New service type added successfully!', type: 'success' });
        }
    };

    const handleEditServiceType = (index) => {
        if (editingServiceTypeName.trim()) {
            const newName = editingServiceTypeName.trim();
            const oldName = customServiceTypes[index].type;
            if (customServiceTypes.some((s, i) => i !== index && s.type === newName)) {
                setToast({ show: true, message: 'Service type with this name already exists', type: 'error' });
                return;
            }
            const updated = [...customServiceTypes];
            updated[index] = { type: newName, defaultWarranty: editingServiceWarranty.trim() };
            saveCustomServiceTypes(updated);
            const updatedSelected = selectedServices.map(s =>
                s.type === oldName ? { ...s, type: newName } : s
            );
            setSelectedServices(updatedSelected);
            setEditingServiceTypeIndex(null);
            setEditingServiceTypeName('');
            setEditingServiceWarranty('');
            setToast({ show: true, message: 'Service type updated successfully!', type: 'success' });
        }
    };

    const handleDeleteServiceType = (index) => {
        const typeToDelete = customServiceTypes[index].type;
        if (window.confirm(`Are you sure you want to delete "${typeToDelete}"?`)) {
            saveCustomServiceTypes(customServiceTypes.filter((_, i) => i !== index));
            if (selectedServices.some(s => s.type === typeToDelete)) {
                setSelectedServices(selectedServices.filter(s => s.type !== typeToDelete));
            }
            setToast({ show: true, message: 'Service type deleted successfully!', type: 'success' });
        }
    };

    // Combine into unified list: { type, defaultWarranty }
    const allServiceTypes = isNevilWindscreen
        ? [...customServiceTypes]
        : [
            ...defaultServiceTypes.map(t => ({ type: t, defaultWarranty: '' })),
            ...customServiceTypes,
          ];

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

    const removeItemUsed = (index) => {
        setStockErrors(prev => { const e = { ...prev }; delete e[index]; return e; });
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
                // Re-validate qty against new product's stock
                const stock = product.stock_quantity ?? product.quantity ?? 0;
                if (updated[index].quantity > stock) {
                    setStockErrors(prev => ({ ...prev, [index]: `Only ${stock} in stock` }));
                } else {
                    setStockErrors(prev => { const e = { ...prev }; delete e[index]; return e; });
                }
            } else {
                // Product deselected — clear error
                setStockErrors(prev => { const e = { ...prev }; delete e[index]; return e; });
            }
        } else if (field === 'quantity') {
            const qty = parseInt(value) || 0;
            updated[index].quantity = qty;
            updated[index].total = updated[index].unit_price * qty;
            // Validate against stock
            const product = products.find(p => String(p.id) === String(updated[index].product_id));
            if (product) {
                const stock = product.stock_quantity ?? product.quantity ?? 0;
                if (qty > stock) {
                    setStockErrors(prev => ({ ...prev, [index]: `Only ${stock} in stock` }));
                } else {
                    setStockErrors(prev => { const e = { ...prev }; delete e[index]; return e; });
                }
            }
        }

        setItemsUsed(updated);
    };

    // Calculate totals
    const calculateTotals = () => {
        const partsTotal = itemsUsed.reduce((sum, item) => sum + item.total, 0);
        const parsedServiceCharges = parseFloat(serviceCharges) || 0;
        const parsedLabourCharges = isNevilWindscreen ? 0 : (parseFloat(labourCharges) || 0);
        const subtotal = partsTotal + parsedServiceCharges + parsedLabourCharges;
        const total = subtotal - parseFloat(discount);

        return {
            partsTotal,
            serviceCharges: parsedServiceCharges,
            labourCharges: parsedLabourCharges,
            subtotal,
            discount: parseFloat(discount),
            total,
        };
    };

    const handleCompleteService = async () => {
        // Validation
        if (selectedServices.length === 0) {
            setToast({ show: true, message: 'Please select at least one service type', type: 'error' });
            return;
        }
        if (!isNevilWindscreen) {
            if (!vehicleNumber) {
                setToast({ show: true, message: 'Please enter vehicle number', type: 'error' });
                return;
            }
            if (!vehicleType) {
                setToast({ show: true, message: 'Please select vehicle type', type: 'error' });
                return;
            }
        }

        setLoading(true);

        try {
            // Update inventory stock for each item used
            for (const item of itemsUsed) {
                if (item.product_id) {
                    // Find the product to get current stock
                    // Find the product to get current stock
                    const product = products.find(p => p.id === item.product_id);
                    if (product) {
                        console.log(`Reducing stock for ${product.name}: ${item.quantity}`);

                        // Update product stock using specialized method
                        await api.products.updateStock(
                            item.product_id,
                            parseInt(item.quantity) || 0,
                            'out',
                            `Garage Service - ${vehicleNumber}`
                        );
                        console.log(`Stock updated via updateStock API`);
                    }
                }
            }

            // Reload products to reflect updated stock
            const updatedProducts = await api.products.getAll(shopId);
            setProducts(updatedProducts);

            const totals = calculateTotals();

            // create sale items for database
            const saleItems = [
                // 1. Used Parts
                ...itemsUsed.map(item => ({
                    product_id: item.product_id, // can be null if custom item
                    name: item.name,
                    quantity: parseInt(item.quantity) || 0,
                    unit_price: parseFloat(item.unit_price) || 0,
                    total_price: parseFloat(item.total) || 0
                })),
                // 2. Service Charges
                {
                    product_id: null,
                    name: !isNevilWindscreen && selectedServices.length > 0
                        ? `Service Charges: ${selectedServices.map(s => s.type).join(', ')}`
                        : 'Service Charges',
                    quantity: 1,
                    unit_price: totals.serviceCharges,
                    total_price: totals.serviceCharges
                },
                // 3. Labour Charges
                totals.labourCharges > 0 ? {
                    product_id: null,
                    name: 'Labour Charges',
                    quantity: 1,
                    unit_price: totals.labourCharges,
                    total_price: totals.labourCharges
                } : null,
                // 4. Vehicle Details (stored as 0 price item for record)
                ...(!isNevilWindscreen && (vehicleNumber || vehicleType || mileage) ? [{
                    product_id: null,
                    name: `Vehicle: ${vehicleNumber} (${vehicleType}) - ${mileage}km`,
                    quantity: 1,
                    unit_price: 0,
                    total_price: 0
                }] : [])
            ].filter(Boolean);

            const saleData = {
                shop_id: shopId,
                user_id: user.id,
                customer_id: selectedCustomer?.id || null,
                subtotal: totals.subtotal,
                discount_amount: totals.discount,
                tax_amount: 0, // Garage currently has no tax field
                total_amount: totals.total,
                payment_method: paymentMethod,
                items: saleItems,
                // Garage specific fields might need to be stored in notes or separate table if schema allows
                // For now, mapping to sales structure
            };

            console.log('Creating sale record:', saleData);
            const createdSale = await api.sales.create(saleData);

            // Construct invoice data using the created sale info
            const invoiceDataFull = {
                ...saleData,
                invoice_number: createdSale?.invoice_number || 'PENDING',
                created_at: createdSale?.created_at || new Date().toISOString(),
                // Add garage specific fields for the invoice display (ServiceInvoice template likely uses them)
                vehicle_type: vehicleType,
                mileage: mileage,
                items_used: itemsUsed, // Keep original format for ServiceInvoice if needed, or map correctly
                service_type: !isNevilWindscreen ? selectedServices.map(s => s.type).join(', ') : '',
                service_warranty: selectedServices
                        .map(s => s.warranty ? `${s.type}: ${s.warranty}` : null)
                        .filter(Boolean)
                        .join('; '),
                parts_total: totals.partsTotal,
                service_charges: totals.serviceCharges,
                labour_charges: totals.labourCharges,
            };

            console.log('DEBUG: totals', totals);
            console.log('DEBUG: invoiceDataFull', invoiceDataFull);

            // Store customer data for invoice (before resetting)
            setInvoiceCustomerData(selectedCustomer);

            // Store invoice data and show invoice
            setInvoiceData(invoiceDataFull);
            setShowInvoice(true);

            // Reset form
            resetForm();
        } catch (error) {
            console.error('Error completing service:', error);
            setToast({ show: true, message: 'Error completing service. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedServices([]);
        setCurrentServiceSelection('');
        setVehicleNumber('');
        setMileage('');
        setVehicleType('');
        setServiceCharges(0);
        setLabourCharges(0);
        setDiscount(0);
        setDiscount(0);
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        setItemsUsed([]);
    };

    const totals = calculateTotals();

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <Wrench className="mr-3" size={32} />
                    {servicePageTitle}
                </h1>
                <p className="text-gray-600 mt-1">
                    {isRepairServiceLabel ? 'Manage repair services' : 'Manage vehicle services and repairs'}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Service Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Service Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Service Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Service Types & Warranties */}
                            <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Service Types & Warranties *
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
                                                            placeholder="Warranty (e.g. 6mo)"
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
                                                    const found = allServiceTypes.find(s => s.type === value);
                                                    setSelectedServices([...selectedServices, { type: value, warranty: found?.defaultWarranty || '' }]);
                                                }
                                                setCurrentServiceSelection('');
                                            }}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Select Service Type to Add...</option>
                                            {allServiceTypes.map((s) => (
                                                <option
                                                    key={s.type}
                                                    value={s.type}
                                                    disabled={selectedServices.some(sel => sel.type === s.type)}
                                                >
                                                    {s.type}{s.defaultWarranty ? ` (${s.defaultWarranty})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddServiceModal(true)}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1"
                                            title="Add new service type"
                                        >
                                            <Plus size={20} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowManageServiceTypesModal(true)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-1"
                                            title="Manage repair types"
                                        >
                                            <Settings size={20} />
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

                    {/* Vehicle Information */}
                    {!isNevilWindscreen && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Vehicle Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vehicle Number *
                                    </label>
                                    <input
                                        type="text"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value)}
                                        placeholder="e.g., ABC-1234"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>

                                {/* Mileage */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mileage (km)
                                    </label>
                                    <input
                                        type="number"
                                        value={mileage}
                                        onChange={(e) => setMileage(e.target.value)}
                                        placeholder="e.g., 50000"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                {/* Vehicle Type */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vehicle Type *
                                    </label>
                                    <select
                                        value={vehicleType}
                                        onChange={(e) => setVehicleType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">Select Vehicle Type</option>
                                        {vehicleTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items Used */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Items Used</h2>
                            <button
                                onClick={addItemUsed}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                <span>Add Item</span>
                            </button>
                        </div>

                        {itemsUsed.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No items added yet</p>
                        ) : (
                            <div className="space-y-3">
                                {itemsUsed.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                        <div className="col-span-5">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Product
                                            </label>
                                            <select
                                                value={item.product_id}
                                                onChange={(e) => updateItemUsed(index, 'product_id', e.target.value)}
                                                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            >
                                                 <option value="">Select Product</option>
                                                 {products.filter(p => (p.quantity ?? p.stock_quantity ?? 0) > 0).map((product) => (
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
                                                className={`w-full px-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 ${stockErrors[index] ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
                                            />
                                            {stockErrors[index] && (
                                                <p className="text-xs text-red-600 mt-1 font-medium">{stockErrors[index]}</p>
                                            )}
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
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Pricing Summary</h2>

                        <div className="space-y-4">
                            {/* Parts Total */}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Parts Total:</span>
                                <span className="font-semibold">{formatCurrency(totals.partsTotal)}</span>
                            </div>

                            {/* Service Charges */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Service Charges
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={serviceCharges}
                                    onChange={(e) => setServiceCharges(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Labour Charges */}
                            {!isNevilWindscreen && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Labour Charges
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={labourCharges}
                                        onChange={(e) => setLabourCharges(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            )}

                            <div className="border-t border-gray-200 pt-3">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                                </div>
                            </div>

                            {/* Discount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Total */}
                            <div className="border-t-2 border-gray-300 pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-800">Total:</span>
                                    <span className="text-2xl font-bold text-primary-600">
                                        {formatCurrency(totals.total)}
                                    </span>
                                </div>
                            </div>

                            {/* Complete Service Button */}
                            <Button
                                variant="primary"
                                className="w-full mt-6"
                                onClick={handleCompleteService}
                                disabled={loading || Object.keys(stockErrors).length > 0}
                            >
                                {loading ? (
                                    'Processing...'
                                ) : (
                                    <>
                                        Complete Service & Print
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
                    usePosLayout={true}
                    onClose={() => setShowInvoice(false)}
                />
            )}

            {/* Add Service Type Modal */}
            {showAddServiceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Service Type</h2>

                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type Name *</label>
                            <input
                                type="text"
                                value={newServiceType}
                                onChange={(e) => setNewServiceType(e.target.value)}
                                onKeyPress={(e) => { if (e.key === 'Enter') handleAddServiceType(); }}
                                placeholder="e.g., Suspension Repair"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                autoFocus
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Default Warranty Period</label>
                            <input
                                type="text"
                                value={newServiceWarranty}
                                onChange={(e) => setNewServiceWarranty(e.target.value)}
                                placeholder="e.g., 3 months, 1 year"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowAddServiceModal(false); setNewServiceType(''); setNewServiceWarranty(''); }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddServiceType}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Add Service
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Service Types Modal */}
            {showManageServiceTypesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Manage Service Types</h2>
                            <button onClick={() => setShowManageServiceTypesModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        {/* CSV Import / Export */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={handleExportServiceTypesCSV}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                                <Download size={15} /> Export CSV
                            </button>
                            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
                                <Upload size={15} /> Import CSV
                                <input type="file" accept=".csv" className="hidden" onChange={handleImportServiceTypesCSV} />
                            </label>
                            <span className="text-xs text-gray-400 self-center">CSV format: Service Type, Default Warranty</span>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2">
                            {customServiceTypes.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No custom service types added.</p>
                            ) : (
                                <div className="space-y-2">
                                    {customServiceTypes.map((svc, index) => (
                                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            {editingServiceTypeIndex === index ? (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        value={editingServiceTypeName}
                                                        onChange={(e) => setEditingServiceTypeName(e.target.value)}
                                                        placeholder="Service type name"
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                                                        autoFocus
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editingServiceWarranty}
                                                        onChange={(e) => setEditingServiceWarranty(e.target.value)}
                                                        placeholder="Default warranty (e.g. 3 months)"
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => handleEditServiceType(index)} className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                                                        <button onClick={() => { setEditingServiceTypeIndex(null); setEditingServiceTypeName(''); setEditingServiceWarranty(''); }} className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium text-gray-800">{svc.type}</span>
                                                        {svc.defaultWarranty && (
                                                            <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{svc.defaultWarranty}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => { setEditingServiceTypeIndex(index); setEditingServiceTypeName(svc.type); setEditingServiceWarranty(svc.defaultWarranty || ''); }}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteServiceType(index)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowManageServiceTypesModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                    duration={2000}
                />
            )}
        </div>
    );
};

export default Garage;
