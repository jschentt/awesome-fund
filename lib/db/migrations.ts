// 数据库迁移脚本
import { supabase } from '../supabase';

// 初始数据
export const initialFundsData = [
  {
    code: '320007',
    name: '诺安成长混合',
    current_value: '1.8560',
    accumulated_value: '2.5110',
    daily_change: '-0.0340',
    change_percent: '-1.80%',
    is_monitoring: true,
    update_time: '2025-10-30',
    status: '打开',
  },
  {
    code: '163406',
    name: '兴全合润混合',
    current_value: '2.1560',
    accumulated_value: '5.0460',
    daily_change: '-0.0120',
    change_percent: '-0.55%',
    is_monitoring: true,
    update_time: '2025-10-30',
    status: '暂停',
  },
  {
    code: '110011',
    name: '易方达中小盘混合',
    current_value: '5.6723',
    accumulated_value: '6.3923',
    daily_change: '-0.0231',
    change_percent: '-0.41%',
    is_monitoring: false,
    update_time: '2025-10-30',
    status: '监控',
  },
  {
    code: '110022',
    name: '易方达消费行业股票',
    current_value: '3.8420',
    accumulated_value: '3.8420',
    daily_change: '+0.0280',
    change_percent: '+0.73%',
    is_monitoring: false,
    update_time: '2025-10-30',
    status: '监控',
  },
];

// 注意：由于Supabase客户端不直接支持创建表（需要使用SQL编辑器），
// 这里我们假设表已经通过SQL编辑器创建好了，只负责插入数据

// 插入初始数据
export async function migrateDatabase() {
  try {
    console.log('开始数据库迁移...');
    
    // 检查表是否存在
    const { data: tableExists, error: existsError } = await supabase
      .from('funds')
      .select('id')
      .limit(1);
      
    if (existsError) {
      console.error('检查表是否存在时出错:', existsError);
      return { 
        success: false, 
        error: '基金表可能不存在，请先在Supabase Dashboard创建表。错误信息：' + existsError.message 
      };
    }
    
    console.log('基金表已存在，可以插入数据');
    
    // 插入初始数据
    for (const fund of initialFundsData) {
      const { error } = await supabase
        .from('funds')
        .insert([fund])
        .onConflict('code')
        .ignore();
      
      if (error) {
        console.error(`插入基金 ${fund.code} 时出错:`, error);
      } else {
        console.log(`基金 ${fund.code} 插入成功`);
      }
    }
    
    console.log('数据库迁移完成');
    return { success: true };
  } catch (error) {
    console.error('数据库迁移失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    };
  }
}

// 提供创建表的SQL语句，需要在Supabase Dashboard执行
export const getCreateTableSQL = () => {
  return `
CREATE TABLE IF NOT EXISTS funds (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  current_value VARCHAR(20) NOT NULL,
  accumulated_value VARCHAR(20) NOT NULL,
  daily_change VARCHAR(20) NOT NULL,
  change_percent VARCHAR(20) NOT NULL,
  is_monitoring BOOLEAN DEFAULT false,
  update_time DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funds_code ON funds(code);
CREATE INDEX IF NOT EXISTS idx_funds_is_monitoring ON funds(is_monitoring);
  `;
};