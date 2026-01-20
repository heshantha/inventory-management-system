// Manual Admin User Creation Script
// Run this in browser console at http://localhost:5173 after enabling Firebase Auth & Firestore

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './src/services/firebaseConfig.js';

async function createAdminUser() {
    try {
        console.log('🔧 Starting admin user creation...');

        // Check if admin already exists in Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', 'admin'));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            console.log('✅ Admin user already exists in Firestore');
            console.log('Admin data:', snapshot.docs[0].data());
            return;
        }

        console.log('📝 Creating admin in Firebase Authentication...');

        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            'admin@inventory.com',
            'admin123'
        );

        console.log('✅ Admin created in Firebase Auth, UID:', userCredential.user.uid);

        // Create Firestore document
        console.log('📝 Creating admin document in Firestore...');

        const docRef = await addDoc(collection(db, 'users'), {
            uid: userCredential.user.uid,
            username: 'admin',
            full_name: 'Administrator',
            email: 'admin@inventory.com',
            role: 'admin',
            is_active: true,
            created_at: new Date()
        });

        console.log('✅ Admin user created successfully!');
        console.log('Document ID:', docRef.id);
        console.log('');
        console.log('🎉 You can now login with:');
        console.log('   Username: admin');
        console.log('   Password: admin123');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.code, error.message);

        if (error.code === 'auth/email-already-in-use') {
            console.log('ℹ️  Admin email already exists in Firebase Auth');
            console.log('ℹ️  But might be missing from Firestore. Checking...');

            // Try to add to Firestore only
            try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    await addDoc(collection(db, 'users'), {
                        uid: currentUser.uid,
                        username: 'admin',
                        full_name: 'Administrator',
                        email: 'admin@inventory.com',
                        role: 'admin',
                        is_active: true,
                        created_at: new Date()
                    });
                    console.log('✅ Added admin to Firestore');
                }
            } catch (firestoreError) {
                console.error('❌ Firestore error:', firestoreError);
            }
        }
    }
}

// Run the function
createAdminUser();
