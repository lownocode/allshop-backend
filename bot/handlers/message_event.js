import fs from 'fs';
import util from 'util';

import { vk } from '../main.js';
import { Offer, Product, User } from "../../DB/models.js";

const handler = async (message) => {
    const sendAnswer = (text) => {
        vk.api.messages.sendMessageEventAnswer({
            event_id: message.eventId, 
            peer_id: message.peerId, 
            converstation_message_ids: message.conversationMessageId, 
            user_id: message.userId,
            event_data: JSON.stringify({
                'type': 'show_snackbar',
                'text': text ? text : message.eventPayload.text
            }) 
        });
    };

    const editMessage = () => {
        vk.api.messages.edit({
            peer_id: message.peerId,
            conversation_message_id: message.conversationMessageId,
            message: message.eventPayload.text
        });
    };

    if(message.eventPayload.command == 'publish_offer') {
        const user = await User.findOne({ where: { id: message.userId } });
        if(!user.admin || !user) {
            return sendAnswer('Вы не являетесь администратором!');
        }

        const offer = await Offer.findOne({ where: { uid: message.eventPayload.offer_id } });
        if(!offer) {
            return sendAnswer('Предложения не существует, либо оно удалено')
        }

        const oldPath = '/root/shop-back/scripts/suggestions/' + offer.filename;
        const newPath = '/root/shop-back/scripts/products/' + offer.filename;

        const fsCopyFile = util.promisify(fs.copyFile).bind(fs);
        fsCopyFile(oldPath, newPath, err => {
            message.eventPayload.text = `Произошла ошибка при копировании файла:\n\n${JSON.stringify(err, null, '\t')}`;
            return editMessage();
        });
        fs.unlinkSync(oldPath, err => {
            message.eventPayload.text = `Произошла ошибка при удалении старого файла:\n\n${JSON.stringify(err, null, '\t')}`;
            return editMessage();
        });

        const answerDb = await Product.create({
            author_id: offer.author_id, 
            demo_link: offer.demo_link,
            type: offer.type,
            cost: offer.cost,
            description: offer.description,
            title: offer.title,
            filename: offer.filename,
            tags: offer.tags
        }, { returning: true });
        message.eventPayload.text = `Успешно опубликовано! Ответ БД:\n${JSON.stringify(answerDb, null, '\t')}`;

        return editMessage();
    }

    else if(message.eventPayload.command == 'destroy_offer') {
        const user = await User.findOne({ where: { id: message.userId } });
        if(!user.admin || !user) {
            return sendAnswer('Вы не являетесь администратором!');
        }

        const offer = await Offer.findOne({ where: { uid: message.eventPayload.offer_id } });
        if(!offer) {
            return sendAnswer('Предложения не существует, либо оно уже удалено')
        }

        fs.unlinkSync('/root/shop-back/scripts/suggestions/' + offer.filename);
        const answerDb = await offer.destroy();
        message.eventPayload.text = `Предложение отклонено! Ответ БД:\n${JSON.stringify(answerDb, null, '\t')}`;

        return editMessage();
    }
};

export default handler;