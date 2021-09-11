import { User } from "../../DB/models.js";

export const reloadCommand = {
    RegExp: /^(?:рл||rl)$/i,
    handler: async message => {
        const user = await User.findOne({ where: { id: message.senderId } });
        if(!user.admin) return;

        await message.send(`Reloading...`);
        await process.exit();
    }
};