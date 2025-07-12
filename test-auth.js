const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock database for testing
const mockUsers = [];

// Test signup function
async function testSignup(name, email, password, location) {
  console.log('\n🔐 Testing Signup...');
  console.log('Input:', { name, email, location, password: '***' });

  try {
    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === email);
    if (existingUser) {
      console.log('❌ Error: User already exists');
      return { success: false, message: 'User already exists' };
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      location,
      points: 0,
      joinDate: new Date()
    };

    mockUsers.push(newUser);

    console.log('✅ User created successfully');
    return {
      success: true,
      message: 'User created successfully',
      data: {
        name: newUser.name,
        email: newUser.email
      }
    };

  } catch (error) {
    console.log('❌ Error:', error.message);
    return { success: false, message: 'Internal server error' };
  }
}

// Test login function
async function testLogin(email, password) {
  console.log('\n🔑 Testing Login...');
  console.log('Input:', { email, password: '***' });

  try {
    // Find user by email
    const user = mockUsers.find(user => user.email === email);

    if (!user) {
      console.log('❌ Error: User not found');
      return { success: false, message: 'User not found' };
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Error: Invalid password');
      return { success: false, message: 'Invalid password' };
    }

    // Generate JWT token
    const JWT_SECRET = 'rewear-test-secret-key';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful');
    return {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          name: user.name,
          email: user.email
        }
      }
    };

  } catch (error) {
    console.log('❌ Error:', error.message);
    return { success: false, message: 'Internal server error' };
  }
}

// Test scenarios
async function runTests() {
  console.log('🧪 Testing ReWear Authentication System\n');
  console.log('=' .repeat(50));

  // Test 1: Signup new user
  const signupResult1 = await testSignup(
    'John Doe',
    'john@example.com',
    'password123',
    'New York'
  );
  console.log('Response:', signupResult1);

  // Test 2: Try to signup same user again (should fail)
  const signupResult2 = await testSignup(
    'John Doe',
    'john@example.com',
    'password123',
    'New York'
  );
  console.log('Response:', signupResult2);

  // Test 3: Login with correct credentials
  const loginResult1 = await testLogin('john@example.com', 'password123');
  console.log('Response:', loginResult1);

  // Test 4: Login with wrong password
  const loginResult2 = await testLogin('john@example.com', 'wrongpassword');
  console.log('Response:', loginResult2);

  // Test 5: Login with non-existent user
  const loginResult3 = await testLogin('nonexistent@example.com', 'password123');
  console.log('Response:', loginResult3);

  // Test 6: Signup another user
  const signupResult3 = await testSignup(
    'Jane Smith',
    'jane@example.com',
    'securepass456',
    'Los Angeles'
  );
  console.log('Response:', signupResult3);

  // Test 7: Login second user
  const loginResult4 = await testLogin('jane@example.com', 'securepass456');
  console.log('Response:', loginResult4);

  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Summary:');
  console.log(`Total users in mock database: ${mockUsers.length}`);
  console.log('Users:', mockUsers.map(u => ({ name: u.name, email: u.email })));
}

// Run the tests
runTests().catch(console.error); 