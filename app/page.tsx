'use client';

import { useState } from 'react';

export default function Page() {
    const [funds, setFunds] = useState([
        {
            code: '000001',
            name: '华夏成长混合',
            netValue: '2.1450',
            dailyChange: '+0.0120',
            changePercent: '+0.56%',
            isMonitoring: false,
        },
        {
            code: '110022',
            name: '易方达消费行业股票',
            netValue: '3.8920',
            dailyChange: '-0.0340',
            changePercent: '-0.87%',
            isMonitoring: true,
        },
        {
            code: '161725',
            name: '招商中证白酒指数',
            netValue: '0.9876',
            dailyChange: '+0.0098',
            changePercent: '+1.00%',
            isMonitoring: false,
        },
        {
            code: '320007',
            name: '诺安成长混合',
            netValue: '1.5432',
            dailyChange: '-0.0056',
            changePercent: '-0.36%',
            isMonitoring: true,
        },
        {
            code: '050002',
            name: '博时沪深300指数',
            netValue: '1.2345',
            dailyChange: '+0.0234',
            changePercent: '+1.93%',
            isMonitoring: false,
        },
    ]);

    const toggleMonitoring = (code) => {
        setFunds(
            funds.map((fund) =>
                fund.code === code ? { ...fund, isMonitoring: !fund.isMonitoring } : fund,
            ),
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8" data-oid="p27hbqg">
            <div className="max-w-6xl mx-auto px-4" data-oid="nslc.l0">
                <div className="mb-8" data-oid="7d0vpo-">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2" data-oid="l-owvt0">
                        基金列表
                    </h1>
                    <p className="text-gray-600" data-oid="-9d:eed">
                        实时基金净值与监控管理
                    </p>
                </div>

                <div
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    data-oid="t0gdezj"
                >
                    <div
                        className="px-6 py-4 bg-gray-50 border-b border-gray-200"
                        data-oid="8.uf5tq"
                    >
                        <div
                            className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700"
                            data-oid="n13t9g_"
                        >
                            <div data-oid="kzis4f.">基金代码</div>
                            <div className="col-span-2" data-oid="b081.vt">
                                基金名称
                            </div>
                            <div data-oid="ag.1xvx">当日净值</div>
                            <div data-oid="1qbt-4-">涨跌幅</div>
                            <div data-oid="nuaprjm">操作</div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200" data-oid="zt.tki1">
                        {funds.map((fund) => (
                            <div
                                key={fund.code}
                                className="px-6 py-4 hover:bg-gray-50 transition-colors"
                                data-oid="qdcsiy5"
                            >
                                <div
                                    className="grid grid-cols-6 gap-4 items-center"
                                    data-oid="8e4b0k9"
                                >
                                    <div
                                        className="text-sm font-mono text-blue-600 font-medium"
                                        data-oid="z2m09.p"
                                    >
                                        {fund.code}
                                    </div>

                                    <div className="col-span-2" data-oid="b1x.0if">
                                        <div
                                            className="text-sm font-medium text-gray-900"
                                            data-oid="t8md-t."
                                        >
                                            {fund.name}
                                        </div>
                                    </div>

                                    <div
                                        className="text-sm font-medium text-gray-900"
                                        data-oid=":v-fuj2"
                                    >
                                        ¥{fund.netValue}
                                    </div>

                                    <div className="flex flex-col" data-oid="7lnaqtz">
                                        <span
                                            className={`text-sm font-medium ${
                                                fund.dailyChange.startsWith('+')
                                                    ? 'text-red-600'
                                                    : 'text-green-600'
                                            }`}
                                            data-oid="-ekxcwa"
                                        >
                                            {fund.dailyChange}
                                        </span>
                                        <span
                                            className={`text-xs ${
                                                fund.changePercent.startsWith('+')
                                                    ? 'text-red-600'
                                                    : 'text-green-600'
                                            }`}
                                            data-oid="thy_.e2"
                                        >
                                            {fund.changePercent}
                                        </span>
                                    </div>

                                    <div data-oid="x22:pg7">
                                        <button
                                            onClick={() => toggleMonitoring(fund.code)}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                fund.isMonitoring
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                            }`}
                                            data-oid="73krvxs"
                                        >
                                            {fund.isMonitoring ? '取消监控' : '监控'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className="mt-6 flex justify-between items-center text-sm text-gray-500"
                    data-oid="qx7cvaq"
                >
                    <div data-oid="no3oa4_">共 {funds.length} 只基金</div>
                    <div data-oid="1qnzw7x">
                        监控中: {funds.filter((f) => f.isMonitoring).length} 只
                    </div>
                </div>
            </div>
        </div>
    );
}
