import md5 from 'md5';

// 设置带过期时间的localStorage数据
export const setLocalStorageWithExpiry = (key: string, value: any, ttl: number): void => {
    // 确保只在浏览器环境中运行
    if (typeof window !== 'undefined') {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + ttl,
        };
        localStorage.setItem(key, JSON.stringify(item));
    }
};

// 从localStorage获取缓存的数据
export const getLocalStorageWithExpiry = (key: string): any => {
    // 确保只在浏览器环境中运行
    if (typeof window === 'undefined') {
        return null;
    }

    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
        return null;
    }

    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }

    return item.value;
};

// 格式化时间，小于10的数字前面补0
const setTimeDateFmt = (num: number | string): string => {
    if (typeof num === 'string') {
        num = parseInt(num);
    }
    return num < 10 ? `0${num}` : `${num}`;
};

// 基于年月日时分秒+随机数生成订单编号
export const createOrderNum = (): string => {
    const now = new Date();
    let month: number | string = now.getMonth() + 1;
    let day: number | string = now.getDate();
    let hour: number | string = now.getHours();
    let minutes: number | string = now.getMinutes();
    let seconds: number | string = now.getSeconds();

    month = setTimeDateFmt(month);
    day = setTimeDateFmt(day);
    hour = setTimeDateFmt(hour);
    minutes = setTimeDateFmt(minutes);
    seconds = setTimeDateFmt(seconds);

    const orderCode =
        now.getFullYear().toString() +
        month +
        day +
        hour +
        minutes +
        seconds +
        Math.round(Math.random() * 1000000).toString();
    return orderCode;
};

// 生成32位随机数
export const genRandomNums = (): string => {
    const chars = [
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z',
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'q',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z',
    ];
    let nums = '';
    for (let i = 0; i < 32; i++) {
        const id = Math.floor(Math.random() * chars.length);
        nums += chars[id];
    }
    return nums;
};
// 对象字典序排序（优化：使用 reduce 简化循环，类型收窄）
export const createObjectDictSort = (arys: Record<string, any>): Record<string, any> => {
    return Object.keys(arys)
        .filter((key) => key !== '' && key !== 'hash' && key != null)
        .sort()
        .reduce(
            (acc, key) => {
                acc[key] = arys[key];
                return acc;
            },
            {} as Record<string, any>,
        );
};

// 生成 hash 值（优化：链式调用 + 模板字符串）
export const generate_xh_hash = (datas: Record<string, any>, hashkey: string): string => {
    const signStr =
        Object.entries(createObjectDictSort(datas))
            .filter(([key, value]) => key !== 'hash' && key !== 'sign_type' && value != null)
            .map(([key, value]) => `${key}=${value}`)
            .join('&') + hashkey;
    return md5(signStr);
};
