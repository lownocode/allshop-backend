import { User } from '../../DB/models.js';

import { getUrlVars } from '../../functions/getUrlVars.js';
import { createUser } from '../../functions/createUser.js';

const getUser = async (fastify) => {
    fastify.post('/getUser', async (req, res) => {
        const params = getUrlVars(req.headers['auth']);
        const user = await User.findOne({ 
            where: { id: params.vk_user_id },
            attributes: ['id', 'history', 'balance', 'purchases', 'admin']
        });
    
        if(!user) {
            const newUser = await createUser(params.vk_user_id);
            return res.send(newUser);
        }

        res.send(user);
    })
};

export default getUser;