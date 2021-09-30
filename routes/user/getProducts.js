import { Product } from "../../DB/models.js";

const getProducts = async (fastify) => {
    fastify.post('/getProducts', async (req, res) => {
        const products = (await Product.findAll({ attributes: ['author_id', 'cost', 'demo_link', 'description', 'uid', 'title', 'type', 'createdAt', 'tags'] })).reverse();

        res.send(products);
    })
};

export default getProducts;