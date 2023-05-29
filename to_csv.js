import { createRequire } from "module";
const require = createRequire(import.meta.url);
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");

export function append_to_csv(tweet_data, csv_name) {
  // Convert tweet_data to an array of objects
  const formattedData = tweet_data.map((tweet) => {
    return {
      date: tweet[0],
      tweet: tweet[1],
    };
  });

  const csvWriter = createCsvWriter({
    path: csv_name,
    header: [
      { id: "date", title: "Date" },
      { id: "tweet", title: "Tweet" },
    ],
    append: true, // Enable append mode
  });

  // Check if the file already exists
  const fileExists = fs.existsSync(csv_name);

  // Append the formattedData to the CSV file
  csvWriter
    .writeRecords(formattedData)
    .then(() => {
      if (!fileExists) {
        console.log("Headers added and data appended to CSV file successfully!");
      } else {
        console.log("Data appended to CSV file successfully!");
      }
    })
    .catch((err) => {
      console.error("Error appending data to CSV file:", err);
    });
}
