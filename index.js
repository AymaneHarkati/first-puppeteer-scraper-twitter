import puppeteer from "puppeteer";
import { append_to_csv } from "./to_csv.js";
import { get_tweet_data } from "./get_tweet_data.js";

const extractTweets = async (
  current_date,
  end_Date,
  email,
  username,
  password,
  keyword,
  csv_name
) => {
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
      await usernameInput.type(email);

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
        await verifyUsernameInput.type(username);
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
      await passwordInput.type(password);

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
        timeout: 200000,
      });
      await search_input.type(
        keyword +
          " lang:en until:" +
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
          timeout: 300000,
        });

        const cards = await page.$x('//article[@data-testid="tweet"]');
        if (tweet_data.length >= 2000) {
          break;
        }
        if (cards.length > 0) {
          for (const card of cards.slice(-200)) {
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
      current_date = tweet_data.slice(-1)[0][0];
      let timestamp = Date.parse(current_date);
      current_date = new Date(timestamp);
      append_to_csv(tweet_data);
      await browser?.close();
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Adjust the delay as needed
    }
  } catch (error) {
    append_to_csv(tweet_data, csv_name);
    console.error(error);
  } finally {
    await browser?.close();
    console.log("end");
  }
};

// Start the scraping
extractTweets(
  "Since Date ex=2020",
  "Until Date ex=2013",
  "Account Email",
  "Account Username",
  "Account Password",
  "KEYWORD ONLY",
  "NAME OF CSV with extension"
);
