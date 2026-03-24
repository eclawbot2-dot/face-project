import http from 'http';
const req = http.get('http://127.0.0.1:3100/login', (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Body length:', data.length, 'First 200:', data.slice(0, 200)));
});
req.on('error', (e) => console.log('Error:', e.message));
req.setTimeout(5000, () => { console.log('Timeout'); req.destroy(); });
