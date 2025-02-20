import { getRequestInfo } from "@/framework/log-request-helper";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const requestPath = new URL(req.url).pathname;

  const clientInfo = await getRequestInfo(req);
  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const query = req.nextUrl.searchParams;
  const queryString = query.toString();

  try {
    const res = await fetch(`${requestPath}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization as string,
      },
    });
    return Response.json({ ...res });
  } catch (error: any) {
    if (error && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    } else if (error) {
      return NextResponse.json(error, { status: 500 });
    } else {
      return NextResponse.json("An error occurred", { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  const requestPath = new URL(req.url).pathname;
  const clientInfo = await getRequestInfo(req);

  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const body = await req.json();
  const query = req.nextUrl.searchParams;
  const queryString = query.toString();
  try {
    const res = await fetch(`${requestPath}?${queryString}`, {
      body,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization as string,
      },
    });
    return Response.json({ ...res });
  } catch (error: any) {
    if (error && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    } else if (error) {
      return NextResponse.json(error, { status: 500 });
    } else {
      return NextResponse.json("An error occurred", { status: 500 });
    }
  }
}

export async function PUT(req: NextRequest) {
  const requestPath = new URL(req.url).pathname;
  const clientInfo = await getRequestInfo(req);
  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const body = await req.json();
  const query = req.nextUrl.searchParams;
  const queryString = query.toString();
  try {
    const res = await fetch(`${requestPath}?${queryString}`, {
      body,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization as string,
      },
    });
    return Response.json({ ...res });
  } catch (error: any) {
    if (error && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    } else if (error) {
      return NextResponse.json(error, { status: 500 });
    } else {
      return NextResponse.json("An error occurred", { status: 500 });
    }
  }
}

export async function DELETE(request: Request) {}

export async function PATCH(request: Request) {}
