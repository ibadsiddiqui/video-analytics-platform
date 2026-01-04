/**
 * PUT /api/keys/:id - Update API key
 * DELETE /api/keys/:id - Delete API key
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { encryptionService } from "@/lib/encryption";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { label, isActive } = body;

    const existingKey = await prisma.userApiKey.findUnique({
      where: { id },
    });

    if (!existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    if (existingKey.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: API key does not belong to user" },
        { status: 403 },
      );
    }

    const updatedKey = await prisma.userApiKey.update({
      where: { id },
      data: {
        label: label !== undefined ? label : existingKey.label,
        isActive: isActive !== undefined ? isActive : existingKey.isActive,
        updatedAt: new Date(),
      },
    });

    const decryptedKey = encryptionService.decrypt({
      encryptedKey: updatedKey.encryptedKey,
      iv: updatedKey.iv,
      authTag: updatedKey.authTag,
      salt: updatedKey.salt,
    });
    const maskedKey = encryptionService.maskKey(decryptedKey);

    return NextResponse.json({
      id: updatedKey.id,
      platform: updatedKey.platform,
      label: updatedKey.label,
      maskedKey,
      isActive: updatedKey.isActive,
      lastUsedAt: updatedKey.lastUsedAt,
      createdAt: updatedKey.createdAt,
      updatedAt: updatedKey.updatedAt,
    });
  } catch (error) {
    console.error("Update API key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const existingKey = await prisma.userApiKey.findUnique({
      where: { id },
    });

    if (!existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    if (existingKey.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: API key does not belong to user" },
        { status: 403 },
      );
    }

    await prisma.userApiKey.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete API key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
