import { User, Promocode } from "../../DB/models.js";
import { genRandomString } from '../../functions/genRandomString.js';

export const createPromocodeCommand = {
    RegExp: /^(?:создать промокод)\s([0-9]+)\s([0-9]+)$/i,
    handler: async message => {
        const user = await User.findOne({ where: { id: message.senderId } });
        if(!user.admin) return;

        if(!message.$match[1] || !message.$match[2]) {
            return message.send(`Использование: создать промокод <<сумма>> <<кол-во активаций>>`);
        }
        const promo = await createPromo(message.$match[1], message.$match[2]);
        if(promo.error) {
            return message.send(JSON.stringify(promo.error)) 
        }
        
        message.send(`Промокод создан\n\n${JSON.stringify(promo)}`);
        message.send(promo.promo);
    }
};

const createPromo = async (sum, usages) => {
    const promo = genRandomString(4) + '-' + genRandomString(4) + '-' + genRandomString(4) + '-' + genRandomString(4);
    const newPromo = await Promocode.create({
        promo: promo, 
        sum: sum, 
        usages: usages
    });
    
    return newPromo;
};