/**
 * Extracts string from numeric-string value
 * @param {String} value
 * @returns {String}
 */
exports.extractString = (value) => value.replace(/[0-9.]/g, "");

/**
 * Format date in string
 * @param {Number} next use to increment the no. of days
 * @param {Date} date
 * @returns {string} returns a formatted date in string
 */
exports.formatDate = (next = 0, date = new Date()) => {
  if (next) date.setDate(date.getDate() + next);

  // Get year, month, and day part from the date
  const year = date.toLocaleString("default", { year: "numeric" });
  const month = date.toLocaleString("default", { month: "2-digit" });
  const day = date.toLocaleString("default", { day: "2-digit" });

  // Generate yyyy-mm-dd date string
  const formattedDate = year + "-" + month + "-" + day;
  return formattedDate;
};
