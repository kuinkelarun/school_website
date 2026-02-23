/**
 * Seed script for Firebase Emulators
 *
 * This script populates the Firebase emulators with test data.
 * Run this after starting the emulators with: firebase emulators:start
 *
 * Usage: node scripts/seed-emulator.js
 */

require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, doc, setDoc, Timestamp, connectFirestoreEmulator } = require('firebase/firestore');

// Admin credentials from .env.local (fallback to defaults)
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'password123';

// Initialize Firebase with dummy config for emulator
const app = initializeApp({
  projectId: 'demo-school-website',
  apiKey: 'demo-api-key',
});

const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
connectFirestoreEmulator(db, 'localhost', 8080);

async function seedData() {
  console.log('🌱 Starting to seed emulator data...\n');

  try {
    // 1. Create admin user
    console.log('1️⃣  Creating admin user...');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    );
    const uid = userCredential.user.uid;
    console.log('   ✅ Admin user created with UID:', uid);

    // 2. Add admin user document
    console.log('\n2️⃣  Creating admin user document in Firestore...');
    await setDoc(doc(db, 'adminUsers', uid), {
      email: ADMIN_EMAIL,
      fullName: 'Test Admin',
      role: 'super_admin',
      isActive: true,
      createdAt: Timestamp.now(),
    });
    console.log('   ✅ Admin user document created');

    // 3. Add site settings
    console.log('\n3️⃣  Creating site settings...');
    await setDoc(doc(db, 'siteSettings', 'main'), {
      schoolName: 'Test High School',
      schoolNameNe: 'परीक्षण हाई स्कूल',
      tagline: 'Excellence in Education',
      taglineNe: 'शिक्षामा उत्कृष्टता',
      address: '123 School Street, Test City, State 12345',
      addressNe: '१२३ स्कूल स्ट्रीट, परीक्षण शहर',
      phone: '+1-234-567-8900',
      email: 'info@testschool.edu',
      aboutContent: '<h2>About Our School</h2><p>Welcome to Test High School! We are committed to providing quality education and fostering excellence in our students.</p><p>Our school has been serving the community since 2020 with dedicated teachers and modern facilities.</p>',
      aboutContentNe: '<h2>हाम्रो स्कूलको बारेमा</h2><p>परीक्षण हाई स्कूलमा स्वागत छ! हामी गुणस्तरीय शिक्षा प्रदान गर्न र हाम्रा विद्यार्थीहरूमा उत्कृष्टता विकास गर्न प्रतिबद्ध छौं।</p>',
      missionVision: '<h3>Mission</h3><p>To provide comprehensive education that develops students intellectually, physically, and socially.</p><h3>Vision</h3><p>To be a leading educational institution recognized for academic excellence and holistic development.</p>',
      missionVisionNe: '<h3>लक्ष्य</h3><p>विद्यार्थीहरूलाई बौद्धिक, शारीरिक र सामाजिक रूपमा विकास गर्ने व्यापक शिक्षा प्रदान गर्ने।</p>',
      socialMedia: {
        facebook: 'https://facebook.com/testschool',
        twitter: 'https://twitter.com/testschool',
        instagram: 'https://instagram.com/testschool',
        youtube: 'https://youtube.com/@testschool',
      },
    });
    console.log('   ✅ Site settings created');

    // 4. Add sample announcements
    console.log('\n4️⃣  Creating sample announcements...');

    const announcements = [
      {
        id: 'announcement-1',
        title: 'Welcome to New Academic Year 2024',
        titleNe: 'नयाँ शैक्षिक वर्ष २०२४ मा स्वागत छ',
        slug: 'welcome-to-new-academic-year-2024',
        content: '<p>We are excited to welcome all students to the new academic year 2024! Classes will commence from January 15th.</p><ul><li>New curriculum updates</li><li>Enhanced facilities</li><li>Exciting extracurricular activities</li></ul>',
        contentNe: '<p>हामी सबै विद्यार्थीहरूलाई नयाँ शैक्षिक वर्ष २०२४ मा स्वागत गर्न उत्साहित छौं!</p>',
        category: 'general',
        isFeatured: true,
        isPublished: true,
      },
      {
        id: 'announcement-2',
        title: 'Science Fair 2024 Registration Open',
        titleNe: 'विज्ञान मेला २०२४ दर्ता खुला',
        slug: 'science-fair-2024-registration-open',
        content: '<p>Annual Science Fair registration is now open! Students from all grades are encouraged to participate.</p><p><strong>Last date to register:</strong> February 15, 2024</p>',
        contentNe: '<p>वार्षिक विज्ञान मेला दर्ता अब खुला छ! सबै कक्षाका विद्यार्थीहरूलाई भाग लिन प्रोत्साहित गरिन्छ।</p>',
        category: 'events',
        isFeatured: false,
        isPublished: true,
      },
      {
        id: 'announcement-3',
        title: 'Mid-Term Examination Schedule Released',
        titleNe: 'मध्यावधि परीक्षा तालिका जारी',
        slug: 'mid-term-examination-schedule-released',
        content: '<p>The mid-term examination schedule has been released. Please check the student portal for detailed timetable.</p><p>Exams will be conducted from March 1-15, 2024.</p>',
        contentNe: '<p>मध्यावधि परीक्षा तालिका जारी गरिएको छ। विस्तृत समय तालिकाको लागि विद्यार्थी पोर्टल जाँच गर्नुहोस्।</p>',
        category: 'academic',
        isFeatured: false,
        isPublished: true,
      },
    ];

    for (const announcement of announcements) {
      await setDoc(doc(db, 'announcements', announcement.id), {
        ...announcement,
        authorId: uid,
        authorName: 'Test Admin',
        viewCount: 0,
        publishedDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        attachments: [],
      });
      console.log(`   ✅ Created: ${announcement.title}`);
    }

    // 5. Add sample events
    console.log('\n5️⃣  Creating sample events...');

    const events = [
      {
        id: 'event-1',
        title: 'Annual Sports Day',
        titleNe: 'वार्षिक खेलकुद दिवस',
        slug: 'annual-sports-day',
        description: '<p>Join us for our Annual Sports Day featuring various athletic competitions, games, and entertainment!</p>',
        descriptionNe: '<p>विभिन्न खेलकुद प्रतियोगिताहरू सहितको हाम्रो वार्षिक खेलकुद दिवसमा सामेल हुनुहोस्!</p>',
        startDate: Timestamp.fromDate(new Date('2024-03-20T09:00:00')),
        endDate: Timestamp.fromDate(new Date('2024-03-20T17:00:00')),
        location: 'School Sports Ground',
        category: 'sports',
        isPublished: true,
      },
      {
        id: 'event-2',
        title: 'Cultural Program',
        titleNe: 'सांस्कृतिक कार्यक्रम',
        slug: 'cultural-program',
        description: '<p>Experience diverse cultural performances by our talented students showcasing traditional dances, music, and art.</p>',
        descriptionNe: '<p>हाम्रा प्रतिभाशाली विद्यार्थीहरूद्वारा परम्परागत नृत्य, संगीत र कला प्रदर्शन गर्ने विविध सांस्कृतिक कार्यक्रमहरू अनुभव गर्नुहोस्।</p>',
        startDate: Timestamp.fromDate(new Date('2024-04-10T14:00:00')),
        endDate: Timestamp.fromDate(new Date('2024-04-10T18:00:00')),
        location: 'School Auditorium',
        category: 'cultural',
        isPublished: true,
      },
    ];

    for (const event of events) {
      await setDoc(doc(db, 'events', event.id), {
        ...event,
        authorId: uid,
        authorName: 'Test Admin',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`   ✅ Created: ${event.title}`);
    }

    // 6. Add sample programs
    console.log('\n6️⃣  Creating sample programs...');

    const programs = [
      {
        id: 'program-1',
        title: 'Science Stream',
        titleNe: 'विज्ञान स्ट्रिम',
        slug: 'science-stream',
        description: '<p>Our Science stream offers comprehensive courses in Physics, Chemistry, Biology, and Mathematics. Students are prepared for medical and engineering entrance exams.</p>',
        descriptionNe: '<p>हाम्रो विज्ञान स्ट्रिमले भौतिक विज्ञान, रसायन विज्ञान, जीवविज्ञान र गणितमा व्यापक पाठ्यक्रमहरू प्रदान गर्दछ।</p>',
        objectives: '<ul><li>Strong foundation in science subjects</li><li>Laboratory practical experience</li><li>Research and analytical skills</li><li>College entrance preparation</li></ul>',
        objectivesNe: '<ul><li>विज्ञान विषयहरूमा बलियो आधार</li><li>प्रयोगशाला व्यावहारिक अनुभव</li></ul>',
        category: 'science',
        displayOrder: 1,
        isPublished: true,
      },
      {
        id: 'program-2',
        title: 'Commerce Stream',
        titleNe: 'वाणिज्य स्ट्रिम',
        slug: 'commerce-stream',
        description: '<p>Commerce stream focuses on Accounting, Business Studies, Economics, and Mathematics. Ideal for students interested in business and finance careers.</p>',
        descriptionNe: '<p>वाणिज्य स्ट्रिमले लेखा, व्यापार अध्ययन, अर्थशास्त्र र गणितमा केन्द्रित हुन्छ।</p>',
        objectives: '<ul><li>Business fundamentals</li><li>Financial literacy</li><li>Entrepreneurship skills</li><li>Career readiness</li></ul>',
        objectivesNe: '<ul><li>व्यापार आधारभूत कुराहरू</li><li>वित्तीय साक्षरता</li></ul>',
        category: 'commerce',
        displayOrder: 2,
        isPublished: true,
      },
      {
        id: 'program-3',
        title: 'Arts/Humanities Stream',
        titleNe: 'कला/मानविकी स्ट्रिम',
        slug: 'arts-humanities-stream',
        description: '<p>Arts and Humanities stream offers diverse subjects including History, Geography, Political Science, and Languages. Perfect for creative and social science oriented students.</p>',
        descriptionNe: '<p>कला र मानविकी स्ट्रिमले इतिहास, भूगोल, राजनीति विज्ञान र भाषाहरू सहित विविध विषयहरू प्रदान गर्दछ।</p>',
        objectives: '<ul><li>Critical thinking</li><li>Social awareness</li><li>Communication skills</li><li>Cultural understanding</li></ul>',
        objectivesNe: '<ul><li>आलोचनात्मक सोच</li><li>सामाजिक जागरूकता</li></ul>',
        category: 'arts',
        displayOrder: 3,
        isPublished: true,
      },
    ];

    for (const program of programs) {
      await setDoc(doc(db, 'programs', program.id), {
        ...program,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`   ✅ Created: ${program.title}`);
    }

    console.log('\n✅ Seed data completed successfully!\n');
    console.log('📝 Test Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}\n`);
    console.log('🌐 Access the website at: http://localhost:3000/en');
    console.log('🔐 Admin login at: http://localhost:3000/login');
    console.log('🔧 Emulator UI at: http://localhost:4000\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedData();
