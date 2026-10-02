const mongoose = require('mongoose');
const Category = require('./models/Category');

const MONGO_URI = "mongodb://Vinit04:DGFSFM15xAbnOvjV@ac-69epuyt-shard-00-00.9vaob4b.mongodb.net:27017,ac-69epuyt-shard-00-01.9vaob4b.mongodb.net:27017,ac-69epuyt-shard-00-02.9vaob4b.mongodb.net:27017/adheen6?ssl=true&replicaSet=atlas-ikf2zx-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

const additionalCategories = [
    { 
        name: "Art & Craft", 
        description: "Creative supplies for little artists.", 
        image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop" 
    },
    { 
        name: "Musical Toys", 
        description: "Instruments to discover sounds.", 
        image: "https://images.unsplash.com/photo-1514115880361-591dc8f7ce11?w=400&h=400&fit=crop" 
    },
    { 
        name: "Outdoor Play", 
        description: "Toys for exploring the outdoors.", 
        image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=400&fit=crop" 
    },
    { 
        name: "Educational Games", 
        description: "Fun games that teach new skills.", 
        image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&h=400&fit=crop" 
    },
    { 
        name: "Role Play Sets", 
        description: "Imaginative play for aspiring minds.", 
        image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop" 
    }
];

async function seedCategories() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");
        
        for (const cat of additionalCategories) {
            await Category.findOneAndUpdate(
                { name: cat.name },
                cat,
                { upsert: true, new: true }
            );
        }
        
        console.log("5 Additional Categories added successfully.");
    } catch (error) {
        console.error("Error seeding categories:", error);
    } finally {
        mongoose.connection.close();
    }
}

seedCategories();
