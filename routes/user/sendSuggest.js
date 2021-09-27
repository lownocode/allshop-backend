import { randomBytes } from 'crypto';
import fs from 'fs';
import { Keyboard } from 'vk-io';

import { getUrlVars } from '../../functions/getUrlVars.js';
import { getSuggestParams } from '../../functions/getSuggestParams.js';
import { vk } from '../../bot/main.js';
import { User, Offer } from '../../DB/models.js';

const sendSuggest = async (fastify) => {
    fastify.post('/sendSuggest', async (req, res) => {
        const query = getSuggestParams(req.headers.params);
        const params = getUrlVars(req.headers['auth']);
        const user = await User.findOne({ where: { id: params.vk_user_id } });

        const file = await req.file();
        const fileSize = file.file._readableState.length;
        const buffer = await file.toBuffer();

        const detachExtension = (string) => {
            const selectors = string.split('.');
            selectors.splice(0, 1);

            let res = ``;

            selectors.map(ext => {
                res += '.' + ext;
            });
            return res;
        };

        const readableBytes = (bytes) => {
            let i = Math.floor(Math.log(bytes) / Math.log(1024)),
            sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + sizes[i];
        };

        const validFileTypes = [
            'x-java-archive', 'x-tar', 'x-bzip',
            'gzip', 'x-lzma', 'vnd.rar', 'zip'
        ];

        const key = randomBytes(15).toString('hex');
        const fileName = 'id' + params.vk_user_id + '_' + key + detachExtension(file.filename);

        if(Number(query.sum) < 10 || Number(query.sum) > 50000) {
            return res.send({
                success: false, 
                msg: 'Некорректно указана сумма'
            });
        }
        else if(query.title.length > 50 || query.description.length > 800 ) {
            return res.send({
                success: false, 
                msg: 'Некорректно указано название, либо описание'
            });
        } 
        else if(!query.type || !Number(query.sum) || !query.description || !query.title) {
            return res.send({
                success: false, 
                msg: 'Один из параметров отсутствует'
            });
        } 
        else if(!file) {
            return res.send({
                success: false,
                msg: 'Файл с исходными файлами отсутствует'
            });
        }
        else if(fileSize > 157286400) {
            return res.send({
                success: false,
                msg: 'Размер файла не должен превышать 150 MB'
            });
        }
        else if(validFileTypes.findIndex(t => t === file.mimetype.split('/')[1] || '') === -1) {
            return res.send({
                success: false,
                msg: 'Тип файла не является валидным'
            });
        }

        fs.writeFile('scripts/suggestions/' + fileName, buffer, async (err) => {
            if (err) {
                vk.api.messages.send({
                    chat_id: 1,
                    random_id: 0,
                    message: `@id${params.vk_user_id} предложил скрипт, но произошла ошибка при сохранении файла, параметры:\n\n${JSON.stringify(query, null, '\t')}\n\nОшибка:\n${JSON.stringify(err, null, '\t')}`
                });
                return res.send({
                    success: false,
                    msg: 'Ошибка при сохранении файла на наш сервер. Попробуйте позднее'
                });
            }

            const answerDB = await Offer.create({
                author_id: user.id, 
                demo_link: query.demo_link,
                type: query.type,
                sum: Number(query.sum),
                description: query.description,
                title: query.title,
                filename: fileName
            }, { returning: true });
            
            vk.api.messages.send({
                chat_id: 1,
                random_id: 0,
                message: `@id${params.vk_user_id} предложил скрипт, параметры:\n\n ${JSON.stringify(query, null, '\t')}\n\nОтвет БД:\n${JSON.stringify(answerDB, null, '\t')}\nИмя файла: ${file.filename}\nРазмер файла: ${readableBytes(Number(fileSize))}\nФайл сохранён на сервере как: ${fileName}\n\nЧтобы опубликовать введите Опубликовать <<id предложения>>`,
                keyboard: Keyboard.keyboard([
                    [
                        Keyboard.callbackButton({
                            label: 'Опубликовать',
                            color: 'positive',
                            payload: {
                                command: 'publish_offer',
                                offer_id: answerDB.uid
                            }
                        }),
                        Keyboard.callbackButton({
                            label: 'Отклонить',
                            color: 'negative',
                            payload: {
                                command: 'destroy_offer',
                                offer_id: answerDB.uid
                            }
                        })
                    ]
                ]).inline()
            });

            return res.send({
                success: true,
                msg: 'Ожидайте, товар добавлен и проходит проверку'
            });
        });
    })
};

export default sendSuggest;