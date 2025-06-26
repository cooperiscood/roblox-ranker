require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const GROUP_ID = process.env.GROUP_ID;
const COOKIE = process.env.COOKIE;
const API_KEY = process.env.API_KEY;

const headersBase = {
  Cookie: `.ROBLOSECURITY=${COOKIE}`,
  "Content-Type": "application/json",
  "User-Agent": "Roblox/WinInet",
  "X-CSRF-TOKEN": ""
};

async function promoteUser(userId, targetRoleId) {
  const url = `https://groups.roblox.com/v1/groups/${GROUP_ID}/users/${userId}`;
  let headers = {...headersBase};

  try {
    // First try
    await axios.patch(url, { roleId: targetRoleId }, { headers });
    return { success: true };
  } catch (error) {
    if (error.response && error.response.status === 403) {
      // Get new CSRF token
      const newToken = error.response.headers["x-csrf-token"];
      if (!newToken) {
        return { success: false, error: "Missing X-CSRF-TOKEN in response" };
      }
      headers["X-CSRF-TOKEN"] = newToken;
      // Retry request with new token
      try {
        await axios.patch(url, { roleId: targetRoleId }, { headers });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message, data: err.response?.data };
      }
    }
    return { success: false, error: error.message, data: error.response?.data };
  }
}

app.post("/promote", async (req, res) => {
  if (req.headers["authorization"] !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId, targetRoleId } = req.body;
  if (!userId || !targetRoleId) {
    return res.status(400).json({ error: "Missing userId or targetRoleId" });
  }

  const result = await promoteUser(userId, targetRoleId);
  if (result.success) {
    res.json({ success: true, message: "User promoted" });
  } else {
    res.status(500).json({ error: result.error, data: result.data || null });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
