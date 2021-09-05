import db from '../../DB/pool.js';

const getProducts = async (fastify) => {
    fastify.post('/getProducts', async (req, res) => {
        const products = await db.query(`SELECT * FROM products`);
        const sortProducts = new Array();
    
        products.rows.map(product => {
            sortProducts.push({
                author_id: product.author_id,
                title: product.title,
                description: product.description,
                cost: product.sum,
                product_id: product.product_id,
                type: product.type,
                demo_link: product.demo_link
            })
        });
    
        res.send(sortProducts.reverse());
    })
};

export default getProducts;