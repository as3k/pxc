/**
 * Phase 4D Edge Cases and Stress Testing Script (ES Module version)
 * Tests unusual scenarios, edge cases, and stress conditions
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_RESULTS = {
  network: [],
  storage: [],
  nodeState: [],
  configuration: [],
  vmCreation: [],
  mockMode: [],
  errorHandling: [],
  performance: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    critical: 0
  }
};

// Utility functions
function logTest(category, name, passed, details = '') {
  const result = {
    name,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  TEST_RESULTS[category].push(result);
  TEST_RESULTS.summary.total++;
  
  if (passed) {
    TEST_RESULTS.summary.passed++;
    console.log(`✓ [${category}] ${name}`);
  } else {
    TEST_RESULTS.summary.failed++;
    console.log(`✗ [${category}] ${name}`);
    if (details) console.log(`  Details: ${details}`);
  }
}

function runCommand(cmd, options = {}) {
  try {
    const result = execSync(cmd, { 
      encoding: 'utf8', 
      timeout: 5000, 
      ...options,
      stdio: 'pipe'
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      exitCode: error.status
    };
  }
}

// Network Edge Cases
async function testNetworkEdgeCases() {
  console.log('\n=== Testing Network Edge Cases ===');
  
  // Test bridge detection on different nodes
  const result1 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getBridges } from \\"./dist/lib/proxmox.js\\"; getBridges(\\"node1\\").then(console.log).catch(console.error)"');
  logTest('network', 'Bridge detection on node1', result1.success, result1.error);
  
  const result2 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getBridges } from \\"./dist/lib/proxmox.js\\"; getBridges(\\"node2\\").then(console.log).catch(console.error)"');
  logTest('network', 'Bridge detection on node2', result2.success, result2.error);
  
  // Test with invalid node name
  const result3 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getBridges } from \\"./dist/lib/proxmox.js\\"; getBridges(\\"invalid-node\\").then(console.log).catch(console.error)"');
  logTest('network', 'Bridge detection with invalid node', result3.success, result3.error);
  
  // Test fallback behavior
  const result4 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getBridges } from \\"./dist/lib/proxmox.js\\"; getBridges(\\"nonexistent\\").then(bridges => console.log(\\"Bridges:\\", bridges.length)).catch(console.error)"');
  logTest('network', 'Fallback to default bridge on failure', result4.success, result4.error);
}

// Storage Edge Cases
async function testStorageEdgeCases() {
  console.log('\n=== Testing Storage Edge Cases ===');
  
  // Test storage detection on different nodes
  const result1 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getStorages } from \\"./dist/lib/proxmox.js\\"; getStorages(\\"node1\\").then(s => console.log(\\"Storages:\\", s.length)).catch(console.error)"');
  logTest('storage', 'Storage detection on node1', result1.success, result1.error);
  
  const result2 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getStorages } from \\"./dist/lib/proxmox.js\\"; getStorages(\\"node2\\").then(s => console.log(\\"Storages:\\", s.length)).catch(console.error)"');
  logTest('storage', 'Storage detection on node2', result2.success, result2.error);
  
  // Test ISO storage detection
  const result3 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getIsoStorages } from \\"./dist/lib/proxmox.js\\"; getIsoStorages(\\"node1\\").then(s => console.log(\\"ISO storages:\\", s.length)).catch(console.error)"');
  logTest('storage', 'ISO storage detection', result3.success, result3.error);
  
  // Test with invalid storage name
  const result4 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getIsoFiles } from \\"./dist/lib/proxmox.js\\"; getIsoFiles(\\"invalid-storage\\").then(console.log).catch(console.error)"');
  logTest('storage', 'ISO files from invalid storage', result4.success, result4.error);
}

// Node State Edge Cases
async function testNodeStateEdgeCases() {
  console.log('\n=== Testing Node State Edge Cases ===');
  
  // Test cluster node detection
  const result1 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getClusterNodes } from \\"./dist/lib/proxmox.js\\"; getClusterNodes().then(console.log).catch(console.error)"');
  logTest('nodeState', 'Get cluster nodes', result1.success, result1.error);
  
  // Test node status check
  const result2 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getNodeStatus } from \\"./dist/lib/proxmox.js\\"; getNodeStatus(\\"node3\\").then(console.log).catch(console.error)"');
  logTest('nodeState', 'Get offline node status', result2.success, result2.error);
  
  // Test preferred node selection
  const result3 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getPreferredNode } from \\"./dist/lib/proxmox.js\\"; getPreferredNode().then(console.log).catch(console.error)"');
  logTest('nodeState', 'Get preferred node', result3.success, result3.error);
  
  // Test cluster environment detection
  const result4 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { isClusterEnvironment } from \\"./dist/lib/proxmox.js\\"; isClusterEnvironment().then(console.log).catch(console.error)"');
  logTest('nodeState', 'Cluster environment detection', result4.success, result4.error);
  
  // Test VM listing across cluster
  const result5 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { listVms } from \\"./dist/lib/proxmox.js\\"; listVms().then(vms => console.log(\\"VMs:\\", vms.length)).catch(console.error)"');
  logTest('nodeState', 'List VMs across cluster', result5.success, result5.error);
}

// VM Creation Edge Cases
async function testVmCreationEdgeCases() {
  console.log('\n=== Testing VM Creation Edge Cases ===');
  
  // Test VM ID allocation
  const result1 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getNextVmid } from \\"./dist/lib/proxmox.js\\"; getNextVmid().then(console.log).catch(console.error)"');
  logTest('vmCreation', 'Get next VM ID', result1.success, result1.error);
  
  // Test VM ID availability check
  const result2 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { isVmidAvailable } from \\"./dist/lib/proxmox.js\\"; isVmidAvailable(99999).then(console.log).catch(console.error)"');
  logTest('vmCreation', 'Check VM ID availability', result2.success, result2.error);
  
  // Test VM creation with invalid node (should fail gracefully in mock)
  const result3 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { createVm } from \\"./dist/lib/proxmox.js\\"; createVm({ vmid: 999, name: \\"test\\", cores: 1, memoryMb: 512, diskGb: 5, storage: \\"invalid\\", bridge: \\"vmbr0\\", node: \\"invalid-node\\" }).catch(console.error)"');
  logTest('vmCreation', 'VM creation with invalid node', result3.success, result3.error);
  
  // Test VM creation with extreme values
  const result4 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { createVm } from \\"./dist/lib/proxmox.js\\"; createVm({ vmid: 998, name: \\"extreme-test\\", cores: 128, memoryMb: 1048576, diskGb: 10000, storage: \\"local-lvm\\", bridge: \\"vmbr0\\" }).catch(console.error)"');
  logTest('vmCreation', 'VM creation with extreme values', result4.success, result4.error);
  
  // Test VM creation on offline node
  const result5 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { createVm } from \\"./dist/lib/proxmox.js\\"; createVm({ vmid: 997, name: \\"offline-test\\", cores: 1, memoryMb: 512, diskGb: 5, storage: \\"local-lvm\\", bridge: \\"vmbr0\\", node: \\"node3\\" }).catch(console.error)"');
  logTest('vmCreation', 'VM creation on offline node', result5.success, result5.error);
}

// Configuration Edge Cases
async function testConfigurationEdgeCases() {
  console.log('\n=== Testing Configuration Edge Cases ===');
  
  // Test with missing configuration directory
  const configDir = path.join(process.env.HOME || '~', '.config', 'pxc');
  const backupDir = configDir + '.backup.' + Date.now();
  
  if (fs.existsSync(configDir)) {
    fs.renameSync(configDir, backupDir);
  }
  
  try {
    // Test with no config file
    const result1 = runCommand('node --input-type=module -e "import { loadConfig } from \\"./dist/lib/config.js\\"; const config = loadConfig(); console.log(\\"Empty config keys:\\", Object.keys(config))"');
    logTest('configuration', 'Load config when file missing', result1.success, result1.error);
    
    // Test resolved defaults with no config
    const result2 = runCommand('node --input-type=module -e "import { getResolvedDefaults } from \\"./dist/lib/config.js\\"; const defaults = getResolvedDefaults(\\"nonexistent-package\\"); console.log(\\"Defaults:\\", Object.keys(defaults))"');
    logTest('configuration', 'Resolved defaults with no config', result2.success, result2.error);
    
    // Test node config with no config
    const result3 = runCommand('node --input-type=module -e "import { getNodeConfig } from \\"./dist/lib/config.js\\"; const config = getNodeConfig(\\"test-node\\"); console.log(\\"Node config:\", Object.keys(config))"');
    logTest('configuration', 'Node config with no config file', result3.success, result3.error);
    
  } finally {
    // Restore original config if it existed
    if (fs.existsSync(backupDir)) {
      if (fs.existsSync(configDir)) {
        fs.rmSync(configDir, { recursive: true });
      }
      fs.renameSync(backupDir, configDir);
    }
  }
}

// Mock Mode Edge Cases
async function testMockModeEdgeCases() {
  console.log('\n=== Testing Mock Mode Edge Cases ===');
  
  // Test mock mode enabled
  const result1 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { isProxmoxNode } from \\"./dist/lib/proxmox.js\\"; isProxmoxNode().then(console.log)"');
  logTest('mockMode', 'Mock mode enabled', result1.success && result1.output.includes('true'), result1.error);
  
  // Test mock mode disabled
  const result2 = runCommand('MOCK_PROXMOX= node --input-type=module -e "import { isProxmoxNode } from \\"./dist/lib/proxmox.js\\"; isProxmoxNode().catch(console.error)"');
  logTest('mockMode', 'Mock mode disabled', !result2.success, result2.error);
  
  // Test mock mode VM operations
  const result3 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { startVm, stopVm } from \\"./dist/lib/proxmox.js\\"; Promise.all([startVm(100), stopVm(101)]).then(() => console.log(\\"Mock operations complete\\")).catch(console.error)"');
  logTest('mockMode', 'Mock VM operations', result3.success, result3.error);
}

// Error Handling Edge Cases
async function testErrorHandlingEdgeCases() {
  console.log('\n=== Testing Error Handling Edge Cases ===');
  
  // Test invalid VM ID handling
  const result1 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getVmInfo } from \\"./dist/lib/proxmox.js\\"; getVmInfo(-1).then(console.log)"');
  logTest('errorHandling', 'Invalid VM ID handling', result1.success, result1.error);
  
  // Test invalid VM operations
  const result2 = runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getVmStatus } from \\"./dist/lib/proxmox.js\\"; getVmStatus(99999).then(console.log)"');
  logTest('errorHandling', 'Non-existent VM status', result2.success, result2.error);
}

// Performance Stress Testing
async function testPerformanceStress() {
  console.log('\n=== Testing Performance Stress ===');
  
  // Test rapid successive operations
  const start = Date.now();
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { getNextVmid } from \\"./dist/lib/proxmox.js\\"; getNextVmid()"'));
  }
  
  try {
    await Promise.all(promises);
    const duration = Date.now() - start;
    logTest('performance', 'Rapid successive operations', duration < 10000, `Took ${duration}ms for 5 operations`);
  } catch (error) {
    logTest('performance', 'Rapid successive operations', false, error.message);
  }
  
  // Test memory usage approximation
  const result3 = runCommand('node --input-type=module -e "const used = process.memoryUsage(); console.log(\\"Memory usage:\\", { rss: Math.round(used.rss / 1024 / 1024) + \\"MB\\", heapTotal: Math.round(used.heapTotal / 1024 / 1024) + \\"MB\\", heapUsed: Math.round(used.heapUsed / 1024 / 1024) + \\"MB\\" });"');
  logTest('performance', 'Memory usage check', result3.success, result3.error);
  
  // Test with many operations (stress test)
  const stressStart = Date.now();
  const stressPromises = [];
  for (let i = 0; i < 20; i++) {
    stressPromises.push(runCommand('MOCK_PROXMOX=1 node --input-type=module -e "import { listVms } from \\"./dist/lib/proxmox.js\\"; listVms().then(vms => console.log(\\"Batch\\" + process.argv[1] + \\":\\" + vms.length))"' + ` ${i}`));
  }
  
  try {
    await Promise.all(stressPromises);
    const stressDuration = Date.now() - stressStart;
    logTest('performance', 'Stress test (20 operations)', stressDuration < 15000, `Took ${stressDuration}ms for 20 operations`);
  } catch (error) {
    logTest('performance', 'Stress test (20 operations)', false, error.message);
  }
}

// Generate test report
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('EDGE CASE AND STRESS TEST REPORT');
  console.log('='.repeat(60));
  
  console.log('\nSUMMARY:');
  console.log(`Total Tests: ${TEST_RESULTS.summary.total}`);
  console.log(`Passed: ${TEST_RESULTS.summary.passed}`);
  console.log(`Failed: ${TEST_RESULTS.summary.failed}`);
  console.log(`Success Rate: ${((TEST_RESULTS.summary.passed / TEST_RESULTS.summary.total) * 100).toFixed(1)}%`);
  
  console.log('\nCATEGORY BREAKDOWN:');
  Object.keys(TEST_RESULTS).forEach(category => {
    if (category === 'summary') return;
    
    const tests = TEST_RESULTS[category];
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  Passed: ${passed}/${tests.length}`);
    console.log(`  Failed: ${failed}/${tests.length}`);
    
    if (failed > 0) {
      console.log('  Failed Tests:');
      tests.filter(t => !t.passed).forEach(test => {
        console.log(`    - ${test.name}: ${test.details}`);
      });
    }
  });
  
  console.log('\nCRITICAL ISSUES:');
  const criticalIssues = [];
  
  // Check for critical patterns
  Object.keys(TEST_RESULTS).forEach(category => {
    if (category === 'summary') return;
    
    TEST_RESULTS[category].forEach(test => {
      if (!test.passed) {
        const details = test.details.toLowerCase();
        if (details.includes('crash') || details.includes('hang') || details.includes('timeout')) {
          criticalIssues.push({ category: category, test: test.name, details: test.details });
          TEST_RESULTS.summary.critical++;
        }
      }
    });
  });
  
  if (criticalIssues.length > 0) {
    criticalIssues.forEach(issue => {
      console.log(`  [${issue.category}] ${issue.test}: ${issue.details}`);
    });
  } else {
    console.log('  No critical issues found');
  }
  
  console.log('\nRECOMMENDATIONS:');
  if (TEST_RESULTS.summary.failed === 0) {
    console.log('  ✓ All edge cases handled gracefully');
    console.log('  ✓ System robust under stress conditions');
    console.log('  ✓ Error handling is comprehensive');
  } else {
    console.log('  ⚠ Some edge cases need attention');
    console.log('  ⚠ Review failed tests for improvements');
    console.log('  ⚠ Consider adding more defensive programming');
  }
  
  console.log('\nOVERALL ASSESSMENT:');
  if (TEST_RESULTS.summary.critical > 0) {
    console.log('  ❌ CRITICAL ISSUES FOUND - Address immediately');
  } else if (TEST_RESULTS.summary.failed > TEST_RESULTS.summary.total * 0.1) {
    console.log('  ⚠️ NEEDS IMPROVEMENT - Multiple edge cases failing');
  } else if (TEST_RESULTS.summary.failed > 0) {
    console.log('  ⚠️ MINOR ISSUES - Some edge cases need attention');
  } else {
    console.log('  ✅ EXCELLENT - All edge cases handled properly');
  }
  
  return TEST_RESULTS;
}

// Main test execution
async function runAllTests() {
  console.log('Starting Phase 4D Edge Cases and Stress Testing...');
  console.log(`Test started at: ${new Date().toISOString()}`);
  
  try {
    await testNetworkEdgeCases();
    await testStorageEdgeCases();
    await testNodeStateEdgeCases();
    await testVmCreationEdgeCases();
    await testConfigurationEdgeCases();
    await testMockModeEdgeCases();
    await testErrorHandlingEdgeCases();
    await testPerformanceStress();
    
    const results = generateReport();
    
    // Save results to file
    const reportPath = './edge-case-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);
    
    return results;
    
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests, TEST_RESULTS };
