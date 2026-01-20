const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Authentication
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),

    // Users
    users: {
        getAll: () => ipcRenderer.invoke('users:getAll'),
        create: (user) => ipcRenderer.invoke('users:create', user),
        update: (id, user) => ipcRenderer.invoke('users:update', { id, user }),
        delete: (id) => ipcRenderer.invoke('users:delete', id),
    },

    // Categories
    categories: {
        getAll: () => ipcRenderer.invoke('categories:getAll'),
        create: (category) => ipcRenderer.invoke('categories:create', category),
        update: (id, category) => ipcRenderer.invoke('categories:update', { id, category }),
        delete: (id) => ipcRenderer.invoke('categories:delete', id),
    },

    // Suppliers
    suppliers: {
        getAll: () => ipcRenderer.invoke('suppliers:getAll'),
        create: (supplier) => ipcRenderer.invoke('suppliers:create', supplier),
        update: (id, supplier) => ipcRenderer.invoke('suppliers:update', { id, supplier }),
        delete: (id) => ipcRenderer.invoke('suppliers:delete', id),
    },

    // Products
    products: {
        getAll: () => ipcRenderer.invoke('products:getAll'),
        getLowStock: () => ipcRenderer.invoke('products:getLowStock'),
        create: (product) => ipcRenderer.invoke('products:create', product),
        update: (id, product) => ipcRenderer.invoke('products:update', { id, product }),
        delete: (id) => ipcRenderer.invoke('products:delete', id),
        updateStock: (id, quantity, movementType, notes) =>
            ipcRenderer.invoke('products:updateStock', { id, quantity, movementType, notes }),
    },

    // Customers
    customers: {
        getAll: () => ipcRenderer.invoke('customers:getAll'),
        create: (customer) => ipcRenderer.invoke('customers:create', customer),
        update: (id, customer) => ipcRenderer.invoke('customers:update', { id, customer }),
        delete: (id) => ipcRenderer.invoke('customers:delete', id),
        getPurchaseHistory: (id) => ipcRenderer.invoke('customers:getPurchaseHistory', id),
    },

    // Sales
    sales: {
        getAll: () => ipcRenderer.invoke('sales:getAll'),
        getById: (id) => ipcRenderer.invoke('sales:getById', id),
        create: (saleData) => ipcRenderer.invoke('sales:create', saleData),
        getToday: () => ipcRenderer.invoke('sales:getToday'),
    },

    // Reports
    reports: {
        dailySales: (date) => ipcRenderer.invoke('reports:dailySales', date),
        monthlySales: (year, month) => ipcRenderer.invoke('reports:monthlySales', { year, month }),
        bestSellers: (startDate, endDate, limit) =>
            ipcRenderer.invoke('reports:bestSellers', { startDate, endDate, limit }),
        inventoryMovement: (startDate, endDate) =>
            ipcRenderer.invoke('reports:inventoryMovement', { startDate, endDate }),
    },

    // Dashboard
    dashboard: {
        getStats: () => ipcRenderer.invoke('dashboard:getStats'),
    },

    // Database
    database: {
        backup: () => ipcRenderer.invoke('database:backup'),
    },
});
