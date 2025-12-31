"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Bell, Share2, Users, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notification {
	id: string;
	type: "prompt_shared" | "group_invite";
	title: string;
	message: string;
	isRead: boolean;
	createdAt: string;
	relatedId?: string;
}

export function NotificationBell() {
	const [notifications, setNotifications] = React.useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = React.useState(0);
	const [isLoading, setIsLoading] = React.useState(true);
	const [open, setOpen] = React.useState(false);

	// Fetch notifications
	const fetchNotifications = React.useCallback(async () => {
		try {
			const res = await fetch("/api/notifications");
			if (res.ok) {
				const data = await res.json();
				setNotifications(data.notifications);
				setUnreadCount(data.unreadCount);
			}
		} catch (error) {
			console.error("Failed to fetch notifications:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	React.useEffect(() => {
		fetchNotifications();
		
		// Poll for new notifications every 30 seconds
		const interval = setInterval(fetchNotifications, 30000);
		return () => clearInterval(interval);
	}, [fetchNotifications]);

	// Mark single notification as read
	const markAsRead = async (id: string) => {
		try {
			const res = await fetch(`/api/notifications/${id}/read`, {
				method: "POST",
			});
			if (res.ok) {
				setNotifications((prev) =>
					prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
				);
				setUnreadCount((prev) => Math.max(0, prev - 1));
			}
		} catch (error) {
			console.error("Failed to mark as read:", error);
		}
	};

	// Mark all as read
	const markAllAsRead = async () => {
		try {
			const res = await fetch("/api/notifications/read-all", {
				method: "POST",
			});
			if (res.ok) {
				setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
				setUnreadCount(0);
				toast.success("All notifications marked as read");
			}
		} catch (error) {
			toast.error("Failed to mark all as read");
		}
	};

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case "prompt_shared":
				return <Share2 className="h-4 w-4" />;
			case "group_invite":
				return <Users className="h-4 w-4" />;
			default:
				return <Bell className="h-4 w-4" />;
		}
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return "Just now";
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return date.toLocaleDateString();
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="sm" className="relative">
					<Bell className="h-4 w-4" />
					{unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
						>
							{unreadCount > 9 ? "9+" : unreadCount}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0" align="end">
				<div className="flex items-center justify-between px-4 py-3 border-b">
					<h3 className="font-semibold text-sm">Notifications</h3>
					{unreadCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-auto py-1 px-2 text-xs"
							onClick={markAllAsRead}
						>
							<CheckCheck className="h-3 w-3 mr-1" />
							Mark all read
						</Button>
					)}
				</div>

				<ScrollArea className="h-[300px]">
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner className="h-5 w-5" />
						</div>
					) : notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 px-4">
							<Bell className="h-8 w-8 text-muted-foreground/30" />
							<p className="mt-2 text-sm text-muted-foreground">
								No notifications yet
							</p>
						</div>
					) : (
						<div className="divide-y">
							{notifications.map((notification) => (
								<div
									key={notification.id}
									className={cn(
										"flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
										!notification.isRead && "bg-primary/5"
									)}
									onClick={() => {
										if (!notification.isRead) {
											markAsRead(notification.id);
										}
									}}
								>
									<div
										className={cn(
											"h-8 w-8 rounded-full flex items-center justify-center shrink-0",
											notification.type === "prompt_shared"
												? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
												: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
										)}
									>
										{getNotificationIcon(notification.type)}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">
											{notification.title}
										</p>
										<p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
											{notification.message}
										</p>
										<p className="text-[10px] text-muted-foreground mt-1">
											{formatTime(notification.createdAt)}
										</p>
									</div>
									{!notification.isRead && (
										<div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
									)}
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
}
