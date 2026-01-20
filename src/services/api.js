// Check if we're running in Electron or browser
const isElectron = () => window.electronAPI !== undefined;

// Import Supabase service for browser mode
import supabaseService from './supabaseService';

// API service layer - wraps Electron IPC calls or uses Supabase
const api = {
    // Authentication
    login: async (credentials) => {
        console.log('🚀 API Login called');
        console.log('Is Electron?', isElectron());

        if (isElectron()) {
            console.log('Using Electron login');
            return await window.electronAPI.login(credentials);
        } else {
            console.log('Using Supabase login');
            return await supabaseService.authenticateUser(credentials.username, credentials.password);
        }
    },

    users: {
        getAll: async (shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.users.getAll();
            } else {
                return await supabaseService.getAllUsers(shopId);
            }
        },
        create: async (user) => {
            if (isElectron()) {
                return await window.electronAPI.users.create(user);
            } else {
                return await supabaseService.createUser(user);
            }
        },
        update: async (id, user) => {
            if (isElectron()) {
                return await window.electronAPI.users.update(id, user);
            } else {
                return await supabaseService.updateUser(id, user);
            }
        },
        delete: async (id) => {
            if (isElectron()) {
                return await window.electronAPI.users.delete(id);
            } else {
                return await supabaseService.deleteUser(id);
            }
        },
    },

    categories: {
        getAll: async (shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.categories.getAll();
            } else {
                return await supabaseService.getAllCategories(shopId);
            }
        },
        create: async (category) => {
            if (isElectron()) {
                return await window.electronAPI.categories.create(category);
            } else {
                return await supabaseService.createCategory(category);
            }
        },
        update: async (id, category) => {
            if (isElectron()) {
                return await window.electronAPI.categories.update(id, category);
            } else {
                return await supabaseService.updateCategory(id, category);
            }
        },
        delete: async (id) => {
            if (isElectron()) {
                return await window.electronAPI.categories.delete(id);
            } else {
                return await supabaseService.deleteCategory(id);
            }
        },
    },

    suppliers: {
        getAll: async (shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.suppliers.getAll();
            } else {
                return await supabaseService.getAllSuppliers(shopId);
            }
        },
        create: async (supplier) => {
            if (isElectron()) {
                return await window.electronAPI.suppliers.create(supplier);
            } else {
                return await supabaseService.createSupplier(supplier);
            }
        },
        update: async (id, supplier) => {
            if (isElectron()) {
                return await window.electronAPI.suppliers.update(id, supplier);
            } else {
                return await supabaseService.updateSupplier(id, supplier);
            }
        },
        delete: async (id) => {
            if (isElectron()) {
                return await window.electronAPI.suppliers.delete(id);
            } else {
                return await supabaseService.deleteSupplier(id);
            }
        },
    },

    products: {
        getAll: async (shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.products.getAll();
            } else {
                return await supabaseService.getAllProducts(shopId);
            }
        },
        getLowStock: async (shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.products.getLowStock();
            } else {
                return await supabaseService.getLowStockProducts(shopId);
            }
        },
        create: async (product) => {
            if (isElectron()) {
                return await window.electronAPI.products.create(product);
            } else {
                return await supabaseService.createProduct(product);
            }
        },
        update: async (id, product) => {
            if (isElectron()) {
                return await window.electronAPI.products.update(id, product);
            } else {
                return await supabaseService.updateProduct(id, product);
            }
        },
        delete: async (id) => {
            if (isElectron()) {
                return await window.electronAPI.products.delete(id);
            } else {
                return await supabaseService.deleteProduct(id);
            }
        },
        updateStock: async (id, quantity, movementType, notes) => {
            if (isElectron()) {
                return await window.electronAPI.products.updateStock(id, quantity, movementType, notes);
            } else {
                return await supabaseService.updateProductStock(id, quantity, movementType, notes);
            }
        },
    },

    customers: {
        getAll: async (shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.customers.getAll();
            } else {
                return await supabaseService.getAllCustomers(shopId);
            }
        },
        create: async (customer) => {
            if (isElectron()) {
                return await window.electronAPI.customers.create(customer);
            } else {
                return await supabaseService.createCustomer(customer);
            }
        },
        update: async (id, customer) => {
            if (isElectron()) {
                return await window.electronAPI.customers.update(id, customer);
            } else {
                return await supabaseService.updateCustomer(id, customer);
            }
        },
        delete: async (id) => {
            if (isElectron()) {
                return await window.electronAPI.customers.delete(id);
            } else {
                return await supabaseService.deleteCustomer(id);
            }
        },
        getPurchaseHistory: async (id) => {
            if (isElectron()) {
                return await window.electronAPI.customers.getPurchaseHistory(id);
            } else {
                return await supabaseService.getCustomerPurchaseHistory(id);
            }
        },
    },

    // Sales
    sales: {
        getAll: async (shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.sales.getAll();
            } else {
                return await supabaseService.getAllSales(shopId);
            }
        },
        getById: async (id) => {
            if (isElectron()) {
                return await window.electronAPI.sales.getById(id);
            } else {
                return await supabaseService.getSaleById(id);
            }
        },
        create: async (saleData) => {
            if (isElectron()) {
                return await window.electronAPI.sales.create(saleData);
            } else {
                return await supabaseService.createSale(saleData);
            }
        },
        getToday: async (shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.sales.getToday();
            } else {
                return await supabaseService.getTodaySales(shopId);
            }
        },
    },

    // Reports
    reports: {
        dailySales: async (date, shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.reports.dailySales(date);
            } else {
                return await supabaseService.getDailySalesReport(date, shopId);
            }
        },
        monthlySales: async (year, month, shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.reports.monthlySales(year, month);
            } else {
                return await supabaseService.getMonthlySalesReport(year, month, shopId);
            }
        },
        bestSellers: async (startDate, endDate, limit = 10, shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.reports.bestSellers(startDate, endDate, limit);
            } else {
                return await supabaseService.getBestSellers(startDate, endDate, limit, shopId);
            }
        },
        inventoryMovement: async (startDate, endDate, shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.reports.inventoryMovement(startDate, endDate);
            } else {
                return await supabaseService.getInventoryMovement(startDate, endDate, shopId);
            }
        },
    },

    // Dashboard
    dashboard: {
        getStats: async (shopId = null) => {
            if (isElectron()) {
                return await window.electronAPI.dashboard.getStats();
            } else {
                return await supabaseService.getDashboardStats(shopId);
            }
        },
    },

    // Database
    database: {
        backup: async () => {
            if (isElectron()) {
                return await window.electronAPI.database.backup();
            } else {
                // Supabase automatic backup
                return { success: true, message: 'Supabase auto-backup enabled' };
            }
        },
    },
};

export default api;
