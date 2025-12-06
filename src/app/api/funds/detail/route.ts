import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types/common';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fundCode = searchParams.get('code');

    // 从Header中获取X-User-Id
    const userId = request.headers.get('X-User-Id');

    if (!fundCode) {
        return new Response(JSON.stringify({ error: '缺少 fundCode' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (!userId) {
        return NextResponse.json<ApiResponse>({ message: '用户不存在' }, { status: 400 });
    }

    try {
        // 查询 user_favorite_fund 表
        const { data: favoriteData, error: favoriteError } = await supabase
            .from('user_favorite_fund')
            .select('fund_code')
            .eq('fund_code', fundCode)
            .eq('user_id', userId)
            .maybeSingle();

        if (favoriteError) {
            throw favoriteError;
        }
        const isFavorite = !!favoriteData;

        // 查询 user_monitor_fund 表
        const { data: monitorData, error: monitorError } = await supabase
            .from('user_monitor_fund')
            .select('fund_code')
            .eq('fund_code', fundCode)
            .eq('user_id', userId)
            .maybeSingle();

        if (monitorError) {
            throw monitorError;
        }
        const isMonitoring = !!monitorData;

        return NextResponse.json<ApiResponse<{ isFavorite: boolean; isMonitoring: boolean }>>(
            { message: '获取数据成功', data: { isFavorite, isMonitoring } },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json<ApiResponse>(
            { message: '服务器内部错误，请稍后重试' },
            { status: 500 },
        );
    }
}
