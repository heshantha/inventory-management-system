import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import supabaseService from '../../services/supabaseService';
import Button from '../../components/common/Button';
import { Trash2, AlertTriangle } from 'lucide-react';

const ClearDataSettings = () => {
    const { user } = useAuth();
    const { currentShop } = useShop();
    const [clearing, setClearing] = useState(false);
    const [selectedData, setSelectedData] = useState({
        sales: true,
        products: false,
        customers: false,
        categories: false,
        suppliers: false,
        stock_movements: false
    });

    // Only shop owners can clear data
    if (user?.role !== 'shop_owner') {
        return null;
    }

    const handleClearData = async () => {
        const dataToDelete = Object.keys(selectedData).filter(key => selectedData[key]);

        if (dataToDelete.length === 0) {
            alert('Please select at least one data type to clear');
            return;
        }

        const confirmMessage = `⚠️ WARNING: Clear Shop Data?\n\nYou are about to permanently delete:\n${dataToDelete.map(d => `- ${d.replace('_', ' ').toUpperCase()}`).join('\n')}\n\nThis action CANNOT be undone!\n\nType "${currentShop?.name}" to confirm:`;

        const userInput = prompt(confirmMessage);

        if (userInput === currentShop?.name) {
            setClearing(true);
            try {
                const result = await supabaseService.clearShopData(currentShop.id, dataToDelete);

                if (result.success) {
                    const summary = Object.entries(result.results)
                        .filter(([key]) => dataToDelete.includes(key))
                        .map(([key, count]) => `${key}: ${count} deleted`)
                        .join('\n');

                    alert(`✅ Data cleared successfully!\n\n${summary}\n\nPage will reload...`);
                    window.location.reload();
                } else {
                    alert('Error clearing data: ' + result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            } finally {
                setClearing(false);
            }
        } else if (userInput !== null) {
            alert('Shop name did not match. Operation cancelled.');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
                <AlertTriangle className="text-red-600 mr-3" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Danger Zone - Clear Shop Data</h2>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This will permanently delete selected data from your shop. This action cannot be undone!
                </p>
            </div>

            <div className="space-y-3 mb-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedData.sales}
                        onChange={(e) => setSelectedData({ ...selectedData, sales: e.target.checked })}
                        className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-gray-700">Sales & Invoices (clears dashboard statistics)</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedData.products}
                        onChange={(e) => setSelectedData({ ...selectedData, products: e.target.checked })}
                        className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-gray-700">Products</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedData.customers}
                        onChange={(e) => setSelectedData({ ...selectedData, customers: e.target.checked })}
                        className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-gray-700">Customers</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedData.categories}
                        onChange={(e) => setSelectedData({ ...selectedData, categories: e.target.checked })}
                        className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-gray-700">Categories</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedData.suppliers}
                        onChange={(e) => setSelectedData({ ...selectedData, suppliers: e.target.checked })}
                        className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-gray-700">Suppliers</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedData.stock_movements}
                        onChange={(e) => setSelectedData({ ...selectedData, stock_movements: e.target.checked })}
                        className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-gray-700">Stock Movements</span>
                </label>
            </div>

            <Button
                variant="danger"
                onClick={handleClearData}
                disabled={clearing}
                style={{ display: 'flex', alignItems: 'center' }}
            >
                <Trash2 size={18} className="mr-2" />
                {clearing ? 'Clearing Data...' : 'Clear Selected Data'}
            </Button>
        </div>
    );
};

export default ClearDataSettings;
