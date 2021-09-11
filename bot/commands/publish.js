import { User, Offer, Product } from "../../DB/models.js";

export const publish = {
    RegExp: /^(?:опубликовать)\s([0-9]+)$/i,
    handler: async message => {
        const user = await User.findOne({ where: { id: message.senderId } });
        if(!user.admin) return;

        const offer = await Offer.findOne({ where: { uid: message.$match[1] } });
        if(!offer) {
            return message.send(`Данного предложения не существует`)
        } 
        
        await Product.create({
            author_id: offer.author_id, 
            demo_link: offer.demo_link,
            source: offer.source,
            type: offer.type,
            sum: offer.sum,
            description: offer.description,
            title: offer.title
        });
        await offer.destroy();
        
        return message.send(`Товар опубликован`);
    }
};