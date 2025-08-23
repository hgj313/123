const axios = require('axios');

async function testTimeLimitValidation() {
  const baseUrl = 'http://localhost:5002';
  
  const testCases = [
    { timeLimit: 0, expected: '时间限制应在1-300秒范围内' },
    { timeLimit: 1, expected: '成功' },
    { timeLimit: 150, expected: '成功' },
    { timeLimit: 300, expected: '成功' },
    { timeLimit: 301, expected: '时间限制应在1-300秒范围内' },
    { timeLimit: 1000, expected: '时间限制应在1-300秒范围内' }
  ];

  console.log('🧪 测试时间限制验证...\n');

  for (const testCase of testCases) {
    try {
      const response = await axios.post(`${baseUrl}/api/validate-constraints`, {
        designSteels: [{ id: 'test1', length: 6000, quantity: 10, crossSection: 1000 }],
        moduleSteels: [{ id: 'mod1', name: 'Test Module', length: 12000 }],
        constraints: {
          wasteThreshold: 600,
          targetLossRate: 5,
          timeLimit: testCase.timeLimit,
          maxWeldingSegments: 0
        }
      });

      console.log(`✅ timeLimit=${testCase.timeLimit}: 成功`);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      console.log(`❌ timeLimit=${testCase.timeLimit}: ${errorMessage}`);
    }
  }
}

testTimeLimitValidation().catch(console.error);