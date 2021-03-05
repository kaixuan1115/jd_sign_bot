(async () => {
  console.log("Puppeteer start...");
  const path = require("path");
  const fs = require("fs").promises;
  const puppeteer = require("puppeteer");
  const cookies_str = process.env.JD_COOKIE || "";

  let browser = null;
  let page = null;

  try {
    browser = await puppeteer.launch({ 
      headless: true
    });
    page = await browser.newPage();
    const client = await page.target().createCDPSession();
    let cookies = null;

    // Importing exsiting cookies from file
    try {
      console.log("Importing existing cookies...");
      const cookiesJSON = await fs.readFile(
        path.resolve(__dirname, "cookies.json")
      );
      cookies = JSON.parse(cookiesJSON);
    } catch (error) {
      console.log("Failed to import existing cookies.");
      if (cookies_str) {
        cookies = parseCookies(cookies_str, 'api.m.jd.com');
        cookies.push.apply(cookies, parseCookies(cookies_str, '.jd.com'));
      }
    }

    // Log into TextNow and get cookies
    try {
      console.log("Logging in with existing cookies");
      await page.setCookie(...cookies);
      cookies = await logIn(page, client);
    } catch (error) {
      console.log("Failed to log in with existing cookies.");
      process.exit(1);
    }

    try {
      console.log("Successfully logged into bean.m.jd.com !");
      // Save cookies to file
      await fs.writeFile(
        path.resolve(__dirname, "cookies.json"),
        JSON.stringify(cookies)
      );
      console.log("Saved cookies to file !");
      await fs.writeFile(
        path.resolve(__dirname, "cookies_str.txt"),
        cookies.filter(i => i.domain == 'api.m.jd.com').map(i => i.name+'='+i.value).join(';')
      );
    } catch (error) {
      console.log("Failed to save cookies to file.");
    }
    await browser.close();
  } catch (error) {
    console.log(error);
    if (browser) await browser.close();
    process.exit(1);
  }
})();

function parseCookies(cookies_str, domain) {
    return cookies_str.split(';').map(pair => {
        let name = pair.trim().slice(0, pair.trim().indexOf('='));
        let value = pair.trim().slice(pair.trim().indexOf('=') + 1);
        return { name, value, domain };
    });
};

const logIn = async (page, client) => {
  await Promise.all([
    page.goto("https://bean.m.jd.com/bean/signIndex.action"),
    page.waitForNavigation({ waitUtil: "networkidle2" }),
  ]);

  const isLoggedIn = page.url().includes("/signIndex.action");
  if (!isLoggedIn) {
    throw new Error("Deteacted invalid or expires cookies");
  }
  const cookies = (await client.send("Network.getAllCookies")).cookies;

  return cookies;
};

