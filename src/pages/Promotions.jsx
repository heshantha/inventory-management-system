import React, { useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import Button from '../components/common/Button';
import { Megaphone, MessageCircle, Share2, Copy, Search, Tag, Smartphone } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const Promotions = () => {
    const { shopId } = useShop();

    // Data States
    const [products, setProducts] = useState([]);
    const [services, setServices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [customerFilter, setCustomerFilter] = useState('');

    // Promotion States
    const [promoType, setPromoType] = useState('product'); // 'product' | 'service'
    const [selectedItem, setSelectedItem] = useState(null); // id
    const [offerType, setOfferType] = useState('percentage'); // 'percentage' | 'fixed'
    const [offerValue, setOfferValue] = useState(10);
    const [customMessage, setCustomMessage] = useState('');

    useEffect(() => {
        if (shopId) {
            loadData();
        }
    }, [shopId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, customersData] = await Promise.all([
                api.products.getAll(shopId),
                api.customers.getAll(shopId)
            ]);
            setProducts(productsData || []);
            setCustomers(customersData || []);

            // Load services from localStorage like RepairService.jsx does
            const savedServices = localStorage.getItem('custom_repair_types');
            if (savedServices) {
                setServices(JSON.parse(savedServices));
            } else {
                setServices([]);
            }
        } catch (error) {
            console.error('Error loading promotion data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate prices
    const getOriginalPrice = () => {
        if (promoType === 'product' && selectedItem) {
            const product = products.find(p => p.id === selectedItem);
            return product ? product.selling_price : 0;
        }
        return 0; // Services don't have fixed prices usually, simplified for now
    };

    const getNewPrice = () => {
        const original = getOriginalPrice();
        if (original === 0 && promoType === 'service') return 0; // Handle service dynamic pricing if needed

        if (offerType === 'percentage') {
            return original - (original * (offerValue / 100));
        } else {
            return offerValue; // Fixed price
        }
    };

    // Generate Message
    useEffect(() => {
        generateMessage();
    }, [promoType, selectedItem, offerType, offerValue]);

    const generateMessage = () => {
        let itemName = '';
        let priceSection = '';

        if (promoType === 'product' && selectedItem) {
            const product = products.find(p => p.id === selectedItem);
            if (product) {
                itemName = product.name;
                const original = product.selling_price;
                const newPrice = getNewPrice();

                if (offerType === 'percentage') {
                    priceSection = `Get ${offerValue}% OFF! Now only ${formatCurrency(newPrice)} (Was ${formatCurrency(original)})`;
                } else {
                    priceSection = `Special Offer: Only ${formatCurrency(newPrice)}! (Save ${formatCurrency(original - newPrice)})`;
                }
            }
        } else if (promoType === 'service' && selectedItem) {
            itemName = selectedItem; // Service name string
            if (offerType === 'percentage') {
                priceSection = `Get ${offerValue}% OFF on ${itemName} services!`;
            } else {
                priceSection = `Special Deal on ${itemName} services! Starting from ${formatCurrency(offerValue)}`;
            }
        }

        if (itemName) {
            setCustomMessage(`🔥 HOT DEAL ALERT! 🔥\n\n${itemName}\n${priceSection}\n\nLimited time offer! Visit us today or reply to book now. 🏃‍♂️💨`);
        } else {
            setCustomMessage('');
        }
    };

    // Actions
    const handleCopy = () => {
        navigator.clipboard.writeText(customMessage);
        alert('Message copied to clipboard!');
    };

    const handleShareToGroup = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(customMessage)}`;
        window.open(url, '_blank');
    };

    const handleSendToCustomer = (phone) => {
        // Clean phone number
        let cleanPhone = phone.replace(/\D/g, '');
        // Basic check if it lacks country code (assuming local context if length is small, but safer not to guess)
        // Ideally should assume international format or prepend local code if configured.
        // For now, passing as is or relying on user input quality.

        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`;
        window.open(url, '_blank');
    };

    const filteredCustomers = customers.filter(c => {
        const nameMatch = c.name.toLowerCase().includes(customerFilter.toLowerCase());
        const phoneMatch = c.phone && c.phone.includes(customerFilter);
        return (nameMatch || phoneMatch) && c.phone; // Only show customers with phones
    });

    return (
        <div className="p-3 md:p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Megaphone className="text-primary-600" />
                    Promotions & Marketing
                </h1>
                <p className="text-gray-600">Create simplified WhatsApp campaigns for your products and services.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Configuration */}
                <div className="space-y-6">
                    {/* 1. Select Item */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Tag size={20} /> 1. Create Offer
                        </h2>

                        {/* Type Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                            <button
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${promoType === 'product' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                onClick={() => { setPromoType('product'); setSelectedItem(null); setOfferType('percentage'); setOfferValue(10); }}
                            >
                                Product Promotion
                            </button>
                            <button
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${promoType === 'service' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                onClick={() => { setPromoType('service'); setSelectedItem(null); setOfferType('percentage'); setOfferValue(10); }}
                            >
                                Service Promotion
                            </button>
                        </div>

                        {/* Selection Dropdown */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select {promoType === 'product' ? 'Product' : 'Service Type'}
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                value={selectedItem || ''}
                                onChange={(e) => setSelectedItem(e.target.value)}
                            >
                                <option value="">-- Select --</option>
                                {promoType === 'product' ? (
                                    products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.selling_price)}</option>
                                    ))
                                ) : (
                                    services.map((s, idx) => (
                                        <option key={idx} value={s}>{s}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Offer Details */}
                        {selectedItem && (
                            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                                <label className="block text-sm font-medium text-primary-900 mb-2">Discount / Offer</label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <select
                                            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            value={offerType}
                                            onChange={(e) => setOfferType(e.target.value)}
                                        >
                                            <option value="percentage">Percentage (%) Off</option>
                                            <option value="fixed">Fixed Price</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            value={offerValue}
                                            onChange={(e) => setOfferValue(parseFloat(e.target.value) || 0)}
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {promoType === 'product' && (
                                    <div className="mt-3 flex justify-between items-center text-sm">
                                        <span className="text-gray-500 line-through">Was: {formatCurrency(getOriginalPrice())}</span>
                                        <span className="font-bold text-green-600 text-lg">Now: {formatCurrency(getNewPrice())}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 2. Message Preview */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MessageCircle size={20} /> 2. Message Preview
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customize Message
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                                rows={6}
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                disabled={!selectedItem}
                                placeholder="Select an item to generate offer message..."
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 justify-center"
                                onClick={handleCopy}
                                disabled={!customMessage}
                            >
                                Copy Text
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1 justify-center bg-[#25D366] hover:bg-[#128C7E] border-none"
                                onClick={handleShareToGroup}
                                disabled={!customMessage}
                            >
                                Share to Group
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-8rem)]">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Smartphone size={20} /> 3. Send to Customers
                        </h2>
                        <div className="mt-4 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                value={customerFilter}
                                onChange={(e) => setCustomerFilter(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {loading ? (
                            <div className="flex justify-center p-8">Loading...</div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="text-center text-gray-500 p-8">
                                No customers found with phone numbers.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredCustomers.map(customer => (
                                    <div key={customer.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                                        <div>
                                            <div className="font-medium text-gray-800">{customer.name}</div>
                                            <div className="text-sm text-gray-500">{customer.phone}</div>
                                        </div>
                                        <button
                                            className="bg-[#25D366] text-white p-2 rounded-full hover:bg-[#128C7E] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => handleSendToCustomer(customer.phone)}
                                            title="Send on WhatsApp"
                                            disabled={!customMessage}
                                        >
                                            <Share2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
                        Note: Opens WhatsApp Web or App for each click. Use responsibly.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Promotions;
