function timestampToDate(unixTimestamp, message) {
  const targetDate = new Date(unixTimestamp * 1000);
  const currentDate = new Date();

  let minimumTime = false;

  if (targetDate < currentDate) {
    message.lock = "🚨 <b>Lock expired!</b>";
    console.log(message.lock);
    return;
  }

  let years = targetDate.getFullYear() - currentDate.getFullYear();
  let months = targetDate.getMonth() - currentDate.getMonth();
  let days = targetDate.getDate() - currentDate.getDate();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (days < 0) {
    months--;
    const prevMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() - 1,
      1
    );
    days += new Date(
      prevMonth.getFullYear(),
      prevMonth.getMonth() + 1,
      0
    ).getDate();
  }

  let lockMessage = "⏳ <b>Locked for</b>:";

  if (years > 0) {
    lockMessage += years === 1 ? " 1 year" : ` ${years} years`;
    minimumTime = true;
  } else if (months > 0) {
    lockMessage += months === 1 ? " 1 month" : ` ${months} months`;
    minimumTime = true;
  } else if (days > 0) {
    lockMessage += days === 1 ? " 1 day 🚨" : ` ${days} days 🚨`;
  } else {
    lockMessage += " less than a day 🚨";
  }

  console.log(lockMessage);

  message.lock = lockMessage;

  return minimumTime;
}

function sortSocialLinks(a, b) {
  const order = {
    "https://t.me": 1,
    "https://twitter.com": 2,
    "https://x.com": 3,
  };

  const prefixA = Object.keys(order).find((prefix) => a.startsWith(prefix));
  const prefixB = Object.keys(order).find((prefix) => b.startsWith(prefix));

  if (prefixA && prefixB) {
    return order[prefixA] - order[prefixB];
  } else if (prefixA) {
    return -1;
  } else if (prefixB) {
    return 1;
  } else {
    return 0;
  }
}

module.exports = {
  timestampToDate,
  sortSocialLinks,
};
