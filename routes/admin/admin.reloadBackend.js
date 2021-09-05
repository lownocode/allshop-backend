import functions from '../../functions.js';
import db from '../../DB/pool.js';

const adminReloadBackend = async (fastify) => {
    fastify.post('/admin.reloadBackend', async (req, res) => {
        const params = functions.getUrlVars(req.headers['auth']);
        const user = await db.query(`SELECT admin FROM users WHERE id = ${params.vk_user_id}`);
    
        if(!user.rows[0].admin || !user.rows[0]) {
            return res.send({
                success: false,
                msg: 'you are not an administrator'
            });
        }
    
        res.send({
            success: true,
            msg: 'Перезагрузка бекенда...'
        });
        process.exit();
    })
};

export default adminReloadBackend;