import User from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import verifyEmail from "../utils/verifyEmail.js";
import verificationCode from "../utils/verificationCode.js";
import createError from "../utils/createError.js";
// import scheduleJob from "../utils/scheduleJob.js";
import sendEmail from "../utils/sendMail.js";
import crypto from "crypto";

export const signupUser = catchAsync(async (req, res) => {
  // Generate random token
  const code = verificationCode();

  // Create user
  const user = await User.create({
    ...req.body,
    verificationCode: code,
  });

  // Send verification email
  const mailOptions = {
    email: user.email,
    subject: "Account Verification",
    code: code,
    name: user.firstName + " " + user.lastName,
  };
  await verifyEmail(mailOptions);

  // // Create Job Schedule
  // const job = scheduleJob("59 * * * *", user.email);
  // job.start();

  // Send response
  res.status(201).json({
    status: "success",
    message: "Verification code has been sent to your email.",
  });
});

export const verificationEmail = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    verificationCode: req.body.verificationCode,
  });

  if (!user) throw createError(401, "Invalid verification code");

  if (user.isVerified)
    throw createError(401, "You are already verified. Login in to continue.");

  user.isVerified = true;

  await user.save();

  sendTokenResponse(user, 200, res);
});

export const loginUser = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
    isVerified: true,
  }).select("+password");
  if (!user) throw createError(401, `Email doesn't match`);

  const isPassword = await user.matchPassword(req.body.password);
  if (!isPassword) throw createError(401, `Password doesn't match`);

  sendTokenResponse(user, 200, res);
});

export const updateDetails = catchAsync(async (req, res, next) => {
  const newDetails = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
  };

  const updatedDetails = await User.findByIdAndUpdate(
    req.user._id,
    newDetails,
    {
      new: true,
    }
  );

  res.status(200).send({ status: "success", data: updatedDetails });
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  //compare currentPassword
  const isMatch = await user.matchPassword(req.body.currentPassword);
  if (!isMatch)
    throw createError(
      400,
      `Current password ${req.body.currentPassword} does't match`
    );

  user.password = req.body.newPassword;

  await user.save();

  sendTokenResponse(user, 200, res);
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    throw createError(400, `User with email ${req.body.email} is not found`);

  const resetToken = user.getResetPasswordToken();

  await user.save();

  try {
    const resetUrl = `http://localhost:8080/api/v1/auth/reset-password/?token=${resetToken}`;

    const message = `You are receiving this email because you (or someone else ) has
    requested the reset of a password.`;

    const options = {
      email: user.email,
      subject: "Password reset token",
      message,
      url: resetUrl,
    };

    await sendEmail(options);

    res
      .status(200)
      .send({ status: "success", message: "ResetPassword token Email sent" });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    throw createError(500, "Email cound't be sent");
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const resetToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) throw createError(400, `Invalid token ${req.body.token}`);

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res
    .status(200)
    .send({ status: "success", message: "Your Password has beed changed" });
});

const sendTokenResponse = (userData, statusCode, res) => {
  const token = userData.getSignedToken();

  const user = {
    id: userData._id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    role: userData.role,
    isVerified: userData.isVerified,
  };

  res.status(statusCode).json({ status: "success", token, user });
};
