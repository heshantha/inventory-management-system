const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class HardwareShopDatabase {
    constructor(dbPath) {
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.initializeTables();
        this.createDefaultUser();
    }

    initializeTables() {
        // Users table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'cashier', 'manager')),
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Categories table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Suppliers table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Products table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category_id INTEGER,
        description TEXT,
        cost_price REAL NOT NULL,
        selling_price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 10,
        supplier_id INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      )
    `);

        // Customers table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Sales table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        user_id INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        tax_amount REAL NOT NULL,
        total_amount REAL NOT NULL,
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

        // Sale items table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        total_price REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

        // Stock movements table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        movement_type TEXT NOT NULL CHECK(movement_type IN ('in', 'out', 'adjustment')),
        quantity INTEGER NOT NULL,
        reference_type TEXT,
        reference_id INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

        console.log('Database tables initialized successfully');
    }

    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    createDefaultUser() {
        try {
            const stmt = this.db.prepare('SELECT COUNT(*) as count FROM users');
            const result = stmt.get();

            if (result.count === 0) {
                const hashedPassword = this.hashPassword('admin123');
                this.db.prepare(`
          INSERT INTO users (username, password, full_name, role)
          VALUES (?, ?, ?, ?)
        `).run('admin', hashedPassword, 'Administrator', 'admin');

                console.log('Default admin user created (username: admin, password: admin123)');
            }
        } catch (error) {
            console.error('Error creating default user:', error);
        }
    }

    // Authentication
    authenticateUser(username, password) {
        try {
            const hashedPassword = this.hashPassword(password);
            const user = this.db.prepare(`
        SELECT id, username, full_name, role, is_active
        FROM users
        WHERE username = ? AND password = ? AND is_active = 1
      `).get(username, hashedPassword);

            if (user) {
                return { success: true, user };
            }
            return { success: false, message: 'Invalid credentials' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // User Management
    getAllUsers() {
        return this.db.prepare('SELECT id, username, full_name, role, is_active, created_at FROM users').all();
    }

    createUser(user) {
        try {
            const hashedPassword = this.hashPassword(user.password);
            const stmt = this.db.prepare(`
        INSERT INTO users (username, password, full_name, role)
        VALUES (?, ?, ?, ?)
      `);
            const result = stmt.run(user.username, hashedPassword, user.full_name, user.role);
            return { success: true, id: result.lastInsertRowid };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateUser(id, user) {
        try {
            let sql = 'UPDATE users SET full_name = ?, role = ?, is_active = ?';
            let params = [user.full_name, user.role, user.is_active ? 1 : 0];

            if (user.password) {
                sql += ', password = ?';
                params.push(this.hashPassword(user.password));
            }

            sql += ' WHERE id = ?';
            params.push(id);

            this.db.prepare(sql).run(...params);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    deleteUser(id) {
        try {
            this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Categories
    getAllCategories() {
        return this.db.prepare('SELECT * FROM categories ORDER BY name').all();
    }

    createCategory(category) {
        try {
            const result = this.db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(
                category.name, category.description || null
            );
            return { success: true, id: result.lastInsertRowid };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateCategory(id, category) {
        try {
            this.db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(
                category.name, category.description || null, id
            );
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    deleteCategory(id) {
        try {
            this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Suppliers
    getAllSuppliers() {
        return this.db.prepare('SELECT * FROM suppliers ORDER BY name').all();
    }

    createSupplier(supplier) {
        try {
            const result = this.db.prepare(`
        INSERT INTO suppliers (name, contact_person, phone, email, address)
        VALUES (?, ?, ?, ?, ?)
      `).run(
                supplier.name,
                supplier.contact_person || null,
                supplier.phone || null,
                supplier.email || null,
                supplier.address || null
            );
            return { success: true, id: result.lastInsertRowid };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateSupplier(id, supplier) {
        try {
            this.db.prepare(`
        UPDATE suppliers 
        SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?
        WHERE id = ?
      `).run(
                supplier.name,
                supplier.contact_person || null,
                supplier.phone || null,
                supplier.email || null,
                supplier.address || null,
                id
            );
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    deleteSupplier(id) {
        try {
            this.db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Products
    getAllProducts() {
        return this.db.prepare(`
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = 1
      ORDER BY p.name
    `).all();
    }

    getLowStockProducts() {
        return this.db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND p.stock_quantity <= p.min_stock_level
      ORDER BY p.stock_quantity
    `).all();
    }

    createProduct(product) {
        try {
            const result = this.db.prepare(`
        INSERT INTO products (sku, name, category_id, description, cost_price, selling_price, stock_quantity, min_stock_level, supplier_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                product.sku,
                product.name,
                product.category_id || null,
                product.description || null,
                product.cost_price,
                product.selling_price,
                product.stock_quantity || 0,
                product.min_stock_level || 10,
                product.supplier_id || null
            );

            // Record initial stock if any
            if (product.stock_quantity > 0) {
                this.db.prepare(`
          INSERT INTO stock_movements (product_id, movement_type, quantity, notes)
          VALUES (?, 'in', ?, 'Initial stock')
        `).run(result.lastInsertRowid, product.stock_quantity);
            }

            return { success: true, id: result.lastInsertRowid };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateProduct(id, product) {
        try {
            this.db.prepare(`
        UPDATE products 
        SET name = ?, category_id = ?, description = ?, cost_price = ?, 
            selling_price = ?, min_stock_level = ?, supplier_id = ?
        WHERE id = ?
      `).run(
                product.name,
                product.category_id || null,
                product.description || null,
                product.cost_price,
                product.selling_price,
                product.min_stock_level || 10,
                product.supplier_id || null,
                id
            );
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    deleteProduct(id) {
        try {
            this.db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateProductStock(id, quantity, movementType, notes) {
        try {
            const transaction = this.db.transaction(() => {
                // Update product stock
                const currentProduct = this.db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(id);
                let newQuantity;

                if (movementType === 'in') {
                    newQuantity = currentProduct.stock_quantity + quantity;
                } else if (movementType === 'out') {
                    newQuantity = currentProduct.stock_quantity - quantity;
                } else {
                    newQuantity = quantity; // adjustment
                }

                this.db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(newQuantity, id);

                // Record movement
                this.db.prepare(`
          INSERT INTO stock_movements (product_id, movement_type, quantity, notes)
          VALUES (?, ?, ?, ?)
        `).run(id, movementType, quantity, notes || null);
            });

            transaction();
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Customers
    getAllCustomers() {
        return this.db.prepare('SELECT * FROM customers ORDER BY name').all();
    }

    createCustomer(customer) {
        try {
            const result = this.db.prepare(`
        INSERT INTO customers (name, phone, email, address)
        VALUES (?, ?, ?, ?)
      `).run(
                customer.name,
                customer.phone || null,
                customer.email || null,
                customer.address || null
            );
            return { success: true, id: result.lastInsertRowid };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateCustomer(id, customer) {
        try {
            this.db.prepare(`
        UPDATE customers 
        SET name = ?, phone = ?, email = ?, address = ?
        WHERE id = ?
      `).run(
                customer.name,
                customer.phone || null,
                customer.email || null,
                customer.address || null,
                id
            );
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    deleteCustomer(id) {
        try {
            this.db.prepare('DELETE FROM customers WHERE id = ?').run(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getCustomerPurchaseHistory(customerId) {
        return this.db.prepare(`
      SELECT s.*, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.customer_id = ?
      ORDER BY s.created_at DESC
    `).all(customerId);
    }

    // Sales
    generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const prefix = `INV${year}${month}${day}`;
        const lastInvoice = this.db.prepare(`
      SELECT invoice_number FROM sales 
      WHERE invoice_number LIKE ? 
      ORDER BY id DESC LIMIT 1
    `).get(`${prefix}%`);

        let sequence = 1;
        if (lastInvoice) {
            sequence = parseInt(lastInvoice.invoice_number.slice(-4)) + 1;
        }

        return `${prefix}${sequence.toString().padStart(4, '0')}`;
    }

    getAllSales() {
        return this.db.prepare(`
      SELECT s.*, c.name as customer_name, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `).all();
    }

    getSaleById(id) {
        const sale = this.db.prepare(`
      SELECT s.*, c.name as customer_name, c.phone as customer_phone,
             c.address as customer_address, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(id);

        if (sale) {
            sale.items = this.db.prepare(`
        SELECT si.*, p.name as product_name, p.sku
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `).all(id);
        }

        return sale;
    }

    createSale(saleData) {
        try {
            const transaction = this.db.transaction(() => {
                // Generate invoice number
                const invoiceNumber = this.generateInvoiceNumber();

                // Insert sale
                const saleResult = this.db.prepare(`
          INSERT INTO sales (invoice_number, customer_id, user_id, subtotal, discount_amount, tax_amount, total_amount, payment_method)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
                    invoiceNumber,
                    saleData.customer_id || null,
                    saleData.user_id,
                    saleData.subtotal,
                    saleData.discount_amount || 0,
                    saleData.tax_amount,
                    saleData.total_amount,
                    saleData.payment_method || 'cash'
                );

                const saleId = saleResult.lastInsertRowid;

                // Insert sale items and update stock
                for (const item of saleData.items) {
                    this.db.prepare(`
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount_amount, tax_rate, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
                        saleId,
                        item.product_id,
                        item.quantity,
                        item.unit_price,
                        item.discount_amount || 0,
                        item.tax_rate || 0,
                        item.total_price
                    );

                    // Update product stock
                    this.db.prepare(`
            UPDATE products 
            SET stock_quantity = stock_quantity - ?
            WHERE id = ?
          `).run(item.quantity, item.product_id);

                    // Record stock movement
                    this.db.prepare(`
            INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, notes)
            VALUES (?, 'out', ?, 'sale', ?, ?)
          `).run(item.product_id, item.quantity, saleId, `Sale ${invoiceNumber}`);
                }

                return { saleId, invoiceNumber };
            });

            const result = transaction();
            return { success: true, id: result.saleId, invoice_number: result.invoiceNumber };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getTodaySales() {
        return this.db.prepare(`
      SELECT s.*, c.name as customer_name, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE DATE(s.created_at) = DATE('now')
      ORDER BY s.created_at DESC
    `).all();
    }

    // Reports
    getDailySalesReport(date) {
        const sales = this.db.prepare(`
      SELECT s.*, c.name as customer_name, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE DATE(s.created_at) = ?
      ORDER BY s.created_at DESC
    `).all(date);

        const summary = this.db.prepare(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_sales,
        SUM(discount_amount) as total_discounts,
        SUM(tax_amount) as total_tax
      FROM sales
      WHERE DATE(created_at) = ?
    `).get(date);

        return { sales, summary };
    }

    getMonthlySalesReport(year, month) {
        const sales = this.db.prepare(`
      SELECT DATE(created_at) as date,
             COUNT(*) as transactions,
             SUM(total_amount) as total_sales
      FROM sales
      WHERE strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(year.toString(), month.toString().padStart(2, '0'));

        const summary = this.db.prepare(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_sales,
        SUM(discount_amount) as total_discounts,
        AVG(total_amount) as average_sale
      FROM sales
      WHERE strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
    `).get(year.toString(), month.toString().padStart(2, '0'));

        return { sales, summary };
    }

    getBestSellers(startDate, endDate, limit = 10) {
        return this.db.prepare(`
      SELECT 
        p.id, p.name, p.sku,
        SUM(si.quantity) as total_quantity,
        SUM(si.total_price) as total_revenue,
        COUNT(DISTINCT si.sale_id) as times_sold
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at) BETWEEN ? AND ?
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_quantity DESC
      LIMIT ?
    `).all(startDate, endDate, limit);
    }

    getInventoryMovement(startDate, endDate) {
        return this.db.prepare(`
      SELECT 
        sm.*, p.name as product_name, p.sku
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      WHERE DATE(sm.created_at) BETWEEN ? AND ?
      ORDER BY sm.created_at DESC
    `).all(startDate, endDate);
    }

    // Dashboard Stats
    getDashboardStats() {
        const todaySales = this.db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as today_sales,
        COALESCE(COUNT(*), 0) as today_transactions
      FROM sales
      WHERE DATE(created_at) = DATE('now')
    `).get();

        const lowStock = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM products
      WHERE is_active = 1 AND stock_quantity <= min_stock_level
    `).get();

        const totalProducts = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM products
      WHERE is_active = 1
    `).get();

        const totalCustomers = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM customers
    `).get();

        return {
            today_sales: todaySales.today_sales || 0,
            today_transactions: todaySales.today_transactions || 0,
            low_stock_count: lowStock.count || 0,
            total_products: totalProducts.count || 0,
            total_customers: totalCustomers.count || 0,
        };
    }

    // Database Backup
    createBackup(backupPath) {
        try {
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupPath, `backup-${timestamp}.db`);

            this.db.backup(backupFile);

            return { success: true, path: backupFile };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    close() {
        this.db.close();
    }
}

module.exports = HardwareShopDatabase;
