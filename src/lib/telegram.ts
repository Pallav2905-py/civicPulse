/**
 * Telegram Notification Helper
 * Sends status update messages back to users who submitted complaints via the Telegram bot.
 * Uses the Telegram Bot API directly (no telegraf dependency needed here).
 */

const STATUS_EMOJI: Record<string, string> = {
    SUBMITTED: "📝",
    UNDER_REVIEW: "🔍",
    IN_PROGRESS: "🔧",
    RESOLVED: "✅",
    CLOSED: "🔒",
    REJECTED: "❌",
};

const STATUS_LABEL: Record<string, string> = {
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
    REJECTED: "Rejected",
};

/**
 * Detects if a complaint was submitted via Telegram.
 * Telegram user IDs are purely numeric strings.
 */
export function isTelegramUser(userId: string): boolean {
    return /^\d+$/.test(userId);
}

/**
 * Sends a Telegram message to a user.
 * @param chatId  - The Telegram user/chat ID (numeric string)
 * @param message - Markdown-formatted message text
 */
export async function sendTelegramMessage(chatId: string, message: string): Promise<void> {
    const token = process.env.BOT_TOKEN;
    if (!token) {
        console.warn("⚠️  BOT_TOKEN not set — skipping Telegram notification.");
        return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "Markdown",
            }),
        });

        const data = await res.json() as { ok: boolean; description?: string };

        if (!data.ok) {
            console.error(`❌ Telegram API error for chat ${chatId}:`, data.description);
        } else {
            console.log(`✅ Telegram notification sent to chat ${chatId}`);
        }
    } catch (err) {
        console.error("❌ Failed to send Telegram notification:", err);
    }
}

/**
 * Sends a formatted status-update notification to a Telegram user.
 */
export async function notifyTelegramStatusUpdate(params: {
    chatId: string;
    complaintId: string;
    complaintTitle: string;
    oldStatus: string;
    newStatus: string;
    comment?: string;
    updatedByName?: string;
}): Promise<void> {
    const { chatId, complaintId, complaintTitle, oldStatus, newStatus, comment, updatedByName } = params;

    const oldEmoji = STATUS_EMOJI[oldStatus] ?? "📋";
    const newEmoji = STATUS_EMOJI[newStatus] ?? "📋";
    const newLabel = STATUS_LABEL[newStatus] ?? newStatus;
    const oldLabel = STATUS_LABEL[oldStatus] ?? oldStatus;

    let message =
        `🔔 *CivicPulse Update — Your Complaint*\n\n` +
        `🆔 ID: \`${complaintId}\`\n` +
        `📌 *${complaintTitle}*\n\n` +
        `${oldEmoji} ~~${oldLabel}~~ → ${newEmoji} *${newLabel}*\n`;

    if (comment) {
        message += `\n💬 _${comment}_\n`;
    }

    if (updatedByName) {
        message += `👤 Updated by: ${updatedByName}\n`;
    }

    if (newStatus === "RESOLVED") {
        message += `\n🎉 Your issue has been resolved! Thank you for reporting it.\nPlease use /status \`${complaintId}\` to view the full details.`;
    } else {
        message += `\nUse /status \`${complaintId}\` to track your complaint.`;
    }

    await sendTelegramMessage(chatId, message);
}
