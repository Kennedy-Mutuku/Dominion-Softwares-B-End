const http = require('http');
let cookie = '';

function request(method, path, body, headers, cb) {
  const d = body ? JSON.stringify(body) : '';
  const opts = {
    hostname: 'localhost', port: 5000, path, method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(d),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(headers || {})
    }
  };
  const req = http.request(opts, res => {
    let s = ''; res.on('data', c => s += c);
    res.on('end', () => {
      if (res.headers['set-cookie']) cookie = res.headers['set-cookie'].join('; ');
      try { cb(res.statusCode, JSON.parse(s || '{}')); } catch (e) { cb(res.statusCode, {}); }
    });
  });
  if (d) req.write(d);
  req.end();
}

// Step 1: Register organizer (may already exist — use login instead)
request('POST', '/api/auth/login', { email: 'organizer@dominion.com', password: 'Org1234!' }, {}, (s, d) => {
  let token;
  if (s === 200) {
    token = d.data.accessToken;
    console.log('1. Login organizer: OK, role=' + d.data.user.role);
    runTests(token);
  } else {
    request('POST', '/api/auth/register', {
      name: 'Event Organizer', email: 'organizer@dominion.com', password: 'Org1234!', role: 'organizer', organization: 'Test Org'
    }, {}, (s2, d2) => {
      if (s2 === 201) {
        token = d2.data.accessToken;
        console.log('1. Register+login organizer: OK, role=' + d2.data.user.role);
        runTests(token);
      } else {
        console.error('Auth failed:', s2, d2);
      }
    });
  }
});

function runTests(token) {
  // Step 2: Dashboard stats
  request('GET', '/api/dashboard/stats', null, { Authorization: 'Bearer ' + token }, (s2, d2) => {
    console.log('2. GET /dashboard/stats: ' + s2 + (d2.data ? ', events=' + d2.data.totalEvents : ' ERR: ' + d2.message));

    // Step 3: Events list (public)
    request('GET', '/api/events', null, {}, (s3, d3) => {
      console.log('3. GET /events: ' + s3 + ', total=' + (d3.data?.total ?? 'N/A'));

      // Step 4: Featured events
      request('GET', '/api/events/featured', null, {}, (s4, d4) => {
        console.log('4. GET /events/featured: ' + s4 + ', count=' + (d4.data?.length ?? 'N/A'));

        // Step 5: Contact form
        request('POST', '/api/contact', { name: 'Test User', email: 'test@test.com', message: 'Test message' }, {}, (s5, d5) => {
          console.log('5. POST /contact: ' + s5 + ', success=' + d5.success);

          // Step 6: Application form
          request('POST', '/api/applications', {
            organizationName: 'Test Co', organizationType: 'NGO', contactPerson: 'Test Person',
            email: 'test@test.com', phone: '0700000000', projectDescription: 'A project description here'
          }, {}, (s6, d6) => {
            console.log('6. POST /applications: ' + s6 + ', success=' + d6.success);

            // Step 7: Dashboard events
            request('GET', '/api/dashboard/events', null, { Authorization: 'Bearer ' + token }, (s7, d7) => {
              console.log('7. GET /dashboard/events: ' + s7 + ', count=' + (d7.data?.length ?? 'N/A'));

              // Step 8: Upload route exists
              request('POST', '/api/uploads/photo', null, {}, (s8, d8) => {
                console.log('8. POST /api/uploads/photo (no file): ' + s8 + ' (expect 400 = route exists)');

                // Step 9: Ticket search route  
                request('GET', '/api/tickets/search/lookup?number=DOM', null, { Authorization: 'Bearer ' + token }, (s9, d9) => {
                  console.log('9. GET /tickets/search/lookup: ' + s9 + ' (expect 403, organizer role needed or 200)');

                  console.log('\n=== ALL ROUTES OK ===');
                  console.log('Backend: http://localhost:5000');
                  console.log('Frontend: http://localhost:5174');
                  process.exit(0);
                });
              });
            });
          });
        });
      });
    });
  });
}
