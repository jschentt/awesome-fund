import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getFundV2Detail } from '@/lib/fund';

// 标记为动态路由，因为使用了 request.headers
export const dynamic = 'force-dynamic';

// 定义请求和响应接口
export interface MonitorListRequest {
    email: string;
}

export interface ApiResponse<T = any> {
    message: string;
    data?: T;
}

export interface FundDetail {
    code: string;
    name: string;
    // 其他基金详情字段
    [key: string]: any;
}

export interface MonitorFund extends FundDetail {
    monitor_time: string;
}

// GET方法获取用户监控基金列表
export async function GET(request: Request) {
    try {
        // 从Header中获取X-User-Id
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return NextResponse.json<ApiResponse>({ message: '用户不存在' }, { status: 400 });
        }

        // 查询用户监控的基金列表
        const { data: monitorFunds, error: monitorQueryError } = await supabase
            .from('user_monitor_fund')
            .select('fund_code, created_at')
            .eq('user_id', userId);

        if (monitorQueryError) {
            console.error('查询用户监控基金失败:', monitorQueryError);
            return NextResponse.json<ApiResponse>(
                { message: '获取监控列表失败，请稍后重试' },
                { status: 500 },
            );
        }

        // 如果用户没有监控任何基金，直接返回空列表
        if (!monitorFunds || monitorFunds.length === 0) {
            return NextResponse.json<ApiResponse<MonitorFund[]>>(
                { message: '获取监控列表成功', data: [] },
                { status: 200 },
            );
        }

        // 为每个监控的基金查询详情
        const fundCodes = monitorFunds.map((f) => f.fund_code);
        const fundDetailsPromises = fundCodes.map(async (fundCode) => {
            try {
                const fundDetail = await getFundV2Detail(fundCode);
                // 找到对应的监控时间
                const monitorRecord = monitorFunds.find((f) => f.fund_code === fundCode);

                return {
                    data: fundDetail || ({} as FundDetail),
                    monitor_time: monitorRecord?.created_at || new Date().toISOString(),
                } as any;
            } catch (error) {
                console.error(`获取基金${fundCode}详情失败:`, error);
                // 如果某个基金详情获取失败，返回基本信息
                return {
                    code: fundCode,
                    name: `基金${fundCode}`,
                    monitor_time:
                        monitorFunds.find((f) => f.fund_code === fundCode)?.created_at ||
                        new Date().toISOString(),
                    error: '详情获取失败',
                };
            }
        });

        // 等待所有基金详情查询完成
        const fundDetails = await Promise.all(fundDetailsPromises);

        // 返回完整的监控列表
        return NextResponse.json<ApiResponse<MonitorFund[]>>(
            { message: '获取监控列表成功', data: fundDetails },
            { status: 200 },
        );
    } catch (error) {
        console.error('获取监控列表时发生错误:', error);
        return NextResponse.json<ApiResponse>(
            { message: '服务器内部错误，请稍后重试' },
            { status: 500 },
        );
    }
}
