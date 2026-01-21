const { supabase, connectDB } = require('./config/supabase');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const seedUsers = async () => {
  try {
    console.log('🔄 Connecting to Supabase...');
    await connectDB();
    console.log('✅ Connected to Supabase\n');

    // Delete all existing users first
    console.log('🗑️  Removing all existing users...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (this condition always matches)
    
    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('⚠️  Error deleting users:', deleteError.message);
    } else {
      console.log('✅ All existing users removed\n');
    }

    // Only these two users allowed
    const users = [
      { username: 'Admin', password: 'Admin@RishuuNJain', role: 'admin' },
      { username: 'Harikanth', password: 'Employee@Harikanth', role: 'employee' }
    ];

    console.log('👤 Creating authorized users...\n');

    for (const userData of users) {
      // Store password in plain text (as requested - visible in database)
      // Create user
      const { data: user, error: insertError } = await supabase
        .from('users')
        .insert({
          username: userData.username,
          password: userData.password, // Plain text password
          role: userData.role
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Error creating user ${userData.username}:`, insertError.message);
      } else {
        console.log(`✅ Created user: ${userData.username} (${userData.role})`);
      }
    }

    console.log('\n✅ User setup complete!');
    console.log('\n📋 Authorized Users:');
    console.log('   🔐 Admin Portal:');
    console.log('      Username: Admin');
    console.log('      Password: Admin@RishuuNJain');
    console.log('   👤 Employee Portal:');
    console.log('      Username: Harikanth');
    console.log('      Password: Employee@Harikanth');
    console.log('\n⚠️  Only these two users have access. All other users have been removed.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

seedUsers();

