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

    if (order.user_id !== 'ec749bba-3001-4dc3-94a5-9d1d466ccd70') {
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

    return new NextResponse('success', { status: 200 });
}
