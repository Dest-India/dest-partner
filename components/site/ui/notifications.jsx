import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Bell, BellDot, CheckCheck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState, useMemo, useCallback } from 'react'

const initialNotifications = [
  {
    "id": "8f1d9a1e-51c4-4d85-9f6e-3d60e2d3f001",
    "user_id": "c45f9e8e-5a34-4b1a-9c91-3a12cce3d010",
    "type": "info",
    "title": "Welcome Back!",
    "message": "We’ve missed you. CheckCheck out what’s new.",
    "action_url": "",
    "is_read": false,
    "created_at": "2025-09-02T10:23:15Z"
  },
  {
    "id": "2a7e451b-36d4-41a0-913a-4b32e9a2c102",
    "user_id": "f12a1c34-4d2b-49e0-84e9-abc23f441a44",
    "type": "alert",
    "title": "Password Expiring",
    "message": "Your password will expire in 5 days. Please update it soon.",
    "action_url": "",
    "is_read": false,
    "created_at": "2025-09-02T18:05:41Z"
  },
  {
    "id": "3c8d92af-5d15-4c1d-a5d8-7b62a56c3e45",
    "user_id": "b45f9e8e-7a21-43a9-9a12-4c1efce3d111",
    "type": "message",
    "title": "New Message",
    "message": "You received a new message from John Doe.",
    "action_url": "/messages/123",
    "is_read": true,
    "created_at": "2025-09-03T07:12:58Z"
  },
  {
    "id": "4d2e11be-12c3-4f91-95c1-0a8b8f6a22de",
    "user_id": "a12f9e8e-6a14-4b2a-9c87-3b11bce3d222",
    "type": "update",
    "title": "System Update",
    "message": "Version 2.3 has been successfully installed.",
    "action_url": "",
    "is_read": false,
    "created_at": "2025-09-03T14:45:20Z"
  },
  {
    "id": "5e3d72cf-42a5-4b1f-b2d4-91c61f6d93e7",
    "user_id": "d91f9e8e-3b21-4d9a-8e91-3a14ece3d333",
    "type": "reminder",
    "title": "Event Reminder",
    "message": "Your scheduled event starts in 30 minutes.",
    "action_url": "/events/789",
    "is_read": false,
    "created_at": "2025-09-03T19:11:09Z"
  },
  {
    "id": "6f4e83df-52c7-4e22-a92d-71f11d2f55aa",
    "user_id": "e33f9e8e-9a54-4b3c-9c11-3a55dce3d444",
    "type": "info",
    "title": "Profile Updated",
    "message": "Your profile information was successfully updated.",
    "action_url": "/profile",
    "is_read": true,
    "created_at": "2025-09-04T09:33:42Z"
  },
  {
    "id": "7a5f94ef-61d8-4f33-b81d-83a21e3f66cc",
    "user_id": "f91f9e8e-4a87-4b2a-8c22-3a99ece3d555",
    "type": "alert",
    "title": "Unusual Login",
    "message": "We detected a login from a new device.",
    "action_url": "",
    "is_read": false,
    "created_at": "2025-09-04T12:47:16Z"
  },
  {
    "id": "8b6fa5ff-71e9-4f44-b91e-95a32e4f77dd",
    "user_id": "g21f9e8e-5c33-4d4a-8a91-3a55ece3d666",
    "type": "message",
    "title": "Team Invitation",
    "message": "You have been invited to join the Marketing Team.",
    "action_url": "/teams/invitations",
    "is_read": false,
    "created_at": "2025-09-04T15:02:58Z"
  },
  {
    "id": "9c7fb6ff-82f1-4f55-c22d-a5b43f5f88ee",
    "user_id": "h51f9e8e-6d44-4e5a-9a11-3a11ece3d777",
    "type": "reminder",
    "title": "Billing Reminder",
    "message": "Your subscription will renew tomorrow.",
    "action_url": "",
    "is_read": true,
    "created_at": "2025-09-05T06:18:29Z"
  },
  {
    "id": "ad8fc7ff-93f2-4f66-d33d-b6c54f6f99ff",
    "user_id": "i61f9e8e-7e55-4f6a-8a12-3a12ece3d888",
    "type": "update",
    "title": "Feature Release",
    "message": "New analytics dashboard is now available.",
    "action_url": "",
    "is_read": false,
    "created_at": "2025-09-05T11:55:04Z"
  }
]

