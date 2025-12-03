// === ACHIEVEMENT DEBUG TEST ===
console.log('Starting Achievement Debug Test...');

// Step 1: Check Token
const token = localStorage.getItem('token') || localStorage.getItem('access_token');
console.log('1. Token:', token ? 'EXISTS' : 'MISSING');

if (!token) {
  console.log('NO TOKEN! You need to login first!');
} else {
  // Step 2: Test API Call
  console.log('2. Testing API call...');
  
  fetch('https://pixeltales-backend.onrender.com/api/achievements/progress/', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('3. Response Status:', response.status);
    
    if (!response.ok) {
      console.log('API ERROR:', response.status, response.statusText);
      return response.text().then(text => {
        console.log('Error details:', text);
      });
    }
    
    return response.json();
  })
  .then(data => {
    if (!data) return;
    
    console.log('=== RESULTS ===');
    console.log('4. Success:', data.success);
    console.log('5. Achievements Array:', data.achievements ? 'EXISTS' : 'MISSING');
    console.log('6. Achievement Count:', data.achievements ? data.achievements.length : 0);
    
    if (data.achievements && data.achievements.length > 0) {
      console.log('BACKEND HAS', data.achievements.length, 'ACHIEVEMENTS!');
      console.log('First 3 achievements:');
      data.achievements.slice(0, 3).forEach((a, i) => {
        console.log((i+1) + '. ' + a.icon + ' ' + a.name + ' - ' + a.description);
      });
      console.log('If you see this, backend is working!');
      console.log('Problem is in frontend rendering.');
    } else {
      console.log('BACKEND HAS 0 ACHIEVEMENTS!');
      console.log('Render did not populate them yet.');
      console.log('Check Render deployment logs.');
    }
    
    console.log('7. User Stats:', data.user_stats);
  })
  .catch(error => {
    console.log('FETCH ERROR:', error);
  });
}
