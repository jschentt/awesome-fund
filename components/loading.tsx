'use client';

import React, { useEffect, useState } from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  type?: 'spinner' | 'dots' | 'pulse';
  color?: string;
  fullScreen?: boolean;
}

export default function Loading({
  size = 'medium',
  text,
  type = 'spinner',
  color = 'blue',
  fullScreen = false,
}: LoadingProps) {
  const [dots, setDots] = useState('');
  
  // 为dots类型实现动态点效果
  useEffect(() => {
    if (type === 'dots' && text) {
      const interval = setInterval(() => {
        setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [type, text]);

  // 根据size确定尺寸
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-6 h-6';
      case 'large':
        return 'w-16 h-16';
      default: // medium
        return 'w-10 h-10';
    }
  };

  // 根据size确定文字大小
  const getTextSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-xl';
      default: // medium
        return 'text-base';
    }
  };

  // 获取颜色类名或直接使用颜色值
  const getColorStyle = (element: 'border' | 'bg') => {
    // 预定义的颜色映射
    const colorMap: Record<string, Record<string, string>> = {
      border: {
        blue: 'border-blue-500',
        white: 'border-white',
        gray: 'border-gray-500',
        green: 'border-green-500',
        red: 'border-red-500'
      },
      bg: {
        blue: 'bg-blue-500',
        white: 'bg-white',
        gray: 'bg-gray-500',
        green: 'bg-green-500',
        red: 'bg-red-500'
      }
    };
    
    // 如果是预定义颜色，返回对应的类名
    if (colorMap[element][color]) {
      return colorMap[element][color];
    }
    
    // 对于自定义颜色（如#FFFFFF），返回style对象
    return '';
  };
  
  // 获取内联样式
  const getInlineStyle = () => {
    // 检查是否为自定义颜色（以#开头或包含rgb/rgba）
    if (color.startsWith('#') || color.includes('rgb')) {
      return {
        borderColor: color,
        backgroundColor: color
      };
    }
    return {};
  };

  // 渲染不同类型的加载动画
  const renderLoader = () => {
    const sizeClasses = getSizeClasses();
    const inlineStyle = getInlineStyle();
    
    switch (type) {
      case 'spinner':
        return (
          <div 
            className={`animate-spin rounded-full ${sizeClasses} border-t-2 border-b-2 ${getColorStyle('border')}`}
            style={inlineStyle}
          ></div>
        );
        
      case 'dots':
        const dotSize = size === 'small' ? 'w-1.5 h-1.5' : size === 'large' ? 'w-2.5 h-2.5' : 'w-2 h-2';
        return (
          <div className="flex space-x-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`rounded-full ${dotSize} ${getColorStyle('bg')} animate-ping opacity-75`}
                style={{ 
                  animationDelay: `${i * 200}ms`,
                  backgroundColor: inlineStyle.backgroundColor || undefined
                }}
              ></div>
            ))}
          </div>
        );
        
      case 'pulse':
        return (
          <div 
            className={`rounded-full ${sizeClasses} ${getColorStyle('bg')} animate-pulse`}
            style={inlineStyle}
          ></div>
        );
        
      default:
        return (
          <div 
            className={`animate-spin rounded-full ${sizeClasses} border-t-2 border-b-2 ${getColorStyle('border')}`}
            style={inlineStyle}
          ></div>
        );
    }
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90' // 半透明背景，突出加载动画
    : 'fixed inset-0 z-40 flex items-center justify-center'; // 非全屏模式下也固定定位在页面中间

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        {renderLoader()}
        {text && (
          <div className={`mt-4 text-gray-700 ${getTextSizeClasses()}`}>
            {text}{dots}
          </div>
        )}
      </div>
    </div>
  );
}