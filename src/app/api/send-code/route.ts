import { NextResponse } from 'next/server';
import { fetchOAuth2Token } from '@/lib/api';
import axios from 'axios';
import https from 'https';
import { supabase } from '@/lib/supabase';

// 定义验证码类型
type CodeType = 'register' | 'login' | 'reset_password';

/**
 * 发送验证码到指定邮箱
 * @param email 邮箱地址
 * @param code 验证码
 * @param name 用户姓名
 */
async function sendEmail(email: string, code: string, name: string) {
    try {
        // 获取OAuth2访问令牌
        const tokenResponse = await fetchOAuth2Token();
        const { access_token } = tokenResponse.data.data;

        if (!access_token) {
            console.error('响应中没有access_token字段:', tokenResponse.data);
            throw new Error('无法获取有效的访问令牌');
        }

        const accessToken = access_token;

        console.debug(accessToken, 'accessToken');

        // 准备邮件内容模板
        const htmlTemplate = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;color:#333"><h2 style="color:#0052d9">量码智源</h2><p>尊敬的 ${name}，</p><p>您正在注册/登录量码智源，请在10分钟内输入下方验证码完成验证：</p><p style="font-size:24px;font-weight:bold;color:#ff5030;margin:16px 0">${code}</p><p>如非本人操作，请忽略此邮件。</p><hr style="border:none;border-top:1px solid #e5e5e5;margin-top:32px"><p style="font-size:12px;color:#999">本邮件由系统自动发送，请勿直接回复。</p></div>`;

        const textTemplate = `量码智源

尊敬的${name}，
您正在注册/登录量码智源，请在10分钟内输入下方验证码完成验证：
${code}

如非本人操作，请忽略此邮件。
本邮件由系统自动发送，请勿直接回复。`;

        // 准备邮件请求数据
        const emailData = {
            recipients: [
                {
                    email: email,
                    name: name,
                },
            ],
            subject: '量码智源 | 邮箱验证码 - 10分钟内有效',
            html: htmlTemplate,
            text: textTemplate,
            fromName: '量码智源',
        };

        // 发送邮件请求
        console.log('发送邮件请求:', new Date().toISOString());
        const response = await axios.post('https://maiqishare.xyz/open-api/email/send', emailData, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // 忽略SSL证书验证，仅在开发环境使用
            }),
        });

        console.log('邮件发送响应数据:', response.data);

        console.log(`验证码已成功发送到邮箱: ${email}`);
    } catch (error) {
        console.error('发送邮件失败:', error);
        throw error;
    }
}

export async function POST(request: Request) {
    try {
        const { email, type = 'register', name = '用户' } = await request.json();

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: '无效的邮箱格式' }, { status: 400 });
        }

        // 验证验证码类型
        const validTypes: CodeType[] = ['register', 'login', 'reset_password'];
        if (!validTypes.includes(type as CodeType)) {
            return NextResponse.json({ error: '无效的验证码类型' }, { status: 400 });
        }

        // 生成6位随机数字验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 计算过期时间（当前时间 + 10分钟）
        const expireAt = new Date(Date.now() + 10 * 60 * 1000);

        // 使用Supabase操作数据库
        // 1. 将旧的未使用的验证码标记为已使用（幂等性处理）
        await supabase
            .from('email_codes')
            .update({ used: true })
            .eq('email', email)
            .eq('used', false);

        // 2. 创建新的验证码记录
        const { error: insertError } = await supabase.from('email_codes').insert({
            email,
            code,
            type,
            expire_at: expireAt,
        });

        if (insertError) {
            console.error('插入验证码记录失败:', insertError);
            return NextResponse.json({ error: '保存验证码失败' }, { status: 500 });
        }

        // 3. 发送邮件
        await sendEmail(email, code, name);

        return NextResponse.json({ message: '验证码发送成功' }, { status: 200 });
    } catch (error) {
        console.error('发送验证码失败:', error);
        return NextResponse.json({ error: '发送验证码失败，请稍后重试' }, { status: 500 });
    }
}
