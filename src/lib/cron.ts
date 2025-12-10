import axios from 'axios';
import https from 'https';

/**
 * 创建定时任务
 * @param jobName 任务名称
 * @param cronExpression cron 表达式
 * @param ruleId 规则 ID
 * @param extraParams 额外参数
 * @returns 创建结果
 */
export async function createCronTask(
    jobName: string,
    cronExpression: string,
    ruleId: string,
    extraParams: {
        userId: string;
        email?: string;
        fundCode: string;
        fundName?: string;
        webhookId?: number;
        riseThreshold?: number;
        netWorthThreshold?: number;
        pushTime?: string;
    },
) {
    try {
        console.log('创建定时任务:', jobName);

        const response = await axios.post(
            'https://maiqishare.xyz/cron-api/tasks',
            {
                jobName,
                cronExpression,
                ruleId,
                extraParams,
            },
            {
                headers: {
                    accept: '*/*',
                    'Content-Type': 'application/json',
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false, // 忽略SSL证书验证，仅在开发环境使用
                }),
            },
        );

        console.log('定时任务创建结果:', response.data);
        return response;
    } catch (error) {
        console.error('创建定时任务失败:', error);
        throw error;
    }
}

/**
 * 删除指定任务名称 的定时任务
 * @param jobName 任务名称 ${id}_${user_id}_${code}
 * @returns 删除结果
 */
export async function deleteCronTask(jobName: string) {
    try {
        console.log('删除定时任务:', jobName);

        const response = await axios.delete(`https://maiqishare.xyz/cron-api/tasks/${jobName}`, {
            headers: {
                accept: '*/*',
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // 忽略SSL证书验证，仅在开发环境使用
            }),
        });

        console.log('定时任务删除结果:', response.data);
        return response;
    } catch (error) {
        console.error('删除定时任务失败:', error);
        throw error;
    }
}

/**
 * 把 'HH:mm:ss' 转成 5 位 cron
 * @param t 时间串，支持格式
 *        HH:mm:ss
 *        HH:mm
 * @returns 5 位 cron，如 '35 14 * * *'
 */
export function toCron(t: string): string {
    const [h = '0', m = '0'] = t.split(':'); // 忽略秒
    // 简单校验
    const hour = parseInt(h, 10);
    const min = parseInt(m, 10);
    if (hour < 0 || hour > 23 || min < 0 || min > 59) {
        throw new Error('Invalid time format');
    }
    return `${min} ${hour} * * *`;
}
