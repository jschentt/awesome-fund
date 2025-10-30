'use client';

import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    BarChart3,
    PieChart,
    TrendingUp,
    Info,
    Calendar,
    Users,
    AlertCircle,
    ChevronDown,
    Star,
    StarOff,
    Share2,
    BookmarkPlus,
    BookmarkCheck,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// 定义基金数据类型接口
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
            '1m': '+2.10%',
            '3m': '+4.80%',
            '6m': '+7.50%',
            '1y': '+18.20%',
            '3y': '+38.60%',
            sinceEstablishment: '+539.23%',
        },
        assetAllocation: [
            { name: '股票', value: 80 },
            { name: '债券', value: 15 },
            { name: '现金', value: 5 },
        ],

        stockTop10: [
            { name: '贵州茅台', code: '600519', proportion: '9.20%', change: '-0.20%' },
            { name: '五粮液', code: '000858', proportion: '8.50%', change: '+0.30%' },
            { name: '泸州老窖', code: '000568', proportion: '7.80%', change: '-0.50%' },
            { name: '洋河股份', code: '002304', proportion: '7.20%', change: '+0.80%' },
            { name: '古井贡酒', code: '000596', proportion: '6.80%', change: '+1.20%' },
            { name: '山西汾酒', code: '600809', proportion: '6.50%', change: '-0.30%' },
            { name: '片仔癀', code: '600436', proportion: '6.20%', change: '+2.50%' },
            { name: '云南白药', code: '000538', proportion: '5.80%', change: '-1.20%' },
            { name: '同仁堂', code: '600085', proportion: '5.50%', change: '+0.60%' },
            { name: '药明康德', code: '603259', proportion: '5.20%', change: '+2.10%' },
        ],

        announcement: '本基金第三季度报告将于2025年10月31日公布。',
        managerInfo: {
            name: '张坤',
            education: '清华大学硕士',
            experience: '11年证券从业经验',
            bio: '价值投资理念，长期持有优质企业，注重企业护城河和成长性。',
        },
        isFavorite: false,
        isMonitoring: false,
    },
};

