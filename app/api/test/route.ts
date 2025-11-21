import { NextResponse } from 'next/server';

// 测试接口，返回success
export async function GET() {
  console.log('测试接口被调用:', new Date().toISOString());
  return NextResponse.json({
    status: 'success',
    message: '测试接口调用成功',
    timestamp: new Date().toISOString()
  });
}
