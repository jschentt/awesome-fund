import cron from 'node-cron';

/**
 * 定时任务管理器 - 单例模式
 * 管理所有系统定时任务
 */
export class CronTaskManager {
    private static instance: CronTaskManager;
    private tasks: Map<string, ReturnType<typeof cron.schedule>> = new Map();

    // 添加静态标志，跟踪初始化状态
    private static initialized: boolean = false;

    private constructor() {
        // 私有构造函数，防止外部直接实例化
        console.log('CronTaskManager实例被创建');
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): CronTaskManager {
        console.log('CronTaskManager.getInstance() 被调用');
        if (!CronTaskManager.instance) {
            console.log('创建新的CronTaskManager实例');
            CronTaskManager.instance = new CronTaskManager();
        }
        return CronTaskManager.instance;
    }

    /**
     * 启动所有定时任务
     */
    public startTasks(): void {
        console.log('CronTaskManager.startTasks() 被调用');

        // 防止重复初始化
        if (CronTaskManager.initialized) {
            console.log('定时任务已经初始化过，跳过');
            return;
        }

        CronTaskManager.initialized = true;

        // 定义所有定时任务
        this.scheduleTask(
            'cron-api-call',
            '*/2 * * * *', // 每2分钟执行一次
            this.callCronApi.bind(this),
        );

        console.log('所有定时任务启动完成');
    }

    /**
     * 调度单个定时任务
     */
    private scheduleTask(name: string, schedule: string, callback: () => void): void {
        console.log(`调度定时任务 [${name}]，执行周期: ${schedule}`);

        // 先停止已存在的同名任务
        if (this.tasks.has(name)) {
            this.tasks.get(name)?.stop();
            console.log(`停止已存在的定时任务 [${name}]`);
        }

        // 创建并启动新任务
        const task = cron.schedule(schedule, callback, {
            timezone: 'Asia/Shanghai',
        });

        this.tasks.set(name, task);
        console.log(`定时任务 [${name}] 已启动，执行周期: ${schedule}`);
    }

    /**
     * 执行cron接口调用任务
     */
    private async callCronApi(): Promise<void> {
        try {
            console.log('开始调用cron接口...');
            const response = await fetch('http://localhost:3001/api/cron');
            if (response.ok) {
                const data = await response.json();
                console.log('cron接口调用成功:', data);
            } else {
                console.error('cron接口调用失败，状态码:', response.status);
            }
        } catch (error) {
            console.error('cron接口调用异常:', error);
        }
    }

    /**
     * 停止所有定时任务
     */
    public stopAllTasks(): void {
        console.log('停止所有定时任务');
        this.tasks.forEach((task, name) => {
            task.stop();
            console.log(`定时任务 [${name}] 已停止`);
        });
        this.tasks.clear();
        CronTaskManager.initialized = false;
    }
}
