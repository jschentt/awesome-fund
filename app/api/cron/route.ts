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

        console.log('OAuth2 token响应数据:', response.data);

        return response;
    } catch (error) {
        // console.error('调用远程OAuth2 token接口时出错:', error);
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
        console.log('Access Token being used:', accessToken);
        // 使用axios发送POST请求，在Header中添加Authorization
        const response = await axios.post(
            'https://maiqishare.xyz/open-api/fund/list',
            {
                page,
                limit,
                blackList: ['货币', '债券', '纯债', '后端'],
                whiteList: ['联接C', '增强C', '指数C'],
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

        return response;
    } catch (error) {
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
async function pushDingTalkMessage(accessToken: string, title: string, text: string) {
    try {
        console.log('推送钉钉消息:', title);

        const response = await axios.post(
            'https://maiqishare.xyz/open-api/dingtalk/markdown',
            {
                title,
                text,
                webhookUrl:
                    'https://oapi.dingtalk.com/robot/send?access_token=3687bbc5b17ee8d28465879b972b594e4a806db28aa8a673159fcd373aa3fed5',
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

// 重构后的GET方法，先获取token再调用基金列表接口，筛选expectGrowth大于1的数据并推送钉钉消息
export async function GET(request: Request) {
    try {
        // 从URL获取查询参数
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '2000', 10);

        // 第一步：获取OAuth2访问令牌
        const tokenResponse = await fetchOAuth2Token();
        // console.log('获取到的token响应数据:', tokenResponse.data);
        const { access_token } = tokenResponse.data.data;

        if (!access_token) {
            console.error('响应中没有access_token字段:', tokenResponse.data);
            throw new Error('无法获取有效的访问令牌');
        }

        // 第二步：使用获取到的access_token调用基金列表接口
        const fundListResponse = await fetchFundList(access_token, page, limit);

        // 第三步：筛选出expectGrowth大于1的数据
        const fundListData = fundListResponse.data.data.data || [];
        console.log('原始基金列表数量:', fundListData.length);

        const filteredFunds = fundListData.filter(
            (fund: any) =>
                fund.expectGrowth && typeof fund.expectGrowth === 'number' && fund.expectGrowth > 3,
        );
        console.log('筛选后expectGrowth>3的基金数据:', JSON.stringify(filteredFunds, null, 2));

        // 第四步：如果有符合条件的基金，推送钉钉消息
        if (filteredFunds.length > 0) {
            const title = `基金预期增长率大于1%的通知 (${new Date().toLocaleDateString()})`;

            // 构建Markdown格式的消息内容
            let text = `## 基金预期增长率大于1%的列表\n\n`;
            text += `**更新时间:** ${new Date().toLocaleString()}\n\n`;
            text += `**符合条件的基金数量:** ${filteredFunds.length}\n\n`;
            text += `### 详情列表\n`;

            // 为每只基金添加详细信息
            filteredFunds.forEach((fund: any) => {
                text += `- **基金代码:** ${fund.code || '未知'}
`;
                text += `- **基金名称:** ${fund.name || '未知'}
`;
                text += `- **预期增长率:** ${fund.expectGrowth}%
`;
                text += `- **当前净值:** ${fund.netWorth || '未知'}
`;
                text += `- **预估净值:** ${fund.expectWorth || '未知'}
`;
                text += `- **更新日期:** ${fund.expectWorthDate || '未知'}

`; // 使用Markdown标准换行
            });

            // 推送钉钉消息
            const dingTalkResponse = await pushDingTalkMessage(access_token, title, text);
            console.log('钉钉消息推送完成，响应:', dingTalkResponse.data);
        }

        // 返回处理结果
        return NextResponse.json(
            {
                status: 'success',
                message: '基金筛选和消息推送完成',
                data: {
                    filteredFunds,
                },
            },
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    } catch (error) {
        // console.error('处理过程中发生错误:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: '处理失败',
                error: error instanceof Error ? error.message : '未知错误',
            },
            {
                status: 500,
            },
        );
    }
}
