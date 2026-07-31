const mongoose = require('mongoose');
const Show = require('./models/Show');
require('dotenv').config();

// 🕒 मोंगोडीबी के लिए एक निश्चित और फिक्स टाइमस्टैम्प (Fixed Static Time)
// उदाहरण: आज दोपहर ठीक 3:00:00 PM का समय
const fixedStartTime = new Date();
fixedStartTime.setHours(15, 0, 0, 0); // Hours: 15 (3 PM), Min: 0, Sec: 0, Ms: 0

const testShow = {
    title: "My Dream Live Movie",
    description: "An incredible content that users can watch seamlessly with simulated live timeline sync.",
    contentType: "movie", // 🍿 कन्टेंट टाइप मूवी सेट किया ताकि सिंगल लिंक प्ले हो सके
    posterUrl: "https://unsplash.com", 
    cardUrl: "https://unsplash.com", // आवश्यक कार्ड यूआरएल 
    genre: ["Action", "Sci-Fi"], 
    episodes: [
        {
            episodeNumber: 1,
            title: "Simulated Live Stream Source",
            // 🎬 एक असली वर्किंग वीडियो लिंक ताकि प्लेयर तुरंत लोड होकर सिंक चेक कर सके
            streamUrl: "https://googleapis.com", 
            downloadUrl: "https://mega.nz"
        }
    ],
    
    // 📺 PURE PSEUDO-LIVE TV SCHEDULER ENGINE FIELDS
    isLiveScheduled: true,
    liveStartTime: fixedStartTime, // डेटाबेस में दोपहर 3:00 बजे का फिक्स टाइम सेव होगा
    durationInSeconds: 7200 // 2 घंटे की फिल्म (7200 सेकंड्स)
};

async function seedDatabase() {
    try {
        // मोंगोडीबी डेटाबेस से सुरक्षित रूप से कनेक्ट करें
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to database for seeding...");

        // पुराने टेस्ट डेटा को साफ़ करें ताकि डुप्लीकेट न बने
        await Show.deleteMany({});

        // नया फिक्स लाइव शो डेटाबेस में सेव करें
        const savedShow = new Show(testShow);
        await savedShow.save();

        console.log("🚀 SUCCESS: Fixed Live TV show inserted into MongoDB successfully!");
        process.exit(0); // स्क्रिप्ट को क्लोज करें
    }
    catch (err) {
        console.error("❌ Seeding transaction failed:", err);
        process.exit(1);
    }
}

seedDatabase();
