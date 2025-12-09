import { NextResponse } from 'next/server';
import { fetchOAuth2Token, pushDingTalkMessage } from '@/lib/api';

export async function POST(req: Request) {
    try {
        // 从请求体获取参数
        const { userId, fundCode, riseThreshold, netWorthThreshold, pushTime } = await req.json();

        // 验证必要参数
        if (!userId || !fundCode) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: '缺少必要参数: userId或fundCode',
                },
                {
                    status: 400,
                },
            );
        }

        // 第一步：获取OAuth2访问令牌
        const tokenResponse = await fetchOAuth2Token();
        const { access_token } = tokenResponse.data.data;

        if (!access_token) {
            console.error('响应中没有access_token字段:', tokenResponse.data);
            throw new Error('无法获取有效的访问令牌');
        }

        // 构建监控设置消息
        const title = `基金监控设置通知 (${new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })})`;

        // 构建Markdown格式的消息内容
        let text = `## 基金监控设置已保存

`;
        text += `**用户ID:** ${userId}
`;
        text += `**基金代码:** ${fundCode}
`;
        text += `**涨跌幅提醒阈值:** ${riseThreshold !== undefined ? `${riseThreshold}%` : '未设置'}
`;
        text += `**净值提醒阈值:** ${netWorthThreshold !== undefined ? netWorthThreshold.toFixed(4) : '未设置'}
`;
        text += `**定时推送时间:** ${pushTime || '未设置'}
`;
        text += `**设置时间:** ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`;

        // 发送钉钉消息
        await pushDingTalkMessage(access_token, title, text);

        // 返回成功响应
        return NextResponse.json(
            {
                status: 'success',
                message: '基金监控设置已保存并发送钉钉通知',
                data: {
                    userId,
                    fundCode,
                    riseThreshold,
                    netWorthThreshold,
                    pushTime,
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
        console.error('处理基金监控设置时出错:', error);
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
