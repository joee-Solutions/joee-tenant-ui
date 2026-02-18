/**
 * Offline Mode Testing Script
 * 
 * Run this in the browser console to test offline mode functionality
 * 
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste this entire script
 * 4. Run the test functions
 */

// Helper function to access IndexedDB
async function getDB() {
  const Dexie = (await import('https://cdn.jsdelivr.net/npm/dexie@4/dist/dexie.min.mjs')).default;
  return new Dexie('JoeeTenantDB').open();
}

// Test 1: Check Cache Expiration
async function testCacheExpiration() {
  console.log('🧪 Testing Cache Expiration...');
  const db = await getDB();
  const entries = await db.apiCache.toArray();
  
  if (entries.length === 0) {
    console.log('❌ No cache entries found. Please pre-cache first.');
    return;
  }
  
  let allValid = true;
  entries.forEach(entry => {
    const expiresIn = new Date(entry.expiresAt) - new Date();
    const days = Math.floor(expiresIn / (1000 * 60 * 60 * 24));
    const hours = Math.floor((expiresIn % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days < 25 || days > 35) {
      console.warn(`⚠️ ${entry.endpoint}: expires in ${days} days ${hours} hours (expected ~30 days)`);
      allValid = false;
    } else {
      console.log(`✅ ${entry.endpoint}: expires in ${days} days ${hours} hours`);
    }
  });
  
  if (allValid) {
    console.log('✅ All cache entries have 1-month expiration');
  } else {
    console.log('⚠️ Some cache entries have unexpected expiration');
  }
}

// Test 2: Check Cache Cleanup
async function testCacheCleanup() {
  console.log('🧪 Testing Cache Cleanup...');
  const db = await getDB();
  
  // Count expired entries
  const now = new Date();
  const allEntries = await db.apiCache.toArray();
  const expired = allEntries.filter(e => new Date(e.expiresAt) < now);
  
  console.log(`Total cache entries: ${allEntries.length}`);
  console.log(`Expired entries: ${expired.length}`);
  
  if (expired.length > 0) {
    console.log('⚠️ Found expired entries. Cleanup should remove them.');
    console.log('Triggering cleanup...');
    
    // Import and trigger cleanup
    try {
      const { offlineService } = await import('/src/lib/offline/offlineService.ts');
      await offlineService.cleanupExpiredCache();
      console.log('✅ Cleanup triggered');
    } catch (error) {
      console.error('❌ Error triggering cleanup:', error);
    }
  } else {
    console.log('✅ No expired entries found');
  }
}

// Test 3: Check Pre-cache Status
async function testPreCacheStatus() {
  console.log('🧪 Testing Pre-cache Status...');
  
  const completed = localStorage.getItem('offline_precache_completed');
  const timestamp = localStorage.getItem('offline_precache_timestamp');
  const stats = localStorage.getItem('offline_precache_stats');
  
  console.log(`Pre-cache completed: ${completed === 'true' ? '✅ Yes' : '❌ No'}`);
  
  if (timestamp) {
    const date = new Date(timestamp);
    console.log(`Last pre-cache: ${date.toLocaleString()}`);
  }
  
  if (stats) {
    const statsObj = JSON.parse(stats);
    console.log(`Pre-cache stats:`, statsObj);
  }
  
  const db = await getDB();
  const cacheCount = await db.apiCache.count();
  console.log(`Total cached endpoints: ${cacheCount}`);
}

// Test 4: Check Organization Pages
async function testOrganizationPages() {
  console.log('🧪 Testing Organization Pages...');
  const db = await getDB();
  
  // Check for organization endpoints
  const orgEndpoints = await db.apiCache
    .where('endpoint')
    .startsWith('/super/tenants/all')
    .toArray();
  
  console.log(`Organization list endpoints: ${orgEndpoints.length}`);
  
  // Check for paginated endpoints
  const paginated = orgEndpoints.filter(e => e.endpoint.includes('page='));
  console.log(`Paginated organization endpoints: ${paginated.length}`);
  
  if (paginated.length > 0) {
    console.log('✅ Multiple pages of organizations are cached');
  } else {
    console.log('⚠️ No paginated organization endpoints found');
  }
}

// Test 5: Check Tenant Pages
async function testTenantPages() {
  console.log('🧪 Testing Tenant Pages...');
  const db = await getDB();
  
  // Get all tenant endpoints
  const tenantEndpoints = await db.apiCache
    .where('endpoint')
    .filter(e => e.endpoint.includes('/tenants/') && !e.endpoint.includes('/all'))
    .toArray();
  
  console.log(`Total tenant endpoints: ${tenantEndpoints.length}`);
  
  // Group by tenant ID
  const tenantMap = new Map();
  tenantEndpoints.forEach(e => {
    const match = e.endpoint.match(/\/tenants\/(\d+)/);
    if (match) {
      const tenantId = match[1];
      if (!tenantMap.has(tenantId)) {
        tenantMap.set(tenantId, []);
      }
      tenantMap.get(tenantId).push(e.endpoint);
    }
  });
  
  console.log(`Tenants with cached pages: ${tenantMap.size}`);
  
  // Check pagination for each tenant
  tenantMap.forEach((endpoints, tenantId) => {
    const paginated = endpoints.filter(e => e.includes('page='));
    console.log(`  Tenant ${tenantId}: ${endpoints.length} endpoints (${paginated.length} paginated)`);
  });
}

// Test 6: Check Sync Queue
async function testSyncQueue() {
  console.log('🧪 Testing Sync Queue...');
  const db = await getDB();
  
  const total = await db.syncQueue.count();
  const pending = await db.syncQueue.where('status').equals('pending').count();
  const syncing = await db.syncQueue.where('status').equals('syncing').count();
  const failed = await db.syncQueue.where('status').equals('failed').count();
  const completed = await db.syncQueue.where('status').equals('completed').count();
  
  console.log(`Total queued actions: ${total}`);
  console.log(`  Pending: ${pending}`);
  console.log(`  Syncing: ${syncing}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Completed: ${completed}`);
  
  if (pending > 0 || failed > 0) {
    console.log('⚠️ There are pending or failed sync actions');
  } else {
    console.log('✅ No pending or failed sync actions');
  }
}

// Test 7: Check Offline Indicator State
function testOfflineIndicator() {
  console.log('🧪 Testing Offline Indicator State...');
  
  const isOnline = navigator.onLine;
  console.log(`Online status: ${isOnline ? '✅ Online' : '❌ Offline'}`);
  
  // Check if indicator should be visible
  // (This is a simplified check - actual visibility depends on sync status)
  console.log('Note: Indicator visibility depends on sync status');
  console.log('  - Hidden when online with no pending actions');
  console.log('  - Visible when offline or has pending actions');
}

// Run All Tests
async function runAllTests() {
  console.log('🚀 Running All Offline Mode Tests...\n');
  
  await testPreCacheStatus();
  console.log('');
  
  await testCacheExpiration();
  console.log('');
  
  await testCacheCleanup();
  console.log('');
  
  await testOrganizationPages();
  console.log('');
  
  await testTenantPages();
  console.log('');
  
  await testSyncQueue();
  console.log('');
  
  testOfflineIndicator();
  console.log('');
  
  console.log('✅ All tests completed!');
}

// Export test functions for use
window.offlineModeTests = {
  testCacheExpiration,
  testCacheCleanup,
  testPreCacheStatus,
  testOrganizationPages,
  testTenantPages,
  testSyncQueue,
  testOfflineIndicator,
  runAllTests,
};

console.log('📋 Offline Mode Testing Script Loaded!');
console.log('Available functions:');
console.log('  - window.offlineModeTests.runAllTests() - Run all tests');
console.log('  - window.offlineModeTests.testCacheExpiration()');
console.log('  - window.offlineModeTests.testCacheCleanup()');
console.log('  - window.offlineModeTests.testPreCacheStatus()');
console.log('  - window.offlineModeTests.testOrganizationPages()');
console.log('  - window.offlineModeTests.testTenantPages()');
console.log('  - window.offlineModeTests.testSyncQueue()');
console.log('  - window.offlineModeTests.testOfflineIndicator()');



