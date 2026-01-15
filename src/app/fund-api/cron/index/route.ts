import axios from 'axios';
import iconv from 'iconv-lite';
import { NextResponse } from 'next/server';
import { fetchOAuth2Token, pushDingTalkMessage } from '@/lib/api';

/**
 * 获取单个指数的行情数据
 * @param code 指数代码
 * @param name 指数名称
 * @returns 指数行情数据
 */
async function fetchSingleIndexData(code: string, name: string) {
    const response = await axios.get(`http://hq.sinajs.cn/list=${code}`, {
        headers: {
            Referer: 'https://finance.sina.com.cn',
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        },
        responseType: 'arraybuffer',
    });

    const decodedData = iconv.decode(Buffer.from(response.data), 'GBK');

    // 解析数据
    const match = decodedData.match(new RegExp(`var hq_str_${code}="([^"]+)";`));
    if (!match) {
        throw new Error(`Failed to parse ${name} data`);
    }

    const dataArray = match[1].split(',');

    // 提取需要的字段
    const indexName = dataArray[0];
    const openPrice = parseFloat(dataArray[1]);
    const prevClosePrice = parseFloat(dataArray[2]);
    const currentPrice = parseFloat(dataArray[3]);
    const highestPrice = parseFloat(dataArray[4]);
    const lowestPrice = parseFloat(dataArray[5]);
    const volume = parseInt(dataArray[8]);
    const amount = parseInt(dataArray[9]);
    const date = dataArray[30];
    const time = dataArray[31];
    const status = dataArray[32];

    // 计算涨跌百分比
    const changeAmount = currentPrice - prevClosePrice;
    const changePercent = (changeAmount / prevClosePrice) * 100;

    return {
        code,
        indexName,
        prevClosePrice,
        currentPrice,
        changeAmount,
        changePercent,
        details: {
            openPrice,
            highestPrice,
            lowestPrice,
            volume,
            amount,
            date,
            time,
            status,
        },
    };
}

/**
 * 获取大盘行情数据并推送钉钉消息
 * @returns 大盘行情数据
 */
async function fetchStockMarketData() {
    // 并行获取上证指数和创业板指数数据
    const [shIndexData, cybIndexData] = await Promise.all([
        fetchSingleIndexData('sh000001', '上证指数'),
        fetchSingleIndexData('sz399006', '创业板指数'),
    ]);

    // 使用第一个指数的日期和时间作为统一的更新时间
    const date = shIndexData.details.date;
    const time = shIndexData.details.time;

    // 构建响应数据
    const responseData = {
        indices: [shIndexData, cybIndexData],
        updateTime: `${date} ${time}`,
    } as any;

    // 推送钉钉消息
    const title = `大盘行情通知 (${date} ${time})`;

    let text = `## 大盘行情

`;
    text += `**更新时间:** ${date} ${time}

`;

    // 添加上证指数信息
    text += `### ${shIndexData.indexName}
`;
    text += `**当前点位:** ${shIndexData.currentPrice.toFixed(2)}
`;
    text += `**昨日收盘:** ${shIndexData.prevClosePrice.toFixed(2)}
`;
    text += `**涨跌金额:** ${shIndexData.changeAmount >= 0 ? '+' : ''}${shIndexData.changeAmount.toFixed(2)}
`;
    text += `**涨跌幅度:** ${shIndexData.changePercent >= 0 ? '+' : ''}${shIndexData.changePercent.toFixed(2)}%
`;
    //     text += `- **开盘点位:** ${shIndexData.details.openPrice.toFixed(2)}
    // `;
    //     text += `- **最高点位:** ${shIndexData.details.highestPrice.toFixed(2)}
    // `;
    //     text += `- **最低点位:** ${shIndexData.details.lowestPrice.toFixed(2)}
    // `;
    //     text += `- **成交量:** ${(shIndexData.details.volume / 100000000).toFixed(2)}亿手
    // `;
    //     text += `- **成交金额:** ${(shIndexData.details.amount / 100000000).toFixed(2)}亿元

    // `;

    // 添加创业板指数信息
    text += `### ${cybIndexData.indexName}
`;
    text += `**当前点位:** ${cybIndexData.currentPrice.toFixed(2)}
`;
    text += `**昨日收盘:** ${cybIndexData.prevClosePrice.toFixed(2)}
`;
    text += `**涨跌金额:** ${cybIndexData.changeAmount >= 0 ? '+' : ''}${cybIndexData.changeAmount.toFixed(2)}
`;
    text += `**涨跌幅度:** ${cybIndexData.changePercent >= 0 ? '+' : ''}${cybIndexData.changePercent.toFixed(2)}%
`;
    //     text += `- **开盘点位:** ${cybIndexData.details.openPrice.toFixed(2)}
    // `;
    //     text += `- **最高点位:** ${cybIndexData.details.highestPrice.toFixed(2)}
    // `;
    //     text += `- **最低点位:** ${cybIndexData.details.lowestPrice.toFixed(2)}
    // `;
    //     text += `- **成交量:** ${(cybIndexData.details.volume / 100000000).toFixed(2)}亿手
    // `;
    //     text += `- **成交金额:** ${(cybIndexData.details.amount / 100000000).toFixed(2)}亿元
    // `;

    // 尝试推送钉钉消息，但不影响接口响应
    // try {
    const tokenResponse = await fetchOAuth2Token();
    const { access_token } = tokenResponse.data.data;

    // 推送钉钉消息
    const dingTalkResponse = await pushDingTalkMessage(access_token, title, text);
    console.log('钉钉消息推送完成，响应:', dingTalkResponse.data);
    // } catch (dingTalkError) {
    // console.error('钉钉消息推送失败:', dingTalkError);
    // 继续执行，不影响接口响应
    // }

    responseData.tokenResponse = tokenResponse.data.data;
    responseData.dingTalkResponse = dingTalkResponse.data;
    return responseData;
}

export async function GET(request: Request) {
    try {
        const responseData = await fetchStockMarketData();

        return NextResponse.json(
            {
                status: 'success',
                message: '大盘行情获取和消息推送完成',
                data: responseData,
            },
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    } catch (error) {
        console.error('Error fetching stock data:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Failed to fetch stock data',
                error: JSON.stringify(error),
                // error: error instanceof Error ? error.message : '未知错误',
            },
            {
                status: 500,
            },
        );
    }
}
