/**
 * Cria os dois usuários de teste no Firebase.
 * Execute UMA VEZ: node scripts/seed-users.js
 */
require('dotenv').config({ path: '.env' });

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, 'default');

const users = [
  {
    email: 'aprendiz@edumatch.com',
    password: 'Teste@123',
    profile: {
      name: 'Ana Oliveira',
      role: 'APPRENTICE',
      bio: 'Jovem aprendiz buscando desenvolver minhas soft skills e encontrar um mentor na área de tecnologia.',
      area: 'Tecnologia',
      interests: ['Comunicação', 'Liderança', 'Trabalho em equipe'],
      skills: ['Comunicação', 'Resolução de problemas'],
      status: 'ACTIVE',
    },
  },
  {
    email: 'mentor@edumatch.com',
    password: 'Teste@123',
    profile: {
      name: 'Carlos Mendes',
      role: 'MENTOR',
      bio: 'Profissional com 10 anos de experiência em TI. Apaixonado por desenvolver talentos e compartilhar conhecimento.',
      area: 'Tecnologia',
      interests: ['Liderança', 'Gestão de pessoas', 'Inovação'],
      skills: ['Liderança', 'Comunicação', 'Mentoria'],
      status: 'ACTIVE',
    },
  },
];

async function seed() {
  for (const u of users) {
    try {
      let uid;
      try {
        const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
        uid = cred.user.uid;
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          const cred = await signInWithEmailAndPassword(auth, u.email, u.password);
          uid = cred.user.uid;
          console.log(`– Auth já existe, atualizando perfil Firestore: ${u.email}`);
        } else {
          throw err;
        }
      }
      const now = Timestamp.now();
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        email: u.email,
        ...u.profile,
        photoURL: null,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`✓ Perfil criado: ${u.email} (${u.profile.role})`);
    } catch (err) {
      console.error(`✗ Erro em ${u.email}:`, err.message);
    }
  }
  console.log('\nPronto! Use as credenciais abaixo para testar:');
  console.log('  Aprendiz → aprendiz@edumatch.com / Teste@123');
  console.log('  Mentor   → mentor@edumatch.com   / Teste@123');
  process.exit(0);
}

seed();
