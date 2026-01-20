// Package limits utility
// Defines subscription package limits and provides helper functions

export const PACKAGE_LIMITS = {
    basic: {
        products: 50,
        customers: 50,
        categories: 50,
        suppliers: 50
    },
    standard: {
        products: 150,
        customers: 150,
        categories: 150,
        suppliers: 150
    },
    premium: {
        products: Infinity,
        customers: Infinity,
        categories: Infinity,
        suppliers: Infinity
    }
};

/**
 * Check if user can add more items based on current count and package limits
 */
export const canAddItem = (currentCount, packageType, itemType) => {
    const limit = PACKAGE_LIMITS[packageType]?.[itemType];
    if (!limit) return true; // Default to allowing if package type not found
    return currentCount < limit;
};

/**
 * Get usage information for an item type
 */
export const getUsageInfo = (currentCount, packageType, itemType) => {
    const limit = PACKAGE_LIMITS[packageType]?.[itemType] || 0;
    const isUnlimited = limit === Infinity;

    return {
        current: currentCount,
        limit: isUnlimited ? 'Unlimited' : limit,
        canAdd: currentCount < limit,
        percentage: isUnlimited ? 0 : Math.round((currentCount / limit) * 100),
        isUnlimited
    };
};

/**
 * Get package display name
 */
export const getPackageDisplayName = (packageType) => {
    const names = {
        basic: 'Basic (50 limit)',
        standard: 'Standard (150 limit)',
        premium: 'Premium (Unlimited)'
    };
    return names[packageType] || 'Unknown';
};
