import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { Plus, Edit, Trash2, Truck, Phone, Mail, MapPin, Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { canAddItem, getUsageInfo } from '../utils/packageLimits';

const CSV_HEADERS = ['name', 'contact_person', 'email', 'phone', 'address'];

function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return { headers: [], rows: [] };

    const parseRow = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"' && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else if (ch === '"') {
                    inQuotes = false;
                } else {
                    current += ch;
                }
            } else if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current.trim());
        return result;
    };

    const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
    const rows = lines.slice(1).map(line => {
        const values = parseRow(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
    });
    return { headers, rows };
}

function escapeCSV(value) {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

const Suppliers = () => {
    const { shopId, currentShop } = useShop();
    const [suppliers, setSuppliers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
    });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState(null);
    const [importErrors, setImportErrors] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (shopId) {
            loadSuppliers();
        }
    }, [shopId]);

    const loadSuppliers = async () => {
        const data = await api.suppliers.getAll(shopId);
        setSuppliers(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSubmit = editingSupplier
            ? formData
            : { ...formData, shop_id: shopId };

        const result = editingSupplier
            ? await api.suppliers.update(editingSupplier.id, dataToSubmit)
            : await api.suppliers.create(dataToSubmit);

        if (result.success) {
            await loadSuppliers();
            setShowModal(false);
            resetForm();
            setToast({
                show: true,
                message: editingSupplier ? 'Supplier updated successfully!' : 'Supplier created successfully!',
                type: 'success'
            });
        } else {
            setToast({ show: true, message: 'Error: ' + result.message, type: 'error' });
        }
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contact_person: supplier.contact_person || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            const result = await api.suppliers.delete(id);
            if (result.success) {
                await loadSuppliers();
                setToast({ show: true, message: 'Supplier deleted successfully!', type: 'success' });
            } else {
                setToast({ show: true, message: 'Error deleting supplier: ' + result.message, type: 'error' });
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
        });
        setEditingSupplier(null);
    };

    const handleExportCSV = () => {
        if (suppliers.length === 0) {
            setToast({ show: true, message: 'No suppliers to export', type: 'error' });
            return;
        }
        const header = CSV_HEADERS.join(',');
        const rows = suppliers.map(s =>
            CSV_HEADERS.map(h => escapeCSV(s[h])).join(',')
        );
        const csv = [header, ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const shopName = currentShop?.name?.replace(/\s+/g, '_') || 'shop';
        link.download = `suppliers_${shopName}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setToast({ show: true, message: `Exported ${suppliers.length} suppliers to CSV`, type: 'success' });
    };

    const handleDownloadTemplate = () => {
        const csv = CSV_HEADERS.join(',') + '\n' + 'ABC Supplies,John Doe,john@abc.com,+1234567890,123 Main St';
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'suppliers_import_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv')) {
            setToast({ show: true, message: 'Please select a CSV file', type: 'error' });
            return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const { headers, rows } = parseCSV(text);

            if (!headers.includes('name')) {
                setImportErrors(['CSV must have a "name" column']);
                setImportData(null);
                setShowImportModal(true);
                return;
            }

            const normalize = (val) => (val || '').trim().replace(/\s+/g, ' ').toLowerCase();

            const existingNames = new Set(suppliers.map(s => normalize(s.name)));
            const existingPhones = new Set(
                suppliers.map(s => s.phone?.trim().replace(/\s+/g, '')).filter(Boolean)
            );
            const existingAddresses = new Set(
                suppliers.map(s => normalize(s.address)).filter(a => a)
            );

            const seenNames = new Set();
            const seenPhones = new Set();
            const seenAddresses = new Set();

            const errors = [];
            const valid = [];
            let duplicateCount = 0;

            rows.forEach((row, i) => {
                const rowNum = i + 2;
                if (!row.name || !row.name.trim()) {
                    errors.push(`Row ${rowNum}: Missing supplier name`);
                    return;
                }

                const name = normalize(row.name);
                const phone = row.phone?.trim().replace(/\s+/g, '') || '';
                const address = normalize(row.address);
                const reasons = [];

                if (existingNames.has(name) || seenNames.has(name)) {
                    reasons.push('name');
                }
                if (phone && (existingPhones.has(phone) || seenPhones.has(phone))) {
                    reasons.push('phone');
                }
                if (address && (existingAddresses.has(address) || seenAddresses.has(address))) {
                    reasons.push('address');
                }

                if (reasons.length > 0) {
                    duplicateCount++;
                    errors.push(`Row ${rowNum}: "${row.name.trim()}" skipped — duplicate ${reasons.join(' & ')}`);
                    return;
                }

                seenNames.add(name);
                if (phone) seenPhones.add(phone);
                if (address) seenAddresses.add(address);

                valid.push({
                    name: row.name.trim(),
                    contact_person: row.contact_person?.trim() || '',
                    email: row.email?.trim() || '',
                    phone: row.phone?.trim() || '',
                    address: row.address?.trim() || '',
                });
            });

            setImportErrors(errors);
            setImportData(valid);
            setImportResult(null);
            setShowImportModal(true);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleImportConfirm = async () => {
        if (!importData || importData.length === 0) return;

        if (currentShop) {
            const usageInfo = getUsageInfo(suppliers.length, currentShop.package_type, 'suppliers');
            if (!usageInfo.isUnlimited) {
                const remaining = usageInfo.limit - usageInfo.current;
                if (importData.length > remaining) {
                    setToast({
                        show: true,
                        message: `Cannot import ${importData.length} suppliers. Only ${remaining} slot(s) remaining in your package.`,
                        type: 'error'
                    });
                    return;
                }
            }
        }

        setImporting(true);
        let successCount = 0;
        let failCount = 0;
        const failedRows = [];

        for (const supplier of importData) {
            const result = await api.suppliers.create({ ...supplier, shop_id: shopId });
            if (result.success) {
                successCount++;
            } else {
                failCount++;
                failedRows.push(`${supplier.name}: ${result.message}`);
            }
        }

        setImporting(false);
        setImportResult({ successCount, failCount, failedRows });
        await loadSuppliers();
    };

    const closeImportModal = () => {
        setShowImportModal(false);
        setImportData(null);
        setImportErrors([]);
        setImportResult(null);
    };

    return (
        <div className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-6">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Suppliers Management</h1>
                        {currentShop && (() => {
                            const usageInfo = getUsageInfo(suppliers.length, currentShop.package_type, 'suppliers');
                            return !usageInfo.isUnlimited && (
                                <span className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full ${usageInfo.percentage >= 100 ? 'bg-red-100 text-red-800' :
                                    usageInfo.percentage >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                    {usageInfo.current} / {usageInfo.limit}
                                </span>
                            );
                        })()}
                    </div>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Manage your suppliers and vendors</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="flex items-center justify-center flex-1 md:flex-none"
                    >
                        <Download size={16} className="mr-1.5" />
                        <span>Export CSV</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center flex-1 md:flex-none"
                    >
                        <Upload size={16} className="mr-1.5" />
                        <span>Import CSV</span>
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            if (currentShop && !canAddItem(suppliers.length, currentShop.package_type, 'suppliers')) {
                                const usageInfo = getUsageInfo(suppliers.length, currentShop.package_type, 'suppliers');
                                setToast({
                                    show: true,
                                    message: `Supplier limit reached (${usageInfo.limit}). Please upgrade your package.`,
                                    type: 'error'
                                });
                                return;
                            }
                            resetForm();
                            setShowModal(true);
                        }}
                        className="flex items-center justify-center flex-1 md:flex-none"
                    >
                        <Plus size={16} className="mr-1.5" />
                        <span>Add Supplier</span>
                    </Button>
                </div>
            </div>

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.length === 0 ? (
                    <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <Truck className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500">No suppliers found. Click "Add Supplier" to create one.</p>
                    </div>
                ) : (
                    suppliers.map((supplier) => (
                        <div
                            key={supplier.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <Truck className="text-primary-500 mr-3" size={24} />
                                    <h3 className="font-bold text-lg text-gray-800">{supplier.name}</h3>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(supplier)}
                                        className="text-primary-600 hover:text-primary-900"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(supplier.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                {supplier.contact_person && (
                                    <div className="flex items-center text-gray-600">
                                        <span className="font-medium">Contact:</span>
                                        <span className="ml-2">{supplier.contact_person}</span>
                                    </div>
                                )}
                                {supplier.phone && (
                                    <div className="flex items-center text-gray-600">
                                        <Phone size={14} className="mr-2" />
                                        <span>{supplier.phone}</span>
                                    </div>
                                )}
                                {supplier.email && (
                                    <div className="flex items-center text-gray-600">
                                        <Mail size={14} className="mr-2" />
                                        <span className="truncate">{supplier.email}</span>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-start text-gray-600">
                                        <MapPin size={14} className="mr-2 mt-1 flex-shrink-0" />
                                        <span className="line-clamp-2">{supplier.address}</span>
                                    </div>
                                )}
                                {supplier.notes && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-gray-500 text-xs line-clamp-2">{supplier.notes}</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., SmartStock POS"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Person
                        </label>
                        <input
                            type="text"
                            value={formData.contact_person}
                            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., John Doe"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., +1234567890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., supplier@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            rows={2}
                            placeholder="Complete address"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowModal(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Import CSV Modal */}
            <Modal
                isOpen={showImportModal}
                onClose={closeImportModal}
                title="Import Suppliers from CSV"
            >
                <div className="space-y-4">
                    {!importData && !importResult && importErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                                <AlertCircle size={18} />
                                <span>Invalid CSV File</span>
                            </div>
                            {importErrors.map((err, i) => (
                                <p key={i} className="text-sm text-red-600">{err}</p>
                            ))}
                        </div>
                    )}

                    {importData && !importResult && (
                        <>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <span className="font-semibold">{importData.length}</span> supplier(s) ready to import
                                </p>
                            </div>

                            {importErrors.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-yellow-800 mb-1">Skipped rows:</p>
                                    <div className="max-h-24 overflow-y-auto">
                                        {importErrors.map((err, i) => (
                                            <p key={i} className="text-xs text-yellow-700">{err}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="max-h-60 overflow-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="text-left px-3 py-2 font-medium text-gray-700">#</th>
                                            <th className="text-left px-3 py-2 font-medium text-gray-700">Name</th>
                                            <th className="text-left px-3 py-2 font-medium text-gray-700">Contact</th>
                                            <th className="text-left px-3 py-2 font-medium text-gray-700">Phone</th>
                                            <th className="text-left px-3 py-2 font-medium text-gray-700">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {importData.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                                <td className="px-3 py-2 font-medium text-gray-800">{row.name}</td>
                                                <td className="px-3 py-2 text-gray-600">{row.contact_person}</td>
                                                <td className="px-3 py-2 text-gray-600">{row.phone}</td>
                                                <td className="px-3 py-2 text-gray-600">{row.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <Button variant="secondary" size="sm" onClick={closeImportModal}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleImportConfirm}
                                    disabled={importing}
                                >
                                    {importing ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Importing...
                                        </span>
                                    ) : (
                                        `Import ${importData.length} Supplier(s)`
                                    )}
                                </Button>
                            </div>
                        </>
                    )}

                    {importResult && (
                        <div className="space-y-3">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-green-700 font-medium">
                                    <CheckCircle size={18} />
                                    <span>{importResult.successCount} supplier(s) imported successfully</span>
                                </div>
                            </div>

                            {importResult.failCount > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-red-700 mb-1">
                                        {importResult.failCount} failed:
                                    </p>
                                    <div className="max-h-24 overflow-y-auto">
                                        {importResult.failedRows.map((msg, i) => (
                                            <p key={i} className="text-xs text-red-600">{msg}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t border-gray-200">
                                <Button variant="primary" size="sm" onClick={closeImportModal}>
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}

                    {!importData && !importResult && importErrors.length === 0 && (
                        <div className="text-center py-6">
                            <FileText className="mx-auto text-gray-400 mb-3" size={40} />
                            <p className="text-gray-500 text-sm">Processing file...</p>
                        </div>
                    )}

                    {!importResult && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">CSV Format Guide:</p>
                            <p className="text-xs text-gray-500 mb-2">
                                Required column: <span className="font-semibold">name</span>.
                                Optional: <span className="font-semibold">contact_person, email, phone, address</span>
                            </p>
                            <button
                                onClick={handleDownloadTemplate}
                                className="text-xs text-primary-600 hover:text-primary-800 underline flex items-center gap-1"
                            >
                                <Download size={12} />
                                Download template CSV
                            </button>
                        </div>
                    )}
                </div>
            </Modal>

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

export default Suppliers;
