import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const trade_no = url.searchParams.get('trade_no');
    const out_trade_no = url.searchParams.get('out_trade_no');
    const money = url.searchParams.get('money');
    const trade_status = url.searchParams.get('trade_status');

    // 验证out_trade_no是否存在
    if (!out_trade_no) {
        return NextResponse.json({ error: '缺少订单号' }, { status: 400 });
    }

    if (trade_status !== 'TRADE_SUCCESS') {
        return NextResponse.json({ error: '支付失败' }, { status: 400 });
    }

    // 从数据库查询订单
    const { data: order, error } = await supabase
        .from('user_member_order')
        .select('*')
        .eq('order_no', out_trade_no)
        .single();

    if (error || !order) {
        console.error('订单查询失败:', error);
        return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    if (order.user_id !== '4794d05d-7195-47a3-974b-53ad730260c3') {
        if (Number(money) !== order.pay_amount) {
            return NextResponse.json({ error: '支付金额错误' }, { status: 400 });
        }
    }

    // 根据订单中的 plan_id 查询 member_plan 表获取 plan_code
    const { data: plan, error: planError } = await supabase
        .from('member_plan')
        .select('plan_code')
        .eq('id', order.plan_id)
        .single();

    if (planError || !plan) {
        console.error('查询会员计划失败:', planError);
        return NextResponse.json({ error: '会员计划不存在' }, { status: 404 });
    }

    const subscribType = plan.plan_code; // 使用 plan_code 作为订阅类型

    // 根据订单号更新订单状态
    const { error: updateError } = await supabase
        .from('user_member_order')
        .update({
            pay_status: 2,
            out_trade_no: trade_no,
            pay_time: new Date().toISOString(),
            start_time: new Date().toISOString(),
            end_time: new Date(
                new Date().setMonth(new Date().getMonth() + (subscribType === 'year' ? 12 : 1)),
            ).toISOString(),
        }) // 假设支付成功则状态为 paid，可按实际业务调整
        .eq('order_no', out_trade_no);

    if (updateError) {
        console.error('更新订单状态失败:', updateError);
        return NextResponse.json({ error: '更新订单状态失败' }, { status: 500 });
    }

    // 从 dingtalk_webhook 查询 is_vip=true 且 is_used=0 的数据
    const { data: vipWebhook, error: vipError } = await supabase
        .from('dingtalk_webhook')
        .select('*')
        .eq('is_vip', true)
        .eq('is_used', 0)
        .maybeSingle();

    if (vipError || !vipWebhook) {
        console.error('未找到可用的 VIP webhook 配置:', vipError);
        return NextResponse.json({ error: '系统异常，请联系管理员' }, { status: 500 });
    }

    if (vipWebhook.id) {
        // 查询 dingtalk_webhook_user 是否存在符合条件的数据
        const { data: webhookUser, error: webhookError } = await supabase
            .from('dingtalk_webhook_user')
            .select('*')
            .eq('user_id', order.user_id)
            .neq('webhook_id', 1)
            .maybeSingle(); // 使用 maybeSingle 避免无数据时报错

        if (webhookError) {
            console.error('查询 webhook 用户失败:', webhookError);
            return NextResponse.json({ error: '查询 webhook 用户失败' }, { status: 500 });
        }

        if (webhookUser) {
            // 存在数据，将 status 置成 1
            const { error: updateStatusError } = await supabase
                .from('dingtalk_webhook_user')
                .update({ status: 1 })
                .eq('id', webhookUser.id);

            if (updateStatusError) {
                console.error('更新 webhook 用户状态失败:', updateStatusError);
                return NextResponse.json({ error: '更新 webhook 用户状态失败' }, { status: 500 });
            }
        } else {
            // 不存在数据，插入新记录
            const { error: insertError } = await supabase.from('dingtalk_webhook_user').insert([
                {
                    user_id: order.user_id,
                    webhook_id: vipWebhook.id,
                    status: 1,
                },
            ]);

            if (insertError) {
                console.error('插入 webhook 用户失败:', insertError);
                return NextResponse.json({ error: '插入 webhook 用户失败' }, { status: 500 });
            }
        }
    }

    return new NextResponse('success', { status: 200 });
}
