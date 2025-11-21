import cron from 'node-cron';

// 定时任务管理器
export class CronTaskManager {
    private static instance: CronTaskManager;
    private tasks: Map<string, cron.ScheduledTask> = new Map();

    private constructor() {}

    // 获取单例实例
    public static getInstance(): CronTaskManager {
        if (!CronTaskManager.instance) {
            CronTaskManager.instance = new CronTaskManager();
        }
        return CronTaskManager.instance;
    }

    // 启动定时任务
    public startTasks(): void {
        console.log('开始启动定时任务...');
        // 每24小时调用一次测试接口
        this.scheduleTask(
            'test-api-call',
            '0 0 * * *', // 每天午夜(00:00)执行一次
            this.callTestApi,
        );

        console.log('所有定时任务已启动');
    }

    // 安排任务
    private scheduleTask(name: string, schedule: string, task: () => void): void {
        const scheduledTask = cron.schedule(schedule, task);
        this.tasks.set(name, scheduledTask);
        console.log(`定时任务已安排: ${name}, 计划: ${schedule}`);
    }

    // 停止所有任务
    public stopAllTasks(): void {
        this.tasks.forEach((task, name) => {
            task.stop();
            console.log(`定时任务已停止: ${name}`);
        });
        this.tasks.clear();
    }

    // 调用测试接口的函数
    private async callTestApi(): Promise<void> {
        const now = new Date().toISOString();
        console.log(`${now} - 定时任务开始执行测试接口调用...`);
        try {
            const response = await fetch('http://localhost:3000/api/test');
            const data = await response.json();
            console.log(`${now} - 定时调用测试接口结果:`, data);
        } catch (error) {
            console.error(`${now} - 定时调用测试接口失败:`, error);
        }
    }
}
