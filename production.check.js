// 生产化静态检查：确认关键生产文件已移除测试硬编码
const fs = require('fs');

const files = [
  'src/utils/auth.ts',
  'src/routes/memory.ts',
  'src/routes/search.ts',
  'src/routes/config.ts',
  'src/routes/files.ts'
];

const forbidden = [
  'test-token-123',
  'user-master-password',
  'test-salt-hex-1234',
  'direct_worker_upload_placeholder'
];

try {
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const bad of forbidden) {
      if (content.includes(bad)) {
        throw new Error(`${file} 仍包含测试占位: ${bad}`);
      }
    }
  }
  console.log('--- 生产化静态检查通过 ---');
} catch (error) {
  console.error('--- 测试失败 ---', error);
  process.exit(1);
}
