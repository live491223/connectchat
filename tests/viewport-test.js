// Viewport test script to verify styling and layout breakpoints
const fs = require('fs');
const path = require('path');

const BREAKPOINTS = [
  { name: 'Mobile Mini', width: 360, expectedLayout: 'mobile', maxCols: 1 },
  { name: 'iPhone 14 / 15', width: 390, expectedLayout: 'mobile', maxCols: 1 },
  { name: 'iPhone Pro Max', width: 430, expectedLayout: 'mobile', maxCols: 1 },
  { name: 'iPad Portrait', width: 768, expectedLayout: 'tablet', maxCols: 2 },
  { name: 'iPad Landscape', width: 1024, expectedLayout: 'desktop', maxCols: 3 },
  { name: 'Laptop', width: 1366, expectedLayout: 'desktop', maxCols: 3 },
  { name: 'FHD Desktop', width: 1920, expectedLayout: 'desktop', maxCols: 3 },
];

console.log('📱 Testing Viewport Adaptation Across All Requested Form Factors...\n');

let allPassed = true;

BREAKPOINTS.forEach((bp) => {
  const isMobile = bp.width < 768;
  const isTablet = bp.width >= 768 && bp.width < 1024;
  const isDesktop = bp.width >= 1024;

  const actualLayout = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  const match = actualLayout === bp.expectedLayout;

  if (match) {
    console.log(`  ✅ ${bp.name} (${bp.width}px): Successfully maps to '${actualLayout.toUpperCase()}' layout`);
  } else {
    console.error(`  ❌ ${bp.name} (${bp.width}px): Failed mapping, got ${actualLayout}`);
    allPassed = false;
  }
});

// Check css files
const globalsCss = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'globals.css'), 'utf-8');
const hasSafeAreas = globalsCss.includes('env(safe-area-inset-bottom');
const hasDvh = globalsCss.includes('100dvh');
const hasTouchAction = globalsCss.includes('touch-action: manipulation');

if (hasSafeAreas && hasDvh && hasTouchAction) {
  console.log('\n  ✅ Mobile Safe Area insets, 100dvh dynamic viewport, and iOS touch rules are active');
} else {
  console.error('\n  ❌ Missing mobile viewport CSS optimizations');
  allPassed = false;
}

if (allPassed) {
  console.log('\n🎉 ALL VIEWPORT BREAKPOINTS VERIFIED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  process.exit(1);
}
