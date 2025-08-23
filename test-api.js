const axios = require('axios');

async function testConstraintValidation() {
  const testData = {
    designSteels: [
      {
        id: "ds-1",
        length: 3000,
        quantity: 10,
        crossSection: "300x300",
        material: "Q235",
        weight: 2250
      }
    ],
    moduleSteels: [
      {
        id: "ms-1",
        length: 6000,
        quantity: 20,
        crossSection: "300x300",
        material: "Q235",
        weight: 4500
      },
      {
        id: "ms-2",
        length: 4000,
        quantity: 15,
        crossSection: "300x300",
        material: "Q235",
        weight: 3000
      }
    ],
    constraints: {
      wasteThreshold: 600,
      targetLossRate: 5,
      timeLimit: 300,
      maxWeldingSegments: 1
    }
  };

  try {
    console.log('测试约束验证API...');
    const response = await axios.post('http://localhost:3000/api/validate-constraints', testData);
    console.log('约束验证结果:', JSON.stringify(response.data, null, 2));

    console.log('\n测试优化API...');
    const optimizeResponse = await axios.post('http://localhost:3000/api/optimize', testData);
    console.log('优化任务创建结果:', JSON.stringify(optimizeResponse.data, null, 2));

    if (optimizeResponse.data.success && optimizeResponse.data.taskId) {
      console.log('\n等待3秒后检查任务状态...');
      setTimeout(async () => {
        try {
          const taskResponse = await axios.get(`http://localhost:3000/api/optimize/${optimizeResponse.data.taskId}/progress`);
          console.log('任务状态:', JSON.stringify(taskResponse.data, null, 2));
        } catch (error) {
          console.error('获取任务状态失败:', error.message);
        }
      }, 3000);
    }

  } catch (error) {
    console.error('API测试失败:', error.message);
  }
}

testConstraintValidation();