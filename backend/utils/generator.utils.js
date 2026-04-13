export const generateStrings = function (length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charLength = characters.length;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters[Math.floor(Math.random() * charLength)];
  }

  return result;
};
