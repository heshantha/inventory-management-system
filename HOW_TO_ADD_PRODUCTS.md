# 📦 How to Add Products - Hardware Shop System

## 🎯 Quick Start Guide

### **Step 1: Navigate to Products Page**

After logging in, you'll see a sidebar on the left. Click on **"Products"** (the package icon).

### **Step 2: Click "Add Product" Button**

On the Products page, you'll see a blue button in the top-right corner that says **"+ Add Product"**. Click it.

### **Step 3: Fill in the Product Form**

A modal/popup will appear with the following fields:

#### **Required Fields (marked with *):**
- **Product Name**: Enter the name of your product (e.g., "Hammer", "Screwdriver Set")
- **SKU**: Stock Keeping Unit - A unique code for the product (e.g., "HAM-001", "SCR-SET-01")
- **Cost Price**: How much you paid for the product
- **Selling Price**: How much you're selling it for

#### **Optional Fields:**
- **Category**: Select from dropdown (you'll need to create categories first)
- **Supplier**: Select from dropdown (you'll need to create suppliers first)
- **Description**: Additional details about the product
- **Initial Stock Quantity**: How many units you have in stock (default: 0)
- **Minimum Stock Level**: When to get a low stock alert (default: 10)

### **Step 4: Click "Add Product"**

After filling in the required fields, click the blue **"Add Product"** button at the bottom of the form.

---

## 📋 Example: Adding a Product

Let's add a hammer to your inventory:

1. **Product Name**: Claw Hammer
2. **SKU**: HAM-001
3. **Description**: 16oz claw hammer with wooden handle
4. **Cost Price**: 850
5. **Selling Price**: 1200
6. **Initial Stock Quantity**: 25
7. **Minimum Stock Level**: 5

Click **"Add Product"** and you're done! ✅

---

## 🏷️ Creating Categories (Optional but Recommended)

Before adding products, it's helpful to create categories:

### **Step 1: Go to Categories**
Click **"Categories"** in the sidebar (folder icon - only visible for admin users)

### **Step 2: Click "+ Add Category"**

### **Step 3: Fill in Details**
- **Name**: e.g., "Hand Tools", "Power Tools", "Fasteners"
- **Description**: Optional details about the category

### **Step 4: Click "Add Category"**

Now you can select this category when adding products!

---

## 🚚 Creating Suppliers (Optional but Recommended)

### **Step 1: Go to Suppliers**
Click **"Suppliers"** in the sidebar (truck icon - only visible for admin users)

### **Step 2: Click "+ Add Supplier"**

### **Step 3: Fill in Details**
- **Name**: Supplier company name (e.g., "ABC Hardware Distributors")
- **Contact Person**: Name of contact
- **Phone**: Contact number
- **Email**: Email address
- **Address**: Supplier address

### **Step 4: Click "Add Supplier"**

Now you can select this supplier when adding products!

---

## 📊 Managing Products

### **View All Products**
The Products page shows a table with all your products displaying:
- Product name and description
- SKU
- Category
- Selling price (and cost price)
- Stock quantity
- Low stock warnings (red triangle icon)

### **Edit a Product**
Click the ✏️ (pencil/edit) icon next to any product to modify it.
**Note:** You cannot change the SKU after creation.

### **Delete a Product**
Click the 🗑️ (trash) icon next to any product to remove it.
A confirmation dialog will appear - click "OK" to confirm.

### **Low Stock Alerts**
Products with stock at or below the minimum level will show:
- Red stock quantity number
- ⚠️ Warning triangle icon

---

## 💾 Data Storage

### **Browser Mode (Current Setup)**
- Data is stored in **localStorage**
- Data persists even after closing the browser
- **Limited to your current browser**
- To clear all data: Clear browser cache or localStorage

### **Electron Mode (Desktop App)**
- Data is stored in **SQLite database**
- Permanent storage on your computer
- Can create backups
- Run `.\start-dev.bat` to use Electron mode

---

## 🔍 Quick Tips

1. **Use Meaningful SKUs**: Create a system like:
   - `HAM-001` for hammers
   - `SCR-001` for screwdrivers
   - `NAIL-001` for nails

2. **Set Realistic Minimum Stock Levels**: 
   - Fast-moving items: Higher minimum (20-50)
   - Slow-moving items: Lower minimum (5-10)

3. **Add Categories First**: Makes products easier to find and organize

4. **Keep Names Concise**: Use descriptions for details

5. **Price Wisely**: Ensure selling price > cost price for profit!

---

## 🎬 Step-by-Step Workflow

```
1. Create Categories → Navigate to "Categories" → Add categories for your products
2. Create Suppliers → Navigate to "Suppliers" → Add your suppliers
3. Add Products → Navigate to "Products" → Click "Add Product"
4. Fill in all product details
5. Assign category and supplier
6. Set initial stock quantity
7. Click "Add Product"
8. Product appears in the table!
```

---

## 🖥️ Navigation

**Sidebar Menu (after login):**
- 📊 Dashboard - Overview of your business
- 🛒 Point of Sale - Make sales transactions
- 📦 **Products** - Manage inventory (YOU ARE HERE)
- 👥 Customers - Manage customer database
- 📄 Sales History - View past sales
- 📈 Reports - Generate reports
- 🏷️ Categories - Organize products (Admin only)
- 🚚 Suppliers - Manage suppliers (Admin only)
- 👤 Users - Manage system users (Admin only)

---

## ❓ Troubleshooting

### **"Cannot add product" error:**
- Make sure Product Name, SKU, Cost Price, and Selling Price are filled in
- SKU must be unique (different from existing products)

### **Categories/Suppliers dropdown is empty:**
- You need to create categories and suppliers first
- Go to Categories/Suppliers pages and add them

### **Product not appearing:**
- Refresh the page
- Check if there were any errors (open browser console with F12)

---

## 📱 Browser Mode vs Electron Mode

| Feature | Browser Mode | Electron Mode |
|---------|--------------|---------------|
| Storage | localStorage | SQLite Database |
| Data Persistence | Browser only | Computer-wide |
| Backup | Manual | Automatic |
| Performance | Good | Excellent |
| Access | Web browser | Desktop app |

---

**Current Mode**: 🌐 Browser Mode (using localStorage)

To switch to Electron Mode, run: `.\start-dev.bat`

---

**Need Help?** Check the browser console (F12) for any error messages!

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-17
