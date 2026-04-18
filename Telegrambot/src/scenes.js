
const { Scenes, Markup } = require('telegraf');
const { processUserMessage } = require('./ai');
const supabase = require('./supabase');

// --- Conversational Report Wizard ---
const reportWizard = new Scenes.WizardScene(
    'report-wizard',

    // Step 1: Initialize and Welcome
    async (ctx) => {
        await ctx.reply('Please describe the issue you are facing in as much detail as possible.');
        return ctx.wizard.next();
    },

    // Step 2: Receive Text and Ask for Location
    async (ctx) => {
        if (ctx.message && ctx.message.text && ctx.message.text === '/cancel') {
            await ctx.reply('Operation cancelled.');
            return ctx.scene.leave();
        }

        if (!ctx.message || !ctx.message.text) {
            await ctx.reply('Please describe the issue using text, or type /cancel to stop.');
            return;
        }

        ctx.wizard.state.issueDescription = ctx.message.text;

        await ctx.reply('Please share the exact location of the issue.', Markup.keyboard([
            Markup.button.locationRequest('📍 Share Location')
        ]).oneTime().resize());
        
        return ctx.wizard.next();
    },

    // Step 3: Handle Location and Save
    async (ctx) => {
        if (!ctx.message || !ctx.message.location) {
            await ctx.reply('Please share a valid location using the button.');
            return;
        }

        ctx.wizard.state.location = ctx.message.location;

        await ctx.reply('🔄 Processing your report...');
        await ctx.sendChatAction('typing');

        const userText = ctx.wizard.state.issueDescription;

        // Call Gemini AI
        const aiResponse = await processUserMessage([], userText);
        
        // Process AI Data
        let aiData;
        if (aiResponse.status === 'COMPLETE') {
            aiData = aiResponse.data;
        } else {
            // Fallback if AI didn't format it properly
            aiData = {
                title: userText.substring(0, 50),
                description: userText,
                category: 'Other',
                priority: 'MEDIUM',
                priority_score: 5.0,
                department: 'General Administration',
                estimated_resolution: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
            };
        }

        // Prepare data for Supabase
        const location = ctx.wizard.state.location;
        const user = ctx.from;
        const complaintId = `CMP-${Date.now()}`; // Simple ID generation

        // Perform reverse geocoding
        let realAddress = 'Location shared via Telegram';
        try {
            const fetch = require('node-fetch');
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`, {
                headers: { 'User-Agent': 'CivicPulseBot/1.0' }
            });
            const geoData = await res.json();
            if (geoData && geoData.display_name) {
                realAddress = geoData.display_name;
            }
        } catch (e) {
            console.error("Geocoding Error:", e);
        }

        const complaintRecord = {
            id: complaintId,
            user_id: user.id.toString(),
            user_name: `${user.first_name} ${user.last_name || ''}`.trim(),

            // Fields from AI
            title: aiData.title,
            description: aiData.description,
            category: aiData.category,
            priority: aiData.priority,
            priority_score: aiData.priority_score,
            department: aiData.department,
            estimated_resolution: aiData.estimated_resolution,
            status: 'SUBMITTED',

            // Fields from User Attachments
            photo_url: null, // Hardcoded to null since photo step is skipped
            latitude: location.latitude,
            longitude: location.longitude,
            address: realAddress, 

            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('complaints')
            .insert([complaintRecord]);

        if (error) {
            console.error('Supabase Error:', error);
            await ctx.reply('❌ System Error: Could not save your complaint. Please try again later.', Markup.removeKeyboard());
        } else {
            // Output summary
            const summary = `✅ *Complaint Registered Successfully!*
Reference ID: \`${complaintId}\`

🔄 *Submitting Complaint...*
*Title:* ${complaintRecord.title}
*Category:* ${complaintRecord.category}
*Priority:* ${complaintRecord.priority}

We will notify you when the status changes.`;
            
            await ctx.replyWithMarkdown(summary, Markup.removeKeyboard());
        }

        return ctx.scene.leave();
    }
);

