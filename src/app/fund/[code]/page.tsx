'use client';

import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Users,
    AlertCircle,
    Star,
    StarOff,
    Share2,
    BookmarkPlus,
    BookmarkCheck,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Table, Spin, notification } from 'antd';
import { getLocalStorageWithExpiry } from '@/lib/utils';
// 移除了echart相关的导入

// 修改NetWorthDataItem类型为二维数组类型
type NetWorthDataItem = [string, string, string, string]; // [交易日期, 单位净值, 当日涨跌幅%, 其他]

// 定义新的基金数据类型接口
interface ApiResponse {
    code: number;
    message: string;
    data: {
        data: FundData;
    };
}

interface FundData {
    id: string;
    code: string;
    name: string;
    shortName: string;
    type: string;
    netWorth: number;
    expectWorth: number;
    totalNetWorth: number;
    expectGrowth: number;
    actualDayGrowth: number;
    estimatedChange: number;
    netWorthDate: string;
    expectWorthDate: string;
    weeklyGrowth: number;
    monthlyGrowth: number;
    threeMonthsGrowth: number;
    sixMonthsGrowth: number;
    annualGrowth: number;
    manager: string;
    fundScale: string;
    minBuyAmount: number;
    originalBuyRate: number;
    currentBuyRate: number;
    establishDate: string;
    description: string;
    netWorthData: NetWorthDataItem[];
    // 添加本地状态字段
    isFavorite?: boolean;
    isMonitoring?: boolean;
}

// 注意：现在从API获取基金数据，不再使用本地模拟数据

// 格式化百分比显示
const formatPercent = (value: number | undefined): string => {
    if (value === undefined) return '0.00%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
};

