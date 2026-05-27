const fs = require('fs');

try {
  const content = fs.readFileSync('PRODUCTION_TODO.md', 'utf8');
  const checks = [
    '上线前必须完成',
    '配置生产环境 Secrets',
    '初始化用户体系',
    '完成基本部署验证',
    '强烈建议上线前完成',
    '建议的下一步执行顺序',
    '无 R2 模式'
  ];

  for (const item of checks) {
    if (!content.includes(item)) {
      throw new Error(`PRODUCTION_TODO 缺少关键章节: ${item}`);
    }
  }

  console.log('--- PRODUCTION_TODO 静态检查通过 ---');
} catch (error) {
  console.error('--- 测试失败 ---', error);
  process.exit(1);
}
