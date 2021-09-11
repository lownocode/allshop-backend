import { User, Offer } from "../../DB/models.js";

export const offersCommand = {
    RegExp: /^(?:Предложения)$/i,
    handler: async message => {
        const user = await User.findOne({ where: { id: message.senderId } });
        const offers = await Offer.findAll();
        let selectOffers = ``;

        if(!user.admin) return;

        if(offers.length === 0) {
            return message.send(`Предложений нет`)
        }

        offers.map((offer, index) => {
            return selectOffers += `${index + 1}. ID: ${offer.uid}, USER: @id${offer.author_id}\n`;
        });

        await message.send(selectOffers);
    }
};