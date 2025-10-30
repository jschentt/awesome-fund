'use client';

import { useState } from 'react';
import { Search, User, Eye, EyeOff, Settings } from 'lucide-react';

export default function Page() {
    const [funds, setFunds] = useState([
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
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'monitoring'
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'monitoring'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4; // Show 4 funds per page

    const toggleMonitoring = (code) => {
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
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const totalFunds = funds.length;
    const monitoringFunds = funds.filter((f) => f.isMonitoring).length;

    return (
        <div className="min-h-screen bg-gray-50" data-oid="p27hbqg">
            {/* Header */}
            <div className="bg-white border-b border-gray-200" data-oid="header">
                <div className="max-w-7xl mx-auto px-4 py-4" data-oid="header-content">
                    <div className="flex justify-between items-center" data-oid="header-flex">
                        <h1 className="text-xl font-semibold text-gray-900" data-oid="title">
                            基金管理
                        </h1>
                        <div className="flex items-center space-x-4" data-oid="user-info">
                            <User className="w-5 h-5 text-gray-600" data-oid="user-icon" />
                            <span className="text-sm text-gray-600" data-oid="username">
                                登录
                            </span>
                            <span className="text-sm text-gray-500" data-oid="fund-count">
                                总数量: 3
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6" data-oid="main-content">
                {/* Subtitle */}
                <p className="text-gray-600 mb-6" data-oid="subtitle">
                    共 {totalFunds} 只基金 · 实时查看基金净值与涨跌情况
                </p>

                {/* Stats and Search */}
                <div className="flex justify-between items-center mb-6" data-oid="stats-search">
                    <div className="flex space-x-6" data-oid="stats">
                        <button
                            onClick={() => handleTabChange('all')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                                activeTab === 'all'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                            data-oid="total-funds"
                        >
                            <span className="text-sm" data-oid="total-label">
                                全部基金
                            </span>
                            <span
                                className={`text-lg font-semibold ${
                                    activeTab === 'all' ? 'text-blue-700' : 'text-gray-900'
                                }`}
                                data-oid="total-number"
                            >
                                {totalFunds}
                            </span>
                        </button>
                        <button
                            onClick={() => handleTabChange('monitoring')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                                activeTab === 'monitoring'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                            data-oid="monitoring-funds"
                        >
                            <Eye
                                className={`w-4 h-4 ${
                                    activeTab === 'monitoring' ? 'text-blue-600' : 'text-gray-600'
                                }`}
                                data-oid="eye-icon"
                            />

                            <span className="text-sm" data-oid="monitoring-label">
                                我的监控
                            </span>
                            <span
                                className={`text-lg font-semibold ${
                                    activeTab === 'monitoring' ? 'text-blue-700' : 'text-gray-900'
                                }`}
                                data-oid="monitoring-number"
                            >
                                {monitoringFunds}
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center space-x-4" data-oid="search-controls">
                        <div className="relative" data-oid="search-container">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                                data-oid="search-icon"
                            />

                            <input
                                type="text"
                                placeholder="搜索基金代码或名称..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                                data-oid="search-input"
                            />
                        </div>
                        <button
                            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                            data-oid="add-monitoring"
                        >
                            <span data-oid="add-text">添加自选到列表</span>
                        </button>
                    </div>
                </div>

                {/* Fund Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-oid="funds-grid">
                    {currentFunds.map((fund) => (
                        <div
                            key={fund.code}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            data-oid="fund-card"
                        >
                            {/* Fund Header */}
                            <div
                                className="flex justify-between items-start mb-4"
                                data-oid="fund-header"
                            >
                                <div data-oid="fund-info">
                                    <div
                                        className="flex items-center space-x-2 mb-1"
                                        data-oid="fund-code-status"
                                    >
                                        <span
                                            className="text-lg font-semibold text-gray-900"
                                            data-oid="fund-code"
                                        >
                                            {fund.code}
                                        </span>
                                        <span
                                            className={`px-2 py-1 text-xs rounded ${
                                                fund.status === '打开'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : fund.status === '暂停'
                                                      ? 'bg-green-100 text-green-700'
                                                      : 'bg-gray-100 text-gray-700'
                                            }`}
                                            data-oid="fund-status"
                                        >
                                            {fund.status}
                                        </span>
                                    </div>
                                    <h3
                                        className="text-base font-medium text-gray-900 mb-2"
                                        data-oid="fund-name"
                                    >
                                        {fund.name}
                                    </h3>
                                </div>
                                <div className="flex space-x-2" data-oid="fund-actions">
                                    <button
                                        onClick={() => toggleMonitoring(fund.code)}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        data-oid="monitoring-toggle"
                                    >
                                        {fund.isMonitoring ? (
                                            <Eye
                                                className="w-5 h-5 text-blue-600"
                                                data-oid="monitoring-on"
                                            />
                                        ) : (
                                            <EyeOff className="w-5 h-5" data-oid="monitoring-off" />
                                        )}
                                    </button>
                                    <button
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        data-oid="settings-btn"
                                    >
                                        <Settings className="w-5 h-5" data-oid="settings-icon" />
                                    </button>
                                </div>
                            </div>

                            {/* Fund Values */}
                            <div className="grid grid-cols-2 gap-4 mb-4" data-oid="fund-values">
                                <div data-oid="current-value">
                                    <div
                                        className="text-sm text-gray-500 mb-1"
                                        data-oid="current-label"
                                    >
                                        当日净值
                                    </div>
                                    <div
                                        className="text-xl font-semibold text-gray-900"
                                        data-oid="current-amount"
                                    >
                                        {fund.currentValue}
                                    </div>
                                </div>
                                <div data-oid="accumulated-value">
                                    <div
                                        className="text-sm text-gray-500 mb-1"
                                        data-oid="accumulated-label"
                                    >
                                        累计净值
                                    </div>
                                    <div
                                        className="text-xl font-semibold text-gray-900"
                                        data-oid="accumulated-amount"
                                    >
                                        {fund.accumulatedValue}
                                    </div>
                                </div>
                            </div>

                            {/* Daily Change */}
                            <div className="grid grid-cols-2 gap-4 mb-4" data-oid="daily-change">
                                <div data-oid="change-amount">
                                    <div
                                        className="text-sm text-gray-500 mb-1"
                                        data-oid="change-label"
                                    >
                                        日涨跌
                                    </div>
                                    <div
                                        className={`text-lg font-semibold ${
                                            fund.dailyChange.startsWith('+')
                                                ? 'text-red-600'
                                                : 'text-green-600'
                                        }`}
                                        data-oid="change-value"
                                    >
                                        {fund.dailyChange}
                                    </div>
                                </div>
                                <div data-oid="change-percent">
                                    <div
                                        className="text-sm text-gray-500 mb-1"
                                        data-oid="percent-label"
                                    >
                                        涨跌幅
                                    </div>
                                    <div
                                        className={`text-lg font-semibold ${
                                            fund.changePercent.startsWith('+')
                                                ? 'text-red-600'
                                                : 'text-green-600'
                                        }`}
                                        data-oid="percent-value"
                                    >
                                        {fund.changePercent}
                                    </div>
                                </div>
                            </div>

                            {/* Update Time */}
                            <div
                                className="text-xs text-gray-400 border-t pt-3"
                                data-oid="update-time"
                            >
                                更新时间: {fund.updateTime}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div
                        className="mt-8 flex justify-center items-center space-x-2"
                        data-oid="pagination"
                    >
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            data-oid="prev-button"
                        >
                            上一页
                        </button>

                        <div className="flex space-x-1" data-oid="page-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                        currentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                    }`}
                                    data-oid={`page-${page}`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            data-oid="next-button"
                        >
                            下一页
                        </button>
                    </div>
                )}

                {/* Results Info */}
                <div className="mt-6 text-center text-sm text-gray-500" data-oid="results-info">
                    显示 {startIndex + 1}-{Math.min(endIndex, filteredFunds.length)} 条，共{' '}
                    {filteredFunds.length} 条结果
                    {activeTab === 'monitoring' && ` (监控中: ${monitoringFunds} 只)`}
                </div>
            </div>
        </div>
    );
}
