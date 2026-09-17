const fetch = require('node-fetch'); // wait, native fetch is available
async function test() {
    try {
        const response = await fetch('http://localhost:5001/api/auth/social', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accessToken: 'ya29.invalidtoken', // testing error handling
                provider: 'google'
            })
        });
        const data = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", data);
    } catch (err) {
        console.error(err);
    }
}
test();
