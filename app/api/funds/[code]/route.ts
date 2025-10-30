import { NextResponse } from 'next/server';

// 定义基金数据类型
interface FundPerformance {
  '1d': string;
  '1w': string;
  '1m': string;
  '3m': string;
  '6m': string;
  '1y': string;
  '3y': string;
  sinceEstablishment: string;
}

interface AssetAllocation {
  name: string;
  value: number;
}

interface StockItem {
  name: string;
  code: string;
  proportion: string;
  change: string;
}

interface ManagerInfo {
  name: string;
  education: string;
  experience: string;
  bio: string;
}

interface FundData {
  code: string;
  name: string;
  currentValue: string;
  accumulatedValue: string;
  dailyChange: string;
  changePercent: string;
  updateTime: string;
  status: string;
  manager: string;
  establishDate: string;
  scale: string;
  type: string;
  riskLevel: string;
  performance: FundPerformance;
  assetAllocation: AssetAllocation[];
  stockTop10: StockItem[];
  announcement: string;
  managerInfo: ManagerInfo;
  isFavorite: boolean;
  isMonitoring: boolean;
}

// 模拟基金数据
const mockFundData: Record<string, FundData> = {
  '320007': {
    code: '320007',
    name: '诺安成长混合',
    currentValue: '1.8560',
    accumulatedValue: '2.5110',
    dailyChange: '-0.0340',
    changePercent: '-1.80%',
    updateTime: '2025-10-30',
    status: '打开',
    manager: '蔡嵩松',
    establishDate: '2009-03-10',
    scale: '31.56亿',
    type: '混合型',
    riskLevel: '中高风险',
    performance: {
      '1d': '-1.80%',
      '1w': '+0.25%',
      '1m': '-2.30%',
      '3m': '+1.50%',
      '6m': '+3.20%',
      '1y': '+15.60%',
      '3y': '+25.30%',
      sinceEstablishment: '+151.10%',
    },
    assetAllocation: [
      { name: '股票', value: 85 },
      { name: '债券', value: 10 },
      { name: '现金', value: 5 },
    ],
    stockTop10: [
      { name: '中芯国际', code: '688981', proportion: '10.25%', change: '+2.10%' },
      { name: '北方华创', code: '002371', proportion: '9.85%', change: '+1.80%' },
      { name: '韦尔股份', code: '603501', proportion: '9.20%', change: '-0.50%' },
      { name: '闻泰科技', code: '600745', proportion: '8.75%', change: '+0.30%' },
      { name: '三安光电', code: '600703', proportion: '8.10%', change: '-1.20%' },
      { name: '汇顶科技', code: '603160', proportion: '7.90%', change: '+1.50%' },
      { name: '兆易创新', code: '603986', proportion: '7.50%', change: '-0.80%' },
      { name: '长电科技', code: '600584', proportion: '7.20%', change: '+0.60%' },
      { name: '通富微电', code: '002156', proportion: '6.80%', change: '-1.00%' },
      { name: '紫光国微', code: '002049', proportion: '6.50%', change: '+2.30%' },
    ],
    announcement: '本基金将于2025年11月15日发放分红，每10份派发0.5元。',
    managerInfo: {
      name: '蔡嵩松',
      education: '中国科学技术大学博士',
      experience: '8年证券从业经验',
      bio: '专注于科技领域投资，尤其在半导体行业有深入研究。',
    },
    isFavorite: false,
    isMonitoring: true,
  },
  '163406': {
    code: '163406',
    name: '兴全合润混合',
    currentValue: '2.1560',
    accumulatedValue: '5.0460',
    dailyChange: '-0.0120',
    changePercent: '-0.55%',
    updateTime: '2025-10-30',
    status: '暂停',
    manager: '谢治宇',
    establishDate: '2010-04-22',
    scale: '276.32亿',
    type: '混合型',
    riskLevel: '中风险',
    performance: {
      '1d': '-0.55%',
      '1w': '+1.20%',
      '1m': '+3.50%',
      '3m': '+5.20%',
      '6m': '+8.30%',
      '1y': '+22.50%',
      '3y': '+45.20%',
      sinceEstablishment: '+404.60%',
    },
    assetAllocation: [
      { name: '股票', value: 75 },
      { name: '债券', value: 20 },
      { name: '现金', value: 5 },
    ],
    stockTop10: [
      { name: '贵州茅台', code: '600519', proportion: '7.80%', change: '-0.20%' },
      { name: '腾讯控股', code: '00700', proportion: '7.20%', change: '+1.50%' },
      { name: '宁德时代', code: '300750', proportion: '6.80%', change: '+0.80%' },
      { name: '美团-W', code: '03690', proportion: '6.50%', change: '-0.50%' },
      { name: '药明康德', code: '603259', proportion: '6.20%', change: '+2.10%' },
      { name: '隆基绿能', code: '601012', proportion: '5.80%', change: '-1.20%' },
      { name: '五粮液', code: '000858', proportion: '5.50%', change: '+0.30%' },
      { name: '阿里巴巴-SW', code: '09988', proportion: '5.20%', change: '+1.80%' },
      { name: '中国平安', code: '601318', proportion: '4.90%', change: '-0.80%' },
      { name: '海康威视', code: '002415', proportion: '4.60%', change: '+0.60%' },
    ],
    announcement: '基金经理将于2025年11月20日举办线上交流会。',
    managerInfo: {
      name: '谢治宇',
      education: '复旦大学硕士',
      experience: '12年证券从业经验',
      bio: '价值投资风格，注重企业长期竞争力和成长性。',
    },
    isFavorite: true,
    isMonitoring: true,
  },
  '110011': {
    code: '110011',
    name: '易方达中小盘混合',
    currentValue: '5.6723',
    accumulatedValue: '6.3923',
    dailyChange: '-0.0231',
    changePercent: '-0.41%',
    updateTime: '2025-10-30',
    status: '监控',
    manager: '张坤',
    establishDate: '2008-06-19',
    scale: '231.56亿',
    type: '混合型',
    riskLevel: '中风险',
    performance: {
      '1d': '-0.41%',
      '1w': '+0.85%',
      '1m': '+1.20%',
      '3m': '+4.50%',
      '6m': '+7.80%',
      '1y': '+18.90%',
      '3y': '+35.20%',
      sinceEstablishment: '+539.23%',
    },
    assetAllocation: [
      { name: '股票', value: 80 },
      { name: '债券', value: 15 },
      { name: '现金', value: 5 },
    ],
    stockTop10: [
      { name: '贵州茅台', code: '600519', proportion: '8.20%', change: '-0.20%' },
      { name: '五粮液', code: '000858', proportion: '7.50%', change: '+0.30%' },
      { name: '泸州老窖', code: '000568', proportion: '6.80%', change: '-0.50%' },
      { name: '洋河股份', code: '002304', proportion: '6.20%', change: '+1.20%' },
      { name: '伊利股份', code: '600887', proportion: '5.80%', change: '+0.80%' },
      { name: '贵州茅台', code: '600519', proportion: '5.50%', change: '-0.20%' },
      { name: '美的集团', code: '000333', proportion: '5.20%', change: '+0.50%' },
      { name: '格力电器', code: '000651', proportion: '4.90%', change: '-0.80%' },
      { name: '中国中免', code: '601888', proportion: '4.60%', change: '+1.50%' },
      { name: '山西汾酒', code: '600809', proportion: '4.20%', change: '+0.70%' },
    ],
    announcement: '本基金将于2025年12月1日起暂停大额申购。',
    managerInfo: {
      name: '张坤',
      education: '清华大学硕士',
      experience: '11年证券从业经验',
      bio: '价值投资理念，长期持有优质企业，专注消费领域。',
    },
    isFavorite: false,
    isMonitoring: false,
  },
  '110022': {
    code: '110022',
    name: '易方达消费行业股票',
    currentValue: '3.8420',
    accumulatedValue: '3.8420',
    dailyChange: '+0.0280',
    changePercent: '+0.73%',
    updateTime: '2025-10-30',
    status: '监控',
    manager: '萧楠',
    establishDate: '2012-09-28',
    scale: '185.32亿',
    type: '股票型',
    riskLevel: '高风险',
    performance: {
      '1d': '+0.73%',
      '1w': '+1.50%',
      '1m': '+2.80%',
      '3m': '+6.20%',
      '6m': '+10.50%',
      '1y': '+25.80%',
      '3y': '+42.30%',
      sinceEstablishment: '+284.20%',
    },
    assetAllocation: [
      { name: '股票', value: 95 },
      { name: '债券', value: 3 },
      { name: '现金', value: 2 },
    ],
    stockTop10: [
      { name: '贵州茅台', code: '600519', proportion: '9.50%', change: '-0.20%' },
      { name: '五粮液', code: '000858', proportion: '8.80%', change: '+0.30%' },
      { name: '泸州老窖', code: '000568', proportion: '7.50%', change: '-0.50%' },
      { name: '洋河股份', code: '002304', proportion: '6.80%', change: '+1.20%' },
      { name: '伊利股份', code: '600887', proportion: '6.20%', change: '+0.80%' },
      { name: '中国中免', code: '601888', proportion: '5.80%', change: '+1.50%' },
      { name: '山西汾酒', code: '600809', proportion: '5.50%', change: '+0.70%' },
      { name: '美的集团', code: '000333', proportion: '5.20%', change: '+0.50%' },
      { name: '格力电器', code: '000651', proportion: '4.80%', change: '-0.80%' },
      { name: '青岛啤酒', code: '600600', proportion: '4.50%', change: '+1.00%' },
    ],
    announcement: '基金经理将在2025年11月10日发布季度投资策略报告。',
    managerInfo: {
      name: '萧楠',
      education: '清华大学硕士',
      experience: '10年证券从业经验',
      bio: '专注消费行业投资，深入研究消费升级趋势。',
    },
    isFavorite: true,
    isMonitoring: false,
  },
};

export async function GET(request: Request, { params }: { params: { code: string } }) {
  const { code } = params;
  const fundData = mockFundData[code];

  if (!fundData) {
    return NextResponse.json({ error: '基金不存在' }, { status: 404 });
  }

  return NextResponse.json(fundData);
}