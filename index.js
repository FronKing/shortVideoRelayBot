import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { getTiktokMedia } from './src/downloaders/tiktok.js';
import { galleries } from './src/galleries.js';

const TIKTOK_URL_REGEX = /https?:\/\/(?:(?:www|m|vm|vt)\.)?tiktok\.com\/(?:@[\w.-]+\/(?:video|photo)\/\d+|t\/[\w-]+|v\/\d+|[\w-]+)\/?(?:\?[^\s]*)?/i;

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('start', (ctx) => {
    ctx.reply('Давай сюда ссылку на ТТ, олух. Мистер блуд кстати педик');
});

bot.on('message', async (ctx) => {
    const message = ctx.message.text;
    if (message.match(TIKTOK_URL_REGEX)) {
        await getTiktokMedia(message, ctx);
    }
});

const editMessageMediaData = (galleryId, gallery) => {
    return [
        {
            type: 'photo',
            media: {
                source: gallery.photos[gallery.index],
            },
            caption: `Фото ${gallery.index + 1} / ${gallery.photos.length}`,
        },
        {
            reply_markup: {
                inline_keyboard: [[
                    { text: '◀️', callback_data: `prev_photo:${galleryId}` },
                    { text: '▶️', callback_data: `next_photo:${galleryId}` },
                ]],
            },
        }
    ]
}

bot.action(/^next_photo:(.+)$/, async (ctx) => {
    const galleryId = ctx.match[1];
    const gallery = galleries.get(ctx.match[1]);

    if (!gallery || gallery.index >= gallery.photos.length - 1) {
        return ctx.answerCbQuery('Последнее фото');
    }
    gallery.index++;
    await ctx.editMessageMedia(...editMessageMediaData(galleryId, gallery));
    await ctx.answerCbQuery();
});

bot.action(/^prev_photo:(.+)$/, async (ctx) => {
    const galleryId = ctx.match[1];
    const gallery = galleries.get(ctx.match[1]);
    if (!gallery || gallery.index <= 0) {
        return ctx.answerCbQuery('Первое фото');
    }
    gallery.index--;
    await ctx.editMessageMedia(...editMessageMediaData(galleryId, gallery));
    await ctx.answerCbQuery();
});

bot.launch();