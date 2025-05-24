const Admin = require("../models/adminModel");

async function seedAdmin() {
  const ROOT_USER_EMAIL = "root@ejae.in"
  const ROOT_USER_PASSWORD = process.env.ROOT_USER_PASSWORD;

  if (!ROOT_USER_PASSWORD) {
    console.error("ROOT_USER_PASSWORD is not set in environment variables.");
    return;
  }

  try {
    const existingAdmin = await Admin.findOne({ email: ROOT_USER_EMAIL });
  
    if (existingAdmin) {
      console.log("Admin with root email already exists.");
      return;
    }
  
    const newAdmin = new Admin({
      name: "root",
      email: ROOT_USER_EMAIL,
      privilege: "super",
      password: ROOT_USER_PASSWORD,
    });
  
    await newAdmin.save()

    console.log("Admin seeded successfully.");
  } catch (error) {
    console.error("Error seeding admin:", error);
  }
}

module.exports = seedAdmin;