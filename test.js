console.log('GOOGLE_SERVICE_ACCOUNT:', process.env.GOOGLE_SERVICE_ACCOUNT);

try {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  console.log('Parsed private_key:', creds.private_key.substring(0, 50)); // первые 50 символов
} catch (err) {
  console.error('JSON parse error:', err.message);
}