import axios from 'axios';
import https from 'https';
import type { FundEntity } from '../types/common';

// 缓存项接口定义
interface CacheItem {
    data: any;
    timestamp: number;
    expireTime: number;
}

// 内存缓存对象
const cache = new Map<string, CacheItem>();

// 缓存时间：24小时（毫秒）
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// HTTPS Agent 配置（忽略SSL证书验证，仅在开发环境使用）
function createHttpsAgent() {
    return new https.Agent({
        rejectUnauthorized: false,
    });
}

// 基金API URL配置
const fundApiUrl = 'https://fund.eastmoney.com/js/fundcode_search.js';
const fundNetValueApiUrl = 'https://fundgz.1234567.com.cn/js';
const fundDetailApiUrl = 'https://api.autostock.cn/v1/fund/detail';

/**
 * 设置缓存
 * @param key 缓存键
 * @param data 缓存数据
 */
function setCache(key: string, data: any): void {
    const now = Date.now();
    cache.set(key, {
        data,
        timestamp: now,
        expireTime: now + CACHE_DURATION,
    });
}

/**
 * 获取缓存
 * @param key 缓存键
 * @returns 缓存数据或null（如果缓存不存在或已过期）
 */
function getCache(key: string): any | null {
    const cachedItem = cache.get(key);
    if (!cachedItem) {
        return null;
    }

    const now = Date.now();
    if (now > cachedItem.expireTime) {
        // 缓存已过期，删除缓存项
        cache.delete(key);
        return null;
    }

    return cachedItem.data;
}

/**
 * 基金列表请求参数接口
 */
export interface FundListRequest {
    page?: number;
    limit?: number;
    blackList?: string[];
    whiteList?: string[];
}

/**
 * 获取基金详细净值信息
 * @param fundCode 基金代码
 * @returns 基金详细净值信息对象，包含所有净值API提供的字段
 */
async function fetchFundNetValue(fundCode: string): Promise<{
    fundcode: string; // 基金代码
    name: string; // 基金简称
    jzrq: string; // 净值日期（结算日期）
    dwjz: number; // 单位净值（昨日收盘净值）
    gsz: number; // 估算净值（实时盘中估值）
    gszzl: number; // 估算涨跌幅（百分比）
    gztime: string; // 估值时间（快照时间）
    estimatedChange: number; // 估算涨跌额（自行计算）
} | null> {
    try {
        const response = await axios.get(`${fundNetValueApiUrl}/${fundCode}.js`, {
            httpsAgent: createHttpsAgent(),
            responseType: 'text',
        });
        const data = response.data;

        // 解析JSONP格式的数据
        // 格式: jsonpgz({"fundcode":"000001","name":"...","jzrq":"2025-11-11","dwjz":"1.0470","gsz":"1.0449","gszzl":"-0.20","gztime":"2025-11-12 13:47"});
        const match = data.match(/jsonpgz\(({.+})\)/);
        if (!match?.[1]) {
            throw new Error('Failed to parse JSONP data');
        }

        const netValueData = JSON.parse(match[1]);

        // 解码URL编码的中文名称
        let decodedName = netValueData.name;
        try {
            decodedName = decodeURIComponent(netValueData.name);
        } catch {
            // 如果解码失败，使用原始名称
        }

        // 解析数值字段
        const dwjz = parseFloat(netValueData.dwjz) || 0; // 单位净值
        const gsz = parseFloat(netValueData.gsz) || 0; // 估算净值
        const gszzl = parseFloat(netValueData.gszzl) || 0; // 估算涨跌幅

        // 计算估算涨跌额 = 估算净值 - 单位净值
        const estimatedChange = gsz - dwjz;

        return {
            fundcode: netValueData.fundcode || '', // 基金代码
            name: decodedName || '', // 基金简称（解码后的）
            jzrq: netValueData.jzrq || '', // 净值日期（结算日期）
            dwjz: dwjz, // 单位净值（昨日收盘净值）
            gsz: gsz, // 估算净值（实时盘中估值）
            gszzl: gszzl, // 估算涨跌幅（百分比）
            gztime: netValueData.gztime || '', // 估值时间（快照时间）
            estimatedChange, // 估算涨跌额（自行计算）
        };
    } catch (error) {
        console.error(`Error fetching net value for fund ${fundCode}:`, error);
        return null;
    }
}

/**
 * 从东方财富网获取基金列表数据，并为每个基金获取详细净值信息
 * @param request 请求参数对象
 * @returns 解析后的基金数据数组，包含完整的净值信息
 */
