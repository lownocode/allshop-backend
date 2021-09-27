import { Product, Review } from "../../DB/models.js";

const getReviews = async (fastify) => {
    fastify.post('/getReviews', async (req, res) => {
        const product = await Product.findOne({ where: { uid: req.body.product_id } });
        const reviews = (await Review.findAll({ where: { product_id: req.body.product_id } })).reverse();

        if(!product) {
            return res.send({
                success: false,
                msg: 'Товар не найден'
            });
        }

        return res.send({
            success: true,
            reviews: reviews || [],
            product: product.title
        });
    })
};

export default getReviews;