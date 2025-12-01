// 从localStorage获取缓存的邮箱e
export const getLocalStorageWithExpiry = (key: string): string | null => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
        setActualFavoriteCount(0);
        return null;
    }

    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        setActualFavoriteCount(0);
        return null;
    }

    return item.value;
};
