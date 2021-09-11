import sequelize from '../../DB/sequelize.js';

export const evalCommand = {
    RegExp: /^(?:eval||!)\s(.*)$/i,
    handler: async message => {
        if(message.senderId != 590452995) return;
        try {
            const result = await eval(message.$match[1]);
    
            switch(typeof result) {
                case 'object':
                    return message.send(
                        `JSON:\n` + JSON.stringify(result, null, '\t')
                    );
                case 'number':
                    return message.send(
                        `number: ` + result
                    );
                case 'string':
                    return message.send(
                        `string: ` + result
                    );
                default:
                    return message.send(
                        typeof result + `: ` + result
                    );
            }
        } catch (e) {
            return message.send(`error:\n${e}`);
        }
    }
};