require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NAVER_API_KEY',
  'NAVER_SECRET_KEY',
  'NAVER_CUSTOMER_ID',
  'SERPAPI_KEY'
];

console.log('🔍 Environment Variables Check:');
let allPresent = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  const status = value ? '✅' : '❌';
  console.log(`${status} ${envVar}: ${value ? 'Present' : 'Missing'}`);
  if (!value) allPresent = false;
});

console.log(allPresent ? '\n✅ All environment variables are present!' : '\n❌ Some environment variables are missing!');
process.exit(allPresent ? 0 : 1);