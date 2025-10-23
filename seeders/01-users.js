const { generateTimestamps, generateSaudiPhone, randomChoice } = require('./utils/helpers');

class UsersSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    const users = [
      // Admin Users
      {
        username: 'admin',
        email: 'admin@vms-dashboard.sa',
        password_hash: '$2b$10$8K1p/a0dTjbzKqL8w9vXHu123456789abcdefghijk', // hashed 'admin123'
        full_name: 'System Administrator',
        role: 'admin',
        department: 'IT Security',
        phone: '+966-11-2345678',
        is_active: true,
        last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        ...generateTimestamps(90)
      },
      {
        username: 'sa_admin',
        email: 'sa.admin@bank-system.sa',
        password_hash: '$2b$10$9L2q/b1eUkczLrM9x0wYIv234567890bcdefghjkl', // hashed 'secure456'
        full_name: 'Ahmed Al-Rashid',
        role: 'admin',
        department: 'System Administration',
        phone: generateSaudiPhone(),
        is_active: true,
        last_login: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        ...generateTimestamps(60)
      },

      // Operators
      {
        username: 'operator1',
        email: 'mohammad.hassan@bank-system.sa',
        password_hash: '$2b$10$7J3o/c2fVldzMsN0y1xZJw345678901cdefghijklm',
        full_name: 'Mohammad Hassan',
        role: 'operator',
        department: 'Security Operations',
        phone: generateSaudiPhone(),
        is_active: true,
        last_login: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        ...generateTimestamps(45)
      },
      {
        username: 'operator2',
        email: 'fatima.alyami@bank-system.sa',
        password_hash: '$2b$10$6I4n/d3gWmezNtO1z2yAKx456789012defghijklmn',
        full_name: 'Fatima Al-Yami',
        role: 'operator',
        department: 'Security Operations',
        phone: generateSaudiPhone(),
        is_active: true,
        last_login: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        ...generateTimestamps(30)
      },
      {
        username: 'riyadh_ops',
        email: 'abdullah.saud@bank-system.sa',
        password_hash: '$2b$10$5H5m/e4hXnfaOuP2a3zBLy567890123efghijklmno',
        full_name: 'Abdullah Saud',
        role: 'operator',
        department: 'Riyadh Operations',
        phone: generateSaudiPhone(),
        is_active: true,
        last_login: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        ...generateTimestamps(20)
      },
      {
        username: 'jeddah_ops',
        email: 'noura.almutairi@bank-system.sa',
        password_hash: '$2b$10$4G6l/f5iYogbPvQ3b4aCMz678901234fghijklmnop',
        full_name: 'Noura Al-Mutairi',
        role: 'operator',
        department: 'Jeddah Operations',
        phone: generateSaudiPhone(),
        is_active: true,
        last_login: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        ...generateTimestamps(15)
      },

      // Technicians
      {
        username: 'tech1',
        email: 'khalid.omar@bank-system.sa',
        password_hash: '$2b$10$3F7k/g6jZphcQwR4c5dDNa789012345ghijklmnopq',
        full_name: 'Khalid Omar',
        role: 'technician',
        department: 'Technical Support',
        phone: generateSaudiPhone(),
        is_active: true,
        last_login: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        ...generateTimestamps(25)
      },
      {
        username: 'tech2',
        email: 'sara.alqahtani@bank-system.sa',
        password_hash: '$2b$10$2E8j/h7kAqidRxS5d6eEOb890123456hijklmnopqr',
        full_name: 'Sara Al-Qahtani',
        role: 'technician',
        department: 'Technical Support',
        phone: generateSaudiPhone(),
        is_active: true,
        last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ...generateTimestamps(40)
      },
      {
        username: 'field_tech',
        email: 'yasser.alkharji@bank-system.sa',
        password_hash: '$2b$10$1D9i/i8lBrjeSyT6e7fFPc901234567ijklmnopqrs',
        full_name: 'Yasser Al-Kharji',
        role: 'technician',
        department: 'Field Operations',
        phone: generateSaudiPhone(),
        is_active: true,
        last_login: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        ...generateTimestamps(50)
      },

      // Viewers
      {
        username: 'viewer1',
        email: 'maha.alshahrani@bank-system.sa',
        password_hash: '$2b$10$0C0h/j9mCskfTzU7f8gGQd012345678jklmnopqrst',
        full_name: 'Maha Al-Shahrani',
        role: 'viewer',
        department: 'Management',
        phone: generateSaudiPhone(),
        is_active: true,
        last_login: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ...generateTimestamps(35)
      },
      {
        username: 'security_mgr',
        email: 'omar.aldossary@bank-system.sa',
        password_hash: '$2b$10$9B1g/k0nDtlgU0V8g9hHRe123456789klmnopqrstu',
        full_name: 'Omar Al-Dossary',
        role: 'viewer',
        department: 'Security Management',
        phone: generateSaudiPhone(),
        is_active: true,
        last_login: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        ...generateTimestamps(20)
      },
      {
        username: 'branch_mgr',
        email: 'layla.albanawy@bank-system.sa',
        password_hash: '$2b$10$8A2f/l1oEumhV1W9h0iISf234567890lmnopqrstuv',
        full_name: 'Layla Al-Banawy',
        role: 'viewer',
        department: 'Branch Management',
        phone: generateSaudiPhone(),
        is_active: true,
        last_login: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        ...generateTimestamps(10)
      },

      // Inactive user for testing
      {
        username: 'inactive_user',
        email: 'inactive@bank-system.sa',
        password_hash: '$2b$10$7Z3e/m2pFvniW2X0i1jJTg345678901mnopqrstuvw',
        full_name: 'Inactive User',
        role: 'viewer',
        department: 'Former Employee',
        phone: generateSaudiPhone(),
        is_active: false,
        last_login: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        ...generateTimestamps(200)
      }
    ];

    const result = await this.db.insertBatch('users', users, 'DO NOTHING');
    
    return {
      summary: `Created ${result.length} users (${users.filter(u => u.role === 'admin').length} admins, ${users.filter(u => u.role === 'operator').length} operators, ${users.filter(u => u.role === 'technician').length} technicians, ${users.filter(u => u.role === 'viewer').length} viewers)`
    };
  }
}

module.exports = UsersSeeder;
