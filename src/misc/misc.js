function timestampToDate(unixTimestamp, message) {
  // Convert to milliseconds
  const date = new Date(unixTimestamp * 1000);

  // Format the date
  const formattedDate = date.toLocaleString();

  message.lock = `Locked until: ${formattedDate}`;
  console.log(`Locked until: ${formattedDate}`);
}

module.exports = {
  timestampToDate,
};
