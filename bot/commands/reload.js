import db from '../../DB/pool.js';

export const reloadCommand = {
    RegExp: /^(?:рл||rl)$/i,
    handler: async message => {
        const user = await db.query(`SELECT admin FROM users WHERE id = ${message.senderId}`);
        if(!user.rows[0].admin) return;

        await message.send(`Reloading...`);
        await process.exit();
    }
};