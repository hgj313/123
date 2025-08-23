const XLSX = require('xlsx');
const fs = require('fs');

// Read CSV file
const csvData = fs.readFileSync('test-data.csv', 'utf8');

// Convert CSV to array of objects
const lines = csvData.trim().split('\n');
const headers = lines[0].split(',');
const rows = lines.slice(1).map(line => {
  const values = line.split(',');
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = values[index];
  });
  return obj;
});

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(rows);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

// Write to Excel file
XLSX.writeFile(wb, 'test-data.xlsx');

console.log('Excel file created successfully: test-data.xlsx');