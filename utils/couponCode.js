function generateCouponCode(numAlphabets = 5, numNumerics = 3) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let couponCode = '';

    // Generate coupon code with random order of alphabets and numbers
    while (numAlphabets > 0 || numNumerics > 0) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        const character = characters.charAt(randomIndex);

        if (/[A-Z]/.test(character) && numAlphabets > 0) {
            couponCode += character;
            numAlphabets--;
        } else if (/[0-9]/.test(character) && numNumerics > 0) {
            couponCode += character;
            numNumerics--;
        }
    }

    return couponCode;
}


module.exports = {
    generateCouponCode
}