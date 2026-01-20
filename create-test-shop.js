// Multi-Shop Test Setup Script
// Run this in browser console on the Firebase setup checker page

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyANUn5n_N0wtyo_agpzOxLk_3SEhXMfCWk",
    authDomain: "inventory-billing-system-3ab24.firebaseapp.com",
    projectId: "inventory-billing-system-3ab24",
    storageBucket: "inventory-billing-system-3ab24.firebasestorage.app",
    messagingSenderId: "81706840264",
    appId: "1:81706840264:web:a77714aa9cec653dfab5fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function createTestShop() {
    console.log('Creating test shop...');

    try {
        // Create Shop 2 - Electronics Store
        const shop2Data = {
            name: "Tech Electronics",
            owner_name: "Sarah Johnson",
            business_type: "Electronics",
            location: "Kandy",
            address: "456 Station Rd, Kandy",
            phone: "+94 777 888 999",
            email: "owner@techelectronics.com",
            is_active: true,
            created_at: serverTimestamp()
        };

        const shop2Ref = await addDoc(collection(db, 'shops'), shop2Data);
        console.log(' Shop created with ID:', shop2Ref.id);

        // Create owner for Shop 2
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            'sarah@techelectronics.com',
            'sarah123'
        );

        await addDoc(collection(db, 'users'), {
            uid: userCredential.user.uid,
            username: 'sarahjohnson',
            full_name: 'Sarah Johnson',
            email: 'sarah@techelectronics.com',
            shop_id: shop2Ref.id,
            role: 'shop_owner',
            is_active: true,
            created_at: serverTimestamp()
        });

        console.log('✅ Test shop owner created successfully!');
        console.log('');
        console.log('LOGIN CREDENTIALS:');
        console.log('Username: sarahjohnson');
        console.log('Password: sarah123');
        console.log('');
        console.log('Shop ID:', shop2Ref.id);

        return {
            shopId: shop2Ref.id,
            username: 'sarahjohnson',
            password: 'sarah123'
        };
    } catch (error) {
        console.error('Error creating test shop:', error);
        throw error;
    }
}

// Export for use
export { createTestShop };

// Auto-run if executed directly
if (typeof window !== 'undefined') {
    window.createTestShop = createTestShop;
    console.log('✅ Test shop setup loaded!');
    console.log('Run: await createTestShop()');
}
