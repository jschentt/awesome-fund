import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createOrderNum, generate_xh_hash } from '@/lib/utils';
import qs from 'qs';

/**
 * @description: 创建7支付订单
 */
interface CreateSevenPayOrderParams {
    userId: string;
    orderNo: string;
    name: string;
    payAmount: number;
    paymentMethod: 'wechat' | 'alipay';
}

const createSevenPayOrder = async (params: CreateSevenPayOrderParams) => {
    const sevenPayParams = {
        pid: process.env.SEVEN_PAY_APPID, // 商户ID
        out_trade_no: params.orderNo, // 商户订单号
        notify_url: process.env.SEVEN_PAY_NOTIFY_URL, // 异步通知地址
        return_url: process.env.WEB_SITE, // 可选。用户支付成功后，我们会让用户浏览器自动跳转到这个网址
        name: params.name, // 商品名称	（商品名称不超过100字）
        type: params.paymentMethod,
        // 兼容管理员
        money: params.userId === '0bd34682-3671-431d-a879-21362a078b82' ? '0.01' : params.payAmount, // 商品金额（单位：元，最大2位小数）
        sign_type: 'MD5',
    } as Record<string, any>;

    // 添加hash值
    sevenPayParams.sign = generate_xh_hash(sevenPayParams, process.env.SEVEN_PAY_APPSECRET!);

    return `${process.env.SEVEN_H5_PAY_HOST}?${qs.stringify(sevenPayParams)}`;
};

export async function POST(request: Request) {
    try {
        const { userId, subscribType, paymentMethod } = await request.json();
        // 从 member_plan 表获取价格与 ID
        const { data: plan, error: planError } = await supabase
            .from('member_plan')
            .select('price_month, price_year, id, plan_name')
            .eq('plan_code', subscribType)
            .single();

        if (planError || !plan) {
            console.error('查询套餐失败:', planError);
            return NextResponse.json({ error: '无效的订阅类型' }, { status: 400 });
        }

        // 计算订阅金额
        const subscribePrice =
            subscribType === 'year'
                ? plan.price_year
                : subscribType === 'month'
                  ? plan.price_month
                  : 0;

        const extraData = {
            name: plan.plan_name,
        };

        const postData = {
            order_no: createOrderNum(),
            user_id: userId,
            plan_id: plan.id,
            pay_amount: subscribePrice,
            pay_method: paymentMethod,
            // '支付状态：0-待支付 1-支付中 2-已支付 3-支付失败'
            pay_status: 0,
            // pay_time: new Date().toISOString(),
            start_time: new Date().toISOString(),
            end_time: new Date(
                new Date().setMonth(new Date().getMonth() + (subscribType === 'year' ? 12 : 1)),
            ).toISOString(),
            // 订阅状态：0-无效/关闭 1-有效
            status: 1,
        };

        // 插入订单数据到 user_member_order 表
        const { error: insertError } = await supabase.from('user_member_order').insert([postData]);

        if (insertError) {
            console.error('插入订单失败:', insertError);
            return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
        }

        const ret = await createSevenPayOrder({
            userId: postData.user_id,
            orderNo: postData.order_no,
            name: extraData.name,
            payAmount: postData.pay_amount,
            paymentMethod: postData.pay_method,
        });

        return NextResponse.json({ message: '登录成功', data: { payUrl: ret } }, { status: 200 });
    } catch (error) {
        console.error('登录失败:', error);
        return NextResponse.json({ error: '登录失败' }, { status: 500 });
    }
}
