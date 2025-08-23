const axios = require('axios');

async function testCompleteFlow() {
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
    console.log('=== 测试完整的系统流程 ===\n');

    // 1. 测试约束验证
    console.log('1. 测试约束验证...');
    const validationResponse = await axios.post('http://localhost:3000/api/validate-constraints', testData);
    console.log('✅ 约束验证通过:', validationResponse.data.success);
    
    if (validationResponse.data.validation) {
      console.log('   - 验证结果:', validationResponse.data.validation.isValid ? '有效' : '无效');
      console.log('   - 违规:', validationResponse.data.validation.violations.length);
      console.log('   - 警告:', validationResponse.data.validation.warnings.length);
    }

    // 2. 创建优化任务
    console.log('\n2. 创建优化任务...');
    const optimizeResponse = await axios.post('http://localhost:3000/api/optimize', testData);
    console.log('✅ 优化任务创建:', optimizeResponse.data.success);
    
    if (optimizeResponse.data.success) {
      const taskId = optimizeResponse.data.taskId;
      console.log('   - 任务ID:', taskId);

      // 3. 等待并检查任务状态
      console.log('\n3. 检查任务状态...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const taskResponse = await axios.get(`http://localhost:3000/api/optimize/${taskId}/progress`);
        console.log('✅ 任务状态:', taskResponse.data.status);
        if (taskResponse.data.result) {
          console.log('   - 损耗率:', taskResponse.data.result.lossRate + '%');
          console.log('   - 利用率:', taskResponse.data.result.utilization + '%');
        }
      } catch (error) {
        console.log('⚠️  任务状态检查失败:', error.response?.data?.error || error.message);
      }
    }

    // 4. 测试其他API
    console.log('\n4. 测试系统统计API...');
    try {
      const statsResponse = await axios.get('http://localhost:3000/api/stats');
      console.log('✅ 统计API响应:', statsResponse.data.success);
    } catch (error) {
      console.log('⚠️  统计API失败:', error.message);
    }

    console.log('\n=== 测试完成 ===');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data?.error || error.message);
  }
}

testCompleteFlow();