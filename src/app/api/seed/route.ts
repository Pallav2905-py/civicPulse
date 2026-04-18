import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
    try {
        // Check if data already exists
        const { count } = await supabase
            .from("complaints")
            .select("*", { count: "exact", head: true });

        if (count && count > 0) {
            return NextResponse.json({ message: `Database already has ${count} complaints. Skipping seed.` });
        }

        const now = new Date();

        const complaints = [
            {
                id: "CPL-0001",
                user_id: "user-1",
                user_name: "Rahul Sharma",
                title: "Massive pothole on MG Road near Central Mall",
                description: "A 3-foot wide pothole has formed on MG Road near Central Mall causing accidents. Multiple two-wheelers have skidded. This is extremely dangerous and needs immediate repair.",
                latitude: 18.5204,
                longitude: 73.8567,
                address: "MG Road, Near Central Mall, Pune",
                category: "POTHOLE",
                priority: "CRITICAL",
                priority_score: 9.2,
                status: "IN_PROGRESS",
                department: "Roads & Infrastructure",
                assigned_to: "dept-roads-1",
                upvote_count: 47,
                upvoted_by: ["user-2", "user-3", "user-4"],
                estimated_resolution: new Date(now.getTime() + 1 * 86400000).toISOString(),
                created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
                updated_at: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
            },
            {
                id: "CPL-0002",
                user_id: "user-2",
                user_name: "Priya Patel",
                title: "Streetlight not working for 2 weeks - Shivaji Nagar",
                description: "The streetlight near Shivaji Park Bus Stop has been off for 15 days. The entire stretch is pitch dark at night making it unsafe for pedestrians, especially women.",
                latitude: 18.5308,
                longitude: 73.8475,
                address: "Shivaji Nagar, Near Bus Stop, Pune",
                category: "STREETLIGHT",
                priority: "HIGH",
                priority_score: 7.5,
                status: "ASSIGNED",
                department: "Electrical Department",
                assigned_to: "dept-elec-1",
                upvote_count: 23,
                upvoted_by: ["user-1", "user-3"],
                estimated_resolution: new Date(now.getTime() + 3 * 86400000).toISOString(),
                created_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
                updated_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
            },
            {
                id: "CPL-0003",
                user_id: "user-3",
                user_name: "Amit Deshmukh",
                title: "Major water pipe burst on Station Road",
                description: "A major water supply pipe has burst on Station Road near the railway station. Clean water is flowing onto the street continuously for hours. Thousands of liters being wasted.",
                latitude: 18.5285,
                longitude: 73.8743,
                address: "Station Road, Near Railway Station, Pune",
                category: "WATER_LEAK",
                priority: "CRITICAL",
                priority_score: 9.5,
                status: "SUBMITTED",
                department: "Water Supply Department",
                upvote_count: 89,
                upvoted_by: ["user-1", "user-2", "user-4"],
                estimated_resolution: new Date(now.getTime() + 1 * 86400000).toISOString(),
                created_at: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
                updated_at: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
            },
            {
                id: "CPL-0004",
                user_id: "user-4",
                user_name: "Sneha Kulkarni",
                title: "Garbage not collected for 5 days in Sector 7",
                description: "Garbage bins in Sector 7 are overflowing for 5 consecutive days. Foul smell is making life difficult. Stray animals are scattering waste everywhere.",
                latitude: 18.5155,
                longitude: 73.8410,
                address: "Sector 7, Kothrud, Pune",
                category: "GARBAGE",
                priority: "MEDIUM",
                priority_score: 5.8,
                status: "RESOLVED",
                department: "Sanitation Department",
                assigned_to: "dept-sanit-1",
                upvote_count: 15,
                upvoted_by: ["user-1"],
                estimated_resolution: new Date(now.getTime() - 1 * 86400000).toISOString(),
                created_at: new Date(now.getTime() - 8 * 86400000).toISOString(),
                updated_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
                resolved_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
            },
            {
                id: "CPL-0005",
                user_id: "user-1",
                user_name: "Rahul Sharma",
                title: "Blocked drainage causing waterlogging",
                description: "The drain near Parvati Hill Road is completely blocked. Every time it rains, the entire area gets waterlogged. Mosquito breeding has increased significantly.",
                latitude: 18.5020,
                longitude: 73.8508,
                address: "Parvati Hill Road, Pune",
                category: "DRAINAGE",
                priority: "HIGH",
                priority_score: 7.1,
                status: "IN_PROGRESS",
                department: "Drainage Department",
                assigned_to: "dept-drain-1",
                upvote_count: 34,
                upvoted_by: ["user-2", "user-3"],
                estimated_resolution: new Date(now.getTime() + 2 * 86400000).toISOString(),
                created_at: new Date(now.getTime() - 4 * 86400000).toISOString(),
                updated_at: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
            },
            {
                id: "CPL-0006",
                user_id: "user-5",
                user_name: "Vikram Joshi",
                title: "Road surface completely damaged after rains",
                description: "The road surface on FC Road between lane 5 and lane 7 has been completely destroyed after recent heavy rains. Multiple layers of asphalt have washed away.",
                latitude: 18.5233,
                longitude: 73.8414,
                address: "FC Road, Lane 5-7, Pune",
                category: "ROAD_DAMAGE",
                priority: "HIGH",
                priority_score: 7.8,
                status: "ASSIGNED",
                department: "Roads & Infrastructure",
                assigned_to: "dept-roads-2",
                upvote_count: 28,
                upvoted_by: ["user-1", "user-2"],
                estimated_resolution: new Date(now.getTime() + 3 * 86400000).toISOString(),
                created_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
                updated_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
            },
            {
                id: "CPL-0007",
                user_id: "user-2",
                user_name: "Priya Patel",
                title: "Illegal construction blocking public pathway",
                description: "An unauthorized structure is being built on the public footpath near Deccan Gymkhana. It blocks the entire pedestrian path forcing people to walk on the road.",
                latitude: 18.5168,
                longitude: 73.8413,
                address: "Deccan Gymkhana, Pune",
                category: "ILLEGAL_CONSTRUCTION",
                priority: "MEDIUM",
                priority_score: 5.5,
                status: "SUBMITTED",
                department: "Building & Planning",
                upvote_count: 12,
                upvoted_by: [],
                estimated_resolution: new Date(now.getTime() + 7 * 86400000).toISOString(),
                created_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
                updated_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
            },
            {
                id: "CPL-0008",
                user_id: "user-6",
                user_name: "Anita More",
                title: "Continuous loud music from banquet hall at night",
                description: "The banquet hall on Baner Road plays extremely loud music every night past midnight. It has been going on for weeks. Residents cannot sleep.",
                latitude: 18.5590,
                longitude: 73.7868,
                address: "Baner Road, Pune",
                category: "NOISE_POLLUTION",
                priority: "MEDIUM",
                priority_score: 4.8,
                status: "ASSIGNED",
                department: "Local Police",
                assigned_to: "dept-police-1",
                upvote_count: 19,
                upvoted_by: ["user-1"],
                estimated_resolution: new Date(now.getTime() + 5 * 86400000).toISOString(),
                created_at: new Date(now.getTime() - 6 * 86400000).toISOString(),
                updated_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
            },
            {
                id: "CPL-0009",
                user_id: "user-3",
                user_name: "Amit Deshmukh",
                title: "Overflowing garbage dump near school",
                description: "The garbage collection point near Bharati Vidyapeeth school is overflowing. Children are exposed to unhygienic conditions daily. Urgent cleanup needed.",
                latitude: 18.4947,
                longitude: 73.8542,
                address: "Near Bharati Vidyapeeth, Pune",
                category: "GARBAGE",
                priority: "HIGH",
                priority_score: 7.3,
                status: "RESOLVED",
                department: "Sanitation Department",
                assigned_to: "dept-sanit-2",
                upvote_count: 41,
                upvoted_by: ["user-1", "user-4"],
                estimated_resolution: new Date(now.getTime() - 3 * 86400000).toISOString(),
                created_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
                updated_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
                resolved_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
            },
            {
                id: "CPL-0010",
                user_id: "user-5",
                user_name: "Vikram Joshi",
                title: "Multiple streetlights broken on Sinhagad Road",
                description: "At least 6 streetlights on Sinhagad Road from Navale Bridge to Dhayari Phata are not functioning. The 2km stretch is completely dark, leading to frequent accidents.",
                latitude: 18.4725,
                longitude: 73.8233,
                address: "Sinhagad Road, Pune",
                category: "STREETLIGHT",
                priority: "CRITICAL",
                priority_score: 8.8,
                status: "IN_PROGRESS",
                department: "Electrical Department",
                assigned_to: "dept-elec-2",
                upvote_count: 56,
                upvoted_by: ["user-1", "user-2", "user-3", "user-4"],
                estimated_resolution: new Date(now.getTime() + 1 * 86400000).toISOString(),
                created_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
                updated_at: new Date(now.getTime() - 0.25 * 86400000).toISOString(),
            },
        ];

        const statusUpdates = [
            {
                id: "SU-001",
                complaint_id: "CPL-0001",
                updated_by: "dept-roads-1",
                updated_by_name: "Rajesh Kumar (Roads Dept)",
                old_status: "SUBMITTED",
                new_status: "ASSIGNED",
                comment: "Complaint received and assigned to road maintenance team.",
                created_at: new Date(now.getTime() - 1.5 * 86400000).toISOString(),
            },
            {
                id: "SU-002",
                complaint_id: "CPL-0001",
                updated_by: "dept-roads-1",
                updated_by_name: "Rajesh Kumar (Roads Dept)",
                old_status: "ASSIGNED",
                new_status: "IN_PROGRESS",
                comment: "Team dispatched. Repair work will begin by tomorrow morning.",
                created_at: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
            },
            {
                id: "SU-003",
                complaint_id: "CPL-0004",
                updated_by: "dept-sanit-1",
                updated_by_name: "Sunil Pawar (Sanitation)",
                old_status: "IN_PROGRESS",
                new_status: "RESOLVED",
                comment: "Area cleaned and garbage collected. Regular schedule restored for this sector.",
                created_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
            },
        ];

        const feedbacks = [
            {
                id: "FB-001",
                complaint_id: "CPL-0004",
                user_id: "user-4",
                rating: 4,
                comment: "Good job! The area was cleaned within the estimated time. Just wish they would maintain regularity.",
                created_at: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
            },
            {
                id: "FB-002",
                complaint_id: "CPL-0009",
                user_id: "user-3",
                rating: 5,
                comment: "Excellent response! The team cleaned up thoroughly and even added an extra bin. Thank you!",
                created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
            },
        ];

        // Insert complaints
        const { error: cError } = await supabase.from("complaints").insert(complaints);
        if (cError) {
            return NextResponse.json({ error: "Failed to seed complaints", details: cError.message }, { status: 500 });
        }

        // Insert status updates
        const { error: sError } = await supabase.from("status_updates").insert(statusUpdates);
        if (sError) {
            return NextResponse.json({ error: "Failed to seed status updates", details: sError.message }, { status: 500 });
        }

        // Insert feedbacks
        const { error: fError } = await supabase.from("feedbacks").insert(feedbacks);
        if (fError) {
            return NextResponse.json({ error: "Failed to seed feedbacks", details: fError.message }, { status: 500 });
        }

        return NextResponse.json({
            message: "Database seeded successfully!",
            counts: { complaints: complaints.length, statusUpdates: statusUpdates.length, feedbacks: feedbacks.length },
        });
    } catch (err) {
        return NextResponse.json({ error: "Seed failed", details: String(err) }, { status: 500 });
    }
}
