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
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (shopId) {
            loadData();
        }
    }, [shopId]);

    const loadData = async () => {
        const [productsData, customersData] = await Promise.all([
            api.products.getAll(shopId),
            api.customers.getAll(shopId),
        ]);
        setProducts(productsData);
        setCustomers(customersData);
    };

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
        setSelectedCustomer(null);
        setBillDiscount(0);
        setWarranty('');
        setPaymentMethod('cash');
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
                <div className="flex-1 flex flex-col p-4 overflow-hidden">
                    {/* Search */}
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search products by name or SKU..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-min">
                        {filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:shadow-md transition-all text-left"
                                disabled={product.stock_quantity <= 0}
                            >
                                <h3 className="font-semibold text-gray-800 mb-1 truncate">
                                    {product.name}
                                </h3>
                                <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-lg font-bold text-primary-600">
                                        {formatCurrency(product.selling_price)}
                                    </p>
                                    <p className={`text-sm ${product.stock_quantity <= product.min_stock_level ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                        Stock: {product.stock_quantity}
                                    </p>
                                </div>
                                {product.stock_quantity <= 0 && (
                                    <div className="mt-2 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded text-center">
                                        Out of Stock
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel - Cart */}
                <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
                    {/* Cart Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <ShoppingCart className="mr-2" size={24} />
                                Cart ({cart.length})
                            </h2>
                            {cart.length > 0 && (
                                <Button variant="secondary" size="sm" onClick={clearCart}>
                                    Clear All
                                </Button>
                            )}
                        </div>

                        {/* Customer Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
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

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                                <p>Cart is empty</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.product_id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800">{item.name}</h4>
                                            <p className="text-xs text-gray-500">{item.sku}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.product_id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <label className="text-xs text-gray-600">Qty</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateCartItem(item.product_id, 'quantity', e.target.value)
                                                }
                                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600">Discount</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.discount_amount}
                                                onChange={(e) =>
                                                    updateCartItem(item.product_id, 'discount_amount', e.target.value)
                                                }
                                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            {item.quantity} × {formatCurrency(item.unit_price)}
                                        </span>
                                        <span className="font-bold text-primary-600">
                                            {formatCurrency(
                                                calculateItemTotal(
                                                    item.quantity,
                                                    item.unit_price,
                                                    item.discount_amount,
                                                    item.tax_rate
                                                )
                                            )}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Cart Footer - Totals & Checkout */}
                    {cart.length > 0 && (
                        <div className="border-t border-gray-200 p-4 space-y-4">
                            {/* Adjustments */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bill Discount
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={billDiscount}
                                        onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tax (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>


                            {/* Warranty - Only for Computer Shops */}
                            {currentShop?.business_type === 'Computer Shop' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Warranty (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={warranty}
                                        onChange={(e) => setWarranty(e.target.value)}
                                        placeholder="e.g., 1 Year, 6 Months"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            )}


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Totals */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(totals.subtotal)}</span>
                                </div>
                                {totals.totalDiscounts > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Discounts:</span>
                                        <span>-{formatCurrency(totals.totalDiscounts)}</span>
                                    </div>
                                )}
                                {totals.taxAmount > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Tax ({taxRate}%):</span>
                                        <span>{formatCurrency(totals.taxAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t border-gray-300">
                                    <span>Total:</span>
                                    <span className="text-primary-600">{formatCurrency(totals.total)}</span>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            <Button
                                variant="primary"
                                className="w-full text-lg py-3 flex items-center justify-center"
                                onClick={handleCompleteSale}
                                disabled={loading}
                            >
                                {loading ? (
                                    'Processing...'
                                ) : (
                                    <>
                                        <Printer className="mr-2" size={20} />
                                        Complete Sale & Print
                                    </>
                                )}
                            </Button>
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
