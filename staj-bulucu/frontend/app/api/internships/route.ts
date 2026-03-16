import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || 'staj';
  const location = searchParams.get('location') || '';

  // Forward to FastAPI backend
  try {
    const res = await fetch(`http://localhost:8000/internships?keyword=${keyword}&location=${location}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Backend connection failed' }, { status: 500 });
  }
}
