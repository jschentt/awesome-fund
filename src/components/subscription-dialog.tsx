'use client';

import { useState } from 'react';
import { Modal, Button, Card, Badge, Radio, Divider, Tag } from 'antd';
import { Crown, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getLocalStorageWithExpiry } from '@/lib/utils';

export type SubscriptionType = 'free' | 'month' | 'year';

export interface SubscriptionPlan {
    name: string;
    price: number;
    period: string;
    features: string[];
    discount?: string;
}

export const subscriptionPlans: Record<SubscriptionType, SubscriptionPlan> = {
    free: {
        name: '免费版',
        price: 0,
        period: '永久',
        features: ['最多监控3只基金', '基本涨跌提醒', '每日更新一次'],
    },
    month: {
        name: '月度会员',
        price: 9.9,
        period: '月',
        features: ['无限基金监控', '实时涨跌提醒', '每日更新多次', '优先技术支持'],
    },
    year: {
        name: '年度会员',
        price: 99,
        period: '年',
        features: ['无限基金监控', '实时涨跌提醒', '每日更新多次', '优先技术支持', '专属客服'],
        discount: '立省19.8元',
    },
};

interface SubscriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentMonitorCount: number;
    onSubscribe: (type: SubscriptionType) => void;
}

type PaymentMethod = 'alipay' | 'wechat';

