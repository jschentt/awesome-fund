import { NextResponse } from 'next/server';

export async function GET() {
  // 基金列表数据
  const funds = [
    {
      code: '320007',
      name: '诺安成长混合',
      currentValue: '1.8560',
      accumulatedValue: '2.5110',
      dailyChange: '-0.0340',
      changePercent: '-1.80%',
      isMonitoring: true,
      updateTime: '2025-10-30',
      status: '打开',
    },
    {
      code: '163406',
      name: '兴全合润混合',
      currentValue: '2.1560',
      accumulatedValue: '5.0460',
      dailyChange: '-0.0120',
      changePercent: '-0.55%',
      isMonitoring: true,
      updateTime: '2025-10-30',
      status: '暂停',
    },
    {
      code: '110011',
      name: '易方达中小盘混合',
      currentValue: '5.6723',
      accumulatedValue: '6.3923',
      dailyChange: '-0.0231',
      changePercent: '-0.41%',
      isMonitoring: false,
      updateTime: '2025-10-30',
      status: '监控',
    },
    {
      code: '110022',
      name: '易方达消费行业股票',
      currentValue: '3.8420',
      accumulatedValue: '3.8420',
      dailyChange: '+0.0280',
      changePercent: '+0.73%',
      isMonitoring: false,
      updateTime: '2025-10-30',
      status: '监控',
    },
  ];

  return NextResponse.json(funds);
}