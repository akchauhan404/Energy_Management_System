import { runPythonInference } from './src/services/mlService.js';

try {
  const result = await runPythonInference({
    action: 'health'
  });

  console.log(
    JSON.stringify(result, null, 2)
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}