export default function FundDetailPage() {
    const params = useParams();
    const router = useRouter();
    const fundCode = params.code as string;
    const [fund, setFund] = useState<FundData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'performance' | 'portfolio' | 'manager' | 'overview'>('performance');

    useEffect(() => {
        // 模拟API请求延迟
        const timer = setTimeout(() => {
            // 使用类型断言确保安全访问
            const fundData = mockFundData[fundCode as keyof typeof mockFundData];
            if (fundData) {
                setFund(fundData);
            }
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [fundCode]);

    const handleBack = () => {
        router.back();
    };

    const toggleFavorite = () => {
        if (fund) {
            // 确保fund不为null时的安全更新
            setFund(prevFund => prevFund ? { ...prevFund, isFavorite: !prevFund.isFavorite } : null);
        }
    };

    const toggleMonitoring = () => {
        if (fund) {
            // 确保fund不为null时的安全更新
            setFund(prevFund => prevFund ? { ...prevFund, isMonitoring: !prevFund.isMonitoring } : null);
        }
    };

    if (loading) {
        return (
            <div
                className="min-h-screen bg-gray-50 flex items-center justify-center"
                data-oid="pvnx9mf"
            >
                <div
                    className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
                    data-oid="ald_32:"
                ></div>
            </div>
        );
    }

    if (!fund) {
        return (
            <div
                className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4"
                data-oid="ego2kyc"
            >
                <AlertCircle className="w-12 h-12 text-gray-400 mb-4" data-oid="-nrrtiz" />
                <h2 className="text-xl font-medium text-gray-900 mb-2" data-oid="9bop0dy">
                    基金不存在
                </h2>
                <p className="text-gray-500 mb-6" data-oid="_96i9vx">
                    无法找到代码为 {fundCode} 的基金信息
                </p>
                <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    data-oid="6s7lhps"
                >
                    返回列表
                </button>
            </div>
        );
    }

    const isPositiveChange = fund.changePercent.startsWith('+');
    const isNegativeChange = fund.changePercent.startsWith('-');

    return (
        <div className="min-h-screen bg-gray-50" data-oid=".uayg5r">
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 border-b border-gray-200" data-oid="x:lrs72">
                <div
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center"
                    data-oid="ec_b6lj"
                >
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        data-oid="88957w5"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-700" data-oid="elyvmyh" />
                    </button>
                    <div className="ml-4 flex-1" data-oid="jy0y1sd">
                        <h1
                            className="text-lg font-medium text-gray-900 truncate"
                            data-oid="a:zg4sn"
                        >
                            {fund.name}
                        </h1>
                        <p className="text-sm text-gray-500" data-oid="50ld4.f">
                            {fund.code}
                        </p>
                    </div>
                    <div className="flex space-x-2" data-oid="hnj79_3">
                        <button
                            onClick={toggleFavorite}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label={fund.isFavorite ? '取消收藏' : '收藏'}
                            data-oid="mrso48i"
                        >
                            {fund.isFavorite ? (
                                <Star
                                    className="h-5 w-5 text-yellow-400 fill-yellow-400"
                                    data-oid="i:ri8i3"
                                />
                            ) : (
                                <StarOff className="h-5 w-5 text-gray-400" data-oid="tk6t3gh" />
                            )}
                        </button>
                        <button
                            onClick={toggleMonitoring}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label={fund.isMonitoring ? '取消监控' : '监控'}
                            data-oid="7yn78n6"
                        >
                            {fund.isMonitoring ? (
                                <BookmarkCheck
                                    className="h-5 w-5 text-blue-500 fill-blue-500"
                                    data-oid="j_jrf06"
                                />
                            ) : (
                                <BookmarkPlus
                                    className="h-5 w-5 text-gray-400"
                                    data-oid="2knuk6e"
                                />
                            )}
                        </button>
                        <button
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="分享"
                            data-oid="o1j:-.."
                        >
                            <Share2 className="h-5 w-5 text-gray-400" data-oid="a_p8c0f" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-oid="ps568z9">
                {/* 基金净值信息 */}
                <section className="bg-white rounded-xl shadow-sm p-6 mb-6" data-oid="s3flg_9">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-oid="y69vqfn">
                        <div data-oid="xzfx45a">
                            <h2 className="text-sm text-gray-500 mb-1" data-oid="kx2wbeu">
                                最新净值
                            </h2>
                            <div className="flex items-baseline" data-oid="xjfr.nw">
                                <span
                                    className="text-3xl font-bold text-gray-900 mr-2"
                                    data-oid="wfhwwju"
                                >
                                    {fund.currentValue}
                                </span>
                                <span
                                    className={`text-lg font-medium ${isPositiveChange ? 'text-green-600' : isNegativeChange ? 'text-red-600' : 'text-gray-600'}`}
                                    data-oid=".vs3k3f"
                                >
                                    {fund.changePercent}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1" data-oid="6xj5ou1">
                                更新时间: {fund.updateTime}
                            </p>
                        </div>
                        <div data-oid="61ptcz5">
                            <h2 className="text-sm text-gray-500 mb-1" data-oid="sa.dx:7">
                                累计净值
                            </h2>
                            <div className="flex items-baseline" data-oid="a3k:qaq">
                                <span
                                    className="text-3xl font-bold text-gray-900 mr-2"
                                    data-oid="a3usqf3"
                                >
                                    {fund.accumulatedValue}
                                </span>
                                <span
                                    className={`text-lg font-medium ${isPositiveChange ? 'text-green-600' : isNegativeChange ? 'text-red-600' : 'text-gray-600'}`}
                                    data-oid="ievsf8w"
                                >
                                    {fund.dailyChange}
                                </span>
                            </div>
                            <div className="mt-2" data-oid="xrg8oxf">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fund.status === '打开' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                                    data-oid="szxttgy"
                                >
                                    {fund.status}
                                </span>
                                <span
                                    className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    data-oid="0y5mqky"
                                >
                                    {fund.riskLevel}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm mb-6" data-oid="u9jzcz2">
                    <div className="flex border-b border-gray-200" data-oid="if:u93x">
                        <button
                            onClick={() => setActiveTab('performance')}
                            className={`flex-1 py-4 px-4 text-sm font-medium ${activeTab === 'performance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            data-oid="0e6__8z"
                        >
                            业绩表现
                        </button>
                        <button
                            onClick={() => setActiveTab('portfolio')}
                            className={`flex-1 py-4 px-4 text-sm font-medium ${activeTab === 'portfolio' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            data-oid=":v3esak"
                        >
                            投资组合
                        </button>
                        <button
                            onClick={() => setActiveTab('manager')}
                            className={`flex-1 py-4 px-4 text-sm font-medium ${activeTab === 'manager' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            data-oid="p3.lgvf"
                        >
                            基金经理
                        </button>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 py-4 px-4 text-sm font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            data-oid="4.wul:9"
                        >
                            基金概况
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6" data-oid="s3v3_2h">
                        {activeTab === 'performance' && (
                            <div data-oid="2y_mzwh">
                                <h3
                                    className="text-lg font-medium text-gray-900 mb-4"
                                    data-oid="dnoje-o"
                                >
                                    业绩走势图
                                </h3>
                                <div
                                    className="h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-6"
                                    data-oid="8bfn-ro"
                                >
                                    <BarChart3
                                        className="h-12 w-12 text-gray-400"
                                        data-oid="em.zghz"
                                    />
                                </div>

                                <h3
                                    className="text-lg font-medium text-gray-900 mb-4"
                                    data-oid="__vo155"
                                >
                                    业绩数据
                                </h3>
                                <div
                                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                                    data-oid="zygvpjc"
                                >
                                    {Object.entries(fund.performance).map(([period, value]) => (
                                        <div
                                            key={period}
                                            className="bg-gray-50 p-4 rounded-lg"
                                            data-oid="f9k1cs3"
                                        >
                                            <p className="text-sm text-gray-500" data-oid="1obmlxd">
                                                {period === '1d' && '日涨幅'}
                                                {period === '1w' && '周涨幅'}
                                                {period === '1m' && '月涨幅'}
                                                {period === '3m' && '季涨幅'}
                                                {period === '6m' && '半年涨幅'}
                                                {period === '1y' && '年涨幅'}
                                                {period === '3y' && '3年涨幅'}
                                                {period === 'sinceEstablishment' && '成立以来'}
                                            </p>
                                            <p
                                                className={`text-xl font-semibold mt-1 ${value.startsWith('+') ? 'text-green-600' : value.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}
                                                data-oid="7cb.f0d"
                                            >
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'portfolio' && (
                            <div data-oid="zd58y-c">
                                <h3
                                    className="text-lg font-medium text-gray-900 mb-4"
                                    data-oid="5wdeibf"
                                >
                                    资产配置
                                </h3>
                                <div
                                    className="h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-6"
                                    data-oid="ojnt3jn"
                                >
                                    <PieChart
                                        className="h-12 w-12 text-gray-400"
                                        data-oid="tbane53"
                                    />
                                </div>

                                <h3
                                    className="text-lg font-medium text-gray-900 mb-4"
                                    data-oid=":8dsq70"
                                >
                                    前十大重仓股
                                </h3>
                                <div className="overflow-x-auto" data-oid="0_qug-c">
                                    <table
                                        className="min-w-full divide-y divide-gray-200"
                                        data-oid="tq7w_1a"
                                    >
                                        <thead data-oid="a1h3jc:">
                                            <tr data-oid="li107dx">
                                                <th
                                                    className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    data-oid="3b4g94a"
                                                >
                                                    股票名称
                                                </th>
                                                <th
                                                    className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    data-oid="pl8_vq0"
                                                >
                                                    股票代码
                                                </th>
                                                <th
                                                    className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    data-oid="g3pns8y"
                                                >
                                                    占比
                                                </th>
                                                <th
                                                    className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    data-oid="mupuviy"
                                                >
                                                    日涨跌幅
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody
                                            className="bg-white divide-y divide-gray-200"
                                            data-oid="bpsqy37"
                                        >
                                            {fund.stockTop10.map((stock, index) => (
                                                <tr key={index} data-oid="y.oazl7">
                                                    <td
                                                        className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900"
                                                        data-oid="dctwqn6"
                                                    >
                                                        {stock.name}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 whitespace-nowrap text-sm text-gray-500"
                                                        data-oid="r0cajur"
                                                    >
                                                        {stock.code}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 whitespace-nowrap text-sm text-gray-500"
                                                        data-oid="x3ptk.0"
                                                    >
                                                        {stock.proportion}
                                                    </td>
                                                    <td
                                                        className={`px-4 py-3 whitespace-nowrap text-sm ${stock.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}
                                                        data-oid="8fd1vtb"
                                                    >
                                                        {stock.change}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'manager' && (
                            <div data-oid="74-rrim">
                                <div className="flex items-start" data-oid="ik.6kks">
                                    <div
                                        className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mr-4"
                                        data-oid="cyjr:id"
                                    >
                                        <Users
                                            className="h-8 w-8 text-gray-400"
                                            data-oid="qfvk3fg"
                                        />
                                    </div>
                                    <div data-oid="nwn9-to">
                                        <h3
                                            className="text-xl font-semibold text-gray-900"
                                            data-oid="jt-w2hl"
                                        >
                                            {fund.managerInfo.name}
                                        </h3>
                                        <p
                                            className="text-sm text-gray-500 mt-1"
                                            data-oid="n0g_59f"
                                        >
                                            {fund.managerInfo.education}
                                        </p>
                                        <p className="text-sm text-gray-500" data-oid="ryo4s5y">
                                            {fund.managerInfo.experience}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6" data-oid="dz0cz_n">
                                    <h4
                                        className="text-lg font-medium text-gray-900 mb-2"
                                        data-oid="2brxntm"
                                    >
                                        个人简介
                                    </h4>
                                    <p className="text-gray-700" data-oid="f5gs37-">
                                        {fund.managerInfo.bio}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'overview' && (
                            <div data-oid="ngd-w6s">
                                <div className="space-y-4" data-oid="17-m:6d">
                                    <div data-oid="b0yzm_j">
                                        <p className="text-sm text-gray-500" data-oid="ixo61s_">
                                            基金全称
                                        </p>
                                        <p className="text-gray-900 font-medium" data-oid="lfzco9s">
                                            {fund.name}
                                        </p>
                                    </div>
                                    <div data-oid="no2vm0k">
                                        <p className="text-sm text-gray-500" data-oid="mkz3.jl">
                                            基金代码
                                        </p>
                                        <p className="text-gray-900 font-medium" data-oid="18fzdj.">
                                            {fund.code}
                                        </p>
                                    </div>
                                    <div data-oid="yyb-5gx">
                                        <p className="text-sm text-gray-500" data-oid="t7pozv6">
                                            基金类型
                                        </p>
                                        <p className="text-gray-900 font-medium" data-oid="rmohhs8">
                                            {fund.type}
                                        </p>
                                    </div>
                                    <div data-oid="rus:9vc">
                                        <p className="text-sm text-gray-500" data-oid="bij_bqe">
                                            成立日期
                                        </p>
                                        <p className="text-gray-900 font-medium" data-oid="-qtqxbc">
                                            {fund.establishDate}
                                        </p>
                                    </div>
                                    <div data-oid="z._sb79">
                                        <p className="text-sm text-gray-500" data-oid="d3cxpq.">
                                            基金规模
                                        </p>
                                        <p className="text-gray-900 font-medium" data-oid="xqpp-1y">
                                            {fund.scale}
                                        </p>
                                    </div>
                                    <div data-oid=".26_r:n">
                                        <p className="text-sm text-gray-500" data-oid=".3ob_ms">
                                            风险等级
                                        </p>
                                        <p className="text-gray-900 font-medium" data-oid="av-j.1f">
                                            {fund.riskLevel}
                                        </p>
                                    </div>
                                    <div data-oid=".j77wmp">
                                        <p className="text-sm text-gray-500" data-oid="r952q4h">
                                            基金经理
                                        </p>
                                        <p className="text-gray-900 font-medium" data-oid="7g_dzr4">
                                            {fund.manager}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 公告信息 */}
                <section className="bg-white rounded-xl shadow-sm p-6 mb-6" data-oid="kxf1a14">
                    <div className="flex items-start" data-oid="2s82syr">
                        <AlertCircle
                            className="h-5 w-5 text-blue-500 mr-2 mt-0.5"
                            data-oid="0eo59qf"
                        />
                        <div data-oid="avxxp45">
                            <h3 className="text-base font-medium text-gray-900" data-oid="7i2fn0j">
                                基金公告
                            </h3>
                            <p className="text-gray-700 mt-1" data-oid="-2md-u.">
                                {fund.announcement}
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Bottom Action Bar */}
            <div
                className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4"
                data-oid=":gjaiji"
            >
                <div
                    className="max-w-7xl mx-auto flex justify-between items-center"
                    data-oid="l:dyx_4"
                >
                    <div className="text-center" data-oid="8-gta6o">
                        <p className="text-sm text-gray-500" data-oid="_5ulsx6">
                            买入费率
                        </p>
                        <p className="text-lg font-medium text-gray-900" data-oid="l8dkx1j">
                            0.15%
                        </p>
                    </div>
                    <div className="flex space-x-3" data-oid="1cc-1q-">
                        <button
                            className="px-6 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium"
                            data-oid="nlnvnzs"
                        >
                            定投
                        </button>
                        <button
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                            data-oid="y:xk9ea"
                        >
                            买入
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
