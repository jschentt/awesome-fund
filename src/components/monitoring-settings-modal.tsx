import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Button, message } from 'antd';
import { Settings } from 'lucide-react';

// 定义组件属性接口
interface MonitoringSettingsModalProps {
  open: boolean;
  onClose: () => void;
  fundName: string;
  onSave: () => void;
}

/**
 * 监控设置模态框组件
 * 用于配置基金监控的提醒阈值等设置
 */
const MonitoringSettingsModal: React.FC<MonitoringSettingsModalProps> = ({
  open,
  onClose,
  fundName,
  onSave,
}) => {
  // 阻止事件冒泡，防止点击模态框内容关闭模态框
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

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
            className="bg-white rounded-lg shadow-xl p-6 sm:max-w-md w-full"
            onClick={handleModalContentClick}
          >
            <div>
              <h3 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 mb-4">
                <Settings className="w-5 h-5 text-blue-500" />
                <span>监控设置</span>
              </h3>
            </div>
            <div className="py-4">
              <p className="text-gray-600 mb-4">{fundName} 监控设置</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    涨跌幅提醒阈值
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="上涨阈值"
                      className="flex-1"
                    />
                    <span className="flex items-center text-gray-500">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    净值提醒阈值
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="目标净值"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"
                onClick={onClose}
              >
                取消
              </Button>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => {
                  message.success('监控设置已保存');
                  onSave();
                  onClose();
                }}
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