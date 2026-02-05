import { getProjectSettings, NotificationTypes, supabase } from './supabase';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

export type NotificationType = keyof NotificationTypes;

interface PMInfo {
  agentId: string;
  displayName: string;
  discordUserId: string | null;
}

async function getProjectPMs(projectId: string): Promise<PMInfo[]> {
  // Get current PM from project
  const { data: project } = await supabase
    .from('projects')
    .select('current_pm_id')
    .eq('id', projectId)
    .single();

  if (!project?.current_pm_id) return [];

  // Get PM's discord_user_id from agents table
  const { data: agent } = await supabase
    .from('agents')
    .select('id, display_name, discord_user_id')
    .eq('id', project.current_pm_id)
    .single();

  if (!agent) return [];

  return [{
    agentId: agent.id,
    displayName: agent.display_name || agent.id,
    discordUserId: agent.discord_user_id || null,
  }];
}

function formatMentions(pms: PMInfo[]): string {
  const mentions = pms
    .filter(pm => pm.discordUserId)
    .map(pm => `<@${pm.discordUserId}>`)
    .join(' ');
  
  return mentions || '';
}

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

async function getNotifyChannel(projectId?: string): Promise<string | null> {
  if (projectId) {
    try {
      const settings = await getProjectSettings(projectId);
      return settings.notify_channel || null;
    } catch {
      return null;
    }
  }
  return null;
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

async function sendToChannel(channelId: string, content: string): Promise<boolean> {
  if (!DISCORD_TOKEN) {
    console.warn('DISCORD_TOKEN not configured, cannot send to channel');
    return false;
  }

  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      console.error('Failed to send Discord channel message:', response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending Discord channel message:', error);
    return false;
  }
}

async function sendToWebhook(webhookUrl: string, content: string): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      console.error('Failed to send Discord webhook:', response.status, response.statusText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
    return false;
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

  // Get PM mentions if we have a project
  let mentions = '';
  if (projectId) {
    const pms = await getProjectPMs(projectId);
    mentions = formatMentions(pms);
  }

  // Prepend mentions to message if we have any
  const fullMessage = mentions ? `${mentions}\n${message}` : message;

  // Try channel-based notification first (preferred)
  const channelId = await getNotifyChannel(projectId);
  if (channelId && DISCORD_TOKEN) {
    const sent = await sendToChannel(channelId, fullMessage);
    if (sent) return; // Success! Don't fall through to webhook
  }

  // Fall back to webhook
  const webhookUrl = await getWebhookUrl(projectId);
  if (webhookUrl) {
    await sendToWebhook(webhookUrl, fullMessage);
    return;
  }

  console.warn('No notification channel or webhook configured, skipping notification');
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

export async function testChannelNotification(channelId: string, projectName: string): Promise<boolean> {
  if (!DISCORD_TOKEN) {
    console.warn('DISCORD_TOKEN not configured');
    return false;
  }

  return sendToChannel(
    channelId,
    `✅ **Clowd-Control** — Channel notification test successful! Notifications are working for project: ${projectName}`
  );
}
