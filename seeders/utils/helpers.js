// Seeding helper functions and utilities

/**
 * Generate random date within a range
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate random number between min and max
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random decimal between min and max
 */
function randomDecimal(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

/**
 * Pick random element from array
 */
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Pick multiple random elements from array
 */
function randomChoices(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate random IP address in a subnet
 */
function randomIP(subnet = '192.168') {
  const thirdOctet = randomInt(1, 10);
  const fourthOctet = randomInt(100, 199);
  return `${subnet}.${thirdOctet}.${fourthOctet}`;
}

/**
 * Generate random MAC address
 */
function randomMAC() {
  return Array.from({length: 6}, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':');
}

/**
 * Generate timestamps for created_at and updated_at
 */
function generateTimestamps(daysAgo = 30) {
  const now = new Date();
  const createdAt = randomDate(new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000), now);
  const updatedAt = randomDate(createdAt, now);
  return {
    created_at: createdAt.toISOString(),
    updated_at: updatedAt.toISOString()
  };
}

/**
 * Generate realistic uptime percentage
 */
function generateUptime() {
  // Most systems have good uptime, with occasional issues
  const rand = Math.random();
  if (rand < 0.7) return randomDecimal(99.0, 99.9); // 70% chance of excellent uptime
  if (rand < 0.9) return randomDecimal(98.0, 99.0); // 20% chance of good uptime
  return randomDecimal(95.0, 98.0); // 10% chance of poor uptime
}

/**
 * Generate storage usage percentage
 */
function generateStorageUsage() {
  // Storage follows normal distribution with tendency towards 40-80%
  const rand = Math.random();
  if (rand < 0.3) return randomInt(20, 40); // Low usage
  if (rand < 0.7) return randomInt(40, 70); // Normal usage
  if (rand < 0.9) return randomInt(70, 85); // High usage
  return randomInt(85, 95); // Critical usage
}

/**
 * Saudi Arabia specific data
 */
const saudiData = {
  regions: [
    { name: 'Riyadh', code: 'RD', coordinates: [24.7136, 46.6753] },
    { name: 'Jeddah', code: 'JD', coordinates: [21.5811, 39.1678] },
    { name: 'Dammam', code: 'DM', coordinates: [26.4207, 50.0888] },
    { name: 'Mecca', code: 'MC', coordinates: [21.4225, 39.8262] },
    { name: 'Medina', code: 'MD', coordinates: [24.4672, 39.6111] }
  ],
  
  branchNames: {
    'Riyadh': ['King Fahd', 'Olaya', 'Granada', 'Al Malaz', 'Al Nassim', 'Al Wurood', 'Al Sahafa', 'Al Yasmin'],
    'Jeddah': ['Al Hamra', 'Corniche', 'Balad', 'Al Rawdah', 'Al Marwah', 'Al Salamah'],
    'Dammam': ['Corniche', 'Al Faisaliyah', 'Al Shatea', 'Al Adama'],
    'Mecca': ['Ajyad', 'Al Aziziyah', 'Al Misfalah'],
    'Medina': ['Al Haram', 'Quba', 'Al Aqeeq']
  },
  
  phoneFormats: ['+966-11-', '+966-12-', '+966-13-', '+966-14-', '+966-17-'],
};

/**
 * Generate Saudi phone number
 */
function generateSaudiPhone() {
  const prefix = randomChoice(saudiData.phoneFormats);
  const number = randomInt(1000000, 9999999);
  return prefix + number;
}

/**
 * Generate device naming conventions
 */
function generateDeviceName(type, regionCode, branchId, deviceNumber) {
  const typeMap = {
    nvr: 'NVR',
    camera: 'CAM'
  };
  return `${typeMap[type]}-${regionCode}-${String(branchId).padStart(3, '0')}-${String(deviceNumber).padStart(2, '0')}`;
}

/**
 * Common device manufacturers and models
 */
const deviceData = {
  nvrManufacturers: ['Hikvision', 'Dahua', 'Uniview', 'Axis'],
  nvrModels: [
    'DS-7616NI-K2',
    'DS-7732NI-I4',
    'NVR4216-16P-4KS2',
    'NVR5216-16P-4KS2E',
    'NVR301-08E2',
    'AXIS S3008',
    'AXIS S2212'
  ],
  
  cameraManufacturers: ['Hikvision', 'Dahua', 'Axis', 'Uniview', 'Bosch'],
  cameraModels: [
    'DS-2CD2143G0-I',
    'DS-2CD2385FWD-I', 
    'IPC-HFW2431S-S',
    'IPC-HDW2431T-AS',
    'AXIS M3046-V',
    'AXIS P3245-LV',
    'FLEXIDOME IP 3000i'
  ],
  
  resolutions: ['4MP (2560x1440)', '5MP (2592x1944)', '8MP (3840x2160)', '2MP (1920x1080)'],
  positions: ['ATM Entrance', 'ATM Interior', 'Cash Dispenser', 'Lobby', 'Parking', 'Exterior', 'Counter Area']
};

/**
 * Generate realistic alert messages
 */
const alertTemplates = {
  camera_offline: [
    'Camera {deviceName} has gone offline',
    'Lost connection to camera {deviceName}',
    'Camera {deviceName} not responding'
  ],
  nvr_offline: [
    'NVR {deviceName} connection lost',
    'NVR {deviceName} system failure detected',
    'Unable to reach NVR {deviceName}'
  ],
  storage_warning: [
    'Storage usage at {percentage}% on {deviceName}',
    'Low disk space on {deviceName}',
    'Storage capacity critical on {deviceName}'
  ],
  motion_detected: [
    'Motion detected outside business hours',
    'Unusual activity detected in restricted area',
    'Motion alert triggered on {deviceName}'
  ],
  network_issue: [
    'Network connectivity issues detected',
    'High packet loss on network segment',
    'Bandwidth utilization critical'
  ]
};

/**
 * Generate alert message
 */
function generateAlertMessage(type, deviceName = null, percentage = null) {
  const templates = alertTemplates[type] || ['System alert generated'];
  let message = randomChoice(templates);
  
  if (deviceName) {
    message = message.replace('{deviceName}', deviceName);
  }
  if (percentage) {
    message = message.replace('{percentage}', percentage);
  }
  
  return message;
}

/**
 * Progress tracking utilities
 */
function logProgress(current, total, operation) {
  const percentage = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  process.stdout.write(`\r${operation}: [${bar}] ${percentage}% (${current}/${total})`);
  if (current === total) console.log(''); // New line when complete
}

module.exports = {
  randomDate,
  randomInt,
  randomDecimal,
  randomChoice,
  randomChoices,
  randomIP,
  randomMAC,
  generateTimestamps,
  generateUptime,
  generateStorageUsage,
  generateSaudiPhone,
  generateDeviceName,
  generateAlertMessage,
  logProgress,
  saudiData,
  deviceData,
  alertTemplates
};
