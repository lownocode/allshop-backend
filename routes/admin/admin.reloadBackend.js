import { getUrlVars } from '../../functions/getUrlVars.js';
import { User } from '../../DB/models.js';

const adminReloadBackend = async (fastify) => {
    fastify.post('/admin.reloadBackend', async (req, res) => {
        const params = getUrlVars(req.headers['auth']);
        const user = await User.findOne({ where: { id: params.vk_user_id } });
    
        if(!user.admin) {
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