import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/db";

export async function GET() {
    const analytics = await getAnalytics();
    return NextResponse.json(analytics);
}
