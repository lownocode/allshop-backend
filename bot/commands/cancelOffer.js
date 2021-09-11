import { Offer, User } from "../../DB/models.js";

export const cancelOfferCommand = {
    RegExp: /^(?:Отклонить)\s([0-9]+)$/i,
    handler: async message => {
        const user = await User.findOne({ where: { id: message.senderId } });
        if (!user.admin) return;

        const offer = await Offer.findOne({ where: { uid: message.$match[1] } });

        if(!offer) {
            return message.send(`Данного предложения не существует`);
        }

        offer.destroy();
        
        return message.send(`Предложение с id ${offer.offer_id} удалено!`);
    }
};