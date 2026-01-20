// Browser-compatible database using localStorage
// This replaces better-sqlite3 for web-based testing

class BrowserDatabase {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        // Initialize empty tables if they don't exist
        const tables = ['users', 'categories', 'suppliers', 'products', 'customers', 'sales', 'sale_items', 'stock_movements'];

        tables.forEach(table => {
            if (!localStorage.getItem(table)) {
                localStorage.setItem(table, JSON.stringify([]));
            }
        });

        // Create default admin user
        this.createDefaultUser();
    }

    hashPassword(password) {
        // Simple hash for demo (in production, use proper crypto)
        return btoa(password);
    }

    createDefaultUser() {
        const users = this.getTable('users');
        if (users.length === 0) {
            users.push({
                id: 1,
                username: 'admin',
                password: this.hashPassword('admin123'),
                full_name: 'Administrator',
                role: 'admin',
                is_active: 1,
                created_at: new Date().toISOString()
            });
            this.saveTable('users', users);
            console.log('Default admin user created');
        }
    }

    getTable(tableName) {
        return JSON.parse(localStorage.getItem(tableName) || '[]');
    }

    saveTable(tableName, data) {
        localStorage.setItem(tableName, JSON.stringify(data));
    }

    getNextId(tableName) {
        const table = this.getTable(tableName);
        return table.length > 0 ? Math.max(...table.map(item => item.id)) + 1 : 1;
    }

    // Authentication
    authenticateUser(username, password) {
        const users = this.getTable('users');
        const hashedPassword = this.hashPassword(password);
        const user = users.find(u => u.username === username && u.password === hashedPassword && u.is_active === 1);

        if (user) {
            const { password, ...userWithoutPassword } = user;
            return { success: true, user: userWithoutPassword };
        }
        return { success: false, message: 'Invalid credentials' };
    }

    // Users
    getAllUsers() {
        return this.getTable('users').map(({ password, ...user }) => user);
    }

    createUser(user) {
        try {
            const users = this.getTable('users');
            const newUser = {
                ...user,
                id: this.getNextId('users'),
                password: this.hashPassword(user.password),
                is_active: 1,
                created_at: new Date().toISOString()
            };
            users.push(newUser);
            this.saveTable('users', users);
            return { success: true, id: newUser.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateUser(id, userData) {
        try {
            const users = this.getTable('users');
            const index = users.findIndex(u => u.id === id);
            if (index !== -1) {
                users[index] = {
                    ...users[index],
                    ...userData,
                    password: userData.password ? this.hashPassword(userData.password) : users[index].password
                };
                this.saveTable('users', users);
                return { success: true };
            }
            return { success: false, message: 'User not found' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    deleteUser(id) {
        try {
            const users = this.getTable('users').filter(u => u.id !== id);
            this.saveTable('users', users);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Categories
    getAllCategories() {
        return this.getTable('categories');
    }

    createCategory(category) {
        try {
            const categories = this.getTable('categories');
            const newCategory = {
                ...category,
                id: this.getNextId('categories'),
                created_at: new Date().toISOString()
            };
            categories.push(newCategory);
            this.saveTable('categories', categories);
            return { success: true, id: newCategory.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateCategory(id, category) {
        try {
            const categories = this.getTable('categories');
            const index = categories.findIndex(c => c.id === id);
            if (index !== -1) {
                categories[index] = { ...categories[index], ...category };
                this.saveTable('categories', categories);
                return { success: true };
            }
            return { success: false, message: 'Category not found' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    deleteCategory(id) {
        try {
            const categories = this.getTable('categories').filter(c => c.id !== id);
            this.saveTable('categories', categories);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Suppliers
    getAllSuppliers() {
        return this.getTable('suppliers');
    }

    createSupplier(supplier) {
        try {
            const suppliers = this.getTable('suppliers');
            const newSupplier = {
                ...supplier,
                id: this.getNextId('suppliers'),
                created_at: new Date().toISOString()
            };
            suppliers.push(newSupplier);
            this.saveTable('suppliers', suppliers);
            return { success: true, id: newSupplier.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateSupplier(id, supplier) {
        try {
            const suppliers = this.getTable('suppliers');
            const index = suppliers.findIndex(s => s.id === id);
            if (index !== -1) {
                suppliers[index] = { ...suppliers[index], ...supplier };
                this.saveTable('suppliers', suppliers);
                return { success: true };
            }
            return { success: false, message: 'Supplier not found' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    deleteSupplier(id) {
        try {
            const suppliers = this.getTable('suppliers').filter(s => s.id !== id);
            this.saveTable('suppliers', suppliers);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Products
    getAllProducts() {
        const products = this.getTable('products').filter(p => p.is_active === 1);
        const categories = this.getTable('categories');
        const suppliers = this.getTable('suppliers');

        return products.map(product => ({
            ...product,
            category_name: categories.find(c => c.id === product.category_id)?.name || null,
            supplier_name: suppliers.find(s => s.id === product.supplier_id)?.name || null
        }));
    }

    getLowStockProducts() {
        return this.getAllProducts().filter(p => p.stock_quantity <= p.min_stock_level);
    }

    createProduct(product) {
        try {
            const products = this.getTable('products');
            const newProduct = {
                ...product,
                id: this.getNextId('products'),
                is_active: 1,
                created_at: new Date().toISOString()
            };
            products.push(newProduct);
            this.saveTable('products', products);

            // Record initial stock movement
            if (product.stock_quantity > 0) {
                this.createStockMovement({
                    product_id: newProduct.id,
                    movement_type: 'in',
                    quantity: product.stock_quantity,
                    notes: 'Initial stock'
                });
            }

            return { success: true, id: newProduct.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateProduct(id, productData) {
        try {
            const products = this.getTable('products');
            const index = products.findIndex(p => p.id === id);
            if (index !== -1) {
                products[index] = { ...products[index], ...productData };
                this.saveTable('products', products);
                return { success: true };
            }
            return { success: false, message: 'Product not found' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    deleteProduct(id) {
        try {
            const products = this.getTable('products');
            const index = products.findIndex(p => p.id === id);
            if (index !== -1) {
                products[index].is_active = 0;
                this.saveTable('products', products);
                return { success: true };
            }
            return { success: false, message: 'Product not found' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateProductStock(id, quantity, movementType, notes) {
        try {
            const products = this.getTable('products');
            const index = products.findIndex(p => p.id === id);

            if (index === -1) {
                return { success: false, message: 'Product not found' };
            }

            const product = products[index];
            let newQuantity = product.stock_quantity;

            if (movementType === 'in') {
                newQuantity += quantity;
            } else if (movementType === 'out') {
                newQuantity -= quantity;
            } else {
                newQuantity = quantity;
            }

            products[index].stock_quantity = newQuantity;
            this.saveTable('products', products);

            this.createStockMovement({
                product_id: id,
                movement_type: movementType,
                quantity,
                notes
            });

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    createStockMovement(movement) {
        const movements = this.getTable('stock_movements');
        movements.push({
            ...movement,
            id: this.getNextId('stock_movements'),
            created_at: new Date().toISOString()
        });
        this.saveTable('stock_movements', movements);
    }

    // Customers
    getAllCustomers() {
        return this.getTable('customers');
    }

    createCustomer(customer) {
        try {
            const customers = this.getTable('customers');
            const newCustomer = {
                ...customer,
                id: this.getNextId('customers'),
                created_at: new Date().toISOString()
            };
            customers.push(newCustomer);
            this.saveTable('customers', customers);
            return { success: true, id: newCustomer.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    updateCustomer(id, customerData) {
        try {
            const customers = this.getTable('customers');
            const index = customers.findIndex(c => c.id === id);
            if (index !== -1) {
                customers[index] = { ...customers[index], ...customerData };
                this.saveTable('customers', customers);
                return { success: true };
            }
            return { success: false, message: 'Customer not found' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    deleteCustomer(id) {
        try {
            const customers = this.getTable('customers').filter(c => c.id !== id);
            this.saveTable('customers', customers);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getCustomerPurchaseHistory(customerId) {
        const sales = this.getTable('sales').filter(s => s.customer_id === customerId);
        const users = this.getTable('users');

        return sales.map(sale => ({
            ...sale,
            cashier_name: users.find(u => u.id === sale.user_id)?.full_name || null
        }));
    }

    // Sales
    generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const prefix = `INV${year}${month}${day}`;
        const sales = this.getTable('sales');
        const todaySales = sales.filter(s => s.invoice_number.startsWith(prefix));

        const sequence = todaySales.length + 1;
        return `${prefix}${sequence.toString().padStart(4, '0')}`;
    }

    getAllSales() {
        const sales = this.getTable('sales');
        const customers = this.getTable('customers');
        const users = this.getTable('users');

        return sales.map(sale => ({
            ...sale,
            customer_name: customers.find(c => c.id === sale.customer_id)?.name || null,
            cashier_name: users.find(u => u.id === sale.user_id)?.full_name || null
        }));
    }

    getSaleById(id) {
        const sales = this.getTable('sales');
        const sale = sales.find(s => s.id === id);

        if (!sale) return null;

        const customers = this.getTable('customers');
        const users = this.getTable('users');
        const saleItems = this.getTable('sale_items').filter(item => item.sale_id === id);
        const products = this.getTable('products');

        const customer = customers.find(c => c.id === sale.customer_id);
        const user = users.find(u => u.id === sale.user_id);

        return {
            ...sale,
            customer_name: customer?.name || null,
            customer_phone: customer?.phone || null,
            customer_address: customer?.address || null,
            cashier_name: user?.full_name || null,
            items: saleItems.map(item => ({
                ...item,
                product_name: products.find(p => p.id === item.product_id)?.name || null,
                sku: products.find(p => p.id === item.product_id)?.sku || null
            }))
        };
    }

    createSale(saleData) {
        try {
            const invoiceNumber = this.generateInvoiceNumber();

            const sales = this.getTable('sales');
            const newSale = {
                id: this.getNextId('sales'),
                invoice_number: invoiceNumber,
                customer_id: saleData.customer_id || null,
                user_id: saleData.user_id,
                subtotal: saleData.subtotal,
                discount_amount: saleData.discount_amount || 0,
                tax_amount: saleData.tax_amount,
                total_amount: saleData.total_amount,
                payment_method: saleData.payment_method || 'cash',
                created_at: new Date().toISOString()
            };
            sales.push(newSale);
            this.saveTable('sales', sales);

            // Add sale items and update stock
            const saleItems = this.getTable('sale_items');
            const products = this.getTable('products');

            saleData.items.forEach(item => {
                saleItems.push({
                    id: this.getNextId('sale_items'),
                    sale_id: newSale.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    discount_amount: item.discount_amount || 0,
                    tax_rate: item.tax_rate || 0,
                    total_price: item.total_price
                });

                // Update product stock
                const productIndex = products.findIndex(p => p.id === item.product_id);
                if (productIndex !== -1) {
                    products[productIndex].stock_quantity -= item.quantity;
                }

                // Record stock movement
                this.createStockMovement({
                    product_id: item.product_id,
                    movement_type: 'out',
                    quantity: item.quantity,
                    reference_type: 'sale',
                    reference_id: newSale.id,
                    notes: `Sale ${invoiceNumber}`
                });
            });

            this.saveTable('sale_items', saleItems);
            this.saveTable('products', products);

            return { success: true, id: newSale.id, invoice_number: invoiceNumber };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getTodaySales() {
        const today = new Date().toISOString().split('T')[0];
        return this.getAllSales().filter(sale =>
            sale.created_at.startsWith(today)
        );
    }

    // Dashboard Stats
    getDashboardStats() {
        const todaySales = this.getTodaySales();
        const products = this.getAllProducts();
        const customers = this.getAllCustomers();
        const lowStock = this.getLowStockProducts();

        return {
            today_sales: todaySales.reduce((sum, sale) => sum + sale.total_amount, 0),
            today_transactions: todaySales.length,
            low_stock_count: lowStock.length,
            total_products: products.length,
            total_customers: customers.length
        };
    }

    // Reports
    getDailySalesReport(date) {
        const sales = this.getAllSales().filter(sale =>
            sale.created_at.startsWith(date)
        );

        const summary = {
            total_transactions: sales.length,
            total_sales: sales.reduce((sum, s) => sum + s.total_amount, 0),
            total_discounts: sales.reduce((sum, s) => sum + s.discount_amount, 0),
            total_tax: sales.reduce((sum, s) => sum + s.tax_amount, 0)
        };

        return { sales, summary };
    }

    getMonthlySalesReport(year, month) {
        const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
        const sales = this.getAllSales().filter(sale =>
            sale.created_at.startsWith(yearMonth)
        );

        const summary = {
            total_transactions: sales.length,
            total_sales: sales.reduce((sum, s) => sum + s.total_amount, 0),
            total_discounts: sales.reduce((sum, s) => sum + s.discount_amount, 0),
            average_sale: sales.length > 0 ? sales.reduce((sum, s) => sum + s.total_amount, 0) / sales.length : 0
        };

        return { sales, summary };
    }

    getBestSellers(startDate, endDate, limit = 10) {
        const sales = this.getTable('sales').filter(sale =>
            sale.created_at >= startDate && sale.created_at <= endDate
        );

        const saleIds = sales.map(s => s.id);
        const saleItems = this.getTable('sale_items').filter(item =>
            saleIds.includes(item.sale_id)
        );

        const products = this.getTable('products');
        const productStats = {};

        saleItems.forEach(item => {
            if (!productStats[item.product_id]) {
                const product = products.find(p => p.id === item.product_id);
                productStats[item.product_id] = {
                    id: item.product_id,
                    name: product?.name || 'Unknown',
                    sku: product?.sku || 'N/A',
                    total_quantity: 0,
                    total_revenue: 0,
                    times_sold: 0
                };
            }
            productStats[item.product_id].total_quantity += item.quantity;
            productStats[item.product_id].total_revenue += item.total_price;
            productStats[item.product_id].times_sold++;
        });

        return Object.values(productStats)
            .sort((a, b) => b.total_quantity - a.total_quantity)
            .slice(0, limit);
    }

    getInventoryMovement(startDate, endDate) {
        const movements = this.getTable('stock_movements').filter(m =>
            m.created_at >= startDate && m.created_at <= endDate
        );

        const products = this.getTable('products');

        return movements.map(movement => ({
            ...movement,
            product_name: products.find(p => p.id === movement.product_id)?.name || null,
            sku: products.find(p => p.id === movement.product_id)?.sku || null
        }));
    }
}

// Export for use in browser
window.BrowserDatabase = BrowserDatabase;
export default BrowserDatabase;
