import sharp from 'sharp';
import { galleries } from '../galleries.js';

export const getTiktokMedia = async (message, ctx) => {
    const url = `https://tik-tok2.p.rapidapi.com/api/tiktok/links/?url=${message}`;

    const options = {
	method: 'POST',
	headers: {
		'x-rapidapi-key': process.env.RAPIDAPI_KEY,
		'x-rapidapi-host': process.env.RAPIDAPI_HOST,
		'Content-Type': 'application/json'
	},
	body: JSON.stringify({ url: message })
};

try {
	const response = await fetch(url, options);

	const result = await response.json();

    const isPhoto = result[0]?.meta?.sourceUrl?.includes('/photo/');

    if (isPhoto) {
        await ctx.sendChatAction('upload_photo');

        let photos = [];

        for (const item of result) {
            const imageResponse = await fetch(`https://tik-tok2.p.rapidapi.com${item.pictureUrl}`, {
                headers: {
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                    'x-rapidapi-host': process.env.RAPIDAPI_HOST,
                },
            });


            if (imageResponse.headers.get('content-type') !== 'image/webp') continue;
           
            const buffer = Buffer.from(await imageResponse.arrayBuffer());

            const compressed = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();

            photos.push(compressed);
        }

        const galleryId = String(Date.now());

        galleries.set(galleryId, { photos, index: 0 });
        
        await ctx.replyWithPhoto(
            { source: photos[0] },
            {
                caption: `Фото ${galleries.get(galleryId).index + 1} / ${photos.length}`,
                reply_markup: {
                    inline_keyboard: [[
                        { text: '◀️', callback_data: `prev_photo:${galleryId}` },
                        { text: '▶️', callback_data: `next_photo:${galleryId}` },
                    ]],
                },
            }
        );
        
    } else {
        await ctx.sendChatAction('upload_video');
    const videoUrl  = result[0].urls.find(item => item.subName === '720')?.url;
   
    const videoResponse = await fetch(videoUrl);
    const buffer = Buffer.from(await videoResponse.arrayBuffer());

    await ctx.replyWithVideo(
        { source: buffer, filename: 'video.mp4' },
    );
    }

	

} catch (error) {
	ctx.reply('Ошибка, сейчас разраб ахуеет ее чинить');
    console.error(error);
}
}

