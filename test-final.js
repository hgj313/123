const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

// 测试数据
const testData = {
  designSteels: [
    {
      id: 'design_1',
      length: 3000,
      quantity: 10,
      crossSection: 200,
      componentNumber: 'GJ001',
      specification: 'H200x100x5.5x8',
      partNumber: 'BJ001',
      material: 'Q235',
      note: '测试数据1'
    },
    {
      id: 'design_2',
      length: 4500,
      quantity: 5,
      crossSection: 250,
      componentNumber: 'GJ002',
      specification: 'H250x125x6x9',
      partNumber: 'BJ002',
      material: 'Q235',
      note: '测试数据2'
    }
  ],
  moduleSteels: [
    {
      id: 'module_1',
      length: 6000,
      quantity: 8,
      crossSection: 200,
      specification: 'H200x100x5.5x8',
      material: 'Q235',
      note: '模块钢材1'
    },
    {
      id: 'module_2',
      length: 8000,
      quantity: 6,
      crossSection: 250,
      specification: 'H250x125x6x9',
      material: 'Q235',
      note: '模块钢材2'
    }
  ],
  constraints: {
    maxWasteLength: 600,
    minRemainderLength: 300,
    targetLossRate: 5,
    maxWeldingSegments: 1,
    timeLimit: 300000
  }
};

async function testSystem() {
  console.log('🚀 开始测试钢材采购优化系统');
  console.log(`后端地址: ${BASE_URL}`);
  console.log(`前端地址: ${FRONTEND_URL}`);
  console.log('='.repeat(50));

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ 健康检查通过:', health.data.message);

    // 2. 测试约束验证
    console.log('2. 测试约束验证...');
    const validation = await axios.post(`${BASE_URL}/api/validate-constraints`, testData);
    console.log('✅ 约束验证通过:', validation.data);

    // 3. 测试优化任务创建
    console.log('3. 测试优化任务创建...');
    const optimization = await axios.post(`${BASE_URL}/api/optimize`, testData);
    console.log('✅ 优化任务创建成功:', optimization.data);
    const taskId = optimization.data.taskId;

    // 4. 测试任务状态查询
    console.log('4. 测试任务状态查询...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
    const taskStatus = await axios.get(`${BASE_URL}/api/task/${taskId}`);
    console.log('✅ 任务状态查询成功:', taskStatus.data);

    // 5. 测试系统统计
    console.log('5. 测试系统统计...');
    const stats = await axios.get(`${BASE_URL}/api/stats`);
    console.log('✅ 系统统计查询成功:', stats.data);

    console.log('='.repeat(50));
    console.log('🎉 所有测试通过！');
    console.log(`🌐 前端访问: ${FRONTEND_URL}`);
    console.log(`🔧 后端API: ${BASE_URL}/api/health`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
  }
}

testSystem();