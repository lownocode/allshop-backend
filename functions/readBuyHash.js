import { Product } from '../DB/models.js';
import { createHmac } from 'crypto';

export const readBuyHash = async (hash, product_id) => {
    if(!hash || !product_id) return;

    const products = await Product.findAll();
    let valid = false;

    products.map(params => {
        const data = `product_id=${product_id}&author_id=${params.author_id}&cost=${params.cost}&type=${params.type}`;
        const check = createHmac('sha256', data).update(params.toString()).digest('hex');
        
        if(check === hash) {
            return valid = true;
        }
    });

    return {
        valid: valid,
        product_id: Number(product_id)
    }
};