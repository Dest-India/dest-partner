import SHA512 from "crypto-js/sha512";

export function generateOTP() {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return otp;
}

export function getUserInfo() {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("userInfo");
    return user ? JSON.parse(user) : null;
  }
  return null;
}
