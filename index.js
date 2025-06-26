require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

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

  try {
    const response = await axios.post(
      `https://groups.roblox.com/v1/groups/${process.env.GROUP_ID}/users/${userId}/roles`,
      { roleId: targetRoleId },
      {
        headers: {
          Cookie: `.ROBLOSECURITY=${process.env.ROBLOSECURITY}`
        }
      }
    );

    return res.json({ success: true, data: response.data });
  } catch (error) {
    return res.status(500).json({
      error: `Request failed with status code ${error.response?.status || 'unknown'}`,
      data: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
