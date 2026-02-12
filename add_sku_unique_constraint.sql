-- ========================================
-- STEP 1: Find Duplicate SKUs
-- ========================================
-- Run this query first to see all duplicate SKUs:

SELECT sku, shop_id, COUNT(*) as duplicate_count,
       STRING_AGG(id::text, ', ') as product_ids
FROM products 
WHERE is_active = true 
GROUP BY sku, shop_id 
HAVING COUNT(*) > 1;

-- ========================================
-- STEP 2: Fix Duplicates (Choose ONE option)
-- ========================================

-- OPTION A: Auto-fix by appending numbers to duplicate SKUs
-- This will rename duplicates like: "ABC123" -> "ABC123-2", "ABC123-3", etc.

DO $$
DECLARE
    dup_record RECORD;
    counter INTEGER;
    pid UUID;
BEGIN
    -- Loop through each group of duplicates
    FOR dup_record IN 
        SELECT sku, shop_id, ARRAY_AGG(id) as ids
        FROM products 
        WHERE is_active = true 
        GROUP BY sku, shop_id 
        HAVING COUNT(*) > 1
    LOOP
        counter := 2;
        -- Skip the first ID, update the rest
        FOREACH pid IN ARRAY dup_record.ids[2:array_length(dup_record.ids, 1)]
        LOOP
            UPDATE products 
            SET sku = dup_record.sku || '-' || counter,
                updated_at = NOW()
            WHERE id = pid;
            counter := counter + 1;
        END LOOP;
        
        RAISE NOTICE 'Fixed duplicates for SKU: % in shop: %', dup_record.sku, dup_record.shop_id;
    END LOOP;
END $$;

-- OPTION B: Delete duplicate records (keeps only the oldest one)
-- WARNING: This permanently deletes duplicate products!
-- Uncomment to use:

/*
DELETE FROM products 
WHERE id IN (
    SELECT id
    FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY sku, shop_id ORDER BY created_at ASC) as rn
        FROM products
        WHERE is_active = true
    ) t
    WHERE rn > 1
);
*/

-- ========================================
-- STEP 3: Verify No Duplicates Remain
-- ========================================
-- Run this again - should return 0 rows:

SELECT sku, shop_id, COUNT(*) as duplicate_count
FROM products 
WHERE is_active = true 
GROUP BY sku, shop_id 
HAVING COUNT(*) > 1;

-- ========================================
-- STEP 4: Add Unique Constraint
-- ========================================
-- Once verified, run this to add the constraint:

ALTER TABLE products 
ADD CONSTRAINT unique_sku_per_shop 
UNIQUE (sku, shop_id);

-- Success! SKU uniqueness is now enforced at database level.
