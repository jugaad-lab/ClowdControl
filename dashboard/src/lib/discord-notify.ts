import { getProjectSettings, NotificationTypes } from './supabase';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export type NotificationType = keyof NotificationTypes;

async function getWebhookUrl(projectId?: string): Promise<string | null> {
  if (projectId) {
    try {
      const settings = await getProjectSettings(projectId);
      if (settings.notification_webhook_url) {
        return settings.notification_webhook_url;
      }
    } catch {
      // Fall through to env var
    }
  }
  return DISCORD_WEBHOOK_URL || null;
}

async function isNotificationEnabled(
  projectId: string | undefined,
  type: NotificationType
): Promise<boolean> {
  if (!projectId) return true; // No project context = always send
  try {
    const settings = await getProjectSettings(projectId);
    if (!settings.notification_types) return true; // No config = send all
    return settings.notification_types[type] ?? true;
  } catch {
    return true;
  }
}

export async function notifyPM(
  message: string,
  projectId?: string,
  notificationType?: NotificationType
): Promise<void> {
  // Check if this notification type is enabled
  if (projectId && notificationType) {
    const enabled = await isNotificationEnabled(projectId, notificationType);
    if (!enabled) return;
  }

  const webhookUrl = await getWebhookUrl(projectId);

  if (!webhookUrl) {
    console.warn('No webhook URL configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });

    if (!response.ok) {
      console.error('Failed to send Discord notification:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

export async function testNotification(webhookUrl: string, projectName: string): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `✅ **Clowd-Control** — Webhook test successful! Notifications are working for project: ${projectName}`
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}
