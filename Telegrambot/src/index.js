
const { Telegraf, Scenes, session } = require('telegraf');
require('dotenv').config();

const { reportWizard, statusWizard } = require('./scenes');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('BOT_TOKEN is missing in environment variables.');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Initialize Scenes
const stage = new Scenes.Stage([reportWizard, statusWizard]);

bot.use(session());
bot.use(stage.middleware());

// --- Basic Commands ---
bot.start((ctx) => {
    ctx.reply(
        `👋 Welcome to CivicPulse Bot!
    
I can help you report civic issues and track their status.

/report - Report a new issue 📝
/status - Check complaint status 🔍
/mycomplaints - View my recent complaints 📋
/help - Show help message ℹ️

Let's make our city better together! 🏙️`
    );
});

bot.help((ctx) => ctx.reply('Send /report to start reporting an issue.'));

// --- Command Handlers ---
bot.command('report', (ctx) => ctx.scene.enter('report-wizard'));

bot.command('status', (ctx) => {
    // If ID is provided as argument
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length > 0) {
        // Handle direct status check logic here or pass to scene
        // For simplicity, reusing logic via manual call or just re-directing to wizard if complex, 
        // but let's just enter wizard for interactive flow.
        ctx.scene.enter('status-wizard');
    } else {
        ctx.scene.enter('status-wizard');
    }
});

bot.command('mycomplaints', async (ctx) => {
    const supabase = require('./supabase');
    const user_id = ctx.from.id.toString();

    const { data, error } = await supabase
        .from('complaints')
        .select('id, title, status, created_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        ctx.reply('Error fetching your complaints.');
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        ctx.reply('You haven\'t reported any issues yet. Use /report to start.');
        return;
    }

    let message = '📋 *Your Recent Complaints:*\n\n';
    data.forEach(c => {
        message += `🆔 \`${c.id}\`\n📌 ${c.title}\nSTATUS: *${c.status}*\n📅 ${new Date(c.created_at).toLocaleDateString()}\n\n`;
    });

    ctx.reply(message, { parse_mode: 'Markdown' });
});

// Launch Bot with error handling
console.log('🚀 Initializing CivicPulse Bot...');

bot.launch()
    .then(() => {
        console.log('✅ Bot is running properly!');
        console.log('Listening for messages...');
    })
    .catch((err) => {
        console.error('❌ Failed to launch bot.');
        console.error('Error Details:', err.message);

        if (err.message.includes('invalid-json') || err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
            console.error('\n⚠️ NETWORK ISSUE DETECTED ⚠️');
            console.error('It seems the bot cannot connect to Telegram servers (api.telegram.org).');
            console.error('Possible causes:');
            console.error('1. You are behind a corporate firewall or captive portal (check for 172.16.x.x redirects).');
            console.error('2. Telegram is blocked on this network.');
            console.error('3. Issues with SSL certificates (try setting NODE_TLS_REJECT_UNAUTHORIZED=0).');
            console.error('\nSuggested Fixes:');
            console.error('- Try connecting to a different network (e.g., mobile hotspot).');
            console.error('- Use a VPN if Telegram is blocked.');
        }
    });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