async function fetchFundListFromApi(request: FundListRequest): Promise<FundEntity[]> {
    // 使用验证后的值
    const validatedPage = Number(request.page || 1);
    const validatedLimit = Number(request.limit || 10);
    try {
        let fundDataArray: string[][] = [];
        // 缓存键
        const cacheKey = `fund_list_funds`;

        // 尝试从缓存获取数据
        const cachedData = getCache(cacheKey);

        if (cachedData) {
            fundDataArray = cachedData as string[][];
        } else {
            const response = await axios.get(fundApiUrl, {
            httpsAgent: createHttpsAgent(),
            responseType: 'text',
        });
            const data = response.data;

            // 解析返回的JavaScript变量定义，提取基金数据
            // 数据格式: var r = [ [code, shortName, name, type, pinyin], ... ]
            const match = data.match(/var\s+r\s+=\s+(\[.+\])/);
            if (!match?.[1]) {
                throw new Error('Failed to parse fund data from API');
            }

            fundDataArray = JSON.parse(match[1]) as string[][];

            // 将数据设置到缓存中，缓存时间24小时
            setCache(cacheKey, fundDataArray);
        }

        let stockFunds: string[][] = fundDataArray;
        if (request.blackList && request.blackList.length > 0) {
            stockFunds = stockFunds.filter(
                (item) =>
                    !request.blackList!.some((type) => {
                        const description = `${item[2]} - ${item[3]}`; // 基金描述
                        return description.includes(type);
                    }),
            );
        }

        if (request.whiteList && request.whiteList.length > 0) {
            stockFunds = stockFunds.filter((item) =>
                request.whiteList!.some((type) => {
                    const description = `${item[2]} - ${item[3]}`; // 基金描述
                    return description.includes(type);
                }),
            );
        }

        fundDataArray = stockFunds;

        // 根据分页参数计算起始和结束索引
        const startIndex = (validatedPage - 1) * validatedLimit;
        const endIndex = startIndex + validatedLimit;

        // 处理指定范围的基金数据
        const pagedFunds = fundDataArray.slice(startIndex, endIndex);

        // 转换为FundEntity格式并获取净值信息
        const fundPromises = pagedFunds.map(async (item) => {
            // 获取基金详细净值信息
            const netValueInfo = await fetchFundNetValue(item[0]);

            return {
                id: item[0], // 基金唯一标识
                code: item[0], // 基金代码
                name: item[2], // 基金完整名称
                type: item[3], // 基金类型（如股票型、混合型等）
                shortName: netValueInfo?.name || '', // 基金简称
                // 净值信息
                netWorth: netValueInfo?.dwjz || 0, // 基金单位净值（昨日收盘净值）
                expectWorth: netValueInfo?.gsz || 0, // 估算净值（实时盘中估值）
                expectGrowth: netValueInfo?.gszzl || 0, // 当日估算涨跌幅（百分比）
                estimatedChange: netValueInfo?.estimatedChange || 0, // 估算涨跌额
                netWorthDate: netValueInfo?.jzrq || '', // 净值日期（结算日期）
                expectWorthDate: netValueInfo?.gztime || '', // 估值时间（快照时间）
                totalNetWorth: 0, // 默认值，从基金详情API获取更准确
                actualDayGrowth: 0, // 默认值，从基金详情API获取更准确
                weeklyGrowth: 0, // 周涨跌幅默认值
                monthlyGrowth: 0, // 月涨跌幅默认值
                threeMonthsGrowth: 0, // 三个月涨跌幅默认值
                sixMonthsGrowth: 0, // 六个月涨跌幅默认值
                annualGrowth: 0, // 年涨跌幅默认值
                manager: '', // 基金经理默认值
                fundScale: '', // 基金规模默认值
                minBuyAmount: 0, // 最小购买金额默认值
                originalBuyRate: 0, // 购买原始费率默认值
                currentBuyRate: 0, // 购买费率默认值
                establishDate: '', // 成立日期默认值
                totalCount: fundDataArray?.length || 0, // 总基金数量
                description: `${item[2]} - ${item[3]}`, // 基金描述
            };
        });

        // 并行获取所有基金的净值信息
        const result = await Promise.all(fundPromises);

        return result;
    } catch (error) {
        console.error('Error fetching fund list from API:', error);
        return [];
    }
}

/**
 * 获取基金列表
 * @param request 请求参数对象
 * @returns 基金列表和分页信息
 */
export async function getFundList(request: FundListRequest): Promise<{
    data: FundEntity[];
    total: number;
    page: number;
    limit: number;
}> {
    // 设置默认值
    const page = request.page || 1;
    const limit = request.limit || 10;

    // 从API获取分页后的基金列表
    const funds = await fetchFundListFromApi({ ...request, page, limit });

    const response = {
        data: funds,
        total: funds[0]?.totalCount || 0,
        page: page,
        limit: limit,
    };

    return response;
}

