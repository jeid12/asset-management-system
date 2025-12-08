const fs = require('fs');

// Device categories and their details
const categories = [
  { name: 'Laptop', brands: ['HP', 'Dell', 'Lenovo', 'Acer', 'ASUS'], models: ['ProBook 450', 'Latitude 3520', 'ThinkPad E14', 'Aspire 5', 'VivoBook 15'] },
  { name: 'Desktop', brands: ['HP', 'Dell', 'Lenovo', 'Acer'], models: ['EliteDesk 800', 'OptiPlex 3080', 'ThinkCentre M720', 'Veriton M'] },
  { name: 'Tablet', brands: ['Samsung', 'Lenovo', 'Apple', 'Huawei'], models: ['Galaxy Tab A8', 'Tab M10', 'iPad 9th Gen', 'MatePad'] },
  { name: 'Projector', brands: ['Epson', 'BenQ', 'ViewSonic', 'Optoma'], models: ['EB-X05', 'MH550', 'PA503W', 'HD146X'] },
  { name: 'Others', brands: ['Canon', 'HP', 'Brother', 'Logitech'], models: ['Printer MF445dw', 'LaserJet Pro', 'DCP-L2550DW', 'Webcam C920'] }
];

const statuses = ['Available', 'Maintenance'];
const conditions = ['New', 'Good', 'Fair'];

const specifications = [
  '8GB RAM, 256GB SSD, Intel Core i5',
  '16GB RAM, 512GB SSD, Intel Core i7',
  '4GB RAM, 128GB SSD, Intel Core i3',
  '8GB RAM, 1TB HDD, AMD Ryzen 5',
  '32GB RAM, 1TB SSD, Intel Core i9',
  '10.1 inch Display, 64GB Storage',
  '13.3 inch Display, 128GB Storage',
  '3000 Lumens, HDMI, VGA',
  '4000 Lumens, Wireless',
  'Network Ready, Duplex Printing'
];

// Function to generate random serial number
function generateSerialNumber(category, index) {
  const prefix = category.substring(0, 3).toUpperCase();
  const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6-digit random number
  const uniqueId = `${Date.now()}${index}`.slice(-6); // Ensure uniqueness
  return `${prefix}-${uniqueId}${randomNum.toString().slice(-3)}`;
}

// Function to get random item from array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate CSV data
function generateDevicesCSV(count) {
  const header = 'serialNumber,category,brand,model,schoolCode,status,specifications,condition\n';
  let csvContent = header;

  for (let i = 1; i <= count; i++) {
    const categoryData = getRandomItem(categories);
    const category = categoryData.name;
    const brand = getRandomItem(categoryData.brands);
    const model = getRandomItem(categoryData.models);
    const serialNumber = generateSerialNumber(category, i);
    const status = getRandomItem(statuses);
    const condition = getRandomItem(conditions);
    const spec = getRandomItem(specifications);
    
    // schoolCode and assetTag are empty
    const schoolCode = '';
    
    csvContent += `${serialNumber},${category},${brand},${model},${schoolCode},${status},"${spec}",${condition}\n`;
  }

  return csvContent;
}

// Generate 2500 devices
const devicesCSV = generateDevicesCSV(2500);

// Write to file
fs.writeFileSync('devices_bulk_2500.csv', devicesCSV);

console.log('✅ Generated devices_bulk_2500.csv with 2500 devices');
console.log('📊 All devices have empty schoolCode and assetTag fields');
console.log('📁 File saved in the current directory');
