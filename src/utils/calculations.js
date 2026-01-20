export const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const calculateItemTotal = (quantity, unitPrice, discountAmount = 0, taxRate = 0) => {
    const subtotal = quantity * unitPrice;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxRate / 100);
    return afterDiscount + taxAmount;
};

export const calculateBillTotal = (items, billDiscountAmount = 0, taxRate = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const itemDiscounts = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
    const afterItemDiscounts = subtotal - itemDiscounts;
    const afterBillDiscount = afterItemDiscounts - billDiscountAmount;
    const taxAmount = afterBillDiscount * (taxRate / 100);
    const total = afterBillDiscount + taxAmount;

    return {
        subtotal,
        itemDiscounts,
        billDiscount: billDiscountAmount,
        totalDiscounts: itemDiscounts + billDiscountAmount,
        taxAmount,
        total,
    };
};

export const generateSKU = (category, name) => {
    const categoryPrefix = category?.substring(0, 3).toUpperCase() || 'GEN';
    const namePrefix = name?.substring(0, 3).toUpperCase() || 'PRD';
    const timestamp = Date.now().toString().slice(-6);
    return `${categoryPrefix}-${namePrefix}-${timestamp}`;
};
