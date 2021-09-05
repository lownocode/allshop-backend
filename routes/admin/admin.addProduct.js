import db from '../../DB/pool.js';
import { getUrlVars } from '../../functions/getUrlVars.js';

const adminAddProduct = async (fastify) => {
    fastify.post('/admin.addProduct', async (req, res) => {
        const query = req.body;
        const params = getUrlVars(req.headers['auth']);
        const user = await db.query(`SELECT * FROM users WHERE id = ${params.vk_user_id}`);
    
        if(!user.rows[0].admin) {
            return res.send({
                success: false,
                msg: 'you are not an administrator'
            });
        } 
        else if(typeof(query.sum) != 'number' || query.sum < 10 || query.sum > 50000) {
            return res.send({
                success: false, 
                msg: 'Некорректно указана сумма'
            });
        }
        else if(query.title.length > 50 || query.description.length > 800 ) {
            return res.send({
                success: false, 
                msg: 'Некорректно указано название, либо описание'
            });
        } else { 
            await db.query(`INSERT INTO products (author_id, demo_link, source, type, sum, description, title) VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
            [
                0, //author_id
                query.demo_link,
                query.source,
                query.type,
                query.sum,
                query.description,
                query.title
            ]);
            return res.send({
                success: true,
                msg: 'Товар добавлен. Ауф!'
            });
        }
    })
};

export default adminAddProduct;