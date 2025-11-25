import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

/**
 * 获取OAuth2访问令牌的公共方法
 * @param grantType 授权类型
 * @param clientId 客户端ID
 * @param clientSecret 客户端密钥
 * @param scope 权限范围
 * @returns OAuth2访问令牌响应
 */
async function fetchOAuth2Token(
    grantType: string = 'client_credentials',
    clientId: string = 'test_app',
    clientSecret: string = 'test_secret',
    scope: string = 'read,write',
) {
    try {
        console.log('OAuth2 token接口被调用:', new Date().toISOString());

        // 在开发环境中模拟返回访问令牌（由于远程接口可能无法访问）
        const mockResponse = {
            status: 200,
            statusText: 'OK',
            data: {
                access_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6InRlc3RfYXBwIiwibmFtZSI6Iua1i-ivleW8gOWPkeiAhSIsInNjb3BlcyI6WyJyZWFkIiwid3JpdGUiXSwiaWF0IjoxNzY0MDUwOTM0LCJleHAiOjE3NjQwNTE4MzR9.4-V1-0OLG6vck1l1zSN-2igKdOYm2cua93nZcokCWwM',
                token_type: 'Bearer',
                expires_in: 900,
                scope: scope,
            },
            headers: {},
            config: {},
        };

        console.log('使用模拟的OAuth2 token响应:', mockResponse.data);

        return mockResponse;

        /* 实际调用远程接口的代码（暂时注释掉）
        // 设置请求体数据
        const requestBody = {
            grant_type: grantType,
            client_id: clientId,
            client_secret: clientSecret,
            scope: scope,
        };

        // 使用axios发送请求，支持忽略SSL证书验证
        const response = await axios.post(
            'https://maiqishare.xyz/open-api/oauth2/token',
            requestBody,
            {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false, // 忽略SSL证书验证，仅在开发环境使用
                }),
            },
        );

        console.log('OAuth2 token响应数据:', response.data);
        
        return response;
        */
    } catch (error) {
        console.error('调用远程OAuth2 token接口时出错:', error);
        throw error;
    }
}

/**
 * 调用基金列表接口的方法
 * @param accessToken OAuth2访问令牌
 * @param page 页码
 * @param limit 每页数量
 * @returns 基金列表响应
 */
async function fetchFundList(accessToken: string, page: number = 1, limit: number = 10) {
    try {
        // 使用axios发送GET请求，在Header中添加Authorization
        const response = await axios.get('https://maiqishare.xyz/open-api/fund/list', {
            params: {
                page,
                limit,
            },
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // 忽略SSL证书验证，仅在开发环境使用
            }),
        });

        return response;
    } catch (error) {
        console.error('调用远程基金列表接口时出错:', error);
        throw error;
    }
}

// 重构后的GET方法，先获取token再调用基金列表接口
export async function GET(request: Request) {
    try {
        // 从URL获取查询参数
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);

        // 第一步：获取OAuth2访问令牌
        const tokenResponse = await fetchOAuth2Token();
        console.log('获取到的token响应完整数据:', tokenResponse);
        const { access_token } = tokenResponse.data;

        if (!access_token) {
            console.error('响应中没有access_token字段:', tokenResponse.data);
            throw new Error('无法获取有效的访问令牌');
        }

        // 第二步：使用获取到的access_token调用基金列表接口
        const fundListResponse = await fetchFundList(access_token, page, limit);

        // 返回基金列表响应数据
        return NextResponse.json(fundListResponse.data, {
            status: fundListResponse.status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('API调用过程中发生错误:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: '获取基金列表失败',
                error: error instanceof Error ? error.message : '未知错误',
            },
            {
                status: 500,
            },
        );
    }
}
