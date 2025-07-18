const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`${response.ok ? '✅' : '❌'} ${method} ${endpoint} - Status: ${response.status}`);
    if (!response.ok) {
      console.log(`   Error: ${data.error || 'Unknown error'}`);
    }
    
    return response.ok;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing APIs...\n');
  
  const tests = [
    // Health check
    { endpoint: '/api/health', method: 'GET' },
    
    // Collection status
    { endpoint: '/api/collect/status', method: 'GET' },
    
    // Keywords list
    { endpoint: '/api/keywords', method: 'GET' },
    
    // Naver keyword test
    { endpoint: '/api/naver/keyword', method: 'POST', body: { keyword: '블로그' } },
    
    // Google trends test
    { endpoint: '/api/google/trends', method: 'POST', body: { keyword: '블로그' } },
    
    // Longtail generation test
    { endpoint: '/api/longtail/generate', method: 'POST', body: { keyword: '블로그' } },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const success = await testAPI(test.endpoint, test.method, test.body);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the APIs.');
    process.exit(1);
  }
}

runTests().catch(console.error);