export function SubscriptionDialog({
    open,
    onOpenChange,
    currentMonitorCount,
    onSubscribe,
}: SubscriptionDialogProps) {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionType>('month');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('alipay');
    const [step, setStep] = useState<'plan' | 'payment'>('plan');
    const [payLoading, setPayLoading] = useState(false);

    const handleContinue = () => {
        if (selectedPlan === 'free') {
            toast.error('请选择付费套餐');
            return;
        }
        setStep('payment');
    };

    const handleBack = () => {
        setStep('plan');
    };

    const handlePay = async () => {
        setPayLoading(true);
        try {
            const userInfo = getLocalStorageWithExpiry('userInfo');
            if (!userInfo) {
                return;
            }

            const userId = userInfo.id;

            const params = {
                userId,
                subscribType: selectedPlan,
                paymentMethod,
                returnUrl: window.location.href,
            };

            const res = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!res.ok) {
                throw new Error('支付失败');
            }
            const data = await res.json();
            const payUrl = data?.data?.payUrl;
            if (!payUrl) {
                throw new Error('支付失败');
            } else {
                window.open(payUrl, '_blank');
                onOpenChange(false);
                // 重置状态
                setTimeout(() => {
                    setStep('plan');
                    setSelectedPlan('month');
                    setPaymentMethod('alipay');
                }, 300);
            }
        } catch (error) {
            console.error('支付失败:', error);
            toast.error('支付失败，请稍后重试');
        } finally {
            setPayLoading(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            setStep('plan');
            setSelectedPlan('month');
            setPaymentMethod('alipay');
        }, 300);
    };

    const renderPlanCard = (type: SubscriptionType) => {
        const plan = subscriptionPlans[type];
        const isSelected = selectedPlan === type;
        const isFree = type === 'free';

        return (
            <Card
                className={`p-6 cursor-pointer transition-all ${
                    isSelected
                        ? 'border-blue-500 border-2 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                } ${isFree ? 'opacity-60' : ''}`}
                onClick={() => !isFree && setSelectedPlan(type)}
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-gray-900 whitespace-nowrap">{plan.name}</h3>
                            {type === 'year' && (
                                <Tag className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                                    最划算
                                </Tag>
                            )}
                        </div>
                        {isFree ? (
                            <p className="text-gray-500 text-sm">当前套餐</p>
                        ) : (
                            <div className="flex items-baseline gap-1">
                                <span className="text-gray-900 text-3xl">¥{plan.price}</span>
                                <span className="text-gray-500 text-sm">/{plan.period}</span>
                            </div>
                        )}
                    </div>
                    {isSelected && !isFree && (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>

                {type === 'year' && plan.discount && (
                    <Tag className="mb-3 text-orange-600 border-orange-200 bg-orange-50">
                        {plan.discount}
                    </Tag>
                )}

                <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className={isFree ? 'text-gray-500' : 'text-gray-700'}>
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>
            </Card>
        );
    };

    return (
        <Modal open={open} onCancel={handleClose} footer={null} width={800} centered>
            <div className="sm:max-w-2xl mx-auto">
                {step === 'plan' ? (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <Crown className="w-5 h-5 text-yellow-500" />
                            <h2 className="text-2xl font-bold">升级订阅</h2>
                        </div>
                        <p className="text-gray-500 mb-4">
                            您已监控 {currentMonitorCount} 只基金，免费版最多监控 3 只
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-blue-900">
                                    升级为付费会员，即可无限制监控基金，并享受更多高级功能
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 mb-6">
                            {renderPlanCard('free')}
                            {renderPlanCard('month')}
                            {renderPlanCard('year')}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleClose} className="flex-1">
                                取消
                            </Button>
                            <Button type="primary" onClick={handleContinue} className="flex-1">
                                继续支付
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <Crown className="w-5 h-5 text-yellow-500" />
                            <h2 className="text-2xl font-bold">选择支付方式</h2>
                        </div>
                        <p className="text-gray-500 mb-4">
                            {subscriptionPlans[selectedPlan].name} - ¥
                            {subscriptionPlans[selectedPlan].price}/
                            {subscriptionPlans[selectedPlan].period}
                        </p>

                        <div className="space-y-4 my-4 mb-6">
                            <Radio.Group
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                className="w-full"
                            >
                                <Card
                                    className={`p-4 cursor-pointer transition-all w-full ${
                                        paymentMethod === 'alipay'
                                            ? 'border-blue-500 border-2'
                                            : 'border-gray-200'
                                    }`}
                                    onClick={() => setPaymentMethod('alipay')}
                                >
                                    <div className="flex items-center gap-3">
                                        <Radio value="alipay" id="alipay" />
                                        <label
                                            htmlFor="alipay"
                                            className="flex-1 cursor-pointer flex items-center gap-3"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                                <span className="text-white text-xl font-bold">
                                                    支
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-gray-900">支付宝</div>
                                                <div className="text-sm text-gray-500">
                                                    推荐使用支付宝快捷支付
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </Card>

                                {/* <Card
                                    className={`p-4 cursor-pointer transition-all w-full mt-3 ${
                                        paymentMethod === 'wechat'
                                            ? 'border-green-500 border-2'
                                            : 'border-gray-200'
                                    }`}
                                    onClick={() => setPaymentMethod('wechat')}
                                >
                                    <div className="flex items-center gap-3">
                                        <Radio value="wechat" id="wechat" />
                                        <label
                                            htmlFor="wechat"
                                            className="flex-1 cursor-pointer flex items-center gap-3"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                                <span className="text-white text-xl font-bold">
                                                    微
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-gray-900">微信支付</div>
                                                <div className="text-sm text-gray-500">
                                                    使用微信扫码支付
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </Card> */}
                            </Radio.Group>

                            <Divider />

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">套餐</span>
                                    <span className="text-gray-900">
                                        {subscriptionPlans[selectedPlan].name}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">周期</span>
                                    <span className="text-gray-900">
                                        {subscriptionPlans[selectedPlan].period}
                                    </span>
                                </div>
                                <Divider />
                                <div className="flex justify-between">
                                    <span className="text-gray-900">应付金额</span>
                                    <span className="text-2xl text-red-600">
                                        ¥{subscriptionPlans[selectedPlan].price}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">
                                    <Check className="w-4 h-4 inline text-green-600 mr-1" />
                                    支付成功后立即生效
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    <Check className="w-4 h-4 inline text-green-600 mr-1" />
                                    支持随时取消订阅
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleBack} className="flex-1">
                                返回
                            </Button>
                            <Button
                                type="primary"
                                onClick={handlePay}
                                className="flex-1"
                                style={{
                                    background: 'linear-gradient(to right, #1890ff, #096dd9)',
                                }}
                                loading={payLoading}
                            >
                                立即支付 ¥{subscriptionPlans[selectedPlan].price}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
