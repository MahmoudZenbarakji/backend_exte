/**
 * Script to create an admin user
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@example.com' },
          { role: 'ADMIN' }
        ]
      }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   ID: ${existingAdmin.id}`);
      return existingAdmin;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1234567890',
        role: 'ADMIN',
        isActive: true
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser.id}`);
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function listAllUsers() {
  try {
    console.log('\n📋 All users in the system:');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (users.length === 0) {
      console.log('   No users found');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

async function runAdminSetup() {
  console.log('👤 Admin User Setup\n');
  
  // Create admin user
  const admin = await createAdminUser();
  
  // List all users
  await listAllUsers();
  
  if (admin) {
    console.log('\n🎉 Admin setup complete!');
    console.log('You can now login to the admin dashboard with:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
  }
}

// Run the admin setup
runAdminSetup().catch(console.error);
