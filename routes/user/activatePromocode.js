import { Promocode, User } from '../../DB/models.js';
import sequelize from 'sequelize';
import { getUrlVars } from '../../functions/getUrlVars.js';

const { Sequelize } = sequelize;

const activatePromocode = async (fastify) => {
    fastify.post('/activatePromocode', async (req, res) => {
        const params = getUrlVars(req.headers['auth']);
        const user = await User.findOne({ where: { id: params.vk_user_id } });

        if(!req.body.promo) {
            return res.send({
                success: false,
                msg: 'Один из параметров отсутствует'
            });
        }
        const promo = await Promocode.findOne({ where: { promo: req.body.promo } });
        if(!promo) {
            return res.send({
                success: false,
                msg: 'Промокода не существует'
            });
        }
        else if(promo.used_users.find(x => x.id == params.vk_user_id)) {
            return res.send({
                success: false,
                msg: 'Вы уже активировали данный промокод'
            });
        }
        else if(promo.usages < 1) {
            return res.send({
                success: false,
                msg: 'У данного промокода закончились активации'
            });
        }

        user.balance = user.balance + promo.sum;
        await user.save();
        
        User.update({
            history: Sequelize.fn('array_prepend', JSON.stringify({
                title: 'Активация промокода',
                date: Date.now(),
                type: 'promocode',
                amount: promo.sum,
                code: promo.promo
            }), Sequelize.col('history'))
        }, { where: { id: params.vk_user_id } });

        Promocode.update({ 
            used_users: Sequelize.fn('array_prepend', JSON.stringify({
                id: params.vk_user_id
            }), Sequelize.col('used_users'))
        }, { where: { promo: promo.promo } });
    
        res.send({
            success: true,
            msg: `Промокод активирован. На ваш баланс зачислено ${(promo.sum).toLocaleString('ru-RU')} руб. Осталось активаций: ${promo.usages - 1}`
        });
    })
};

export default activatePromocode;