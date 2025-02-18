const getFormattedDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    const randomNum = String(Math.floor(100000 + Math.random() * 900000)); // Generates 6-digit random number

    return `${year}${month}${day}${randomNum}`;
};

module.exports = getFormattedDate;