# Code README

This code is a script written in JavaScript that utilizes the Puppeteer library to scrape tweets from Twitter based on a given keyword and date range. The scraped tweets are then saved to a CSV file.

## Prerequisites

To run this code, you need to have the following:

- Node.js installed on your machine.
- A Twitter account with valid login credentials (email, username, and password).

## Installation

1. Clone or download the code files to your local machine.
2. Open a terminal or command prompt and navigate to the directory where the code files are located.
3. Run the following command to install the required dependencies:

   ```shell
   npm install puppeteer
## Usage

Before running the code, make sure to replace the placeholders with your own values in the `extractTweets` function call at the bottom of the code:

```javascript
extractTweets(
  new Date(2020, 0, 2),                   // Start date
  new Date(2012, 11, 31),                 // End date
  "Account Email",                        // Your Twitter account email
  "Account Username",                     // Your Twitter account username
  "Account Password",                     // Your Twitter account password
  "KEYWORD ONLY",                         // The keyword to search for in tweets
  "NAME OF CSV with extension"             // Name of the CSV file to save the scraped data
);
After configuring the parameters, you can run the code using the following command:

```shell
node your_file_name.js
