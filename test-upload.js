const fs = require('fs');
const path = require('path');

// 读取测试文件并转换为base64
const filePath = path.join(__dirname, 'test-data.xlsx');
const fileBuffer = fs.readFileSync(filePath);
const base64Data = fileBuffer.toString('base64');

console.log('File read successfully, size:', fileBuffer.length, 'bytes');
console.log('Base64 data length:', base64Data.length);

// 发送请求到服务器
fetch('http://localhost:5001/api/upload-design-steels', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    filename: 'test-data.xlsx',
    data: base64Data,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('Error:', error);
});