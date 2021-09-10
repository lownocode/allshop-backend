import db from '../DB/pool.js';
import { createHmac } from 'crypto';

export const readBuyHash = async (hash, product_id) => {
    if(!hash || !product_id) return;

    const products = (await db.query(`SELECT * FROM products`)).rows;
    let valid = false;

    products.map(params => {
        console.log(params)
        const data = `product_id=${product_id}&author_id=${params.author_id}&cost=${params.sum}&type=${params.type}`;
        const check = createHmac('sha256', data).update(params.toString()).digest('hex');
        console.log(data, check)
        
        if(check === hash) {
            return valid = true;
        }
    });

    return {
        valid: valid,
        product_id: Number(product_id)
    }
};