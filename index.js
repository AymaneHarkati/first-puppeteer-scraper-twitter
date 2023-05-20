import puppeteer from "puppeteer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

function to_csv(tweet_data) {
  const fs = require("fs");

  // Create or overwrite the file
  const filename = "stanley.csv";
  fs.appendFileSync(filename, "username,handle,postDate,tweetText,likes,\n");

  // Write rows to the file
  for (const data of tweet_data) {
    const row = data.join(",");
    fs.appendFileSync(filename, row + "\n");
  }
}

async function get_tweet_data(card) {
  // username , getting the first span tag after the current tag
  const username = await card
    .$eval("span", (el) => el.textContent.replace(/\n/g, " ").trim())
    .catch(() => "N/A");

  // twitter handle
  const handle = await card.evaluate((card) => {
    const handleElement = card.querySelector('span[aria-hidden="true"] + span');
    if (handleElement) {
      return handleElement.textContent.replace(/\n/g, " ").trim();
    } else {
      return null;
    }
  });

  // post date
  const postDate = await card
    .$eval("time", (el) => el.getAttribute("datetime"))
    .catch(() => "N/A");
  // content of the tweet
  const tweetText = await card
    .$eval('div[data-testid="tweetText"]', (el) =>
      el.textContent.replace(/\n/g, " ").trim()
    )
    .catch(() => "N/A");

  // likes
  const likes = await card
    .$eval('div[data-testid="like"]', (el) =>
      el.textContent.replace(/\n/g, " ").trim()
    )
    .catch(() => "N/A");

  const tweet = [username, handle, postDate, tweetText, likes];
  return tweet;
}

const extractTweets = async (current_date, end_Date) => {
  // Start a Puppeteer session with:
  let browser;
  try {
    while (current_date >= end_Date) {
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        protocolTimeout: 0,
        maxConcurrency: 1,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-accelerated-2d-canvas",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-breakpad",
          "--disable-client-side-phishing-detection",
          "--disable-default-apps",
          "--disable-extensions",
          "--disable-features=site-per-process",
          "--disable-hang-monitor",
          "--disable-ipc-flooding-protection",
          "--disable-popup-blocking",
          "--disable-prompt-on-repost",
          "--disable-renderer-backgrounding",
          "--disable-sync",
          "--force-color-profile=srgb",
          "--metrics-recording-only",
          "--no-first-run",
          "--safebrowsing-disable-auto-update",
          "--enable-automation",
          "--password-store=basic",
          "--use-mock-keychain",
          "--enable-features=NetworkService,NetworkServiceInProcess",
        ],
      });
      const page = await browser.newPage();
      await page.setCacheEnabled(false);
      await page.goto("https://twitter.com/i/flow/login", {
        waitUntil: "networkidle0",
        timeout: 60000,
      });
      // Enter username
      const usernameSelector = '[name="text"]';
      await page.waitForSelector(usernameSelector, {
        visible: true,
        timeout: 20000,
      });
      const usernameInput = await page.$(usernameSelector);
      await usernameInput.type("naboc11531@in2reach.com");

      // Click on login button
      const loginButtonSelector =
        "/html/body/div[1]/div/div/div[1]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[6]";
      await page.waitForXPath(loginButtonSelector, {
        visible: true,
        timeout: 20000,
      });
      const [loginButton] = await page.$x(loginButtonSelector);
      await loginButton.click();

      // Enter verification username
      const isavlb = await page
        .waitForSelector(usernameSelector, { visible: true, timeout: 5000 })
        .catch(() => false);
      if (isavlb) {
        const verifyUsernameInput = await page.$(usernameSelector);
        await verifyUsernameInput.type("FaceGhost25358");
      }

      // Click on verify login button
      const verifyLoginButtonSelector =
        "/html/body/div[1]/div/div/div[1]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div/div/div";
      await page.waitForXPath(verifyLoginButtonSelector, {
        visible: true,
        timeout: 20000,
      });
      const [verifyLoginButton] = await page.$x(verifyLoginButtonSelector);
      await verifyLoginButton.click();

      // Enter password
      const passwordSelector = '[name="password"]';
      await page.waitForSelector(passwordSelector, {
        visible: true,
        timeout: 20000,
      });
      const passwordInput = await page.$(passwordSelector);
      await passwordInput.type("12345678Kakachi");

      // Click on login button again
      const loginButtonSecondSelector =
        "/html/body/div[1]/div/div/div[1]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[1]/div/div/div";
      await page.waitForXPath(loginButtonSecondSelector, {
        visible: true,
        timeout: 20000,
      });
      const [loginButtonSecond] = await page.$x(loginButtonSecondSelector);
      await loginButtonSecond.click();

      // Search input of twitter
      const search_xPATH =
        "/html/body/div[1]/div/div/div[2]/main/div/div/div/div[2]/div/div[2]/div/div/div/div[1]/div/div/div/form/div[1]/div/div/div/label/div[2]/div/input";
      const search_input = await page.waitForXPath(search_xPATH, {
        visible: true,
        timeout: 20000,
      });
      await search_input.type(
        "Morgan Stanley lang:en until:" +
          current_date.toISOString().slice(0, 10) +
          " since:" +
          end_Date.toISOString().slice(0, 10)
      );
      await search_input.press("Enter");
      // latest Tab
      const latest_xPATH =
        "/html/body/div[1]/div/div/div[2]/main/div/div/div/div/div/div[1]/div[1]/div[2]/nav/div/div[2]/div/div[2]/a/div/div/span";
      const latest_tab = await page.waitForXPath(latest_xPATH, {
        visible: true,
        timeout: 20000,
      });
      await latest_tab.click();
      console.log("start");
      var tweet_data = [];
      const tweet_ids = new Set();
      let last_position = await page.evaluate(() => window.pageYOffset);
      let scrolling = true;

      while (scrolling) {
        await page.waitForXPath('//article[@data-testid="tweet"]', {
          visible: true,
          timeout: 30000,
        });

        const cards = await page.$x('//article[@data-testid="tweet"]');
        if (tweet_data.length >= 2000) {
          break;
        }
        if (cards.length > 0) {
          for (const card of cards.slice(-10)) {
            const data = await get_tweet_data(card);
            if (data) {
              const tweet_id = data.join("");
              if (!tweet_ids.has(tweet_id)) {
                tweet_ids.add(tweet_id);
                tweet_data.push(data);
              }
            }
          }
        } else {
          throw new Error("No cards were found");
        }

        let scrollAttempt = 0;
        while (true) {
          await page.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight)
          );
          await page.waitForTimeout(5000);
          const currentPosition = await page.evaluate(() => window.pageYOffset);

          if (last_position === currentPosition) {
            scrollAttempt += 1;

            if (scrollAttempt >= 3) {
              scrolling = false;
              break;
            } else {
              await page.waitForTimeout(5000);
            }
          } else {
            last_position = currentPosition;
            break;
          }
        }
      }
      current_date = tweet_data.slice(-1)[0][2];
      let timestamp = Date.parse(current_date);
      current_date = new Date(timestamp);
      to_csv(tweet_data);
      await browser?.close();
      await new Promise(resolve => setTimeout(resolve, 10000)); // Adjust the delay as needed
    }
  } catch (error) {
    to_csv(tweet_data);
    console.error(error);
  } finally {
    await browser?.close();
    console.log("end");
  }
};

// Start the scraping
extractTweets(new Date(2016, 1, 24), new Date(2013, 0, 1));
