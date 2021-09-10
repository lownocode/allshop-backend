import { readBuyHash } from "../../functions/readBuyHash.js";
import db from '../../DB/pool.js';

const buyProduct = async (fastify) => {
    fastify.post('/buyProduct', async (req, res) => {
        const check = await readBuyHash(req.body.hash, req.body.product_id);
        if(!check.valid) {
            return res.send({
                success: false,
                msg: 'Invalid body data'
            })
        }

        const product = (await db.query(`SELECT * FROM products WHERE product_id = ${check.product_id}`)).rows[0];
    
        res.send({
            success: true, 
            ...product
        });
    })
};

export default buyProduct;