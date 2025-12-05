// 设置带过期时间的localStorage数据
export const setLocalStorageWithExpiry = (key: string, value: any, ttl: number): void => {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
};

// 从localStorage获取缓存的数据
export const getLocalStorageWithExpiry = (key: string): any => {
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
