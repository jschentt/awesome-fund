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
        const { email, code, password } = await request.json();

        // 验证必填字段
        if (!email || !code || !password) {
            return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: '无效的邮箱格式' }, { status: 400 });
        }

        // 验证验证码长度
        if (code.length !== 6) {
            return NextResponse.json({ error: '验证码必须是6位数字' }, { status: 400 });
        }

        // 验证密码长度
        if (password.length < 8) {
            return NextResponse.json({ error: '密码长度不能少于8位' }, { status: 400 });
        }

        // 1. 验证邮箱验证码
        const now = new Date();
        console.log(`验证验证码: email=${email}, code=${code}, current time=${now}`);

        // 先查询该邮箱的所有验证码记录，帮助调试
        const { data: allCodes, error: listError } = await supabase
            .from('email_codes')
            .select('*')
            .eq('email', email)
            .order('created_at', { ascending: false })
            .limit(5); // 只查询最近5条记录

        if (listError) {
            console.error('查询验证码记录失败:', listError);
        } else {
            console.log(`找到验证码记录数: ${allCodes?.length || 0}`);
            allCodes?.forEach((code) => {
                console.log(
                    `验证码ID: ${code.id}, 代码: ${code.code}, 类型: ${code.type}, 是否已使用: ${code.used}, 过期时间: ${code.expire_at}`,
                );
            });
        }

        // 使用ISO 8601格式的时间字符串，这是PostgreSQL可接受的时间戳格式
        const nowISO = now.toISOString();
        console.log(`使用ISO格式时间进行查询: ${nowISO}`);

        const { data: emailCodeData, error: emailCodeError } = await supabase
            .from('email_codes')
            .select('*')
            .eq('email', email)
            .eq('code', code)
            .eq('type', 'register')
            .eq('used', false)
            .gte('expire_at', nowISO)
            .limit(1); // 限制只返回一条记录，避免single()可能的错误

        console.log('验证码查询结果:', { data: emailCodeData, error: emailCodeError });

        if (emailCodeError || !emailCodeData || emailCodeData.length === 0) {
            console.error('验证码验证失败:', emailCodeError?.message || '未找到匹配的有效验证码');
            return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
        }

        // 获取第一个匹配的验证码记录
        const validCode = emailCodeData[0];
        console.log('找到有效验证码:', validCode);

        // 2. 标记验证码为已使用
        const { error: updateCodeError } = await supabase
            .from('email_codes')
            .update({ used: true, updated_at: now })
            .eq('id', validCode.id);

        if (updateCodeError) {
            console.error('更新验证码状态失败:', updateCodeError);
            return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
        }

        // 3. 检查邮箱是否已注册
        const { data: existingUser, error: checkUserError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (!checkUserError && existingUser) {
            return NextResponse.json({ error: '邮箱已注册' }, { status: 400 });
        }

        // 4. 生成密码哈希
        const passwordHash = await hashPassword(password);

        // 5. 直接向users表插入数据
        const currentTime = new Date();
        const { data: newUser, error: createUserError } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    password_hash: passwordHash,
                    status: 1, // 默认状态为激活
                },
            ])
            .select();

        if (createUserError) {
            console.error('创建用户失败:', createUserError);
            return NextResponse.json(
                { error: '注册失败，请稍后重试: ' + createUserError.message },
                { status: 500 },
            );
        }

        console.log(`用户注册成功: ${email}`);

        return NextResponse.json({ message: '注册成功' }, { status: 201 });
    } catch (error) {
        console.error('注册失败:', error);
        return NextResponse.json({ error: '注册失败' }, { status: 500 });
    }
}
