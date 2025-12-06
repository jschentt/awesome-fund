import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import axios from 'axios';
import https from 'https';
import { fetchOAuth2Token } from '@/lib/api';

// 定义请求和响应接口
export interface FavoriteListRequest {
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

export interface FavoriteFund extends FundDetail {
    favorite_time: string;
}

// GET方法获取用户收藏基金列表
export async function GET(request: Request) {
    try {
        // 从Header中获取X-User-Id
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return NextResponse.json<ApiResponse>({ message: '用户不存在' }, { status: 400 });
        }

        // 查询用户收藏的基金列表
        const { data: favoriteFunds, error: favoriteQueryError } = await supabase
            .from('user_favorite_fund')
            .select('fund_code, created_at')
            .eq('user_id', userId);

        if (favoriteQueryError) {
            console.error('查询用户收藏基金失败:', favoriteQueryError);
            return NextResponse.json<ApiResponse>(
                { message: '获取收藏列表失败，请稍后重试' },
                { status: 500 },
            );
        }

        // 如果用户没有收藏任何基金，直接返回空列表
        if (!favoriteFunds || favoriteFunds.length === 0) {
            return NextResponse.json<ApiResponse<FavoriteFund[]>>(
                { message: '获取收藏列表成功', data: [] },
                { status: 200 },
            );
        }

        // 为每个收藏的基金查询详情
        const fundCodes = favoriteFunds.map((f) => f.fund_code);
        const fundDetailsPromises = fundCodes.map(async (fundCode) => {
            try {
                // 从API获取基金详情
                // const detailResponse = await fetch(`http://localhost:3000/api/funds/${fundCode}`);

                // 第一步：获取OAuth2访问令牌
                const tokenResponse = await fetchOAuth2Token();
                const { access_token } = tokenResponse.data.data;

                if (!access_token) {
                    console.error('响应中没有access_token字段:', tokenResponse.data);
                    return NextResponse.json({ error: '无法获取有效的访问令牌' }, { status: 500 });
                }

                const API_BASE_URL = 'https://maiqishare.xyz/open-api/fund/detail/v2';

                // 调用真实API获取基金详情
                const response = await axios.get(`${API_BASE_URL}/${fundCode}`, {
                    headers: {
                        accept: 'application/json',
                        Authorization: `Bearer ${access_token}`,
                    },
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false, // 忽略SSL证书验证，仅在开发环境使用
                    }),
                });

                // axios会自动解析JSON，直接获取响应数据
                const detailResponse: ApiResponse = response.data;

                // 检查API响应状态
                if ((detailResponse as any).code !== 0) {
                    return NextResponse.json(
                        { error: detailResponse.message || '获取基金数据失败' },
                        { status: 400 },
                    );
                }

                const fundDetail = await detailResponse.data;

                // 找到对应的收藏时间
                const favoriteRecord = favoriteFunds.find((f) => f.fund_code === fundCode);

                return {
                    ...fundDetail,
                    favorite_time: favoriteRecord?.created_at || new Date().toISOString(),
                };
            } catch (error) {
                console.error(`获取基金${fundCode}详情失败:`, error);
                // 如果某个基金详情获取失败，返回基本信息
                return {
                    code: fundCode,
                    name: `基金${fundCode}`,
                    favorite_time:
                        favoriteFunds.find((f) => f.fund_code === fundCode)?.created_at ||
                        new Date().toISOString(),
                    error: '详情获取失败',
                };
            }
        });

        // 等待所有基金详情查询完成
        const fundDetails = await Promise.all(fundDetailsPromises);

        // 返回完整的收藏列表
        return NextResponse.json<ApiResponse<FavoriteFund[]>>(
            { message: '获取收藏列表成功', data: fundDetails },
            { status: 200 },
        );
    } catch (error) {
        console.error('获取收藏列表时发生错误:', error);
        return NextResponse.json<ApiResponse>(
            { message: '服务器内部错误，请稍后重试' },
            { status: 500 },
        );
    }
}
