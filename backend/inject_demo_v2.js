import http from 'http';

async function fetchJSON(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({ hostname: 'localhost', port: 5000, path, method, headers: {'Content-Type': 'application/json'}}, (res) => {
      let d=''; res.on('data', c=>d+=c); res.on('end', ()=> { try{ resolve(JSON.parse(d)) }catch(e){ resolve(d) } });
    });
    if(data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log("Injecting live demo data...");
  // 1. Create a patient appointment
  const b = await fetchJSON('/queue/book', 'POST', { 
    patientId: 'demo_user_777', 
    patientName: 'Sathish Live Demo', 
    doctorId: '1', // Dr. Priya
    session: 'morning', 
    priorityType: 'OPD', 
    patientProblem: 'Severe Fever' 
  });
  
  if (b.appointment) {
    // 2. Set it to IN_PROGRESS so doctor can "End Call"
    await fetchJSON('/appointment/status', 'POST', { id: b.appointment._id, status: 'IN_PROGRESS' });
    console.log("Demo Appointment ID:", b.appointment._id);
    console.log("Ready! Open browser to test.");
  }
}
run();
