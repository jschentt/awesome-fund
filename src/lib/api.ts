import axios from 'axios';
import https from 'https';

// 定义 OAuth2 令牌缓存接口
interface TokenCache {
    token: any;
    timestamp: number;
    expiryTime: number;
}

// 创建缓存对象
let tokenCache: TokenCache | null = null;
// 缓存有效期（1小时，单位：毫秒）
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * 获取OAuth2访问令牌的公共方法，带1小时缓存
 * @param grantType 授权类型
 * @param clientId 客户端ID
 * @param clientSecret 客户端密钥
 * @param scope 权限范围
 * @returns OAuth2访问令牌响应
 */
export async function fetchOAuth2Token(
    grantType: string = 'client_credentials',
    clientId: string = 'test_app',
    clientSecret: string = 'test_secret',
    scope: string = 'read,write',
) {
    const now = Date.now();

    // 检查缓存是否有效
    if (tokenCache && now < tokenCache.expiryTime) {
        console.log('使用缓存的OAuth2令牌');
        return tokenCache.token;
    }

    try {
        console.log('OAuth2 token接口被调用，获取新令牌:', new Date().toISOString());

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

        // 更新缓存
        tokenCache = {
            token: response,
            timestamp: now,
            expiryTime: now + CACHE_DURATION,
        };

        console.log('OAuth2 token获取成功并缓存');

        return response;
    } catch (error) {
        console.error('调用远程OAuth2 token接口时出错:', error);
        throw error;
    }
}

/**
 * 推送钉钉消息的方法
 * @param accessToken OAuth2访问令牌
 * @param title 消息标题
 * @param text 消息内容（Markdown格式）
 * @returns 推送响应
 */
export async function pushDingTalkMessage(
    accessToken: string,
    title: string,
    text: string,
    webhookUrl?: string,
) {
    try {
        console.log('推送钉钉消息:', title);

        const response = await axios.post(
            'https://maiqishare.xyz/open-api/dingtalk/markdown',
            {
                title,
                text,
                webhookUrl,
            },
            {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false, // 忽略SSL证书验证，仅在开发环境使用
                }),
            },
        );

        console.log('钉钉消息推送结果:', response.data);
        return response;
    } catch (error) {
        // console.error('推送钉钉消息失败:', error);
        throw error;
    }
}
