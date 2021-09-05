import { getUrlVars } from '../../functions/getUrlVars.js';
import db from '../../DB/pool.js';
import os from 'os';

const adminGetInfo = async (fastify) => {
    fastify.post('/admin.getInfo', async (req, res) => {
        const params = getUrlVars(req.headers['auth']);
        const user = await db.query(`SELECT * FROM users WHERE id = ${params.vk_user_id}`);
    
        if(!user.rows[0].admin || !user.rows[0]) {
            return res.send({
                success: false,
                msg: 'you are not an administrator'
            });
        }
    
        const users = await db.query(`SELECT id FROM users`);
    
        res.send({
            success: true,
            users_count: users.rows.length,
            loadavg: os.loadavg(),
            mem: {
                free: os.freemem(), 
                total: os.totalmem()
            },
            uptime: os.uptime()
        });
    })
};

export default adminGetInfo;