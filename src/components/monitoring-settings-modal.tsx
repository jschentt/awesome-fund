import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, message, DatePicker, InputNumber, Form, Modal } from 'antd';
import Image from 'next/image';
import dayjs from 'dayjs';
import { useAuth } from '@/app/providers/auth-provider';
import { Settings } from 'lucide-react';
import { FundItem } from './fund-list';
import { MonitorRuleRequest } from '@/types/common';

// 定义组件属性接口
interface MonitoringSettingsModalProps {
    open: boolean;
    onClose: () => void;
    fundInfo: FundItem;
}

/**
 * 监控设置模态框组件
 * 用于配置基金监控的提醒阈值等设置
 */
const MonitoringSettingsModal: React.FC<MonitoringSettingsModalProps> = ({
    open,
    onClose,
    fundInfo,
}) => {
    const [form] = Form.useForm();
    const { user, vipInfo } = useAuth();
    const [detailInfo, setDetailInfo] = useState<MonitorRuleRequest>();
    const [saveLoading, setSaveLoading] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    // 阻止事件冒泡，防止点击模态框内容关闭模态框
    const handleModalContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const { name: fundName, code: fundCode } = fundInfo;

    // 根据 fundCode 查询已有监控规则并回填表单
    useEffect(() => {
        if (!fundCode || !open || !user?.id) return;
        const fetchMonitorRule = async () => {
            try {
                const res = await fetch(`/api/rules?fundCode=${fundCode}`, {
                    headers: {
                        'X-User-Id': user?.id || '',
                    },
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data && data.data) {
                    form.setFieldsValue({
                        riseThreshold: data.data.rise_threshold,
                        netWorthThreshold: data.data.net_worth_threshold,
                        pushTime: data.data.push_time ? dayjs(data.data.push_time, 'HH:mm') : null,
                    });
                    setDetailInfo({
                        ...data.data,
                        ruleId: data.data?.id,
                    });
                }
            } catch (err) {
                console.error('获取监控规则失败:', err);
            }
        };
        fetchMonitorRule();
    }, [fundCode, user?.id, open]);

    const onSave = async (data: MonitorRuleRequest) => {
        setSaveLoading(true);
        try {
            const response = await fetch('/api/rules', {
                method: detailInfo?.ruleId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    ruleId: detailInfo?.ruleId,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                message.success(result.message || '监控设置已保存');
                onClose();
            } else {
                const result = await response.json();
                message.error(result.message || '保存失败');
            }
        } catch (error) {
            console.error('保存监控设置失败:', error);
            message.error('保存监控设置失败，请稍后重试');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            // 校验至少要设置一条规则
            const hasValue = Object.values(values).some(
                (v) => v !== undefined && v !== null && v !== '',
            );
            if (!hasValue) {
                message.warning('请至少设置一条监控规则');
                return;
            }

            if (!user?.id) {
                message.error('用户ID不能为空');
                return;
            }

            // 准备请求数据
            const requestData = {
                userId: user?.id,
                fundCode,
                fundName,
                email: user?.email,
                ruleName: `【${fundName}】监控规则`,
                riseThreshold: values.riseThreshold,
                netWorthThreshold: values.netWorthThreshold,
                pushTime: dayjs(values.pushTime).format('HH:mm'),
            };

            // 如果 pushTime 为空，给出提示
            if (!values.pushTime) {
                Modal.confirm({
                    title: '定时推送未设置',
                    content: '定时推送没有设置，钉钉群组将不会接收消息，是否继续保存？',
                    okText: '是',
                    cancelText: '否',
                    onOk: async () => {
                        // 用户选择“是”，继续保存
                        await onSave(requestData);
                    },
                    onCancel: () => {
                        // 用户选择“否”，不保存
                        message.info('已取消保存');
                    },
                });
                return;
            }

            await onSave(requestData);
        } catch (error) {
            message.error('请填写正确的监控设置');
        }
    };

    const handleWebhookPush = async () => {
        setPushLoading(true);
        message.info('正在推送监控报告...');
        const { riseThreshold, netWorthThreshold, pushTime } = form.getFieldsValue();
        const params = {
            webhookId: vipInfo?.webhook_id,
            userId: user?.id,
            email: user?.email,
            fundCode,
            fundName,
            riseThreshold,
            netWorthThreshold,
            pushTime,
        };
        try {
            const res = await fetch('/api/rules/dingtalk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });
            const data = await res.json();
            if (res.ok) {
                message.success(data.message || '推送成功');
            } else {
                message.error(data.message || '推送失败');
            }
        } catch (error) {
            message.error('推送失败，请稍后重试');
        } finally {
            setPushLoading(false);
        }
    };

    useEffect(() => {
        if (!open) {
            form.resetFields();
        }
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white rounded-lg shadow-xl py-6 sm:max-w-md w-full"
                        onClick={handleModalContentClick}
                    >
                        <div className="px-6">
                            <h3 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 mb-4">
                                <Settings className="w-5 h-5 text-blue-500" />
                                <span>监控设置</span>
                            </h3>
                        </div>
                        <div className="py-4 max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden px-6 scrollbar-thin scrollbar-thumb-[#f0f0f0] scrollbar-track-transparent">
                            <p className="text-gray-600 mb-4">{fundName} 监控设置</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                                <div className="bg-blue-50 p-2 rounded-md border border-blue-100">
                                    <p className="text-xs text-gray-500 mb-0.5">预估涨幅</p>
                                    <p
                                        className={`text-lg font-semibold ${fundInfo.expectGrowth && fundInfo.expectGrowth < 0 ? 'text-green-500' : 'text-red-500'}`}
                                    >
                                        {fundInfo.expectGrowth ? `${fundInfo.expectGrowth}%` : '-'}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-2 rounded-md border border-green-100">
                                    <p className="text-xs text-gray-500 mb-0.5">预估净值</p>
                                    <p className="text-lg font-semibold text-gray-800">
                                        {fundInfo.expectWorth
                                            ? fundInfo.expectWorth.toFixed(4)
                                            : '-'}
                                    </p>
                                </div>
                                <div className="bg-purple-50 p-2 rounded-md border border-purple-100">
                                    <p className="text-xs text-gray-500 mb-0.5">预估净值新增</p>
                                    <p
                                        className={`text-lg font-semibold ${fundInfo.estimatedChange && fundInfo.estimatedChange < 0 ? 'text-green-500' : 'text-red-500'}`}
                                    >
                                        {fundInfo.estimatedChange
                                            ? fundInfo.estimatedChange.toFixed(4)
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                            <Form layout="vertical" className="space-y-4" form={form}>
                                <Form.Item
                                    name="riseThreshold"
                                    label="涨跌幅提醒阈值"
                                    rules={[
                                        {
                                            required: false,
                                            message: '请输入涨跌幅提醒阈值',
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        placeholder="上涨阈值"
                                        className="flex-1"
                                        min={-Infinity}
                                        max={Infinity}
                                        step={0.01}
                                        precision={2}
                                        suffix="%"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="netWorthThreshold"
                                    label="净值提醒阈值"
                                    rules={[
                                        {
                                            required: false,
                                            message: '请输入净值提醒阈值',
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        placeholder="目标净值"
                                        className="w-full"
                                        min={0}
                                        step={0.0001}
                                        precision={4}
                                    />
                                </Form.Item>

                                {/* 定时推送配置 */}
                                <Form.Item
                                    name="pushTime"
                                    label="定时推送配置"
                                    rules={[
                                        {
                                            required: false,
                                            message: '请选择定时推送时间',
                                        },
                                    ]}
                                >
                                    <DatePicker
                                        picker="time"
                                        format="HH:mm"
                                        placeholder="选择时间"
                                        className="w-full"
                                    />
                                </Form.Item>
                                <p className="text-xs text-gray-500 relative top-[-8px] mb-3">
                                    每日该时间推送基金监控报告
                                </p>
                                {/* 立即推送按钮 */}
                                <div className="pt-2">
                                    <Button
                                        type="primary"
                                        className="w-full"
                                        onClick={() => handleWebhookPush()}
                                        loading={pushLoading}
                                    >
                                        立即推送监控报告
                                    </Button>
                                </div>

                                {/* 推送二维码区域 */}
                                {vipInfo?.qr_code_url && (
                                    <div className="pt-6 flex flex-col items-center">
                                        <p className="text-gray-700 mb-4 text-sm leading-relaxed text-center">
                                            {vipInfo?.plan_code === 'year' ? (
                                                <span>
                                                    当前您为
                                                    <span className="font-bold text-yellow-600">
                                                        年度
                                                    </span>
                                                    会员， 扫码加入专属一对一
                                                    <span className="font-bold text-blue-600">
                                                        VIP
                                                    </span>
                                                    钉钉群组，获取实时监控提醒、专业基金分析与独家策略
                                                </span>
                                            ) : vipInfo?.plan_code === 'month' ? (
                                                <span>
                                                    当前您为
                                                    <span className="font-bold text-blue-600">
                                                        月度
                                                    </span>
                                                    会员， 扫码加入专属一对一
                                                    <span className="font-bold text-blue-600">
                                                        VIP
                                                    </span>
                                                    钉钉群组，获取实时监控提醒、专业基金分析与独家策略
                                                </span>
                                            ) : (
                                                <span>
                                                    当前您为
                                                    <span className="font-bold text-green-600">
                                                        免费
                                                    </span>
                                                    会员， 扫码加入
                                                    <span className="font-bold text-green-600">
                                                        免费
                                                    </span>
                                                    钉钉群组，获取基础监控提醒
                                                </span>
                                            )}
                                        </p>
                                        <div className="w-48 h-48 bg-gray-50 rounded-md flex items-center justify-center mb-4 overflow-hidden border border-gray-100">
                                            {/* 使用 Next.js Image 组件加载二维码图片 */}
                                            {vipInfo?.qr_code_url && (
                                                <Image
                                                    src={vipInfo?.qr_code_url}
                                                    alt="钉钉群组二维码"
                                                    width={192}
                                                    height={192}
                                                    className="object-contain p-2"
                                                    // 如果图片不存在，会显示默认的占位符
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const placeholderDiv =
                                                            document.createElement('div');
                                                        placeholderDiv.className =
                                                            'text-gray-500 text-sm';
                                                        placeholderDiv.textContent =
                                                            '请上传钉钉群组二维码图片';
                                                        target.parentElement?.appendChild(
                                                            placeholderDiv,
                                                        );
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Form>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 px-6">
                            <Button
                                className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"
                                onClick={onClose}
                            >
                                取消
                            </Button>
                            <Button
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                onClick={() => {
                                    handleSave();
                                }}
                                loading={saveLoading}
                            >
                                保存设置
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MonitoringSettingsModal;
