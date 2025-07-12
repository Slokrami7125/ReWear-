const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = "mongodb+srv://slokpankaj7777:slok%407125@cluster1.lxh23dx.mongodb.net/rewear?retryWrites=true&w=majority";
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000
  });

  try {
    console.log('🔌 Testing MongoDB connection...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    const db = client.db('rewear');
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('🔌 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection(); 