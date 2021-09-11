import { User, Promocode } from "../../DB/models.js";
import sequelize from 'sequelize';
const { Sequelize } = sequelize;

export const promocodeCommand = {
    RegExp: /^(?:промо||промокод)\s(.*)$/i,
    handler: async message => {
        const promo = await Promocode.findOne({ where: { promo: message.$match[1] } });
        
        if(!promo || promo.error) {
            return message.send(`Промокод не найден`);
        }
        else if(promo.used_users.find(x => x.id == message.senderId)) {
            return message.send(`Вы уже активировали данный промокод`);
        }
        else if(promo.usages < 1) {
            return message.send(`У данного промокода закончились активации`)
        }

        const user = await User.findOne({ where: { id: message.senderId } });

        user.balance = user.balance + promo.sum;
        user.update({
            history: Sequelize.fn('array_prepend', JSON.stringify({
                title: 'Активация промокода',
                date: Date.now(),
                type: 'promocode',
                amount: promo.sum,
                code: promo.promo
            }), Sequelize.col('history'))
        });
        await user.save();

        promo.usages = promo.usages - 1;
        promo.update({
            used_users: Sequelize.fn('array_prepend', JSON.stringify({
                id: user.id
            }), Sequelize.col('used_users'))
        });
        await promo.save();

        return message.send(`Промокод активирован.\nНа ваш баланс зачислено ${promo.sum} руб.\nТеперь ваш баланс составляет ${user.balance} руб.\nОсталось активаций: ${promo.usages}`)
    }
};