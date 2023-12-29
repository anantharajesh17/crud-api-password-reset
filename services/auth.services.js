const JWT = require("jsonwebtoken");
const User = require("../models/user.model");
const Token = require("../models/user.model");
const sendEmail = require("../utils/emails/sendemail");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const JWTSecret = process.env.JWT_SECRET;
const bcryptSalt = process.env.BCRYPT_SALT;
const clientURL = process.env.CLIENT_URL;

const signup = async (data) => {
  let user = await User.findOne({ email: data.email });
  if (user) {
    throw new Error("Email already exist", 422);
  }
  user = new User(data);
  console.log("line:1", user);
  console.log("line:2", user.email);
  console.log("line:3", user.name);
  const token = JWT.sign({ id: user._id }, JWTSecret);
  await user.save();

  sendEmail(
    user.email,
    "Password Reset Request",
    {
      name: user.name,
    },
    "./template/welcome.handlebars"
  );

  return (data = {
    userId: user._id,
    email: user.email,
    name: user.name,
    token: token,
  });

  

};

const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Email does not exist");

  let token = await Token.findOne({ userId: user._id });
  if (token) await token.deleteOne();

  let resetToken = crypto.randomBytes(32).toString("hex");
  const hash = await bcrypt.hash(resetToken, Number(bcryptSalt));

  await new Token({
    userId: user._id,
    token: hash,
    createdAt: Date.now(),
  }).save();

  const link = `${clientURL}/passwordReset?token=${resetToken}&id=${user._id}`;

  sendEmail(
    user.email,
    "Password Reset Request",
    {
      name: user.name,
      link: link,
    },
    "./template/requestResetPassword.handlebars"
  );
  return { link };

};

const resetPassword = async (userId, token, password) => {
  console.log("line:1", userId);
  console.log("line:2", token);
  console.log("line:3", password);
  let passwordResetToken = await Token.findOne({ userId });

  if (!passwordResetToken) {
    throw new Error("Invalid or expired password reset token");
  }

  console.log(passwordResetToken.token, token);

  const isValid = await bcrypt.compare(token, passwordResetToken.token);

  if (!isValid) {
    throw new Error("Invalid or expired password reset token");
  }

  const hash = await bcrypt.hash(password, Number(bcryptSalt));

  await User.updateOne(
    { _id: userId },
    { $set: { password: hash } },
    { new: true }
  );

  const user = await User.findById({ _id: userId });

  sendEmail(
    user.email,
    "Password Reset Successfully",
    {
      name: user.name,
    },
    "./template/resetPassword.handlebars"
  );

  await passwordResetToken.deleteOne();

  return { message: "Password reset was successful" };
};

module.exports = {
  signup,
  requestPasswordReset,
  resetPassword,
};
