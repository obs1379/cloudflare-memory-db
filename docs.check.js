const fs = require('fs');

try {
  const readme = fs.readFileSync('README.md', 'utf8');
  const deploy = fs.readFileSync('DEPLOYMENT.md', 'utf8');

  const readmeChecks = [
    'Cloudflare Memory DB',
    'API 接口',
    '安全说明'
  ];

  const deployChecks = [
    '部署前准备',
    '修改 `wrangler.toml`',
    '部署 Worker',
    '生产化改造建议'
  ];

  for (const item of readmeChecks) {
    if (!readme.includes(item)) throw new Error(`README 缺少内容: ${item}`);
  }
  for (const item of deployChecks) {
    if (!deploy.includes(item)) throw new Error(`DEPLOYMENT 缺少内容: ${item}`);
  }

  console.log('--- 文档静态检查通过 ---');
} catch (error) {
  console.error('--- 测试失败 ---', error);
  process.exit(1);
}
