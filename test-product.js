const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:admin@cluster0.zexm0.mongodb.net/toys_website?retryWrites=true&w=majority');
const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
async function test() {
    const product = await Product.findOne({});
    console.log(product);
    process.exit();
}
test();
