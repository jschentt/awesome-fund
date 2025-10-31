import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { initialFundsData, getCreateTableSQL } from '@/lib/db/migrations'

dotenv.config({ path: '.env.local' })

// 环境变量检查
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少必要的环境变量，请确保.env.local文件中包含 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 使用service_role密钥创建Supabase客户端
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  { auth: { persistSession: false } }
)

// 显示创建表的SQL语句和执行指南
function displayCreateTableInstructions() {
  const createTableSQL = getCreateTableSQL();
  
  console.log('\n🔧 表创建指南:');
  console.log('========================================');
  console.log('请按照以下步骤手动创建funds表:');
  console.log('1. 登录您的Supabase控制台');
  console.log('2. 导航到SQL编辑器');
  console.log('3. 复制并执行以下SQL语句:');
  console.log('----------------------------------------');
  console.log(createTableSQL);
  console.log('----------------------------------------');
  console.log('4. 执行后确认表已创建成功');
  console.log('5. 再次运行 pnpm db:init 来插入数据');
  console.log('========================================');
}

// 直接插入初始数据
async function insertInitialData() {
  console.log('\n开始插入初始基金数据...');
  let successCount = 0;
  let errorCount = 0;
  
  try {
    for (const fund of initialFundsData) {
      try {
        console.log(`尝试插入基金: ${fund.code} ${fund.name}`);
        
        // 使用supabase-js客户端插入数据
        const { error } = await supabase
          .from('funds')
          .insert([fund]);
        
        if (error) {
          if (error.message.includes('duplicate key')) {
            console.log(`ℹ️  基金 ${fund.code} ${fund.name} 已存在，跳过`);
          } else {
            console.error(`❌ 插入失败: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`✓ 基金 ${fund.code} ${fund.name} 插入成功`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ 处理基金 ${fund.code} 时发生异常:`, err instanceof Error ? err.message : String(err));
        errorCount++;
      }
    }
    
    return { success: successCount > 0 || errorCount === 0, successCount, totalCount: initialFundsData.length };
  } catch (error) {
    console.error('插入数据过程中发生错误:', error instanceof Error ? error.message : String(error));
    return { success: false, successCount: 0, totalCount: initialFundsData.length };
  }
}

// 检查数据库连接和表是否存在
async function checkDatabaseStatus() {
  try {
    console.log('检查数据库连接和表状态...');
    
    // 尝试简单查询表
    const { data, error } = await supabase.from('funds').select('id').limit(1);
    
    if (!error) {
      console.log('✓ 数据库连接正常，表存在且可访问');
      return { connected: true, tableExists: true, dataCount: data?.length || 0 };
    }
    
    if (error.message.includes('Could not find the table')) {
      console.log('⚠️  数据库连接正常，但表不存在');
      return { connected: true, tableExists: false, dataCount: 0 };
    }
    
    console.error(`⚠️  数据库查询错误: ${error.message}`);
    return { connected: true, tableExists: false, dataCount: 0 };
  } catch (error) {
    console.error('❌ 数据库连接失败:', error instanceof Error ? error.message : String(error));
    return { connected: false, tableExists: false, dataCount: 0 };
  }
}

async function initDatabase() {
  console.log('========================================');
  console.log('基金数据库初始化工具');
  console.log('========================================');
  
  // 1. 检查数据库状态
  const status = await checkDatabaseStatus();
  
  if (!status.connected) {
    console.error('\n❌ 无法连接到数据库，请检查环境变量和网络连接');
    return;
  }
  
  // 2. 如果表不存在，提供创建指南
  if (!status.tableExists) {
    displayCreateTableInstructions();
    return;
  }
  
  // 3. 如果表存在，尝试插入数据
  console.log('\n✓ 表已存在，开始数据初始化...');
  const dataResult = await insertInitialData();
  
  // 4. 总结结果
  console.log('\n========================================');
  if (dataResult.success) {
    console.log(`🎉 数据初始化完成！`);
    console.log(`- 成功插入: ${dataResult.successCount} 条`);
    console.log(`- 总计数据: ${dataResult.totalCount} 条`);
    console.log('\n✅ 数据库初始化成功！您可以运行 pnpm db:check 来验证数据');
  } else {
    console.log('⚠️  数据初始化遇到问题');
    console.log(`- 成功插入: ${dataResult.successCount} 条`);
    console.log(`- 失败: ${dataResult.totalCount - dataResult.successCount} 条`);
    console.log('\n建议手动在Supabase Dashboard中检查并完成数据插入');
  }
  console.log('========================================');
}

// 主函数执行
initDatabase().catch(error => {
  console.error('\n❌ 初始化过程中发生未捕获异常:', error);
  process.exit(1);
});