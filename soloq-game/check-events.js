const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/events.json', 'utf8'));
const roles = Object.keys(data);
console.log('Roller:', roles);
roles.forEach(role => {
  console.log(`${role}: ${data[role].length} olay`);
});