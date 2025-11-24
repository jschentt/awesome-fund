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

        return response;
    } catch (error) {
        console.error('调用远程OAuth2 token接口时出错:', error);
        throw error;
    }
}

// OAuth2 token接口，调用远程服务
export async function GET(request: Request) {
    try {
        // 调用公共方法获取OAuth2令牌
        const response = await fetchOAuth2Token();

        // 返回远程接口的响应数据
        return NextResponse.json(response.data, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'error',
                message: '调用远程接口失败',
                error: error instanceof Error ? error.message : '未知错误',
            },
            {
                status: 500,
            },
        );
    }
}