// --- Status Check Wizard ---
const statusWizard = new Scenes.WizardScene(
    'status-wizard',
    (ctx) => {
        ctx.reply('Please enter your Complaint ID (e.g., CPL-015742-459 or seed-...):');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const complaintId = ctx.message.text.trim(); // Trim whitespace
        console.log(`Checking status for ID: '${complaintId}'`);

        if (!complaintId) {
            ctx.reply('Please enter a valid text ID.');
            return ctx.scene.leave();
        }

        const hardcodedComplaints = {
            'CPL-015742-459': { title: '🕳️ Pothole near Aissms', category: 'Pothole', priority: 'MEDIUM', status: 'SUBMITTED', assigned: 'Chief Officer Sharma', date: '27 Mar' },
            'seed-1774586465847-9': { title: 'Noise pollution from construction site in Wakad', category: 'Other', priority: 'MEDIUM', status: 'In Progress', assigned: 'Chief Officer Sharma', date: '26 Mar' },
            'seed-1774586465846-5': { title: 'Water pipeline burst in Aundh IT Park area', category: 'Water', priority: 'CRITICAL', status: 'SUBMITTED', assigned: 'Comm. Singh', date: '26 Mar' },
            'seed-1774586465846-3': { title: '💡 Streetlights not working on Sinhagad Road', category: 'Streetlight', priority: 'HIGH', status: 'SUBMITTED', assigned: 'Chief Officer Sharma', date: '26 Mar' },
            'seed-1774586465846-2': { title: '🗑️ Overflowing garbage dump at Kothrud bus stop', category: 'Garbage', priority: 'HIGH', status: 'In Progress', assigned: 'Comm. Singh', date: '24 Mar' },
            'seed-1774586465846-4': { title: '🌊 Open manhole near Nal Stop endangering pedestrians', category: 'Drainage', priority: 'CRITICAL', status: 'RESOLVED', assigned: 'Director Verma', date: '23 Mar' },
            'seed-1774586465847-10': { title: '📋 Fallen tree blocking road in Shivajinagar after storm', category: 'Other', priority: 'CRITICAL', status: 'SUBMITTED', assigned: 'Chief Officer Sharma', date: '23 Mar' },
            'seed-1774586465846-7': { title: 'Broken traffic signal at Hinjawadi Chowk', category: 'Traffic', priority: 'HIGH', status: 'RESOLVED', assigned: 'Director Verma', date: '22 Mar' },
            'seed-1774586465846-6': { title: 'Illegal construction blocking public footpath in Viman Nagar', category: 'Other', priority: 'MEDIUM', status: 'SUBMITTED', assigned: 'Chief Officer Sharma', date: '21 Mar' },
            'seed-1774586465846-1': { title: '🕳️ Massive pothole on FC Road causing accidents', category: 'Pothole', priority: 'CRITICAL', status: 'SUBMITTED', assigned: 'Director Verma', date: '20 Mar' },
            'seed-1774586465847-8': { title: '📋 Stray dog menace in Koregaon Park Lane 5', category: 'Other', priority: 'HIGH', status: 'SUBMITTED', assigned: 'Comm. Singh', date: '20 Mar' }
        };

        const hc = hardcodedComplaints[complaintId];

        if (hc) {
            const message = `🆔 Tracking ID: ${complaintId}
📌 Status: ${hc.status.toUpperCase()}
📂 Category: ${hc.category}
🔺 Priority: ${hc.priority}
👤 Assigned To: ${hc.assigned}
📅 Submitted: ${hc.date}
📝 Title: ${hc.title}
📄 Description: ${hc.title}
📍 Location: Pune, Maharashtra`;
            ctx.reply(message);
            return ctx.scene.leave();
        }

        // Fallback to Supabase
        const { data, error } = await supabase
            .from('complaints')
            .select('*')
            .eq('id', complaintId)
            .single();

        console.log('Supabase Query Result:', { data, error });

        if (error || !data) {
            console.error('Status Check Error:', error);
            ctx.reply(`❌ Complaint not found.\nInput ID: \`${complaintId}\`\nError: ${error ? error.message : 'No data returned'}\n\nPlease check the ID and try again. /status`, { parse_mode: 'Markdown' });
        } else {
            const message = `🆔 Tracking ID: ${data.id}
📌 Status: ${data.status}
📂 Category: ${data.category || 'N/A'}
🔺 Priority: ${data.priority || 'N/A'}
👤 Assigned To: System
📅 Submitted: ${new Date(data.created_at).toLocaleDateString()}
📝 Title: ${data.title}
📄 Description: ${data.description || data.title}
📍 Location: ${data.address || 'Pune, Maharashtra'}`;
            ctx.reply(message);
        }
        return ctx.scene.leave();
    }
);

module.exports = { reportWizard, statusWizard };
