import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase';
import type { ApiResponse, UserFavorite } from '../../../../src/types/favorite';

// 更新请求类型接口
interface FavoriteRequest {
    fundCode: string;
    email: string;
}

/**
 * 添加基金到收藏列表的API接口
 * 注意：接口显式验证用户身份，确保用户只能操作自己的数据
 */
export async function POST(request: Request) {
    try {
        const { fundCode, email }: FavoriteRequest = await request.json();

        // 验证必要参数
        if (!fundCode || !email) {
            return NextResponse.json<ApiResponse>(
                { message: '缺少必要参数：fundCode和email' },
                { status: 400 },
            );
        }

        // 通过email查询用户ID
        const { data: user, error: userQueryError } = await supabaseServer
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (userQueryError) {
            if (userQueryError.code === 'PGRST116') {
                return NextResponse.json<ApiResponse>({ message: '用户不存在' }, { status: 404 });
            }
            console.error('查询用户信息失败:', userQueryError);
            return NextResponse.json<ApiResponse>(
                { message: '服务器错误，请稍后重试' },
                { status: 500 },
            );
        }

        console.log('用户ID:', user.id);

        // 检查是否已经收藏
        // 使用服务端客户端绕过RLS，并确保使用正确的user_id类型
        const { data: existingFavorite, error: checkError } = await supabaseServer
            .from('user_favorite_fund')
            .select('id')
            .eq('user_id', String(user.id))
            .eq('fund_code', fundCode)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116表示未找到记录
            console.error('检查收藏状态失败:', checkError);
            return NextResponse.json<ApiResponse>(
                { message: '服务器错误，请稍后重试' },
                { status: 500 },
            );
        }

        if (existingFavorite) {
            // existingFavorite 可能是 null 或 UserFavorite
            return NextResponse.json<ApiResponse>(
                { message: '基金已在收藏列表中' },
                { status: 400 },
            );
        }

        // 添加收藏 - 注意：新表中created_at字段由数据库自动设置为now()
        const { data, error } = await supabaseServer
            .from('user_favorite_fund')
            .insert([
                {
                    user_id: String(user.id),
                    fund_code: fundCode,
                },
            ])
            .select();

        if (error) {
            console.error('添加收藏失败:', error);
            return NextResponse.json<ApiResponse>(
                { message: '添加收藏失败，请稍后重试' },
                { status: 500 },
            );
        }

        return NextResponse.json<ApiResponse<UserFavorite[]>>(
            {
                message: '添加收藏成功',
                data,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('添加收藏接口异常:', error);
        return NextResponse.json<ApiResponse>({ message: '服务器内部错误' }, { status: 500 });
    }
}

/**
 * 取消收藏基金的API接口
 * 注意：接口显式验证用户身份，确保用户只能操作自己的数据
 */
export async function DELETE(request: Request) {
    try {
        const { fundCode, email }: FavoriteRequest = await request.json();

        // 验证必要参数
        if (!fundCode || !email) {
            return NextResponse.json<ApiResponse>(
                { message: '缺少必要参数：fundCode和email' },
                { status: 400 },
            );
        }

        // 通过email查询用户ID
        const { data: user, error: userQueryError } = await supabaseServer
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (userQueryError) {
            if (userQueryError.code === 'PGRST116') {
                return NextResponse.json<ApiResponse>({ message: '用户不存在' }, { status: 404 });
            }
            console.error('查询用户信息失败:', userQueryError);
            return NextResponse.json<ApiResponse>(
                { message: '服务器错误，请稍后重试' },
                { status: 500 },
            );
        }

        // 删除收藏
        // 使用服务端客户端绕过RLS，并确保使用正确的user_id类型
        const { error } = await supabaseServer
            .from('user_favorite_fund')
            .delete()
            .eq('user_id', String(user.id))
            .eq('fund_code', fundCode);

        if (error) {
            console.error('取消收藏失败:', error);
            return NextResponse.json<ApiResponse>(
                { message: '取消收藏失败，请稍后重试' },
                { status: 500 },
            );
        }

        return NextResponse.json<ApiResponse>({ message: '取消收藏成功' }, { status: 200 });
    } catch (error) {
        console.error('取消收藏接口异常:', error);
        return NextResponse.json<ApiResponse>({ message: '服务器内部错误' }, { status: 500 });
    }
}
