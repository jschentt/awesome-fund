'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, User, Eye, EyeOff, Settings } from 'lucide-react';
// 暂时注释掉，稍后修复组件导入问题
// import Navbar from '@/components/navbar';

interface FundItem {
    code: string;
    name: string;
    currentValue: string;
    accumulatedValue: string;
    dailyChange: string;
    changePercent: string;
    isMonitoring: boolean;
    updateTime: string;
    status: string;
}

export default function Page() {
    const [funds, setFunds] = useState<FundItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // 从API获取基金列表
    useEffect(() => {
        async function fetchFunds() {
            try {
                const response = await fetch('/api/funds');
                if (response.ok) {
                    const data = await response.json();
                    setFunds(data);
                }
            } catch (error) {
                console.error('获取基金列表失败:', error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchFunds();
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'monitoring'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4; // Show 4 funds per page

    const toggleMonitoring = (code: string) => {
        setFunds(
            funds.map((fund) =>
                fund.code === code ? { ...fund, isMonitoring: !fund.isMonitoring } : fund,
            ),
        );
    };

    const filteredFunds = funds.filter((fund) => {
        const matchesSearch = fund.name.includes(searchTerm) || fund.code.includes(searchTerm);
        const matchesTab = activeTab === 'all' || (activeTab === 'monitoring' && fund.isMonitoring);
        return matchesSearch && matchesTab;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredFunds.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFunds = filteredFunds.slice(startIndex, endIndex);

    // Reset to first page when filters change
    const handleTabChange = (tab: 'all' | 'monitoring') => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const totalFunds = funds.length;
    const monitoringFunds = funds.filter((f) => f.isMonitoring).length;

    return (
        <div className="min-h-screen bg-gray-50" data-oid="e38gb.n">
            {/* 导航栏占位 - 暂时使用简单的导航结构 */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold">基金监测列表</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/auth/login" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                            登录
                        </a>
                    </div>
                </div>
            </header>
            {/* 主要内容 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 mb-6">
                    <h1
                        className="text-xl sm:text-2xl font-bold text-gray-900"
                        data-oid="up9q76g"
                    >
                        基金管理
                    </h1>
                    <div
                        className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4"
                            data-oid="k3fhp1l"
                        >
                            <div className="flex items-center space-x-2" data-oid="n2_6t-h">
                                <User
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
                                    data-oid="5qt3__e"
                                />
                                <span
                                    className="text-xs sm:text-sm text-gray-600"
                                    data-oid="4_lhlz5"
                                >
                                    登录
                                </span>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500" data-oid="1gr45uk">
                                总数量: {totalFunds}
                            </span>
                        </div>
                    </div>
                </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" data-oid="denm-p5">
                {/* Subtitle */}
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6" data-oid="rem0.x2">
                    共 {totalFunds} 只基金 · 实时查看基金净值与涨跌情况
                </p>

                {/* Stats and Search */}
                <div
                    className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6"
                    data-oid="3urw3uc"
                >
                    {/* Stats Tabs */}
                    <div className="flex space-x-3 sm:space-x-6" data-oid="yjdp4i0">
                        <button
                            onClick={() => handleTabChange('all')}
                            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border transition-colors min-h-[44px] ${activeTab === 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            data-oid="b14zv4-"
                        >
                            <span className="text-xs sm:text-sm" data-oid="i-m23ix">
                                全部基金
                            </span>
                            <span
                                className={`text-base sm:text-lg font-semibold ${activeTab === 'all' ? 'text-blue-700' : 'text-gray-900'}`}
                                data-oid="fkq9lev"
                            >
                                {totalFunds}
                            </span>
                        </button>
                        <button
                            onClick={() => handleTabChange('monitoring')}
                            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border transition-colors min-h-[44px] ${activeTab === 'monitoring' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            data-oid="s8i7maf"
                        >
                            <Eye
                                className={`w-3 h-3 sm:w-4 sm:h-4 ${activeTab === 'monitoring' ? 'text-blue-600' : 'text-gray-600'}`}
                                data-oid="hqktihl"
                            />
                            <span className="text-xs sm:text-sm" data-oid="g0bfz6b">
                                我的监控
                            </span>
                            <span
                                className={`text-base sm:text-lg font-semibold ${activeTab === 'monitoring' ? 'text-blue-700' : 'text-gray-900'}`}
                                data-oid=".bc7j1y"
                            >
                                {monitoringFunds}
                            </span>
                        </button>
                    </div>

                    {/* Search Controls */}
                    <div
                        className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4"
                        data-oid="f004op4"
                    >
                        <div className="relative" data-oid="1wgz500">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                                data-oid="mo17uac"
                            />
                            <input
                                type="text"
                                placeholder="搜索基金代码或名称..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full sm:w-64 pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                data-oid="3_4w1x9"
                            />
                        </div>
                        <button
                            className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 py-2.5 sm:py-0 min-h-[44px] sm:min-h-0"
                            data-oid="x-2y872"
                        >
                            <span data-oid="iawkvr2">添加自选到列表</span>
                        </button>
                    </div>
                </div>

                {/* Fund Cards Grid */}
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6"
                    data-oid="tyj8xkz"
                >
                    {currentFunds.map((fund) => (
                        <Link
                            href={`/fund/${fund.code}`}
                            key={fund.code}
                            className="block bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow hover:border-blue-300"
                            data-oid="v9ybs6i"
                        >
                            {/* Fund Header */}
                            <div
                                className="flex justify-between items-start mb-3 sm:mb-4"
                                data-oid="6ajdgzt"
                            >
                                <div className="flex-1 min-w-0" data-oid="rit9k41">
                                    <div
                                        className="flex items-center space-x-2 mb-1"
                                        data-oid="8r2gjsj"
                                    >
                                        <span
                                            className="text-base sm:text-lg font-semibold text-gray-900 truncate"
                                            data-oid="m759ky3"
                                        >
                                            {fund.code}
                                        </span>
                                        <span
                                            className={`px-2 py-1 text-xs rounded flex-shrink-0 ${fund.status === '打开' ? 'bg-blue-100 text-blue-700' : fund.status === '暂停' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                                            data-oid="u94:hhl"
                                        >
                                            {fund.status}
                                        </span>
                                    </div>
                                    <h3
                                        className="text-sm sm:text-base font-medium text-gray-900 mb-2 line-clamp-2"
                                        data-oid="9qcfqez"
                                    >
                                        {fund.name}
                                    </h3>
                                </div>
                                <div
                                    className="flex space-x-1 ml-2 flex-shrink-0"
                                    data-oid=".iv8o.e"
                                >
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleMonitoring(fund.code);
                                        }}
                                        className="p-2.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                                        data-oid="p:v9p8c"
                                    >
                                        {fund.isMonitoring ? (
                                            <Eye
                                                className="w-5 h-5 text-blue-600"
                                                data-oid="bf8j1nz"
                                            />
                                        ) : (
                                            <EyeOff className="w-5 h-5" data-oid="cjf5biy" />
                                        )}
                                    </button>
                                    <button
                                        className="p-2.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                                        data-oid="hu8-m3w"
                                    >
                                        <Settings className="w-5 h-5" data-oid="jxz:v1_" />
                                    </button>
                                </div>
                            </div>

                            {/* Fund Values */}
                            <div
                                className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4"
                                data-oid="_oab45r"
                            >
                                <div data-oid="1_:xqr5">
                                    <div
                                        className="text-xs sm:text-sm text-gray-500 mb-1"
                                        data-oid="xvdkki1"
                                    >
                                        当日净值
                                    </div>
                                    <div
                                        className="text-lg sm:text-xl font-semibold text-gray-900"
                                        data-oid="8h81tkt"
                                    >
                                        {fund.currentValue}
                                    </div>
                                </div>
                                <div data-oid="bksc0e.">
                                    <div
                                        className="text-xs sm:text-sm text-gray-500 mb-1"
                                        data-oid="_8up6yb"
                                    >
                                        累计净值
                                    </div>
                                    <div
                                        className="text-lg sm:text-xl font-semibold text-gray-900"
                                        data-oid="hdqbw6_"
                                    >
                                        {fund.accumulatedValue}
                                    </div>
                                </div>
                            </div>

                            {/* Daily Change */}
                            <div
                                className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4"
                                data-oid="7r3erdc"
                            >
                                <div data-oid="bw.8zhw">
                                    <div
                                        className="text-xs sm:text-sm text-gray-500 mb-1"
                                        data-oid="3w20:n4"
                                    >
                                        日涨跌
                                    </div>
                                    <div
                                        className={`text-base sm:text-lg font-semibold ${fund.dailyChange.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}
                                        data-oid="uc-x05p"
                                    >
                                        {fund.dailyChange}
                                    </div>
                                </div>
                                <div data-oid="o-g96vh">
                                    <div
                                        className="text-xs sm:text-sm text-gray-500 mb-1"
                                        data-oid="gsldzpw"
                                    >
                                        涨跌幅
                                    </div>
                                    <div
                                        className={`text-base sm:text-lg font-semibold ${fund.changePercent.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}
                                        data-oid="qozgmky"
                                    >
                                        {fund.changePercent}
                                    </div>
                                </div>
                            </div>

                            {/* Update Time */}
                            <div
                                className="text-xs text-gray-400 border-t pt-2 sm:pt-3"
                                data-oid="gw-9m:o"
                            >
                                更新时间: {fund.updateTime}
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div
                        className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-2"
                        data-oid="yak5ccg"
                    >
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
                            data-oid="opy2n.d"
                        >
                            上一页
                        </button>

                        <div
                            className="flex space-x-1 overflow-x-auto pb-2 sm:pb-0"
                            data-oid="6.sks9v"
                        >
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 sm:px-3 py-2.5 sm:py-2 text-sm font-medium rounded-md transition-colors min-w-[44px] min-h-[44px] sm:min-h-0 flex items-center justify-center ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}
                                    data-oid="oow_t9z"
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
                            data-oid="y59fpnz"
                        >
                            下一页
                        </button>
                    </div>
                )}

                {/* Results Info */}
                <div
                    className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 px-4"
                    data-oid="fc0t_5r"
                >
                    显示 {startIndex + 1}-{Math.min(endIndex, filteredFunds.length)} 条，共{' '}
                    {filteredFunds.length} 条结果
                    {activeTab === 'monitoring' && ` (监控中: ${monitoringFunds} 只)`}
                </div>
            </div>
        </div>
    );
}
