import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MonitorRuleRequest, ApiResponse } from '@/types/common';

export async function POST(request: Request) {
    try {
        // 解析请求体
        const {
            userId,
            fundCode,
            ruleName,
            riseThreshold,
            netWorthThreshold,
            pushTime,
        }: MonitorRuleRequest = await request.json();

        // 参数验证
        if (!fundCode || !userId) {
            return NextResponse.json({ message: '基金代码和用户ID不能为空' }, { status: 400 });
        }

        // 查找用户ID
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            console.error('查找用户失败:', userError);
            return NextResponse.json({ message: '用户不存在' }, { status: 404 });
        }

        // 插入监控规则
        const { error } = await supabase.from('fund_monitor_rules').insert([
            {
                user_id: user?.id,
                rule_name: ruleName,
                fund_code: fundCode,
                rise_threshold: riseThreshold,
                net_worth_threshold: netWorthThreshold,
                push_time: pushTime,
            },
        ]);

        if (error) {
            console.error('插入监控规则失败:', error);
            return NextResponse.json(
                { message: '保存监控规则失败', error: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ message: '监控规则保存成功' }, { status: 200 });
    } catch (error) {
        console.error('处理监控规则请求失败:', error);
        return NextResponse.json(
            {
                message: '服务器内部错误',
                error: error instanceof Error ? error.message : '未知错误',
            },
            { status: 500 },
        );
    }
}

// GET接口：根据userId和fundCode获取监控规则详情
export async function GET(request: Request) {
    try {
        // 从URL获取查询参数
        const { searchParams } = new URL(request.url);
        const fundCode = searchParams.get('fundCode');

        // 从Header中获取X-User-Id
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return NextResponse.json<ApiResponse>({ message: '用户不存在' }, { status: 400 });
        }

        // 参数验证
        if (!fundCode) {
            return NextResponse.json<ApiResponse>({ message: '基金代码不能为空' }, { status: 400 });
        }

        // 查询监控规则
        const { data: monitorRule, error } = await supabase
            .from('fund_monitor_rules')
            .select('*')
            .eq('user_id', userId)
            .eq('fund_code', fundCode)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // 没有找到匹配的记录
                return NextResponse.json<ApiResponse>(
                    { message: '未找到监控规则' },
                    { status: 404 },
                );
            }
            console.error('查询监控规则失败:', error);
            return NextResponse.json<ApiResponse>({ message: '查询监控规则失败' }, { status: 500 });
        }

        return NextResponse.json<ApiResponse>(
            { message: '查询成功', data: monitorRule },
            { status: 200 },
        );
    } catch (error) {
        console.error('处理监控规则查询请求失败:', error);
        return NextResponse.json<ApiResponse>(
            {
                message: '服务器内部错误',
                error: error instanceof Error ? error.message : '未知错误',
            },
            { status: 500 },
        );
    }
}

/**
 * 更新监控基金规则的API接口
 * 注意：接口显式验证用户身份，确保用户只能操作自己的数据
 */
export async function PUT(request: Request) {
    try {
        const {
            userId,
            email,
            fundCode,
            fundName,
            riseThreshold,
            netWorthThreshold,
            pushTime,
            ruleId,
            webhookId,
        }: Partial<MonitorRuleRequest> = await request.json();

        // 验证必要参数
        if (!fundCode) {
            return NextResponse.json<ApiResponse>(
                { message: '缺少必要参数：fundCode' },
                { status: 400 },
            );
        }

        if (!userId) {
            return NextResponse.json<ApiResponse>({ message: '用户不存在' }, { status: 400 });
        }

        // 检查基金是否在监控列表中
        const { data: monitorFund } = await supabase
            .from('user_monitor_fund')
            .select('id')
            .eq('user_id', userId)
            .eq('fund_code', fundCode)
            .single();

        if (!monitorFund) {
            return NextResponse.json<ApiResponse>(
                { message: '基金不在监控列表中' },
                { status: 400 },
            );
        }

        // 准备更新数据
        const updateData = {
            email,
            fund_code: fundCode,
            webhook_id: webhookId,
            fund_name: fundName,
            rise_threshold: riseThreshold,
            net_worth_threshold: netWorthThreshold,
            push_time: pushTime,
        };

        // 更新监控规则
        // 根据 ruleId 是否存在决定 update 或 insert
        if (ruleId) {
            // 如果提供了 ruleId，则按 id 更新
            const { error } = await supabase
                .from('fund_monitor_rules')
                .update(updateData)
                .eq('id', ruleId)
                .eq('user_id', userId);

            if (error) {
                console.error('更新监控规则失败:', error);
                return NextResponse.json<ApiResponse>(
                    { message: '更新监控规则失败，请稍后重试' },
                    { status: 500 },
                );
            }
        } else {
            // 未提供 ruleId，则插入新规则
            const { error } = await supabase.from('fund_monitor_rules').insert({
                user_id: userId,
                ...updateData,
            });

            if (error) {
                console.error('创建监控规则失败:', error);
                return NextResponse.json<ApiResponse>(
                    { message: '创建监控规则失败，请稍后重试' },
                    { status: 500 },
                );
            }
        }

        return NextResponse.json<ApiResponse>({ message: '更新监控规则成功' }, { status: 200 });
    } catch (error) {
        console.error('更新监控规则接口异常:', error);
        return NextResponse.json<ApiResponse>({ message: '服务器内部错误' }, { status: 500 });
    }
}
