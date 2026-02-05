import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import { formatCurrency, calculateItemTotal } from '../utils/calculations';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ThermalReceipt from '../components/ThermalReceipt/ThermalReceipt';
import Invoice from '../components/Invoice/Invoice';
import {
    Search,
    Plus,
    Trash2,
    ShoppingCart,
    Printer,
    X,
    User,
    ArrowLeft,
    LogOut,
    UserCircle,
    Package,
} from 'lucide-react';

const PointOfSale = () => {
    const { user, logout } = useAuth();
    const { shopId, currentShop } = useShop();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [billDiscount, setBillDiscount] = useState(0);
    const [taxRate, setTaxRate] = useState(0);
    const [warranty, setWarranty] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [showReceipt, setShowReceipt] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const customerDropdownRef = useRef(null);
    const isInitialMount = useRef(true);

    const loadSavedPOSData = () => {
        try {
            // Load cart
            const savedCart = localStorage.getItem('pos_cart');
            if (savedCart) {
                setCart(JSON.parse(savedCart));
            }

            // Load other settings
            const savedBillDiscount = localStorage.getItem('pos_bill_discount');
            if (savedBillDiscount) {
                setBillDiscount(parseFloat(savedBillDiscount));
            }

            const savedTaxRate = localStorage.getItem('pos_tax_rate');
            if (savedTaxRate) {
                setTaxRate(parseFloat(savedTaxRate));
            }

            const savedWarranty = localStorage.getItem('pos_warranty');
            if (savedWarranty) {
                setWarranty(savedWarranty);
            }

            const savedPaymentMethod = localStorage.getItem('pos_payment_method');
            if (savedPaymentMethod) {
                setPaymentMethod(savedPaymentMethod);
            }
        } catch (error) {
            console.error('Error loading POS data from localStorage:', error);
        }
    };

    const loadData = async () => {
        const [productsData, customersData] = await Promise.all([
            api.products.getAll(shopId),
            api.customers.getAll(shopId),
        ]);
        setProducts(productsData);
        setCustomers(customersData);
    };

    // Load saved cart and settings from localStorage on mount (before shopId loads)
    useEffect(() => {
        loadSavedPOSData();
    }, []);

    useEffect(() => {
        if (shopId) {
            loadData();
        }
    }, [shopId]);

    // Restore selected customer after customers are loaded
    useEffect(() => {
        if (customers.length > 0) {
            const savedCustomerId = localStorage.getItem('pos_selected_customer_id');
            if (savedCustomerId) {
                const customer = customers.find(c => c.id === savedCustomerId);
                if (customer) {
                    setSelectedCustomer(customer);
                }
            }
        }
    }, [customers]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Save cart to localStorage whenever it changes (skip on initial mount)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        localStorage.setItem('pos_cart', JSON.stringify(cart));
    }, [cart]);

    // Save customer selection to localStorage
    useEffect(() => {
        if (selectedCustomer) {
            localStorage.setItem('pos_selected_customer_id', selectedCustomer.id);
        } else {
            localStorage.removeItem('pos_selected_customer_id');
        }
    }, [selectedCustomer]);

    // Save bill discount to localStorage
    useEffect(() => {
        localStorage.setItem('pos_bill_discount', billDiscount.toString());
    }, [billDiscount]);

    // Save tax rate to localStorage
    useEffect(() => {
        localStorage.setItem('pos_tax_rate', taxRate.toString());
    }, [taxRate]);

    // Save warranty to localStorage
    useEffect(() => {
        localStorage.setItem('pos_warranty', warranty);
    }, [warranty]);

    // Save payment method to localStorage
    useEffect(() => {
        localStorage.setItem('pos_payment_method', paymentMethod);
    }, [paymentMethod]);

    const filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToCart = (product) => {
        const existingItem = cart.find((item) => item.product_id === product.id);

        if (existingItem) {
            setCart(
                cart.map((item) =>
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );

        } else {
            setCart([
                ...cart,
                {
                    product_id: product.id,
                    name: product.name,
                    sku: product.sku,
                    unit_price: product.selling_price,
                    quantity: 1,
                    discount_amount: 0,
                    tax_rate: taxRate,
                },
            ]);
        }
        setSearchTerm('');
        setShowDropdown(false);
        searchInputRef.current?.focus();
    };

    const updateCartItem = (productId, field, value) => {
        setCart(
            cart.map((item) =>
                item.product_id === productId ? { ...item, [field]: parseFloat(value) || 0 } : item
            )
        );
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter((item) => item.product_id !== productId));
    };

    const calculateTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
        const itemDiscounts = cart.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
        const afterItemDiscounts = subtotal - itemDiscounts;
        const afterBillDiscount = afterItemDiscounts - billDiscount;
        const taxAmount = afterBillDiscount * (taxRate / 100);
        const total = afterBillDiscount + taxAmount;

        return {
            subtotal,
            itemDiscounts,
            billDiscount,
            totalDiscounts: itemDiscounts + billDiscount,
            taxAmount,
            total,
        };
    };

    const handleCompleteSale = async () => {
        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        setLoading(true);

        const totals = calculateTotals();
        const saleData = {
            shop_id: shopId,
            customer_id: selectedCustomer?.id,
            user_id: user.id,
            subtotal: totals.subtotal,
            discount_amount: totals.totalDiscounts,
            tax_amount: totals.taxAmount,
            total_amount: totals.total,
            payment_method: paymentMethod,
            warranty: warranty || null,
            items: cart.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_amount: item.discount_amount || 0,
                tax_rate: item.tax_rate || 0,
                total_price: calculateItemTotal(
                    item.quantity,
                    item.unit_price,
                    item.discount_amount,
                    item.tax_rate
                ),
            })),
        };

        const result = await api.sales.create(saleData);

        if (result.success) {
            // Reload products to show updated stock
            await loadData();

            // Get the invoice data
            let invoice = await api.sales.getById(result.id);

            // Enrich invoice with customer and product details for display
            if (invoice) {
                invoice = {
                    ...invoice,
                    warranty: invoice.warranty || warranty || null, // Explicitly ensure warranty is included
                    customer_name: selectedCustomer?.name,
                    customer_phone: selectedCustomer?.phone,
                    customer_email: selectedCustomer?.email,
                    customer_address: selectedCustomer?.address,
                    items: invoice.items.map(item => {
                        const cartItem = cart.find(c => c.product_id === item.product_id);
                        return {
                            ...item,
                            name: cartItem?.name,
                            sku: cartItem?.sku,
                        };
                    }),
                };
            }

            setCurrentInvoice(invoice);
            setShowReceipt(true);
            clearCart();
        } else {
            alert('Failed to create sale: ' + result.message);
        }

        setLoading(false);
    };

    const clearCart = () => {
        setCart([]);
        // Keep customer, billDiscount, taxRate, warranty, and paymentMethod for convenience
    };

    const totals = calculateTotals();

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {/* Only show Back to Menu for non-cashier users */}
                        {user?.role !== 'cashier' && (
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center text-gray-600 hover:text-gray-800"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft size={24} />
                                <span className="ml-2 font-medium">Back to Menu</span>
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-gray-800">Point of Sale</h1>
                    </div>

                    {/* User Info and Logout */}
                    <div className="flex items-center space-x-4">
                        {/* Products Button - Always visible */}
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => navigate('/products')}
                            className="flex items-center space-x-2"
                        >
                            <Package size={18} />
                            <span>Products</span>
                        </Button>

                        <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            <UserCircle size={32} className="text-primary-600" />
                            <div>
                                <p className="font-semibold text-gray-800">{user?.full_name}</p>
                                <p className="text-xs text-gray-600 capitalize">{user?.role?.replace('_', ' ')}</p>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="md"
                            onClick={logout}
                            className="flex items-center space-x-2"
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Product Selection */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Search with Autocomplete */}
                    <div className="mb-4 relative p-4 pb-0" ref={dropdownRef}>
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowDropdown(e.target.value.length > 0);
                                    }}
                                    onFocus={() => {
                                        if (searchTerm.length > 0) {
                                            setShowDropdown(true);
                                        }
                                    }}
                                    placeholder="Search products by name or SKU..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            {cart.length > 0 && (
                                <Button variant="secondary" size="sm" onClick={clearCart} className="whitespace-nowrap">
                                    Clear All
                                </Button>
                            )}
                        </div>

                        {/* Autocomplete Dropdown */}
                        {showDropdown && searchTerm && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto left-4 right-4">
                                {filteredProducts.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No products found</p>
                                    </div>
                                ) : (
                                    <div className="py-1">
                                        {filteredProducts.map((product) => (
                                            <button
                                                key={product.id}
                                                onClick={() => addToCart(product)}
                                                disabled={product.stock_quantity <= 0}
                                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${product.stock_quantity <= 0
                                                    ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                                    : 'cursor-pointer'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-gray-800">
                                                                {product.name}
                                                            </h4>
                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                {product.sku}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-sm font-bold text-primary-600">
                                                                {formatCurrency(product.selling_price)}
                                                            </span>
                                                            <span
                                                                className={`text-xs px-2 py-0.5 rounded font-medium ${product.stock_quantity <= 0
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : product.stock_quantity < 10
                                                                        ? 'bg-yellow-100 text-yellow-700'
                                                                        : 'bg-green-100 text-green-700'
                                                                    }`}
                                                            >
                                                                {product.stock_quantity <= 0
                                                                    ? 'Out of Stock'
                                                                    : `Stock: ${product.stock_quantity}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {product.stock_quantity > 0 && (
                                                        <Plus size={20} className="text-primary-600 ml-2" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cart Items Display */}
                    <div className="flex-1 overflow-y-auto px-4">
                        {cart.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                                <p>Cart is empty</p>
                                <p className="text-sm mt-2">Search and add products to start</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {cart.map((item) => (
                                    <div key={item.product_id} className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-800 text-base truncate">{item.name}</h4>
                                                <p className="text-xs text-gray-500 truncate">{item.sku}</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.product_id)}
                                                className="text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0 ml-2"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div>
                                                <label className="text-xs text-gray-600 block mb-1 font-medium">Qty</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateCartItem(item.product_id, 'quantity', e.target.value)
                                                    }
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600 block mb-1 font-medium">Disc</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.discount_amount}
                                                    onChange={(e) =>
                                                        updateCartItem(item.product_id, 'discount_amount', e.target.value)
                                                    }
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 pt-2 border-t border-gray-200">
                                            <div className="flex justify-between items-center text-xs text-gray-600">
                                                <span>{item.quantity} × {formatCurrency(item.unit_price)}</span>
                                            </div>
                                            <div className="font-bold text-base text-primary-600 text-right">
                                                {formatCurrency(
                                                    calculateItemTotal(
                                                        item.quantity,
                                                        item.unit_price,
                                                        item.discount_amount,
                                                        item.tax_rate
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart Footer - Horizontal at Bottom */}
                    {cart.length > 0 && (
                        <div className="flex-shrink-0 border-t-2 border-gray-300 bg-white shadow-lg">
                            <div className="p-3">
                                {/* First Row - Customer, Bill Discount, Tax, Warranty, Payment */}
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-2">
                                    {/* Customer Selection */}
                                    <div className="relative" ref={customerDropdownRef}>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Customer
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedCustomer ? selectedCustomer.name : customerSearchTerm}
                                            onChange={(e) => {
                                                setCustomerSearchTerm(e.target.value);
                                                setShowCustomerDropdown(true);
                                                if (!e.target.value) {
                                                    setSelectedCustomer(null);
                                                }
                                            }}
                                            onFocus={() => {
                                                setShowCustomerDropdown(true);
                                            }}
                                            placeholder="Walk-in or search..."
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />

                                        {/* Customer Dropdown */}
                                        {showCustomerDropdown && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {/* Walk-in Option */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCustomer(null);
                                                        setCustomerSearchTerm('');
                                                        setShowCustomerDropdown(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 text-sm"
                                                >
                                                    <div className="font-medium text-gray-700">Walk-in Customer</div>
                                                </button>

                                                {/* Filtered Customers */}
                                                {customers
                                                    .filter(c =>
                                                        c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                                                        c.phone.toLowerCase().includes(customerSearchTerm.toLowerCase())
                                                    )
                                                    .map((customer) => (
                                                        <button
                                                            key={customer.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedCustomer(customer);
                                                                setCustomerSearchTerm('');
                                                                setShowCustomerDropdown(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 text-sm"
                                                        >
                                                            <div className="font-medium text-gray-800">{customer.name}</div>
                                                            <div className="text-xs text-gray-500">{customer.phone}</div>
                                                        </button>
                                                    ))}

                                                {customers.filter(c =>
                                                    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                                                    c.phone.toLowerCase().includes(customerSearchTerm.toLowerCase())
                                                ).length === 0 && customerSearchTerm && (
                                                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                                            No customers found
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bill Discount */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Bill Disc
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={billDiscount}
                                            onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    {/* Tax */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Tax (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    {/* Warranty - Only for Computer Shops */}
                                    {currentShop?.business_type === 'Computer Shop' && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Warranty
                                            </label>
                                            <input
                                                type="text"
                                                value={warranty}
                                                onChange={(e) => setWarranty(e.target.value)}
                                                placeholder="1 Year"
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    )}

                                    {/* Payment Method */}
                                    <div className={currentShop?.business_type === 'Computer Shop' ? '' : 'lg:col-start-4'}>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Payment
                                        </label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="bank_transfer">Transfer</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Second Row - Totals and Checkout */}
                                <div className="flex items-end gap-3 pt-2 border-t border-gray-200">
                                    {/* Totals Summary */}
                                    <div className="flex-1 grid grid-cols-3 lg:grid-cols-4 gap-2 text-md">
                                        <div className="flex flex-col">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-semibold text-gray-800">{formatCurrency(totals.subtotal)}</span>
                                        </div>
                                        {totals.totalDiscounts > 0 && (
                                            <div className="flex flex-col">
                                                <span className="text-gray-600">Discounts</span>
                                                <span className="font-semibold text-red-600">-{formatCurrency(totals.totalDiscounts)}</span>
                                            </div>
                                        )}
                                        {totals.taxAmount > 0 && (
                                            <div className="flex flex-col">
                                                <span className="text-gray-600">Tax</span>
                                                <span className="font-semibold text-gray-800">{formatCurrency(totals.taxAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 font-medium">TOTAL</span>
                                            <span className="font-bold text-lg text-primary-600">{formatCurrency(totals.total)}</span>
                                        </div>
                                    </div>

                                    {/* Checkout Button */}
                                    <Button
                                        variant="primary"
                                        className="px-6 py-2.5 text-sm flex items-center justify-center whitespace-nowrap"
                                        onClick={handleCompleteSale}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            'Processing...'
                                        ) : (
                                            <>
                                                <Printer className="mr-2" size={16} />
                                                Complete Sale
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Receipt Modal - Conditional based on shop type */}
            {showReceipt && currentInvoice && (
                <Modal
                    isOpen={showReceipt}
                    onClose={() => setShowReceipt(false)}
                    title={currentShop?.business_type === 'Computer Shop' ? 'Invoice' : 'Thermal Receipt'}
                    size={currentShop?.business_type === 'Computer Shop' ? 'xl' : 'lg'}
                >
                    {currentShop?.business_type === 'Computer Shop' ? (
                        <Invoice
                            invoice={currentInvoice}
                            onClose={() => setShowReceipt(false)}
                        />
                    ) : (
                        <ThermalReceipt
                            invoice={currentInvoice}
                            onClose={() => setShowReceipt(false)}
                        />
                    )}
                </Modal>
            )}
        </div>
    );
};

export default PointOfSale;
