require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

async function robloxPatchWithCsrf(url, data, cookie) {
  let config = {
    headers: {
      Cookie: `.ROBLOSECURITY=${cookie}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    // First attempt
    return await axios.patch(url, data, config);
  } catch (error) {
    if (error.response && error.response.status === 403) {
      // Roblox sends a token in the response header
      const csrfToken = error.response.headers['x-csrf-token'];
      if (!csrfToken) throw error;

      // Retry with the CSRF token added
      config.headers['X-CSRF-TOKEN'] = csrfToken;
      return await axios.patch(url, data, config);
    }
    throw error;
  }
}

app.get('/', (req, res) => {
  res.send('Roblox Ranker API is running.');
});

app.post('/promote', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId, targetRoleId } = req.body;
  if (!userId || !targetRoleId) {
    return res.status(400).json({ error: 'Missing userId or targetRoleId in request body' });
  }

  const url = `https://groups.roblox.com/v1/groups/${process.env.GROUP_ID}/users/${userId}`;

  try {
    const response = await robloxPatchWithCsrf(url, { roleId: targetRoleId }, process.env.ROBLOSECURITY);
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({
      error: `Request failed with status code ${error.response?.status || 'unknown'}`,
      data: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
