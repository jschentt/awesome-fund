import axios from 'axios';
import https from 'https';
import type { FundEntity } from '@/types/common';

// 定义 OAuth2 令牌缓存接口
interface TokenCache {
    token: any;
    timestamp: number;
    expiryTime: number;
}

// 创建缓存对象
let tokenCache: TokenCache | null = null;
// 缓存有效期（1小时，单位：毫秒）
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * 获取OAuth2访问令牌的公共方法，带1小时缓存
 * @param grantType 授权类型
 * @param clientId 客户端ID
 * @param clientSecret 客户端密钥
 * @param scope 权限范围
 * @returns OAuth2访问令牌响应
 */
export async function fetchOAuth2Token(
    grantType: string = 'client_credentials',
    clientId: string = 'test_app',
    clientSecret: string = 'test_secret',
    scope: string = 'read,write',
) {
    const now = Date.now();

    // 检查缓存是否有效
    if (tokenCache && now < tokenCache.expiryTime) {
        console.log('使用缓存的OAuth2令牌');
        return tokenCache.token;
    }

    try {
        console.log('OAuth2 token接口被调用，获取新令牌:', new Date().toISOString());

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

        // 更新缓存
        tokenCache = {
            token: response,
            timestamp: now,
            expiryTime: now + CACHE_DURATION,
        };

        console.log('OAuth2 token获取成功并缓存');

        return response;
    } catch (error) {
        console.error('调用远程OAuth2 token接口时出错:', error);
        throw error;
    }
}

/**
 * 推送钉钉消息的方法
 * @param accessToken OAuth2访问令牌
 * @param title 消息标题
 * @param text 消息内容（Markdown格式）
 * @returns 推送响应
 */
export async function pushDingTalkMessage(
    accessToken: string,
    title: string,
    text: string,
    webhookUrl?: string,
) {
    try {
        console.log('推送钉钉消息:', title);

        const response = await axios.post(
            'https://maiqishare.xyz/open-api/dingtalk/markdown',
            {
                title,
                text,
                webhookUrl,
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

        console.log('钉钉消息推送结果:', response.data);
        return response;
    } catch (error) {
        // console.error('推送钉钉消息失败:', error);
        throw error;
    }
}

/**
 * 获取基金详细信息
 * 从基金详情API获取完整的基金数据并映射到FundEntity结构
 * @param fundCode 基金代码
 * @returns 基金详情实体对象或null（如果API调用失败）
 */
export async function getFundV2Detail(fundCode: string): Promise<FundEntity | null> {
    try {
        // 构建请求URL，格式为: https://fundgz.1234567.com.cn/js/[code].js
        const apiUrl = `https://fundgz.1234567.com.cn/js/${fundCode}.js`;

        // 调用基金净值API获取数据
        const response = await axios.get(apiUrl, {
            responseType: 'text', // 获取原始文本响应
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // 忽略SSL证书验证，仅在开发环境使用
            }),
        });

        // 解析API响应数据（这是一个JSONP格式的数据）
        const responseText = response.data;

        // 提取JSON部分（去掉jsonpgz(...)包装）
        const jsonMatch = responseText.match(/jsonpgz\(([^)]+)\)/);
        if (!jsonMatch || !jsonMatch[1]) {
            console.error(`基金净值API返回格式无效，基金代码: ${fundCode}`, responseText);
            return null;
        }

        // 解析JSON数据
        const fundData = JSON.parse(jsonMatch[1]);

        // 验证必要字段是否存在
        if (!fundData || !fundData.fundcode) {
            console.error(`基金净值API返回数据无效，基金代码: ${fundCode}`, fundData);
            return null;
        }

        // 构建基金详情对象，包含API返回的所有相关字段
        const fundDetail: FundEntity = {
            /** 基金唯一标识 - 使用基金代码作为ID */
            id: fundCode,

            /** 基金代码 - 从API的fundcode字段获取 */
            code: fundData.fundcode || fundCode,

            /** 基金名称（完整名称）- 从API的name字段获取 */
            name: fundData.name || `基金${fundCode}`,

            /** 基金简称 - 优先从API的name字段截取，或使用name字段 */
            shortName: fundData.name
                ? fundData.name.length > 8
                    ? fundData.name.substring(0, 8) + '...'
                    : fundData.name
                : `基金${fundCode}`,

            /** 基金类型 - API返回的jzrq字段为净值日期，这里暂时不提供类型信息 */
            type: '', // 东方财富网API不直接提供基金类型

            /** 单位净值 - 从API的dwjz字段获取（单位净值） */
            netWorth: parseFloat(fundData.dwjz || '0'),

            /** 估算净值 - 从API的gsz字段获取（估算净值） */
            expectWorth: parseFloat(fundData.gsz || '0'),

            /** 累计净值 - 从API的ljjz字段获取（累计净值） */
            totalNetWorth: parseFloat(fundData.ljjz || '0'),

            /** 当日估算涨跌幅 - 从API的gszzl字段获取（估算涨跌幅） */
            expectGrowth: parseFloat(fundData.gszzl || '0'),

            /** 日涨跌幅 - 使用估算涨跌幅作为日涨跌幅 */
            actualDayGrowth: parseFloat(fundData.gszzl || '0'),

            /** 估算涨跌额 - 根据估算净值和单位净值计算 */
            estimatedChange: parseFloat(fundData.gsz || '0') - parseFloat(fundData.dwjz || '0'),

            /** 净值日期 - 从API的jzrq字段获取（净值日期） */
            netWorthDate: fundData.jzrq || '',

            /** 估算净值日期 - 从API的gztime字段获取（估值时间） */
            expectWorthDate: fundData.gztime || '',

            /** 周涨跌幅 - 东方财富网API不直接提供周涨跌幅 */
            weeklyGrowth: 0,

            /** 月涨跌幅 - 东方财富网API不直接提供月涨跌幅 */
            monthlyGrowth: 0,

            /** 三个月涨跌幅 - 东方财富网API不直接提供三个月涨跌幅 */
            threeMonthsGrowth: 0,

            /** 六个月涨跌幅 - 东方财富网API不直接提供六个月涨跌幅 */
            sixMonthsGrowth: 0,

            /** 年涨跌幅 - 东方财富网API不直接提供年涨跌幅 */
            annualGrowth: 0,

            /** 基金经理 - 东方财富网API不直接提供基金经理信息 */
            manager: '',

            /** 基金规模 - 东方财富网API不直接提供基金规模 */
            fundScale: '',

            /** 最小购买金额 - 东方财富网API不直接提供最小购买金额 */
            minBuyAmount: 0,

            /** 购买原始费率 - 东方财富网API不直接提供购买原始费率 */
            originalBuyRate: 0,

            /** 购买费率 - 东方财富网API不直接提供购买费率 */
            currentBuyRate: 0,

            /** 成立日期 - 东方财富网API不直接提供成立日期 */
            establishDate: '',

            /** 基金描述 - 构建基本描述 */
            description: `基金${fundCode}: ${fundData.name || ''}`,
        };

        // 返回构建的基金详情对象
        return fundDetail;
    } catch (error) {
        // 记录API调用错误
        console.error(`获取基金详情失败，基金代码: ${fundCode}`, error);
        return null;
    }
}
