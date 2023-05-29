
export async function get_tweet_data(card) {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Adjust the delay as needed
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

  const tweet = [postDate, tweetText];
  console.log(tweet);
  return tweet;
}