import { processResponse } from "@/framework/joee.client";
import { getRequestInfo } from "@/framework/log-request-helper";
import { siteConfig } from "@/framework/site-config";
import axios from "axios";
import { NextResponse, type NextRequest } from "next/server";
import FormDataNode from "form-data";



const apiUrl = siteConfig.host;

export async function GET(req: NextRequest) {
  console.log("req-->", apiUrl);
  const requestPath = new URL(req.url).pathname;
  const pathName = requestPath.split("/api")[1];
  const clientInfo = await getRequestInfo(req);
  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const query = req.nextUrl.searchParams;
  const queryString = query.toString();
const pathUrl = `${apiUrl}${pathName}${queryString ? "?" + queryString : ""}`;
console.log("pathUrl-->", pathUrl);
  try {
    const res = await axios.get(
      pathUrl,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization as string,
        },
      }
    );
    const response = processResponse(res);
    return Response.json({ ...response });
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
  console.log("req-->", apiUrl);
  const requestPath = new URL(req.url).pathname;
  const pathName = requestPath.split("/api")[1];
  
  try {
  const clientInfo = await getRequestInfo(req);
  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization");
  
  const contentType = req.headers.get("Content-Type");
  const isMultipart = contentType?.includes("multipart/form-data");
  
  let body;
  if (isMultipart) {
    // Handle FormData - convert Next.js FormData to form-data package for Node.js compatibility
    const nextFormData = await req.formData();
    
    // Create a new FormData using the form-data package for Node.js
    const nodeFormData = new FormDataNode();
    
    // Log and convert FormData contents
    const entries: any = {};
    for (const [key, value] of nextFormData.entries()) {
      if (value instanceof File) {
        // Convert File to Buffer for form-data package
        const arrayBuffer = await value.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        nodeFormData.append(key, buffer, {
          filename: value.name,
          contentType: value.type || 'application/octet-stream',
        });
        entries[key] = {
          name: value.name,
          size: value.size,
          type: value.type,
          isFile: true
        };
      } else {
        nodeFormData.append(key, value as string);
        entries[key] = value;
      }
    }
    console.log("FormData received and converted:", entries);
    body = nodeFormData;
  } else {
    // Handle JSON
    try {
      body = await req.json();
    } catch (jsonError) {
      // If JSON parsing fails, body might be empty or invalid
      body = {};
    }
  }
    
  const query = req.nextUrl.searchParams;
  const queryString = query.toString();
  const path = `${apiUrl}${pathName}${queryString ? "?" + queryString : ""}`;
    console.log("POST pathUrl-->", path, "isMultipart:", isMultipart);
    
    // For FormData, let axios set the Content-Type header automatically with boundary
    // For JSON, set Content-Type explicitly
    const headers: any = {
      Authorization: authorization as string | "",
      "x-client-info": JSON.stringify(clientInfo),
      "x-client-host": clientInfo["host"],
      "x-client-protocol": clientInfo["protocol"],
    };
    
    // Only set Content-Type for non-FormData requests
    // Axios will automatically set multipart/form-data with boundary for FormData
    if (!isMultipart) {
      headers["Content-Type"] = contentType || "application/json";
    }
    
    const res = await axios.post(
      path, 
      isMultipart ? body : JSON.stringify(body),
      {
        headers: isMultipart ? {
          ...headers,
          ...(body as FormDataNode).getHeaders(), // Get headers with boundary from form-data
        } : headers,
      }
    );
    const response = processResponse(res);
    return Response.json({ ...response });
  } catch (error: any) {
    console.error("POST error:", error);
    if (error && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    } else if (error) {
      return NextResponse.json(
        { 
          error: error.message || "An error occurred",
          details: error.toString() 
        }, 
        { status: 500 }
      );
    } else {
      return NextResponse.json("An error occurred", { status: 500 });
    }
  }
}

export async function PUT(req: NextRequest) {
  const requestPath = new URL(req.url).pathname;
  const pathName = requestPath.split("/api")[1];
  const clientInfo = await getRequestInfo(req);

  console.log("clientInfo-->", clientInfo);
  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization");

  const contentType = req.headers.get("Content-Type");
  const isMultipart = contentType?.includes("multipart/form-data");

  const body = isMultipart
    ? await req.formData()
    : contentType?.includes("application/json")
    ? await req.json()
    : await req.json();
  console.log("body-->", body, isMultipart);
  const query = req.nextUrl.searchParams;
  const queryString = query.toString();
  const path = `${apiUrl}${pathName}${queryString ? "?" + queryString : ""}`;
  try {
    const res = await axios.put(
      path,
      isMultipart ? body : JSON.stringify(body),
      {
        headers: {
          "Content-Type": contentType || "application/json",
          Authorization: authorization as string | "",
          "x-client-info": JSON.stringify(clientInfo),
          "x-client-host": clientInfo["host"],
          "x-client-protocol": clientInfo["protocol"],
        },
      }
    );
    const response = processResponse(res);
    return Response.json({ ...response });
  } catch (error: any) {
    if (error && error.response) {
      console.log(error, "--> error");

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

export async function DELETE(req: NextRequest) {
  const requestPath = new URL(req.url).pathname;
  const pathName = requestPath.split("/api")[1];
  const clientInfo = await getRequestInfo(req);
  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const query = req.nextUrl.searchParams;
  const queryString = query.toString();
  const path = `${apiUrl}${pathName}${queryString ? "?" + queryString : ""}`;
  
  try {
    const res = await axios.delete(path, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization as string | "",
      },
    });
    const response = processResponse(res);
    return Response.json({ ...response });
  } catch (error: any) {
    console.error("DELETE error:", error);
    if (error && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    } else if (error) {
      return NextResponse.json(
        { 
          error: error.message || "An error occurred",
          details: error.toString() 
        }, 
        { status: 500 }
      );
    } else {
      return NextResponse.json("An error occurred", { status: 500 });
    }
  }
}

export async function PATCH(req: NextRequest) {
  const requestPath = new URL(req.url).pathname;
  const pathName = requestPath.split("/api")[1];
  const clientInfo = await getRequestInfo(req);

  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization");

  const contentType = req.headers.get("Content-Type");
  const isMultipart = contentType?.includes("multipart/form-data");

  const body = isMultipart
    ? await req.formData()
    : contentType?.includes("application/json")
    ? await req.json()
    : await req.json();

  const query = req.nextUrl.searchParams;
  const queryString = query.toString();
  const path = `${apiUrl}${pathName}${queryString ? "?" + queryString : ""}`;

  try {
    const res = await axios.patch(
      path,
      isMultipart ? body : JSON.stringify(body),
      {
        headers: {
          "Content-Type": contentType || "application/json",
          Authorization: authorization as string | "",
          "x-client-info": JSON.stringify(clientInfo),
          "x-client-host": clientInfo["host"],
          "x-client-protocol": clientInfo["protocol"],
        },
      }
    );

    const response = processResponse(res);
    return Response.json({ ...response });
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

