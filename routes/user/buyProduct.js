import { readBuyHash } from "../../functions/readBuyHash.js";
import { Product } from "../../DB/models.js";

const buyProduct = async (fastify) => {
    fastify.post('/buyProduct', async (req, res) => {
        const check = await readBuyHash(req.body.hash, req.body.product_id);
        if(!check.valid) {
            return res.send({
                success: false,
                msg: 'Invalid body data'
            })
        }

        const product = await Product.findOne({ where: { uid: check.product_id } });
    
        res.send({
            success: true, 
            ...product
        });
    })
};

export default buyProduct;