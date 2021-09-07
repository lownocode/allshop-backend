import db from '../../DB/pool.js';
import { getUrlVars } from '../../functions/getUrlVars.js';

const activatePromocode = async (fastify) => {
    fastify.post('/activatePromocode', async (req, res) => {
        const params = getUrlVars(req.headers['auth']);
        const promo = await db.query(`SELECT * FROM promocodes WHERE promo = '${req.body.promo}'`);
        if(!req.body.promo) {
            return res.send({
                success: false,
                msg: 'Один из параметров отсутствует'
            });
        }
        else if(!promo.rows[0]) {
            return res.send({
                success: false,
                msg: 'Промокода не существует'
            });
        }
        else if(promo.rows[0].used_users.find(x => x.id == params.vk_user_id)) {
            return res.send({
                success: false,
                msg: 'Вы уже активировали данный промокод'
            });
        }
        else if(promo.rows[0].usages < 1) {
            return res.send({
                success: false,
                msg: 'У данного промокода закончились активации'
            });
        }
        db.query(`UPDATE users SET balance = balance + ${promo.rows[0].sum}, history = array_prepend($1, history) WHERE id = '${params.vk_user_id}' RETURNING *`, [
            {
                title: 'Активация промокода',
                date: Date.now(),
                type: 'promocode',
                amount: promo.rows[0].sum,
                code: promo.rows[0].promo
            }
        ]);
        db.query(`UPDATE promocodes SET used_users = array_prepend($1, used_users), usages = usages - 1 WHERE promo = '${promo.rows[0].promo}'`, [
            {
                id: params.vk_user_id
            }
        ]);
    
        res.send({
            success: true,
            msg: `Промокод активирован. На ваш баланс зачислено ${(promo.rows[0].sum).toLocaleString('ru-RU')} руб. Осталось активаций: ${promo.rows[0].usages - 1}`
        });
    })
};

export default activatePromocode;