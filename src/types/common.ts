/**
 * 用户收藏基金的类型定义（对应user_favorite_fund表）
 */
export interface UserFund {
    id: string | number; // 表中id为bigserial类型
    user_id: string; // uuid类型
    fund_code: string; // character varying(10)类型
    created_at: string; // timestamp with time zone类型
}

/**
 * 收藏相关请求参数（使用email而非userId）
 */
export interface CommonRequest {
    fundCode: string;
    email: string;
}

/**
 * API响应类型
 */
export interface ApiResponse<T = any> {
    message: string;
    data?: T;
    error?: string;
}
