const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('./database.cjs');

let mainWindow;
let db;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
        title: 'Hardware Shop Inventory & Billing System',
    });

    // Load the app
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    // Initialize database
    const dbPath = path.join(app.getPath('userData'), 'hardware-shop.db');
    db = new Database(dbPath);

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (db) db.close();
        app.quit();
    }
});

// IPC Handlers - Authentication
ipcMain.handle('auth:login', async (event, { username, password }) => {
    return db.authenticateUser(username, password);
});

// IPC Handlers - Users
ipcMain.handle('users:getAll', async () => {
    return db.getAllUsers();
});

ipcMain.handle('users:create', async (event, user) => {
    return db.createUser(user);
});

ipcMain.handle('users:update', async (event, { id, user }) => {
    return db.updateUser(id, user);
});

ipcMain.handle('users:delete', async (event, id) => {
    return db.deleteUser(id);
});

// IPC Handlers - Categories
ipcMain.handle('categories:getAll', async () => {
    return db.getAllCategories();
});

ipcMain.handle('categories:create', async (event, category) => {
    return db.createCategory(category);
});

ipcMain.handle('categories:update', async (event, { id, category }) => {
    return db.updateCategory(id, category);
});

ipcMain.handle('categories:delete', async (event, id) => {
    return db.deleteCategory(id);
});

// IPC Handlers - Suppliers
ipcMain.handle('suppliers:getAll', async () => {
    return db.getAllSuppliers();
});

ipcMain.handle('suppliers:create', async (event, supplier) => {
    return db.createSupplier(supplier);
});

ipcMain.handle('suppliers:update', async (event, { id, supplier }) => {
    return db.updateSupplier(id, supplier);
});

ipcMain.handle('suppliers:delete', async (event, id) => {
    return db.deleteSupplier(id);
});

// IPC Handlers - Products
ipcMain.handle('products:getAll', async () => {
    return db.getAllProducts();
});

ipcMain.handle('products:getLowStock', async () => {
    return db.getLowStockProducts();
});

ipcMain.handle('products:create', async (event, product) => {
    return db.createProduct(product);
});

ipcMain.handle('products:update', async (event, { id, product }) => {
    return db.updateProduct(id, product);
});

ipcMain.handle('products:delete', async (event, id) => {
    return db.deleteProduct(id);
});

ipcMain.handle('products:updateStock', async (event, { id, quantity, movementType, notes }) => {
    return db.updateProductStock(id, quantity, movementType, notes);
});

// IPC Handlers - Customers
ipcMain.handle('customers:getAll', async () => {
    return db.getAllCustomers();
});

ipcMain.handle('customers:create', async (event, customer) => {
    return db.createCustomer(customer);
});

ipcMain.handle('customers:update', async (event, { id, customer }) => {
    return db.updateCustomer(id, customer);
});

ipcMain.handle('customers:delete', async (event, id) => {
    return db.deleteCustomer(id);
});

ipcMain.handle('customers:getPurchaseHistory', async (event, id) => {
    return db.getCustomerPurchaseHistory(id);
});

// IPC Handlers - Sales
ipcMain.handle('sales:getAll', async () => {
    return db.getAllSales();
});

ipcMain.handle('sales:getById', async (event, id) => {
    return db.getSaleById(id);
});

ipcMain.handle('sales:create', async (event, saleData) => {
    return db.createSale(saleData);
});

ipcMain.handle('sales:getToday', async () => {
    return db.getTodaySales();
});

// IPC Handlers - Reports
ipcMain.handle('reports:dailySales', async (event, date) => {
    return db.getDailySalesReport(date);
});

ipcMain.handle('reports:monthlySales', async (event, { year, month }) => {
    return db.getMonthlySalesReport(year, month);
});

ipcMain.handle('reports:bestSellers', async (event, { startDate, endDate, limit }) => {
    return db.getBestSellers(startDate, endDate, limit);
});

ipcMain.handle('reports:inventoryMovement', async (event, { startDate, endDate }) => {
    return db.getInventoryMovement(startDate, endDate);
});

// IPC Handlers - Dashboard
ipcMain.handle('dashboard:getStats', async () => {
    return db.getDashboardStats();
});

// IPC Handlers - Database Backup
ipcMain.handle('database:backup', async () => {
    const backupPath = path.join(app.getPath('userData'), 'backups');
    return db.createBackup(backupPath);
});
