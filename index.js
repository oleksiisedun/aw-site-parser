const puppeteer = require('puppeteer');
const axios = require('axios');

const learnAACLinks = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.assistiveware.com/learn-aac');
  const links = await page.evaluate(() => 
    [...document.querySelectorAll('.article-aac__content a.readmore')].map(e => e.href));
  await browser.close();
  return links;
};

const blogLinks = async () => {
  const {data: blogs} = await axios.get('https://www.assistiveware.com/api/lazy-load-blogs');
  return blogs.data.map(({html}) => html.match(/(?<=")https:.+?(?=")/)[0]);
};

const toChunks = (arr, size) => 
  arr.reduce((a, r) => a.at(-1).length < size ? (a.at(-1).push(r), a) : [...a, [r]], [[]]);

(async () => {
  const links = [...await blogLinks(), ...await learnAACLinks()];
  const chunks = toChunks(links, 10);
  const status = [];

  const browser = await puppeteer.launch();
  for (let chunk of chunks) {
    const chunkStatus = await Promise.all(chunk.map(async link => {
      const page = await browser.newPage();
      await page.goto(link);
      const imageLink = await page.evaluate(() => document.querySelector('.article-text a img'));
      await page.close();
      return imageLink != null;
    }));
    status.push(...chunkStatus);
  }
  await browser.close();
  console.log(links.filter((_, i) => status[i]));
})();

// Using axios, Promise.all & map
// const status = await Promise.all(links.map(async link => {
//   const {data: html} = await axios.get(link);
//   return /<a [^<>]+><img .*><\/a>/s.test(html);
// }));
// const result = links.filter((_, i) => status[i]);
// console.log(result);

// Using puppeteer & for-of
// const browser = await puppeteer.launch();
// const page = await browser.newPage();
// for (let link of links) {
//   await page.goto(link);
//   const imageLink = await page.evaluate(() => document.querySelector('.article-text a img'));
//   if (imageLink != null) console.log(link);
// }
// await browser.close();