const User = require("../models/User");

const ensureLocalUser = async () => {
  let user = await User.findOne({ email: "local@paprev.local" });

  if (!user) {
    user = await User.create({
      name: "Local User",
      email: "local@paprev.local",
      passwordHash: "local-starter-mode",
      institution: "PapRev Local",
      plan: "free",
    });
  }

  return user;
};

module.exports = {
  ensureLocalUser,
};
