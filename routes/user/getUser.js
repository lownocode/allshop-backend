import db from '../../DB/pool.js';

import { getUrlVars } from '../../functions/getUrlVars.js';
import { createUser } from '../../vk_bot.js';

const getUser = async (fastify) => {
    fastify.post('/getUser', async (req, res) => {
        const params = getUrlVars(req.headers['auth']);
        const user = await db.query(`SELECT * FROM users where id = ${params.vk_user_id}`);
    
        if(!user.rows[0]) {
            const newUser = await createUser(params.vk_user_id);
            return res.send(newUser);
        }

        res.send(user.rows[0]);
    })
};

export default getUser;