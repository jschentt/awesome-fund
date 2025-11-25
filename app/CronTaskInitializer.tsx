// 服务器组件：仅在服务器端执行
// 用于初始化定时任务，不渲染任何UI内容

// 注意：此组件不使用'use client'指令，确保它在服务器端执行
import { CronTaskManager } from '../lib/cron-tasks';

// 模块级别的服务器端初始化代码
// 当这个模块被导入时，这段代码会在服务器端执行
if (typeof window === 'undefined') {
  console.log('通过服务器组件初始化定时任务...');
  try {
    const cronManager = CronTaskManager.getInstance();
    cronManager.startTasks();
    console.log('定时任务初始化完成');
  } catch (error) {
    console.error('定时任务初始化失败:', error);
  }
}

export default function CronTaskInitializer() {
  // 这个组件不会在UI中渲染任何内容
  // 它的主要目的是在服务器端执行上面的初始化代码
  return null;
}