import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 从Supabase数据库获取基金数据
    const { data: funds, error } = await supabase
      .from('funds')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('获取基金数据失败:', error);
      return NextResponse.json(
        { error: '获取基金数据失败' },
        { status: 500 }
      );
    }

    // 转换数据格式以匹配前端期望的字段名
    const formattedFunds = funds.map(fund => ({
      code: fund.code,
      name: fund.name,
      currentValue: fund.current_value,
      accumulatedValue: fund.accumulated_value,
      dailyChange: fund.daily_change,
      changePercent: fund.change_percent,
      isMonitoring: fund.is_monitoring,
      updateTime: fund.update_time,
      status: fund.status,
    }));

    return NextResponse.json(formattedFunds);
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}