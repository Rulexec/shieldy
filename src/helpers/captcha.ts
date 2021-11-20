import {create} from 'svg-captcha';
import sharp from 'sharp';

export type ImageCaptcha = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  png: any;
  text: string;
};
export async function getImageCaptcha(): Promise<ImageCaptcha> {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const catpcha = create({
    size: 6,
    ignoreChars: letters + letters.toUpperCase(),
    noise: 2,
    width: 150,
    height: 100,
  });
  return {
    png: await sharp(Buffer.from(catpcha.data)).png().toBuffer(),
    text: catpcha.text,
  };
}
