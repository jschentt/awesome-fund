import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

// 环境变量检查
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少必要的环境变量，请确保.env.local文件中包含 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  { auth: { persistSession: false } }
)

// 格式化输出函数
function printHeader(title: string) {
  console.log('========================================');
  console.log(title);
  console.log('========================================');
}

function printDivider() {
  console.log('----------------------------------------');
}

async function checkDatabase() {
  printHeader('基金数据库验证工具');
  
  try {
    // 1. 检查数据库连接和表存在性
    console.log('\n🔍 检查数据库连接和表状态...');
    const { data, error } = await supabase.from('funds').select('*').limit(1);
    
    if (error) {
      if (error.message.includes('Could not find the table')) {
        console.error('❌ 错误: funds表不存在');
        console.log('\n请按照以下步骤操作:');
        console.log('1. 运行 pnpm db:init 查看创建表的SQL语句');
        console.log('2. 在Supabase Dashboard中执行SQL创建表');
        console.log('3. 再次运行 pnpm db:init 插入初始数据');
        process.exit(1);
      }
      
      console.error('❌ 数据库查询错误:', error.message);
      if (error.message.includes('permission denied')) {
        console.log('💡 提示: 请确保您的Supabase密钥具有足够的权限');
      }
      process.exit(1);
    }
    
    console.log('✅ 表存在并且可以正常访问');
    
    // 2. 获取数据统计信息
    printHeader('📊 数据统计');
    
    // 总记录数
    const { count: totalCount } = await supabase.from('funds').select('*', { count: 'exact' });
    console.log(`总基金数量: ${totalCount || 0}`);
    
    if (totalCount === 0) {
      console.log('\n⚠️  数据库中没有数据');
      console.log('请运行 pnpm db:init 插入初始数据');
      process.exit(0);
    }
    
    // 监控状态统计 - 使用单独查询替代group方法
    try {
      // 查询监控中的基金数量
      const { count: monitoringCount } = await supabase
        .from('funds')
        .select('*', { count: 'exact' })
        .eq('is_monitoring', true);
      
      console.log(`监控中的基金: ${monitoringCount || 0}`);
      console.log(`未监控的基金: ${(totalCount || 0) - (monitoringCount || 0)}`);
    } catch (statError) {
      console.log(`监控状态统计出错: ${statError.message}`);
      console.log(`总基金数量: ${totalCount || 0}`);
    }
    
    // 3. 显示数据示例
    printHeader('📋 数据示例 (前3条)');
    const { data: sampleData } = await supabase.from('funds').select('*').limit(3);
    
    if (sampleData && sampleData.length > 0) {
      sampleData.forEach((fund: any, index: number) => {
        console.log(`\n基金 #${index + 1}:`);
        console.log(`  代码: ${fund.code}`);
        console.log(`  名称: ${fund.name}`);
        console.log(`  净值: ${fund.current_value}`);
        console.log(`  累计: ${fund.accumulated_value}`);
        console.log(`  涨跌幅: ${fund.daily_change} (${fund.change_percent})`);
        console.log(`  监控: ${fund.is_monitoring ? '✅ 是' : '❌ 否'}`);
        console.log(`  更新: ${fund.update_time}`);
        console.log(`  状态: ${fund.status}`);
      });
    }
    
    // 4. 表结构验证
    printHeader('🔧 表结构验证');
    
    const requiredFields = [
      'id', 'code', 'name', 'current_value', 'accumulated_value',
      'daily_change', 'change_percent', 'is_monitoring', 'update_time', 'status'
    ];
    
    let structureValid = true;
    
    if (sampleData && sampleData.length > 0) {
      const firstRecord = sampleData[0];
      
      requiredFields.forEach(field => {
        if (!(field in firstRecord)) {
          console.error(`❌ 缺失字段: ${field}`);
          structureValid = false;
        }
      });
      
      if (structureValid) {
        console.log('✅ 表结构完整，所有必要字段都存在');
      } else {
        console.log('⚠️  表结构不完整，请检查字段定义');
      }
    }
    
    // 5. 总结
    printHeader('📝 验证总结');
    
    if (structureValid && totalCount && totalCount > 0) {
      console.log('🎉 数据库验证成功！');
      console.log(`\n✅ 表存在且结构正确`);
      console.log(`✅ 数据正常 (${totalCount} 条记录)`);
      console.log('\n您可以通过以下方式进一步验证:');
      console.log('1. 访问 http://localhost:3000/api/funds 测试API接口');
      console.log('2. 在Supabase Dashboard中直接查看数据');
    } else {
      console.log('⚠️  数据库验证完成，但有需要注意的事项');
      if (!structureValid) {
        console.log('- 表结构可能不完整');
      }
    }
    
  } catch (error: any) {
    console.error('\n❌ 验证过程中发生错误:', error.message);
    console.log('\n请检查:');
    console.log('1. 环境变量是否正确设置');
    console.log('2. Supabase服务是否可访问');
    console.log('3. 数据库凭证是否有效');
    process.exit(1);
  }
}

// 执行检查
checkDatabase();