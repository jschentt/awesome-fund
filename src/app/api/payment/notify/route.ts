import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { code: string } }) {
    console.log(params, '7支付回调');
    return NextResponse.json({ message: '支付回调处理完成' }, { status: 200 });
}
