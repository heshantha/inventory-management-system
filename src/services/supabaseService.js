// Supabase service layer - replaces Firebase
import { supabase, supabaseAdmin } from './supabaseConfig';

class SupabaseService {
    constructor() {
        this.supabase = supabase;
    }

    // ==================== SHOPS ====================

    async getAllShops() {
        try {
            const { data, error } = await this.supabase
                .from('shops')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting shops:', error);
            return [];
        }
    }

    async getShopById(shopId) {
        try {
            const { data, error } = await this.supabase
                .from('shops')
                .select('*')
                .eq('id', shopId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting shop:', error);
            return null;
        }
    }

    async createShop(shopData) {
        try {
            const { data, error } = await this.supabase
                .from('shops')
                .insert({
                    ...shopData,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, id: data.id };
        } catch (error) {
            console.error('Error creating shop:', error);
            return { success: false, message: error.message };
        }
    }

    async updateShop(shopId, shopData) {
        try {
            const { error } = await this.supabase
                .from('shops')
                .update({
                    ...shopData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', shopId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating shop:', error);
            return { success: false, message: error.message };
        }
    }

    async updateShopStatus(shopId, isActive) {
        try {
            const { error } = await this.supabase
                .from('shops')
                .update({
                    is_active: isActive,
                    updated_at: new Date().toISOString()
                })
                .eq('id', shopId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating shop status:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteShop(shopId) {
        try {
            const { error } = await this.supabase
                .from('shops')
                .delete()
                .eq('id', shopId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting shop:', error);
            return { success: false, message: error.message };
        }
    }

    // ==================== AUTHENTICATION ====================

    async createDefaultAdmin() {
        try {
            // Check if super admin exists
            const { data: existingUsers } = await this.supabase
                .from('users')
                .select('*')
                .eq('username', 'admin');

            if (existingUsers && existingUsers.length > 0) {
                console.log('Admin user already exists');
                return;
            }

            // Create auth user
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: 'admin@smartstockpos.com',
                password: 'admin123'
            });

            if (authError && !authError.message.includes('already registered')) {
                throw authError;
            }

            // Create user record
            const { error } = await this.supabase
                .from('users')
                .insert({
                    auth_id: authData?.user?.id || null,
                    username: 'admin',
                    full_name: 'Super Administrator',
                    email: 'admin@smartstockpos.com',
                    role: 'super_admin',
                    is_active: true
                });

            if (error && !error.message.includes('duplicate')) {
                throw error;
            }

            console.log('Super admin user created');
        } catch (error) {
            console.error('Error creating super admin:', error);
        }
    }

    async authenticateUser(username, password) {
        try {
            // Get user by username
            const { data: users, error: userError } = await this.supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('is_active', true);

            if (userError) throw userError;

            if (!users || users.length === 0) {
                return { success: false, message: 'Invalid credentials' };
            }

            const userData = users[0];

            // Sign in with Supabase Auth
            const email = userData.email || `${username}@inventory.com`;
            const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (authError) {
                console.error('Auth error:', authError);
                return { success: false, message: 'Invalid credentials' };
            }

            const { auth_id, ...userWithoutAuthId } = userData;
            return { success: true, user: userWithoutAuthId };
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, message: 'Invalid credentials' };
        }
    }

    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: error.message };
        }
    }

    onAuthStateChange(callback) {
        const { data: { subscription } } = this.supabase.auth.onAuthStateChange((event, session) => {
            callback(session?.user || null);
        });
        return () => subscription.unsubscribe();
    }

    // ==================== USERS ====================

    async getAllUsers(shopId = null) {
        try {
            let query = this.supabase.from('users').select('*');

            if (shopId) {
                query = query.eq('shop_id', shopId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    async createUser(userData) {
        try {
            // Generate unique email if not provided (with timestamp to avoid duplicates)
            const email = userData.email || `${userData.username}.${Date.now()}@inventory.com`;

            // Create auth user with admin client (auto-confirmed)
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: userData.password,
                email_confirm: true, // Auto-confirm the user
                user_metadata: {
                    username: userData.username,
                    full_name: userData.full_name
                }
            });

            if (authError) throw authError;

            // Create user record
            const { data, error } = await this.supabase
                .from('users')
                .insert({
                    auth_id: authData.user?.id,
                    username: userData.username,
                    full_name: userData.full_name,
                    email: email,
                    shop_id: userData.shop_id,
                    role: userData.role,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, id: data.id };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, message: error.message };
        }
    }

    async updateUser(id, userData) {
        try {
            const updateData = {
                ...userData,
                updated_at: new Date().toISOString()
            };
            delete updateData.password; // Don't update password through this method

            const { error } = await this.supabase
                .from('users')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteUser(id) {
        try {
            const { error } = await this.supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting user:', error);
            return { success: false, message: error.message };
        }
    }

    // ==================== CATEGORIES ====================

    async getAllCategories(shopId = null) {
        try {
            let query = this.supabase.from('categories').select('*');

            if (shopId) {
                query = query.eq('shop_id', shopId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting categories:', error);
            return [];
        }
    }

    async createCategory(categoryData) {
        try {
            const { data, error } = await this.supabase
                .from('categories')
                .insert(categoryData)
                .select()
                .single();

            if (error) throw error;
            return { success: true, id: data.id };
        } catch (error) {
            console.error('Error creating category:', error);
            return { success: false, message: error.message };
        }
    }

    async updateCategory(id, categoryData) {
        try {
            const { error } = await this.supabase
                .from('categories')
                .update({
                    ...categoryData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating category:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteCategory(id) {
        try {
            const { error } = await this.supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting category:', error);
            return { success: false, message: error.message };
        }
    }

    // ==================== SUPPLIERS ====================

    async getAllSuppliers(shopId = null) {
        try {
            let query = this.supabase.from('suppliers').select('*');

            if (shopId) {
                query = query.eq('shop_id', shopId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting suppliers:', error);
            return [];
        }
    }

    async createSupplier(supplierData) {
        try {
            const { data, error } = await this.supabase
                .from('suppliers')
                .insert(supplierData)
                .select()
                .single();

            if (error) throw error;
            return { success: true, id: data.id };
        } catch (error) {
            console.error('Error creating supplier:', error);
            return { success: false, message: error.message };
        }
    }

    async updateSupplier(id, supplierData) {
        try {
            const { error } = await this.supabase
                .from('suppliers')
                .update({
                    ...supplierData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating supplier:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteSupplier(id) {
        try {
            const { error } = await this.supabase
                .from('suppliers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting supplier:', error);
            return { success: false, message: error.message };
        }
    }

    // ==================== PRODUCTS ====================

    async getAllProducts(shopId = null) {
        try {
            let query = this.supabase
                .from('products')
                .select(`
                    *,
                    categories(name),
                    suppliers(name)
                `)
                .eq('is_active', true);

            if (shopId) {
                query = query.eq('shop_id', shopId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(product => ({
                ...product,
                category_name: product.categories?.name || null,
                supplier_name: product.suppliers?.name || null
            }));
        } catch (error) {
            console.error('Error getting products:', error);
            return [];
        }
    }

    async getLowStockProducts(shopId = null) {
        try {
            const products = await this.getAllProducts(shopId);
            return products.filter(p => p.stock_quantity <= p.min_stock_level);
        } catch (error) {
            console.error('Error getting low stock products:', error);
            return [];
        }
    }

    async createProduct(productData) {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .insert({
                    ...productData,
                    stock_quantity: parseInt(productData.stock_quantity) || 0,
                    min_stock_level: parseInt(productData.min_stock_level) || 10,
                    cost_price: parseFloat(productData.cost_price),
                    selling_price: parseFloat(productData.selling_price),
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            // Record initial stock movement if any
            if (productData.stock_quantity > 0) {
                await this.createStockMovement({
                    product_id: data.id,
                    movement_type: 'in',
                    quantity: parseInt(productData.stock_quantity),
                    notes: 'Initial stock'
                });
            }

            return { success: true, id: data.id };
        } catch (error) {
            console.error('Error creating product:', error);
            return { success: false, message: error.message };
        }
    }

    async updateProduct(id, productData) {
        try {
            const updateData = {
                ...productData,
                updated_at: new Date().toISOString()
            };

            if (productData.cost_price !== undefined) {
                updateData.cost_price = parseFloat(productData.cost_price);
            }
            if (productData.selling_price !== undefined) {
                updateData.selling_price = parseFloat(productData.selling_price);
            }
            if (productData.min_stock_level !== undefined) {
                updateData.min_stock_level = parseInt(productData.min_stock_level);
            }

            const { error } = await this.supabase
                .from('products')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating product:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteProduct(id) {
        try {
            const { error } = await this.supabase
                .from('products')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting product:', error);
            return { success: false, message: error.message };
        }
    }

    async updateProductStock(id, quantity, movementType, notes) {
        try {
            // Get current product
            const { data: product, error: fetchError } = await this.supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            let newQuantity = product.stock_quantity;
            if (movementType === 'in') {
                newQuantity += quantity;
            } else if (movementType === 'out') {
                newQuantity -= quantity;
            } else {
                newQuantity = quantity;
            }

            // Update stock
            const { error: updateError } = await this.supabase
                .from('products')
                .update({
                    stock_quantity: newQuantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Record movement
            await this.createStockMovement({
                product_id: id,
                movement_type: movementType,
                quantity,
                notes
            });

            return { success: true };
        } catch (error) {
            console.error('Error updating stock:', error);
            return { success: false, message: error.message };
        }
    }

    async createStockMovement(movementData) {
        try {
            await this.supabase
                .from('stock_movements')
                .insert(movementData);
        } catch (error) {
            console.error('Error creating stock movement:', error);
        }
    }

    // ==================== CUSTOMERS ====================

    async getAllCustomers(shopId = null) {
        try {
            let query = this.supabase.from('customers').select('*');

            if (shopId) {
                query = query.eq('shop_id', shopId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting customers:', error);
            return [];
        }
    }

    async createCustomer(customerData) {
        try {
            const { data, error } = await this.supabase
                .from('customers')
                .insert(customerData)
                .select()
                .single();

            if (error) throw error;
            return { success: true, id: data.id };
        } catch (error) {
            console.error('Error creating customer:', error);
            return { success: false, message: error.message };
        }
    }

    async updateCustomer(id, customerData) {
        try {
            const { error } = await this.supabase
                .from('customers')
                .update({
                    ...customerData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating customer:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteCustomer(id) {
        try {
            const { error } = await this.supabase
                .from('customers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting customer:', error);
            return { success: false, message: error.message };
        }
    }

    async getCustomerPurchaseHistory(customerId) {
        try {
            const { data: sales, error } = await this.supabase
                .from('sales')
                .select(`
                    *,
                    users(full_name)
                `)
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (sales || []).map(sale => ({
                ...sale,
                cashier_name: sale.users?.full_name || null
            }));
        } catch (error) {
            console.error('Error getting purchase history:', error);
            return [];
        }
    }

    // ==================== SALES ====================

    generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const timestamp = Date.now().toString().slice(-4);
        return `INV${year}${month}${day}${timestamp}`;
    }

    async getAllSales(shopId = null) {
        try {
            let query = this.supabase
                .from('sales')
                .select(`
                    *,
                    customers(name),
                    users(full_name)
                `);

            if (shopId) {
                query = query.eq('shop_id', shopId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(sale => ({
                ...sale,
                customer_name: sale.customers?.name || null,
                cashier_name: sale.users?.full_name || null
            }));
        } catch (error) {
            console.error('Error getting sales:', error);
            return [];
        }
    }

    async getSaleById(id) {
        try {
            const { data: sale, error } = await this.supabase
                .from('sales')
                .select(`
                    *,
                    customers(name, phone, address),
                    users(full_name)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            return {
                ...sale,
                customer_name: sale.customers?.name || null,
                customer_phone: sale.customers?.phone || null,
                customer_address: sale.customers?.address || null,
                cashier_name: sale.users?.full_name || null
            };
        } catch (error) {
            console.error('Error getting sale:', error);
            return null;
        }
    }

    async createSale(saleData) {
        try {
            const invoiceNumber = this.generateInvoiceNumber();

            // Create sale
            const { data: sale, error: saleError } = await this.supabase
                .from('sales')
                .insert({
                    shop_id: saleData.shop_id,
                    invoice_number: invoiceNumber,
                    customer_id: saleData.customer_id || null,
                    user_id: saleData.user_id,
                    subtotal: saleData.subtotal,
                    discount_amount: saleData.discount_amount || 0,
                    tax_amount: saleData.tax_amount,
                    total_amount: saleData.total_amount,
                    payment_method: saleData.payment_method || 'cash',
                    items: saleData.items
                })
                .select()
                .single();

            if (saleError) throw saleError;

            // Update product stock for each item
            for (const item of saleData.items) {
                const { data: product } = await this.supabase
                    .from('products')
                    .select('stock_quantity')
                    .eq('id', item.product_id)
                    .single();

                if (product) {
                    await this.supabase
                        .from('products')
                        .update({
                            stock_quantity: product.stock_quantity - item.quantity,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', item.product_id);

                    // Create stock movement
                    await this.supabase
                        .from('stock_movements')
                        .insert({
                            product_id: item.product_id,
                            movement_type: 'out',
                            quantity: item.quantity,
                            reference_type: 'sale',
                            reference_id: sale.id,
                            notes: `Sale ${invoiceNumber}`
                        });
                }
            }

            return { success: true, id: sale.id, invoice_number: invoiceNumber };
        } catch (error) {
            console.error('Error creating sale:', error);
            return { success: false, message: error.message };
        }
    }

    async getTodaySales(shopId = null) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const sales = await this.getAllSales(shopId);
            return sales.filter(sale => sale.created_at && sale.created_at.startsWith(today));
        } catch (error) {
            console.error('Error getting today sales:', error);
            return [];
        }
    }

    // ==================== DASHBOARD ====================

    async getDashboardStats(shopId = null) {
        try {
            const todaySales = await this.getTodaySales(shopId);
            const products = await this.getAllProducts(shopId);
            const customers = await this.getAllCustomers(shopId);
            const lowStock = await this.getLowStockProducts(shopId);

            return {
                today_sales: todaySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0),
                today_transactions: todaySales.length,
                low_stock_count: lowStock.length,
                total_products: products.length,
                total_customers: customers.length
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return {
                today_sales: 0,
                today_transactions: 0,
                low_stock_count: 0,
                total_products: 0,
                total_customers: 0
            };
        }
    }

    // ==================== REPORTS ====================

    async getDailySalesReport(date, shopId = null) {
        try {
            const sales = await this.getAllSales(shopId);
            const dateSales = sales.filter(sale => sale.created_at && sale.created_at.startsWith(date));

            const summary = {
                total_transactions: dateSales.length,
                total_sales: dateSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0),
                total_discounts: dateSales.reduce((sum, s) => sum + parseFloat(s.discount_amount || 0), 0),
                total_tax: dateSales.reduce((sum, s) => sum + parseFloat(s.tax_amount || 0), 0)
            };

            return { sales: dateSales, summary };
        } catch (error) {
            console.error('Error getting daily sales report:', error);
            return { sales: [], summary: {} };
        }
    }

    async getMonthlySalesReport(year, month, shopId = null) {
        try {
            const sales = await this.getAllSales(shopId);
            const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
            const monthSales = sales.filter(sale => sale.created_at && sale.created_at.startsWith(yearMonth));

            const summary = {
                total_transactions: monthSales.length,
                total_sales: monthSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0),
                total_discounts: monthSales.reduce((sum, s) => sum + parseFloat(s.discount_amount || 0), 0),
                average_sale: monthSales.length > 0
                    ? monthSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0) / monthSales.length
                    : 0
            };

            return { sales: monthSales, summary };
        } catch (error) {
            console.error('Error getting monthly sales report:', error);
            return { sales: [], summary: {} };
        }
    }

    async getBestSellers(startDate, endDate, limitCount = 10, shopId = null) {
        try {
            const sales = await this.getAllSales(shopId);
            const filteredSales = sales.filter(sale =>
                sale.created_at >= startDate && sale.created_at <= endDate
            );

            const productStats = {};
            const products = await this.getAllProducts(shopId);

            filteredSales.forEach(sale => {
                if (sale.items) {
                    sale.items.forEach(item => {
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
                        productStats[item.product_id].total_revenue += item.total_price || (item.unit_price * item.quantity);
                        productStats[item.product_id].times_sold++;
                    });
                }
            });

            return Object.values(productStats)
                .sort((a, b) => b.total_quantity - a.total_quantity)
                .slice(0, limitCount);
        } catch (error) {
            console.error('Error getting best sellers:', error);
            return [];
        }
    }

    async getInventoryMovement(startDate, endDate, shopId = null) {
        try {
            const { data: movements, error } = await this.supabase
                .from('stock_movements')
                .select(`
                    *,
                    products(name, sku)
                `)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (movements || []).map(movement => ({
                ...movement,
                product_name: movement.products?.name || null,
                sku: movement.products?.sku || null
            }));
        } catch (error) {
            console.error('Error getting inventory movement:', error);
            return [];
        }
    }
}

// Create singleton instance
const supabaseService = new SupabaseService();

// Initialize default admin user
// Note: Commented out due to Supabase's stricter email validation
// You can manually create the first admin user through the app's signup process
// supabaseService.createDefaultAdmin();

export default supabaseService;
