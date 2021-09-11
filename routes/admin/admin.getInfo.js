import { getUrlVars } from '../../functions/getUrlVars.js';
import { User } from '../../DB/models.js';
import os from 'os';

const adminGetInfo = async (fastify) => {
    fastify.post('/admin.getInfo', async (req, res) => {
        const params = getUrlVars(req.headers['auth']);
        const user = await User.findOne({ where: { id: params.vk_user_id } });
    
        if(!user.admin || !user) {
            return res.send({
                success: false,
                msg: 'you are not an administrator'
            });
        }
    
        const users = await User.findAll({ attributes: ['uid'] });
    
        res.send({
            success: true,
            users_count: users.length,
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