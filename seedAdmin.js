const bcrypt = require('bcrypt');
const { User, Role } = require('./models'); // Make sure this path points to your models folder

async function createSecureAdmin() {
  try {
    // 1. Find the ADMIN role in your database
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    
    // 2. Hash a secure password
    const hashedPassword = await bcrypt.hash('secureAdmin123', 10);
    
    // 3. Create the user
    await User.create({
      username: 'bossadmin',
      password: hashedPassword,
      roleId: adminRole.id
    });
    
    console.log("✅ Secure Admin created! Username: bossadmin | Password: secureAdmin123");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

createSecureAdmin();