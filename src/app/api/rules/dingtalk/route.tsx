import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchOAuth2Token, pushDingTalkMessage } from '@/lib/api';
import axios from 'axios';
import https from 'https';
import { ApiResponse } from '@/app/api/funds/[code]/route';

export async function POST(req: Request) {
    try {
        // 从请求体获取参数
        const {
            userId,
            email,
            fundCode,
            fundName,
            webhookId,
            riseThreshold,
            netWorthThreshold,
            pushTime,
        } = await req.json();

        // 验证必要参数
        if (!userId || !fundCode || !webhookId) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: '缺少必要参数: userId或fundCode或webhookId',
                },
                {
                    status: 400,
                },
            );
        }

        // 查询dingtalk_webhookb表中对应webhookId的记录
        const { data: webhookData, error: webhookError } = await supabase
            .from('dingtalk_webhook')
            .select('*')
            .eq('id', webhookId)
            .single();

        if (webhookError || !webhookData) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: '未找到对应的钉钉Webhook配置',
                },
                {
                    status: 404,
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

        // 设置真实API的URL，根据curl命令调整
        const API_BASE_URL = 'https://maiqishare.xyz/open-api/fund/detail';

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
        const apiResponse: ApiResponse = response.data;

        // 检查API响应状态
        if (apiResponse.code !== 0) {
            return NextResponse.json(
                { error: apiResponse.message || '获取基金数据失败' },
                { status: 400 },
            );
        }

        console.debug('基金详情:', apiResponse.data.data);

        // 获取基金详情数据
        const fundDetail = apiResponse.data.data;
        const { netWorth, actualDayGrowth, totalNetWorth, netWorthDate } = fundDetail;

        // 数据对比逻辑
        const comparisonResults = {
            netWorth: {
                current: netWorth,
                threshold: netWorthThreshold,
                triggered: netWorthThreshold !== undefined ? netWorth >= netWorthThreshold : false,
            },
            rise: {
                current: actualDayGrowth,
                threshold: riseThreshold,
                triggered:
                    riseThreshold !== undefined
                        ? Math.abs(actualDayGrowth) >= riseThreshold
                        : false,
            },
        };

        // 检查是否有阈值被触发
        const isThresholdTriggered = Object.values(comparisonResults).some(
            (result) => result.triggered,
        );

        // 构建监控设置消息
        const title = `基金监控消息通知 (${new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })})`;

        // 格式化定时推送时间
        const formatPushTime = (time: string | undefined) => {
            if (!time) return '未设置';
            try {
                return new Date(time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
            } catch {
                return time;
            }
        };

        // 构建Markdown格式的消息内容（字体调小）
        let text = `<font size=2>**基金监控消息通知**</font><br>`;
        text += `<font size=2>用户邮箱: ${email}</font><br>`;
        text += `<font size=2>基金代码: ${fundCode}</font><br>`;
        text += `<font size=2>基金名称: ${fundName || fundDetail.name}</font><br><br>`;
        text += `<font size=2>基金实时监控信息:</font><br>`;
        text += `<font size=2>当前净值: ${netWorth.toFixed(4)}</font><br>`;
        text += `<font size=2>累计净值: ${totalNetWorth.toFixed(4)}</font><br>`;
        text += `<font size=2>日涨跌幅: ${actualDayGrowth >= 0 ? '+' : ''}${actualDayGrowth.toFixed(2)}%</font><br>`;
        text += `<font size=2>净值更新时间: ${netWorthDate}</font><br><br>`;
        text += `<font size=2 style="background-color:#f2f2f2">基金规则设置信息:</font><br>`;
        text += `<font size=2 style="background-color:#f2f2f2">涨跌幅提醒阈值: ${riseThreshold !== undefined ? `${riseThreshold}%` : '未设置'}</font><br>`;
        text += `<font size=2 style="background-color:#f2f2f2">净值提醒阈值: ${netWorthThreshold !== undefined ? netWorthThreshold.toFixed(4) : '未设置'}</font><br>`;
        text += `<font size=2 style="background-color:#f2f2f2">定时推送时间: ${formatPushTime(pushTime)}</font><br>`;
        text += `<font size=2>触发时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</font>`;

        // 添加阈值触发提醒
        if (isThresholdTriggered) {
            text += `<br><br><font size=2 color="red"> ⚠️ 阈值触发提醒</font><br>`;
            if (comparisonResults.netWorth.triggered) {
                text += `<font size=2>净值已达到或超过设置阈值: ${netWorth.toFixed(4)} ≥ ${netWorthThreshold!.toFixed(4)}</font><br>`;
            }
            if (comparisonResults.rise.triggered) {
                text += `<font size=2>涨跌幅已达到或超过设置阈值: ${Math.abs(actualDayGrowth).toFixed(2)}% ≥ ${riseThreshold}%</font><br>`;
            }
        } else {
            text += `<br><br><font size=2 color="red"> ⚠️ 未达到阈值触发条件</font>`;
        }

        // 发送钉钉消息
        await pushDingTalkMessage(access_token, title, text, webhookData.webhook_url);

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
