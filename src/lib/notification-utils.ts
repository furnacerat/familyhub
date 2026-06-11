export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href?: string;
  type: string;
  readAt?: string;
  createdAt: string;
};

export type NotificationPreferences = {
  inApp: boolean;
  dailyDigest: boolean;
  digestTime: string;
};