const formatTimeAgo = (dateString, short = true) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minutes ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hours ago`;
  } else if (diffInSeconds < 172800) {
    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return short ? `Yesterday` : `Yesterday at ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return short ? `${dateStr}` : `${dateStr} at ${timeStr}`;
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  // Memoize unread count calculation
  const unreadCount = useMemo(() =>
    notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  // Memoize sorted notifications
  const sortedNotifications = useMemo(() => {
    return [...initialNotifications]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .sort((a, b) => a.is_read - b.is_read);
  }, []);

  useEffect(() => {
    setNotifications(sortedNotifications);
  }, [sortedNotifications]);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    )
  }, []);

  const handleMarkAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, is_read: true }
          : n
      )
    );
  }, []);

  const handleActionClick = useCallback((actionUrl, notificationId) => {
    if (actionUrl) {
      router.push(actionUrl);
      // Mark as read when taking action
      handleMarkAsRead(notificationId);
    }
  }, [router, handleMarkAsRead]);

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className={`size-8 ${unreadCount && 'text-destructive hover:text-destructive hover:bg-destructive/4'}`}>
              {unreadCount ? <BellDot /> : <Bell />}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">
          Notifications
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 md:w-88 p-0 overflow-hidden rounded-lg">
        <div className="flex items-baseline justify-between gap-4 p-4 py-3 border-b">
          <div className="text-sm font-semibold">Notifications</div>
          {unreadCount > 0 && (
            <button
              className="text-xs hover:underline underline-offset-3"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto p-1.5">
          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="hover:bg-accent rounded-md px-3 py-2 text-sm transition-colors"
              >
                <div className="relative flex items-center gap-2">
                  <div className="flex-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="font-medium text-foreground/80 text-left cursor-pointer">{notification.title}</div>
                      </DialogTrigger>
                      <DialogContent showCloseButton={false} className="p-4 pt-6">
                        <DialogHeader>
                          <DialogTitle>{notification.title}</DialogTitle>
                          <DialogDescription>{formatTimeAgo(notification.created_at, false)}</DialogDescription>
                        </DialogHeader>
                        <p>{notification.message}</p>
                        <DialogFooter className="justify-between !m-0">
                          {!notification.is_read ? (
                            <Button
                              onClick={() => handleMarkAsRead(notification.id)}
                              size="sm"
                              variant="ghost"
                            >
                              <CheckCheck className="size-3.5" /> Mark as read
                            </Button>
                          ) : <div />}
                          <div className="flex items-center gap-2">
                            {notification.action_url && (
                              <Button
                                onClick={() => handleActionClick(notification.action_url, notification.id)}
                                size="sm"
                              >
                                Take Action
                              </Button>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DialogClose asChild>
                                  <Button variant="outline" size="icon" className="size-8"><X /></Button>
                                </DialogClose>
                              </TooltipTrigger>
                              <TooltipContent>Close</TooltipContent>
                            </Tooltip>
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <div className="text-muted-foreground text-xs">
                      {formatTimeAgo(notification.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {notification.action_url && (
                      <Button
                        onClick={() => handleActionClick(notification.action_url, notification.id)}
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                      >
                        Action
                      </Button>
                    )}
                    {!notification.is_read && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleMarkAsRead(notification.id)}
                            size="icon"
                            variant="outline"
                            className="size-7"
                          >
                            <CheckCheck className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent align="end">Mark as read</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover >
  )
}
