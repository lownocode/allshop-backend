import { getUrlVars } from '../../functions/getUrlVars.js';
import db from '../../DB/pool.js';

const adminGetOffers = async (fastify) => {
    fastify.post('/admin.getOffers', async (req, res) => {
        const params = getUrlVars(req.headers['auth']);
        const user = await db.query(`SELECT * FROM users WHERE id = ${params.vk_user_id}`);
        const offers = await db.query(`SELECT * FROM offers`);
    
        if(!user.rows[0].admin) {
            return res.send({
                success: false,
                msg: 'you are not an administrator'
            });
        } else { 
            return res.send(offers.rows);
        }
    })
};

export default adminGetOffers;