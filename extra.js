'use strict';

const exec = require('child_process').execSync;
const fs = require('fs');

// 公共变量
const KEY = process.env.JD_COOKIE;

async function changeFile (fileName) {
   if (fileName) {
	 let content = await fs.readFileSync(fileName, 'utf8');
	 content = content.replace(/GITHUB/, 'GITHUB_NOT_FOUND');
	 await fs.writeFileSync(fileName, content, 'utf8');
	 return;
   }
   let content = await fs.readFileSync('./extra/jdCookie.js', 'utf8')
   content = content.replace(/var Key = ''/, `var Key = '${KEY}'`);
   await fs.writeFileSync('./extra/jdCookie.js', content, 'utf8');
}

const CRONTAB = {
	'./extra/jd_global.js': /2021-03/
};

async function start() {
  if (!KEY) {
    console.log('请填写 key 后在继续')
    return
  }

  await changeFile();
  const today = new Date();
  today.setUTCHours(today.getUTCHours() + 8);
  const data_str = today.toISOString();
  for (const fileName in CRONTAB) {
    if (!CRONTAB[fileName].test(data_str)) continue;
    await changeFile(fileName);
    console.log('开始执行:', fileName);
    await exec("node " + fileName, { stdio: [1, 2] });
  }
}

start()
