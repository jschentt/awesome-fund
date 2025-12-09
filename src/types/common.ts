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
 * 监控规则类型定义（对应fund_monitor_rules表）
 */
export interface FundMonitorRule {
    id: string | number;
    user_id: string;
    fund_code: string;
    rise_threshold?: number;
    net_worth_threshold?: number;
    push_time?: string;
    created_at: string;
    updated_at: string;
}

/**
 * 监控规则请求参数
 */
export interface MonitorRuleRequest {
    fundCode: string;
    userId: string;
    ruleName: string;
    riseThreshold?: number;
    netWorthThreshold?: number;
    pushTime?: string;
}

/**
 * API响应类型
 */
export interface ApiResponse<T = any> {
    message: string;
    data?: T;
    error?: string;
}
