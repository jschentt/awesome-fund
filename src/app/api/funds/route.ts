import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import { fetchOAuth2Token } from '@/lib/api';

// 定义前端需要的数据格式
interface FormattedFundItem {
    id: string;
    code: string;
    name: string;
    type: string;
    shortName: string;
    netWorth: number;
    expectWorth: number;
    expectGrowth: number;
    estimatedChange: number;
    netWorthDate: string;
    expectWorthDate: string;
    totalCount: number;
    description: string;
    // 兼容FundList组件所需的字段
    currentValue?: string;
    accumulatedValue?: string;
    dailyChange?: string;
    changePercent?: string;
    isMonitoring?: boolean;
    isFavorite?: boolean;
    status?: string;
    updateTime: string;
}

// fetchOAuth2Token 方法已从 @/lib/api 导入，带有1小时缓存

/**
 * 调用基金列表接口的方法
 * @param accessToken OAuth2访问令牌
 * @param page 页码
 * @param limit 每页数量
 * @returns 基金列表响应
 */
async function fetchFundList(accessToken: string, page: number = 1, limit: number = 10) {
    try {
        // console.log('Access Token being used:', accessToken);
        // 使用axios发送POST请求，在Header中添加Authorization
        const response = await axios.post(
            'https://maiqishare.xyz/open-api/fund/list',
            {
                page,
                limit,
                blackList: ['货币', '债券', '纯债', '后端'],
                whiteList: ['联接C', '增强C', '指数C'],
            },
            {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false, // 忽略SSL证书验证，仅在开发环境使用
                }),
            },
        );

        return response;
    } catch (error) {
        console.error('调用基金列表接口时出错:', error);
        throw error;
    }
}

/**
 * 转换基金数据格式以兼容前端组件
 */
function transformFundData(fundData: any): FormattedFundItem {
    const growthValue = fundData.expectGrowth || 0;
    const change = fundData.expectWorth - fundData.netWorth || 0;

    return {
        id: fundData.code || '',
        code: fundData.code || '',
        name: fundData.name || '',
        type: fundData.type || '',
        shortName: fundData.name || '',
        netWorth: fundData.netWorth || 0,
        expectWorth: fundData.expectWorth || 0,
        expectGrowth: growthValue,
        estimatedChange: change,
        netWorthDate: fundData.netWorthDate || '',
        expectWorthDate: fundData.expectWorthDate || '',
        totalCount: fundData.totalCount || 0,
        description: `${fundData.name || ''} - ${fundData.type || ''}`,
        // 兼容FundList组件
        currentValue: (fundData.netWorth || 0).toString(),
        accumulatedValue: (fundData.accumulatedNetWorth || 0).toString(),
        dailyChange: change > 0 ? `+${change.toFixed(4)}` : change.toFixed(4),
        changePercent:
            growthValue > 0 ? `+${growthValue.toFixed(2)}%` : `${growthValue.toFixed(2)}%`,
        isMonitoring: false, // 默认值
        isFavorite: false, // 默认值
        status: '打开', // 默认值
        updateTime: new Date().toISOString(),
    };
}

export async function GET(request: Request) {
    try {
        // 解析查询参数，获取分页信息
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);

        // 第一步：获取OAuth2访问令牌
        const tokenResponse = await fetchOAuth2Token();
        const { access_token } = tokenResponse.data.data;

        if (!access_token) {
            console.error('响应中没有access_token字段:', tokenResponse.data);
            throw new Error('无法获取有效的访问令牌');
        }

        // 第二步：使用获取到的access_token调用基金列表接口
        const fundListResponse = await fetchFundList(access_token, page, limit);

        // 获取基金列表数据
        const fundListData = fundListResponse.data.data.data || [];

        // 转换数据格式
        const transformedData = fundListData.map((fund: any) => transformFundData(fund));

        // 返回数据，使用前端期望的格式
        return NextResponse.json({
            data: transformedData,
            total: fundListResponse.data.data.total || 0,
            page,
            limit,
        });
    } catch (error) {
        // 如果发生错误，返回友好的错误信息
        console.error('基金数据获取失败:', error);
        return NextResponse.json(
            {
                message: '获取基金数据失败，请稍后重试',
                error: error instanceof Error ? error.message : '未知错误',
            },
            { status: 500 },
        );
    }
}