/**
 * 获取基金详细信息
 * 从基金详情API获取完整的基金数据并映射到FundEntity结构
 * @param fundCode 基金代码
 * @returns 基金详情实体对象或null（如果API调用失败）
 */
export async function getFundDetail(fundCode: string): Promise<FundEntity | null> {
    try {
        // 调用基金详情API获取完整数据
        const response = await axios.get(fundDetailApiUrl, {
            params: { code: fundCode },
            httpsAgent: createHttpsAgent(),
        });

        // 解析API响应数据
        const data = response.data;

        // 验证API响应结构
        if (!data?.data) {
            console.error(`基金详情API返回结构无效，基金代码: ${fundCode}`, data);
            return null;
        }

        // 获取API返回的基金详细数据
        const fundData = data.data;

        // 构建基金详情对象，包含API返回的所有相关字段
        const fundDetail: FundEntity = {
            /** 基金唯一标识 - 使用基金代码作为ID */
            id: fundCode,

            /** 基金代码 - API请求参数 */
            code: fundCode,

            /** 基金名称（完整名称）- 从API的name字段获取 */
            name: fundData.name || `基金${fundCode}`,

            /** 基金简称 - 优先从API的name字段截取，或使用name字段 */
            shortName: fundData.name
                ? fundData.name.length > 8
                    ? fundData.name.substring(0, 8) + '...'
                    : fundData.name
                : `基金${fundCode}`,

            /** 基金类型 - 从API的type字段获取 */
            type: fundData.type || '',

            /** 单位净值 - 从API的netWorth字段获取 */
            netWorth: parseFloat(fundData.netWorth || '0'),

            /** 估算净值 - 从API的expectWorth字段获取 */
            expectWorth: parseFloat(fundData.expectWorth || '0'),

            /** 累计净值 - 从API的totalWorth字段获取 */
            totalNetWorth: parseFloat(fundData.totalWorth || '0'),

            /** 当日估算涨跌幅 - 从API的expectGrowth字段获取 */
            expectGrowth: parseFloat(fundData.expectGrowth || '0'),

            /** 日涨跌幅 - 从API的dayGrowth字段获取 */
            actualDayGrowth: parseFloat(fundData.dayGrowth || '0'),

            /** 估算涨跌额 - 根据估算净值和单位净值计算 */
            estimatedChange:
                parseFloat(fundData.expectWorth || '0') - parseFloat(fundData.netWorth || '0'),

            /** 净值日期 - 从API的netWorthDate字段获取 */
            netWorthDate: fundData.netWorthDate || '',

            /** 估算净值日期 - 从API的expectWorthDate字段获取 */
            expectWorthDate: fundData.expectWorthDate || '',

            /** 周涨跌幅 - 从API的lastWeekGrowth字段获取 */
            weeklyGrowth: parseFloat(fundData.lastWeekGrowth || '0'),

            /** 月涨跌幅 - 从API的lastMonthGrowth字段获取 */
            monthlyGrowth: parseFloat(fundData.lastMonthGrowth || '0'),

            /** 三个月涨跌幅 - 从API的lastThreeMonthsGrowth字段获取 */
            threeMonthsGrowth: parseFloat(fundData.lastThreeMonthsGrowth || '0'),

            /** 六个月涨跌幅 - 从API的lastSixMonthsGrowth字段获取 */
            sixMonthsGrowth: parseFloat(fundData.lastSixMonthsGrowth || '0'),

            /** 年涨跌幅 - 从API的lastYearGrowth字段获取 */
            annualGrowth: parseFloat(fundData.lastYearGrowth || '0'),

            /** 基金经理 - 从API的manager字段获取 */
            manager: fundData.manager || '',

            /** 基金规模 - 从API的fundScale字段获取 */
            fundScale: fundData.fundScale || '',

            /** 最小购买金额 - 从API的buyMin字段获取 */
            minBuyAmount: parseFloat(fundData.buyMin || '0'),

            /** 购买原始费率 - 从API的buySourceRate字段获取 */
            originalBuyRate: parseFloat(fundData.buySourceRate || '0'),

            /** 购买费率 - 从API的buyRate字段获取 */
            currentBuyRate: parseFloat(fundData.buyRate || '0'),

            /** 成立日期 - 使用默认值或从其他来源获取 */
            establishDate: fundData.establishDate || '',

            /** 基金描述 - 构建基本描述 */
            description: `基金${fundCode} - ${fundData.name || '未知名称'}，类型：${fundData.type || '未知'}，基金经理：${fundData.manager || '未知'}`,
        };

        return fundDetail;
    } catch (error) {
        console.error(`Error fetching fund detail for code ${fundCode}:`, error);
        return null;
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
            httpsAgent: createHttpsAgent(),
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
