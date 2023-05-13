import puppeteer from "puppeteer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

function to_csv(tweet_data) {
  const fs = require("fs");

  // Create or overwrite the file
  const filename = "tweets.csv";
  fs.writeFileSync(
    filename,
    "username,handle,postDate,tweetText,retweets,likes,keyword_used,\n"
  );

  // Write rows to the file
  for (const data of tweet_data) {
    const row = data.join(",");
    fs.appendFileSync(filename, row + "\n");
  }
}

async function get_tweet_data(card) {
  try {
  } catch (err) {
  } finally {
  }
  // username , getting the first span tag after the current tag
  const username = await card.$eval("span", (el) => el.textContent);
  console.log("Username: " + username + "\n");

  // twitter handle
  const handle = await card.evaluate((card) => {
    const handleElement = card.querySelector('span[aria-hidden="true"] + span');
    if (handleElement) {
      return handleElement.textContent;
    } else {
      return null;
    }
  });
  console.log("Twitter Handle: " + handle + "\n");

  // post date
  const postDate = await card
    .$eval("time", (el) => el.getAttribute("datetime"))
    .catch(() => "N/A");
  console.log("Post Date: " + postDate + "\n");
  // content of the tweet
  const tweetText = await card.$eval(
    'div[data-testid="tweetText"]',
    (el) => el.textContent
  );
  console.log("Responding: " +  tweetText + "\n");

  // retweet
  const retweets = await card.$eval(
    'div[data-testid="retweet"]',
    (el) => el.textContent
  );
  console.log("Retweets: " + retweets + "\n");

  // likes
  const likes = await card.$eval(
    'div[data-testid="like"]',
    (el) => el.textContent
  );
  const keyword_used = "aapl";

  const tweet = [
    username,
    handle,
    postDate,
    tweetText,
    retweets,
    likes,
    keyword_used,
  ];
  return tweet;
}

const extractTweets = async () => {
  // Start a Puppeteer session with:

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      timeout: 0,
      args: [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ]
    });
    const page = await browser.newPage();

    await page.goto("https://twitter.com/i/flow/login", {
      waitUntil: "networkidle0",
    });
    page.setDefaultNavigationTimeout(0);
    page.setDefaultTimeout(0);
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
      .waitForSelector(usernameSelector, { visible: true, timeout: 20000 })
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
    await search_input.type("JP Morgan lang:en until:2019-12-31 since:2013-01-01");
    await search_input.press("Enter");
    // latest Tab
    const latest_xPATH =
      "/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[1]/div[1]/div[2]/nav/div/div[2]/div/div[2]/a";
    const latest_tab = await page.waitForXPath(latest_xPATH, {
      visible: true,
      timeout: 20000,
    });
    await latest_tab.click();
    var tweet_data = [];
    const tweet_ids = new Set();
    let last_position = await page.evaluate(() => window.pageYOffset);
    let scrolling = true;

    while (scrolling) {
      await page.waitForXPath('//article[@data-testid="tweet"]');
      const cards = await page.$x('//article[@data-testid="tweet"]');

      if (cards.length > 0) {
        for (const card of cards.slice(-15)) {
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
  } catch (error) {
    console.error(error);
  } finally {
    await browser?.close();
    to_csv(tweet_data);
  }
};

// Start the scraping
extractTweets();
