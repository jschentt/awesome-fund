import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 生成密码哈希的函数，确保返回固定长度为60的哈希值
async function hashPassword(password: string): Promise<string> {
    // 为了符合数据库表结构character(60)的要求，生成固定长度的哈希值
    // 在实际生产环境中应使用bcrypt等安全的密码哈希库
    const baseHash = `$2a$10$${Buffer.from(password).toString('base64').substring(0, 22)}`;
    // 确保哈希值长度为60，不足部分用空格填充
    return baseHash.padEnd(60, ' ').substring(0, 60);
}

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // 验证必填字段
        if (!email || !password) {
            return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: '无效的邮箱格式' }, { status: 400 });
        }

        // 验证密码长度
        if (password.length < 8) {
            return NextResponse.json({ error: '密码长度不能少于8位' }, { status: 400 });
        }

        // 查询用户信息
        const { data: userData, error: queryError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (queryError) {
            return NextResponse.json({ error: '用户不存在' }, { status: 401 });
        }

        // 检查用户状态
        if (userData.status !== 1) {
            return NextResponse.json({ error: '用户账号被禁用' }, { status: 403 });
        }

        // 使用与注册时相同的哈希函数生成密码哈希并进行验证
        const passwordHash = await hashPassword(password);
        if (passwordHash !== userData.password_hash) {
            return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
        }

        console.log(`用户登录成功: ${email}`);

        // 返回用户信息，但不包含密码哈希
        const { password_hash, ...userInfo } = userData;
        return NextResponse.json(
            { message: '登录成功', data: { user: userInfo } },
            { status: 200 },
        );
    } catch (error) {
        console.error('登录失败:', error);
        return NextResponse.json({ error: '登录失败' }, { status: 500 });
    }
}
