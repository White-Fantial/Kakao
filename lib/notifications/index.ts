import type { NotificationType } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

const NOTIFICATIONS_PER_PAGE = 30;

export type CreateNotificationParams = {
  recipientId: string;
  type: NotificationType;
  relatedPostId?: string;
  relatedCommentId?: string;
  actorId?: string;
};

export type NotificationLinkTarget = {
  relatedPostId: string | null;
  relatedCommentId: string | null;
};

export function getNotificationHref(notification: NotificationLinkTarget): string | null {
  if (!notification.relatedPostId) return null;
  if (notification.relatedCommentId) {
    return `/posts/${notification.relatedPostId}#comment-${notification.relatedCommentId}`;
  }
  return `/posts/${notification.relatedPostId}`;
}

export async function createNotification(params: CreateNotificationParams) {
  await prisma.notification.create({
    data: {
      recipientId: params.recipientId,
      type: params.type,
      relatedPostId: params.relatedPostId ?? null,
      relatedCommentId: params.relatedCommentId ?? null,
      actorId: params.actorId ?? null,
    },
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { recipientId: userId, isRead: false },
  });
}

export async function getNotifications(userId: string, cursor?: string) {
  return prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    take: NOTIFICATIONS_PER_PAGE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      type: true,
      isRead: true,
      relatedPostId: true,
      relatedCommentId: true,
      actorId: true,
      createdAt: true,
    },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true },
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: userId },
    data: { isRead: true },
  });
}

export async function openNotification(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, recipientId: userId },
    select: {
      relatedPostId: true,
      relatedCommentId: true,
      isRead: true,
    },
  });

  if (!notification) {
    return null;
  }

  if (!notification.isRead) {
    await prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId, isRead: false },
      data: { isRead: true },
    });
  }

  return getNotificationHref(notification);
}

export async function archiveNotification(notificationId: string, userId: string) {
  await prisma.notification.deleteMany({
    where: { id: notificationId, recipientId: userId },
  });
}
