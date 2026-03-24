/**
 * Seed Script - Generate Test Data
 * 
 * Usage:
 *   node scripts/seed.js
 * 
 * This script creates sample test data for development
 */

const crypto = require("crypto");

console.log("\n════════════════════════════════════════════════════════════════");
console.log("🌱 SSI Sepolia Seed Script");
console.log("════════════════════════════════════════════════════════════════\n");

// Sample Universities (Issuers)
const universities = [
  {
    name: "MIT",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f42e0E"
  },
  {
    name: "Stanford University",
    address: "0x8ba1f109551bD432803012645Ac136ddd64DBA72"
  },
  {
    name: "Harvard University",
    address: "0x1234567890123456789012345678901234567890"
  }
];

// Sample Students
const students = [
  {
    name: "Alice Johnson",
    id: "MIT-2024-001",
    email: "alice@student.mit.edu"
  },
  {
    name: "Bob Smith",
    id: "STANFORD-2024-102",
    email: "bob@student.stanford.edu"
  },
  {
    name: "Carol Williams",
    id: "HARVARD-2024-203",
    email: "carol@student.harvard.edu"
  },
  {
    name: "David Chen",
    id: "MIT-2024-304",
    email: "david@student.mit.edu"
  }
];

// Sample Degrees
const degrees = [
  "Bachelor of Science in Computer Science",
  "Master of Business Administration",
  "Bachelor of Science in Engineering",
  "Master of Science in Data Science",
  "Bachelor of Arts in Philosophy"
];

// Sample Years
const years = [2023, 2024, 2025];

// Generate Credentials
console.log("📝 Generated Sample Credentials:\n");

const credentials = [];

for (let i = 0; i < 8; i++) {
  const university = universities[Math.floor(Math.random() * universities.length)];
  const student = students[Math.floor(Math.random() * students.length)];
  const degree = degrees[Math.floor(Math.random() * degrees.length)];
  const year = years[Math.floor(Math.random() * years.length)];

  const credential = {
    id: `cred-${i + 1}`,
    studentName: student.name,
    studentId: student.id,
    degree: degree,
    year: year,
    issuerName: university.name,
    issuerAddress: university.address,
    issuedAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      .toISOString()
  };

  credentials.push(credential);

  console.log(`${i + 1}. ${credential.studentName}`);
  console.log(`   Degree: ${credential.degree}`);
  console.log(`   Year: ${credential.year}`);
  console.log(`   Issuer: ${credential.issuerName}`);
  console.log(`   Issued: ${credential.issuedAt.substring(0, 10)}\n`);
}

// Generate Test Issuers
console.log("\n📋 Registered Issuers/Universities:\n");

universities.forEach((uni, index) => {
  console.log(`${index + 1}. ${uni.name}`);
  console.log(`   Address: ${uni.address}\n`);
});

// Generate Test Wallets
console.log("\n🔑 Generated Test Student IDs:\n");

students.forEach((student, index) => {
  console.log(`${index + 1}. ${student.name}`);
  console.log(`   ID: ${student.id}`);
  console.log(`   Email: ${student.email}\n`);
});

// Test Data Export
console.log("\n════════════════════════════════════════════════════════════════");
console.log("📊 TEST DATA STATISTICS");
console.log("════════════════════════════════════════════════════════════════");
console.log(`Total Sample Credentials: ${credentials.length}`);
console.log(`Total Universities: ${universities.length}`);
console.log(`Total Students: ${students.length}`);
console.log(`Degree Programs: ${degrees.length}`);
console.log("════════════════════════════════════════════════════════════════\n");

// Save to file
const fs = require("fs");
const testData = {
  timestamp: new Date().toISOString(),
  credentials,
  universities,
  students,
  degrees,
  years
};

const outputPath = "scripts/test-data.json";
fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));

console.log(`✅ Test data saved to: ${outputPath}\n`);

// API Example Calls
console.log("════════════════════════════════════════════════════════════════");
console.log("🚀 EXAMPLE API CALLS");
console.log("════════════════════════════════════════════════════════════════\n");

console.log("1️⃣  Issue a Credential:");
console.log(`   POST /api/issuer/issue-credential`);
console.log(`   Body: {`);
console.log(`     "studentName": "${credentials[0].studentName}",`);
console.log(`     "degree": "${credentials[0].degree}",`);
console.log(`     "year": ${credentials[0].year},`);
console.log(`     "studentId": "${credentials[0].studentId}"`);
console.log(`   }\n`);

console.log("2️⃣  Get Student Credentials:");
console.log(`   GET /api/wallet/credentials?userId=${students[0].id}\n`);

console.log("3️⃣  Verify Credential:");
console.log(`   POST /api/verify/validate-credential`);
console.log(`   Body: {`);
console.log(`     "credential": { ...credential },`);
console.log(`     "signature": "0x..."`);
console.log(`   }\n`);

console.log("════════════════════════════════════════════════════════════════");
console.log("✅ Seed data generated successfully!\n");
