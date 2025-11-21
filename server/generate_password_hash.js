// Helper script to generate bcrypt password hash
// Usage: node generate_password_hash.js your-password

const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node generate_password_hash.js <password>');
  console.error('Example: node generate_password_hash.js admin123');
  process.exit(1);
}

const SALT_ROUNDS = 10;

bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  
  console.log('\n✓ Password hash generated successfully!\n');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse this hash in your SQL INSERT statement:');
  console.log(`'${hash}'`);
  console.log('\n');
});
