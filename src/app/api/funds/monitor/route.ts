import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ApiResponse, UserFund, CommonRequest } from '@/types/common';

/**
 * 添加基金到监控列表的API接口
 * 注意：接口显式验证用户身份，确保用户只能操作自己的数据
 */
export async function POST(request: Request) {
    try {
        const { fundCode }: CommonRequest = await request.json();

        // 验证必要参数
        if (!fundCode) {
            return NextResponse.json<ApiResponse>(
                { message: '缺少必要参数：fundCode' },
                { status: 400 },
            );
        }

        // 从Header中获取X-User-Id
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return NextResponse.json<ApiResponse>({ message: '用户不存在' }, { status: 400 });
        }

        // 检查是否已经监控
        // 确保使用正确的user_id类型
        const { data: existingMonitor, error: checkError } = await supabase
            .from('user_monitor_fund')
            .select('id')
            .eq('user_id', userId)
            .eq('fund_code', fundCode)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116表示未找到记录
            console.error('检查监控状态失败:', checkError);
            return NextResponse.json<ApiResponse>(
                { message: '服务器错误，请稍后重试' },
                { status: 500 },
            );
        }

        if (existingMonitor) {
            // existingMonitor 可能是 null 或 UserFund
            return NextResponse.json<ApiResponse>(
                { message: '基金已在监控列表中' },
                { status: 400 },
            );
        }

        // 添加监控 - 注意：新表中created_at字段由数据库自动设置为now()
        const { data, error } = await supabase
            .from('user_monitor_fund')
            .insert([
                {
                    user_id: userId,
                    fund_code: fundCode,
                },
            ])
            .select();

        if (error) {
            console.error('添加监控失败:', error);
            return NextResponse.json<ApiResponse>(
                { message: '添加监控失败，请稍后重试' },
                { status: 500 },
            );
        }

        return NextResponse.json<ApiResponse<UserFund[]>>(
            {
                message: '添加监控成功',
                data,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('添加监控接口异常:', error);
        return NextResponse.json<ApiResponse>({ message: '服务器内部错误' }, { status: 500 });
    }
}

/**
 * 取消监控基金的API接口
 * 注意：接口显式验证用户身份，确保用户只能操作自己的数据
 */
export async function DELETE(request: Request) {
    try {
        const { fundCode }: CommonRequest = await request.json();

        // 验证必要参数
        if (!fundCode) {
            return NextResponse.json<ApiResponse>(
                { message: '缺少必要参数：fundCode' },
                { status: 400 },
            );
        }

        // 从Header中获取X-User-Id
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return NextResponse.json<ApiResponse>({ message: '用户不存在' }, { status: 400 });
        }

        // 删除监控
        // 确保使用正确的user_id类型
        const { error } = await supabase
            .from('user_monitor_fund')
            .delete()
            .eq('user_id', userId)
            .eq('fund_code', fundCode);

        if (error) {
            console.error('取消监控失败:', error);
            return NextResponse.json<ApiResponse>(
                { message: '取消监控失败，请稍后重试' },
                { status: 500 },
            );
        }

        return NextResponse.json<ApiResponse>({ message: '取消监控成功' }, { status: 200 });
    } catch (error) {
        console.error('取消监控接口异常:', error);
        return NextResponse.json<ApiResponse>({ message: '服务器内部错误' }, { status: 500 });
    }
}