export default function FundDetailPage() {
    const params = useParams();
    const router = useRouter();
    const fundCode = params.code as string;
    const [fund, setFund] = useState<FundData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'performance' | 'manager' | 'overview'>(
        'performance',
    );
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 确保在异步函数中使用await
    async function fetchFundStatus() {
        try {
            const userInfo = getLocalStorageWithExpiry('userInfo');
            if (!userInfo) {
                return;
            }
            const response = await fetch(`/api/funds/detail?code=${fundCode}`, {
                method: 'GET',
                // GET 传参，将 fundCode 拼接在 URL 查询字符串中
                headers: {
                    'X-User-Id': userInfo.id,
                },
            });

            if (!response.ok) {
                throw new Error(`API调用失败: ${response.statusText}`);
            }
            const apiResponse = await response.json();
            const { isFavorite, isMonitoring } = apiResponse?.data || {};
            return { isFavorite, isMonitoring };
        } catch (err) {
            notification.error({
                message: '获取基金详情失败',
                description: err instanceof Error ? err.message : '获取基金详情失败',
            });
        }
    }

    async function fetchFundDetail() {
        try {
            const response = await fetch(`/api/funds/${fundCode}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('基金不存在');
                }
                throw new Error('获取基金详情失败');
            }

            const apiResponse: ApiResponse = await response.json();

            // 检查API响应状态
            if (apiResponse.code !== 0 || !apiResponse.data?.data) {
                throw new Error(apiResponse.message || '获取基金数据失败');
            }

            const { isFavorite, isMonitoring } = (await fetchFundStatus()) || {};

            // 添加本地状态字段
            const fundDataWithLocalState = {
                ...apiResponse.data.data,
                isFavorite: isFavorite || false,
                isMonitoring: isMonitoring || false,
            };

            setFund(fundDataWithLocalState);
        } catch (err) {
            setError(err instanceof Error ? err.message : '获取基金详情失败');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchFundDetail();
    }, [fundCode]);

    const handleBack = () => {
        router.back();
    };

    const toggleFavorite = async () => {
        if (!fund) return;

        const userInfo = getLocalStorageWithExpiry('userInfo');
        if (!userInfo) {
            notification.error({ message: '请先登录' });
            return;
        }

        const endpoint = `/api/funds/favorite`;
        const method = fund.isFavorite ? 'DELETE' : 'POST';

        try {
            // 调用API
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userInfo.id,
                },
                body: JSON.stringify({ fundCode: fund.code }),
            });

            // 检查响应状态
            if (!response.ok) {
                throw new Error(`API调用失败: ${response.statusText}`);
            }

            // 更新本地状态
            setFund((prevFund) =>
                prevFund ? { ...prevFund, isFavorite: !prevFund.isFavorite } : null,
            );

            notification.success({ message: fund.isFavorite ? '已从收藏中移除' : '已添加到收藏' });
        } catch (err) {
            notification.error({
                message: fund.isFavorite ? '取消收藏失败' : '添加收藏失败',
                description: err instanceof Error ? err.message : '未知错误',
            });
        }
    };

    const toggleMonitoring = async () => {
        if (!fund) return;

        const userInfo = getLocalStorageWithExpiry('userInfo');
        if (!userInfo) {
            notification.error({ message: '请先登录' });
            return;
        }

        const endpoint = `/api/funds/monitor`;
        const method = fund.isMonitoring ? 'DELETE' : 'POST';

        try {
            // 调用API
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userInfo.id,
                },
                body: JSON.stringify({ fundCode: fund.code }),
            });

            // 检查响应状态
            if (!response.ok) {
                throw new Error(`API调用失败: ${response.statusText}`);
            }

            // 更新本地状态
            setFund((prevFund) =>
                prevFund ? { ...prevFund, isMonitoring: !prevFund.isMonitoring } : null,
            );

            notification.success({
                message: fund.isMonitoring ? '已从监控中移除' : '已添加到监控',
            });
        } catch (err) {
            notification.error({
                message: fund.isMonitoring ? '取消监控失败' : '添加监控失败',
                description: err instanceof Error ? err.message : '未知错误',
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Spin size="default" />
            </div>
        );
    }

    if (error || !fund) {
        return (
            <div
                className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4"
                data-oid="ego2kyc"
            >
                <AlertCircle className="w-12 h-12 text-gray-400 mb-4" data-oid="-nrrtiz" />
                <h2 className="text-xl font-medium text-gray-900 mb-2" data-oid="9bop0dy">
                    {error || '基金不存在'}
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

    // 计算涨跌状态
    const isPositiveChange = fund.actualDayGrowth > 0;
    const isNegativeChange = fund.actualDayGrowth < 0;

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
                            onClick={() => {
                                const detailUrl = `${window.location.origin}/fund/${fundCode}`;
                                navigator.clipboard
                                    .writeText(detailUrl)
                                    .then(() => {
                                        notification.success({
                                            message: '复制成功',
                                            description: '链接已复制到剪贴板',
                                            placement: 'top',
                                        });
                                    })
                                    .catch(() => {
                                        notification.error({
                                            message: '复制失败',
                                            description: '请手动复制链接',
                                            placement: 'top',
                                        });
                                    });
                            }}
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
                                    {fund.netWorth}
                                </span>
                                <span
                                    className={`text-lg font-medium ${isPositiveChange ? 'text-red-600' : isNegativeChange ? 'text-green-600' : 'text-gray-600'}`}
                                    data-oid=".vs3k3f"
                                >
                                    {formatPercent(fund.actualDayGrowth)}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1" data-oid="6xj5ou1">
                                更新时间: {fund.netWorthDate}
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
                                    {fund.totalNetWorth}
                                </span>
                                <span
                                    className={`text-lg font-medium ${isPositiveChange ? 'text-red-600' : isNegativeChange ? 'text-green-600' : 'text-gray-600'}`}
                                    data-oid="ievsf8w"
                                >
                                    {fund.estimatedChange?.toFixed(4)}
                                </span>
                            </div>
                            <div className="mt-2" data-oid="xrg8oxf">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}
                                    data-oid="szxttgy"
                                >
                                    开放
                                </span>
                                <span
                                    className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    data-oid="0y5mqky"
                                >
                                    {fund.type}
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
                                    历史净值
                                </h3>
                                {fund.netWorthData && (
                                    <div className="bg-white rounded-lg mb-6">
                                        <Table
                                            columns={[
                                                {
                                                    title: '交易日期',
                                                    dataIndex: 'date',
                                                    key: 'date',
                                                    width: 120,
                                                },
                                                {
                                                    title: '单位净值',
                                                    dataIndex: 'netWorth',
                                                    key: 'netWorth',
                                                    width: 100,
                                                    render: (text) => {
                                                        // 格式化单位净值，保留3位小数
                                                        const value = parseFloat(text);
                                                        return !isNaN(value)
                                                            ? value.toFixed(3)
                                                            : 'N/A';
                                                    },
                                                },
                                                {
                                                    title: '当日涨跌幅%',
                                                    dataIndex: 'changeRate',
                                                    key: 'changeRate',
                                                    width: 120,
                                                    render: (text, record) => {
                                                        const changeRate = parseFloat(text);
                                                        if (isNaN(changeRate)) {
                                                            return '-';
                                                        }
                                                        const prefix = changeRate >= 0 ? '+' : '';
                                                        const colorClass =
                                                            changeRate > 0
                                                                ? 'text-red-600'
                                                                : changeRate < 0
                                                                  ? 'text-green-600'
                                                                  : 'text-gray-600';
                                                        return (
                                                            <span className={colorClass}>
                                                                {prefix}
                                                                {changeRate.toFixed(2)}%
                                                            </span>
                                                        );
                                                    },
                                                },
                                            ]}
                                            dataSource={[...fund.netWorthData]
                                                .sort((a, b) => {
                                                    // 按日期倒序排序（新日期在前）
                                                    return (
                                                        new Date(b[0]).getTime() -
                                                        new Date(a[0]).getTime()
                                                    );
                                                })
                                                .map((item, index) => ({
                                                    key: index,
                                                    date: item[0], // 索引0：交易日期
                                                    netWorth: item[1], // 索引1：单位净值
                                                    changeRate: item[2], // 索引2：当日涨跌幅%
                                                    index,
                                                }))}
                                            pagination={{
                                                current: currentPage,
                                                pageSize: itemsPerPage,
                                                total: fund.netWorthData.length,
                                                onChange: (page) => setCurrentPage(page),
                                                showSizeChanger: false,
                                                showTotal: (total) => `共 ${total} 条记录`,
                                            }}
                                        />
                                    </div>
                                )}

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
                                    {[
                                        { label: '日涨幅', value: fund.actualDayGrowth },
                                        { label: '周涨幅', value: fund.weeklyGrowth },
                                        { label: '月涨幅', value: fund.monthlyGrowth },
                                        { label: '季涨幅', value: fund.threeMonthsGrowth },
                                        { label: '半年涨幅', value: fund.sixMonthsGrowth },
                                        { label: '年涨幅', value: fund.annualGrowth },
                                    ].map((item, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-50 p-4 rounded-lg"
                                            data-oid="f9k1cs3"
                                        >
                                            <p className="text-sm text-gray-500" data-oid="1obmlxd">
                                                {item.label}
                                            </p>
                                            <p
                                                className={`text-xl font-semibold mt-1 ${item.value > 0 ? 'text-red-600' : item.value < 0 ? 'text-green-600' : 'text-gray-600'}`}
                                                data-oid="7cb.f0d"
                                            >
                                                {formatPercent(item.value)}
                                            </p>
                                        </div>
                                    ))}
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
                                            {fund.manager}
                                        </h3>
                                        <p
                                            className="text-sm text-gray-500 mt-1"
                                            data-oid="n0g_59f"
                                        >
                                            基金经理
                                        </p>
                                        <p className="text-sm text-gray-500" data-oid="ryo4s5y">
                                            {fund.type}基金
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6" data-oid="dz0cz_n">
                                    <h4
                                        className="text-lg font-medium text-gray-900 mb-2"
                                        data-oid="2brxntm"
                                    >
                                        基金介绍
                                    </h4>
                                    <p className="text-gray-700" data-oid="f5gs37-">
                                        {fund.description}
                                    </p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'overview' && (
                            <div data-oid="ngd-w6s">
                                {/* 使用响应式栅格布局：手机端2列，平板及以上3列 */}
                                <div
                                    className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5"
                                    data-oid="17-m:6d"
                                >
                                    <div data-oid="b0yzm_j">
                                        <p className="text-sm text-gray-500" data-oid="ixo61s_">
                                            基金全称
                                        </p>
                                        <p
                                            className="text-gray-900 font-medium break-words"
                                            data-oid="lfzco9s"
                                        >
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
                                            {fund.establishDate || '-'}
                                        </p>
                                    </div>
                                    <div data-oid="z._sb79">
                                        <p className="text-sm text-gray-500" data-oid="d3cxpq.">
                                            基金规模
                                        </p>
                                        <p className="text-gray-900 font-medium" data-oid="xqpp-1y">
                                            {fund.fundScale}
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
                                    <div data-oid="new-field-min-buy">
                                        <p className="text-sm text-gray-500">起购金额</p>
                                        <p className="text-gray-900 font-medium">
                                            {fund.minBuyAmount}元
                                        </p>
                                    </div>
                                    <div data-oid="new-field-buy-rate">
                                        <p className="text-sm text-gray-500">申购费率</p>
                                        <p className="text-gray-900 font-medium">
                                            {formatPercent(fund.currentBuyRate)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 基金预期表现 */}
                <section className="bg-white rounded-xl shadow-sm p-6 mb-6" data-oid="kxf1a14">
                    <div className="flex items-start" data-oid="2s82syr">
                        <AlertCircle
                            className="h-5 w-5 text-blue-500 mr-2 mt-0.5"
                            data-oid="0eo59qf"
                        />
                        <div data-oid="avxxp45">
                            <h3 className="text-base font-medium text-gray-900" data-oid="7i2fn0j">
                                预期表现
                            </h3>
                            <div className="mt-2 space-y-2">
                                <div>
                                    <span className="text-sm text-gray-500">预期净值：</span>
                                    <span className="font-medium">{fund.expectWorth}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">预期涨幅：</span>
                                    <span
                                        className={`font-medium ${fund.expectGrowth > 0 ? 'text-red-600' : 'text-green-600'}`}
                                    >
                                        {formatPercent(fund.expectGrowth)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">预期日期：</span>
                                    <span className="text-gray-700">{fund.expectWorthDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
