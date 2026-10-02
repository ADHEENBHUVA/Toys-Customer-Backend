const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: Number,
    compareAtPrice: Number,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    status: { type: String, default: 'Active' },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    images: [String],
    thumbnailImage: String,
    sku: { type: String, unique: true }
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true }
});

const Product = mongoose.model('Product', productSchema);
const Category = mongoose.model('Category', categorySchema);

async function seed() {
    try {
        await mongoose.connect('mongodb://Vinit04:DGFSFM15xAbnOvjV@ac-69epuyt-shard-00-00.9vaob4b.mongodb.net:27017,ac-69epuyt-shard-00-01.9vaob4b.mongodb.net:27017,ac-69epuyt-shard-00-02.9vaob4b.mongodb.net:27017/adheen6?ssl=true&replicaSet=atlas-ikf2zx-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0');
        console.log('Connected to DB');

        const categories = await Category.find();
        
        for (const cat of categories) {
            for (let i = 1; i <= 3; i++) {
                const prod = new Product({
                    name: `Premium ${cat.name} Set ${i}`,
                    description: `This is a high-quality, safe ${cat.name.toLowerCase()} designed specially for your little ones. It provides endless hours of fun and learning while being completely non-toxic and highly durable.`,
                    price: Math.floor(Math.random() * 1500) + 200, 
                    compareAtPrice: Math.floor(Math.random() * 500) + 2000, 
                    category: cat._id,
                    status: 'Active',
                    stock: 50,
                    sku: 'SKU-' + Date.now() + Math.floor(Math.random() * 100000),
                    rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
                    reviewCount: Math.floor(Math.random() * 150) + 10,
                    images: [
                        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80'
                    ],
                    thumbnailImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80'
                });
                await prod.save();
            }
            console.log(`Added 3 products for ${cat.name}`);
        }
        console.log('Database seeded successfully!');
        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        mongoose.disconnect();
    }
}
seed();
