import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface ApiResponse<T = any> {
    message: string;
    data?: T;
}

// 标记为动态路由，因为使用了 request.headers
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 从Header中获取X-User-Id
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
        return NextResponse.json<ApiResponse>(
            { message: '用户不存在', data: null },
            { status: 200 },
        );
    }

    try {
        // 查询user_member_order表中user_id等于userId且status=1、pay_status=2的所有数据
        const { data, error } = await supabase
            .from('user_member_order')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 1) // 有效订单
            .eq('pay_status', 2); // 已支付

        if (error) {
            console.error('查询用户会员订单失败:', error);
            return NextResponse.json<ApiResponse>(
                { message: '查询用户会员订单失败', data: null },
                { status: 200 },
            );
        }

        const now = new Date();

        // 筛选出当前时间在有效期内的订单，并按 end_time 倒序取第一条（end_time 最大）
        const validOrder = (data || [])
            .filter((item) => {
                const start = new Date(item.start_time);
                const end = new Date(item.end_time);
                return now >= start && now <= end;
            })
            .sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())[0];

        if (!validOrder) {
            return NextResponse.json<ApiResponse>(
                { message: '用户当前没有有效会员订单', data: null },
                { status: 200 },
            );
        }

        const { plan_id } = validOrder;

        // 查询member_plan表中id等于plan_id的单条数据
        const { data: planData, error: planError } = await supabase
            .from('member_plan')
            .select('*')
            .eq('id', plan_id)
            .single();

        if (planError) {
            console.error('查询用户会员计划失败:', planError);
            return NextResponse.json<ApiResponse>(
                { message: '查询用户会员计划失败', data: null },
                { status: 200 },
            );
        }

        if (!planData || planData.length === 0) {
            return NextResponse.json<ApiResponse>(
                { message: '用户会员计划不存在', data: null },
                { status: 200 },
            );
        }

        // 关联dingtalk_webhook_user和dingtalk_webhook表，条件：dingtalk_webhook_user.webhook_id = dingtalk_webhook?.id
        // 过滤条件：dingtalk_webhook_user.user_id = userId 且 status = 1 且 webhook_id ≠ 1
        const { data: webhookUser, error: webhookError } = await supabase
            .from('dingtalk_webhook_user')
            .select(
                `
                *,
                dingtalk_webhook!inner (
                    qr_code_url,
                    webhook_url,
                    id
                )
            `,
            )
            .eq('user_id', userId)
            .eq('status', 1)
            .neq('webhook_id', 1)
            .single();

        return NextResponse.json<ApiResponse>(
            {
                message: '查询用户会员订单成功',
                data: {
                    plan_code: planData.plan_code,
                    plan_name: planData.plan_name,
                    qr_code_url: webhookUser?.dingtalk_webhook?.qr_code_url,
                    webhook_id: webhookUser?.dingtalk_webhook?.id,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('服务器错误:', error);
        return NextResponse.json<ApiResponse>({ message: '服务器错误' }, { status: 500 });
    }
}
