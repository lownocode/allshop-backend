import { User, Promocode } from "../../DB/models.js";

export const promocodesCommand = {
    RegExp: /^(?:Промокоды)$/i,
    handler: async message => {
        const user = await User.findOne({ where: { id: message.senderId } });
        const promocodes = await Promocode.findAll();
        let selectPromocodes = ``;

        if(!user.admin) return;

        if(promocodes.length === 0) {
            return message.send(`Промокодов нет`);
        }

        promocodes.map((promocode) => {
            if(promocode.usages <= 0) return;
            return selectPromocodes += 
            `${promocode.uid}. Код: ${promocode.promo} Использований: ${promocode.usages} из ${Number(promocode.usages + promocode.used_users.length)} Сумма: ${promocode.sum}\n`;
        });

        await message.send(selectPromocodes);
    }
};