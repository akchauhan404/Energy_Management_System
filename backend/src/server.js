import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`ENERGY.AI REST Backend Server listening on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
