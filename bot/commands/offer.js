import { User, Offer } from "../../DB/models.js";

export const offerCommand = {
    RegExp: /^(?:Предложение)\s([0-9]+)$/i,
    handler: async message => {
        const user = await User.findOne({ where: { id: message.senderId } });
        const offer = await Offer.findOne({ where: { uid: message.$match[1] } });
        const offers = await Offer.findAll({ attributes: ['uid'] });

        if(!user.admin) return;

        if(offers.length === 0) {
            return message.send(`Предложений нет`)
        }

        if(!offer) {
            return message.send(`Данного предложения не существует, минимальный айди предложения - ${offers[0].uid}`)
        } 

        return message.send(JSON.stringify(offer, null, '\t'));
    }
};