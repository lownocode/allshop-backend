import { getUrlVars } from '../../functions/getUrlVars.js';
import { Offer, User } from '../../DB/models.js';

const adminGetOffers = async (fastify) => {
    fastify.post('/admin.getOffers', async (req, res) => {
        const params = getUrlVars(req.headers['auth']);
        const user = await User.findOne({ where: { id: params.vk_user_id } });
        const offers = await Offer.findAll();
    
        if(!user.admin) {
            return res.send({
                success: false,
                msg: 'you are not an administrator'
            });
        } else { 
            return res.send(offers);
        }
    })
};

export default adminGetOffers;