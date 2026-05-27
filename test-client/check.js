// 纯静态检查：验证 HTML 页面包含关键联调入口
const fs = require('fs');

try {
  const html = fs.readFileSync('test-client/index.html', 'utf8');

  const checks = [
    '调用 POST /memory',
    '调用 GET /memory/search',
    '调用 GET /sync',
    'function createMemory()',
    'function searchMemory()',
    'function syncData()'
  ];

  for (const item of checks) {
    if (!html.includes(item)) {
      throw new Error(`缺少关键内容: ${item}`);
    }
  }

  console.log('--- API 联调页静态检查通过 ---');
} catch (error) {
  console.error('--- 测试失败 ---', error);
  process.exit(1);
}
