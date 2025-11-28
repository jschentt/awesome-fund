import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

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

// 定义API响应类型
interface ApiResponse {
    code: number;
    message: string;
    data: {
        data: {
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
            netWorthData: any[];
        };
    };
}

/**
 * 获取OAuth2访问令牌的公共方法
 * @param grantType 授权类型
 * @param clientId 客户端ID
 * @param clientSecret 客户端密钥
 * @param scope 权限范围
 * @returns OAuth2访问令牌响应
 */
async function fetchOAuth2Token(
    grantType: string = 'client_credentials',
    clientId: string = 'test_app',
    clientSecret: string = 'test_secret',
    scope: string = 'read,write',
) {
    try {
        console.log('OAuth2 token接口被调用:', new Date().toISOString());

        // 设置请求体数据
        const requestBody = {
            grant_type: grantType,
            client_id: clientId,
            client_secret: clientSecret,
            scope: scope,
        };

        // 使用axios发送请求，支持忽略SSL证书验证
        const response = await axios.post(
            'https://maiqishare.xyz/open-api/oauth2/token',
            requestBody,
            {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false, // 忽略SSL证书验证，仅在开发环境使用
                }),
            },
        );

        console.log('OAuth2 token响应数据:', response.data);

        return response;
    } catch (error) {
        console.error('调用远程OAuth2 token接口时出错:', error);
        throw error;
    }
}

// 修改函数返回类型为新的数据结构格式
function transformFundData(apiData: ApiResponse['data']['data']): any {
    // 格式化百分比，添加正负号和%符号
    const formatPercent = (value: number): string => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    // 计算日涨跌幅
    const dailyChange = (apiData.estimatedChange || 0).toFixed(4);
    const changePercent = formatPercent(apiData.actualDayGrowth || 0);

    return {
        code: 0,
        message: 'success',
        data: {
            data: {
                id: apiData.id || apiData.code,
                code: apiData.code,
                name: apiData.name,
                shortName: apiData.shortName || apiData.name.substring(0, 8) + '...',
                type: apiData.type || '指数型',
                netWorth: apiData.netWorth,
                expectWorth: apiData.expectWorth,
                totalNetWorth: apiData.totalNetWorth,
                expectGrowth: apiData.expectGrowth,
                actualDayGrowth: apiData.actualDayGrowth,
                estimatedChange: apiData.estimatedChange,
                netWorthDate: apiData.netWorthDate,
                expectWorthDate: apiData.expectWorthDate,
                weeklyGrowth: apiData.weeklyGrowth,
                monthlyGrowth: apiData.monthlyGrowth,
                threeMonthsGrowth: apiData.threeMonthsGrowth,
                sixMonthsGrowth: apiData.sixMonthsGrowth,
                annualGrowth: apiData.annualGrowth,
                manager: apiData.manager || '',
                fundScale: apiData.fundScale || '',
                minBuyAmount: apiData.minBuyAmount || 10,
                originalBuyRate: apiData.originalBuyRate || 0,
                currentBuyRate: apiData.currentBuyRate || 0,
                establishDate: apiData.establishDate || '',
                description:
                    apiData.description ||
                    `基金${apiData.code} - ${apiData.name}，类型：${apiData.type || '指数型'}，基金经理：${apiData.manager || ''}`,
                netWorthData: apiData.netWorthData || [],
            },
        },
    };
}

// 获取基金详情API
export async function GET(request: Request, { params }: { params: { code: string } }) {
    const { code } = params;

    try {
        // 第一步：获取OAuth2访问令牌
        const tokenResponse = await fetchOAuth2Token();
        const { access_token } = tokenResponse.data.data;

        if (!access_token) {
            console.error('响应中没有access_token字段:', tokenResponse.data);
            return NextResponse.json({ error: '无法获取有效的访问令牌' }, { status: 500 });
        }

        // 设置真实API的URL，根据curl命令调整
        const API_BASE_URL = 'https://maiqishare.xyz/open-api/fund/detail';

        // 调用真实API获取基金详情
        const response = await axios.get(`${API_BASE_URL}/${code}`, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${access_token}`,
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // 忽略SSL证书验证，仅在开发环境使用
            }),
        });

        // axios会自动解析JSON，直接获取响应数据
        const apiResponse: ApiResponse = response.data;

        // 检查API响应状态
        if (apiResponse.code !== 0) {
            return NextResponse.json(
                { error: apiResponse.message || '获取基金数据失败' },
                { status: 400 },
            );
        }

        // 返回原始API响应数据，不再进行转换
        return NextResponse.json(apiResponse);
    } catch (error) {
        console.error('获取基金详情失败:', error);
        // 如果发生异常，返回错误信息
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}
