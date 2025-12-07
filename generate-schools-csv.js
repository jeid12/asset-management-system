const fs = require('fs');

const provinces = ['Kigali City', 'Eastern Province', 'Western Province', 'Northern Province', 'Southern Province'];
const districts = {
  'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
  'Eastern Province': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
  'Western Province': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
  'Northern Province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
  'Southern Province': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango']
};
const categories = ['TSS', 'VTC', 'Other'];
const statuses = ['Active', 'Inactive'];

const csv = ['schoolCode,schoolName,category,province,district,sector,cell,village,email,phoneNumber,representativeEmail,status'];

for (let i = 1; i <= 4000; i++) {
  const province = provinces[i % provinces.length];
  const districtList = districts[province];
  const district = districtList[i % districtList.length];
  const schoolCode = 'SCH' + String(i).padStart(5, '0');
  const schoolName = 'Test School ' + i;
  const category = categories[i % categories.length];
  const sector = 'Sector ' + ((i % 20) + 1);
  const cell = 'Cell ' + ((i % 10) + 1);
  const village = 'Village ' + ((i % 15) + 1);
  const email = 'school' + i + '@testschool.rw';
  const phoneNumber = '+25078' + String(1000000 + i).substring(1);
  const status = statuses[i % statuses.length];
  
  csv.push([schoolCode, schoolName, category, province, district, sector, cell, village, email, phoneNumber, '', status].join(','));
}

fs.writeFileSync('schools_bulk_4000.csv', csv.join('\n'), 'utf8');
console.log('Generated schools_bulk_4000.csv with 4000 rows');
