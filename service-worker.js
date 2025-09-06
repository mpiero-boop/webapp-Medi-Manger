// service-worker.js

let schedules = [];
let timer = null;
const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
let lastNotificationTimes = {}; // Verhindert doppelte Benachrichtigungen

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_SCHEDULES') {
    schedules = event.data.schedules;
    if (timer) clearInterval(timer);
    startTimer();
  }
});

function startTimer() {
  checkSchedules(); // Sofortige Prüfung beim Start/Update
  timer = setInterval(checkSchedules, 60000); // Prüfung jede Minute
}

function checkSchedules() {
    if (!schedules || schedules.length === 0) {
        return;
    }
    
    const now = new Date();
    const currentDay = dayNames[now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDate = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    
    // Alte Benachrichtigungs-Tracker am Tagesanfang zurücksetzen
    if (currentTime === '00:00') {
      lastNotificationTimes = {};
    }

    const medsDueNow = [];

    schedules.forEach(med => {
        if (med.intakeDays.includes(currentDay)) {
            med.intakeSlots.forEach(slot => {
                const notificationId = `${med.id}-${slot.time}`;
                if (slot.time === currentTime && lastNotificationTimes[notificationId] !== currentDate) {
                    medsDueNow.push(`${med.name} (${slot.dosage} Stk.)`);
                    lastNotificationTimes[notificationId] = currentDate;
                }
            });
        }
    });

    if (medsDueNow.length > 0) {
        showNotification(medsDueNow);
    }
}

function showNotification(meds) {
    const title = 'Zeit für Ihre Medikamente!';
    const body = meds.join('\n');
    const options = {
        body: body,
        icon: "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect x='5' y='5' width='90' height='90' rx='20' ry='20' fill='%235c67f2'/%3e%3cpath d='M50,25 L50,75 M25,50 L75,50' stroke='white' stroke-width='10' stroke-linecap='round'/%3e%3c/svg%3e",
        badge: "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect x='5' y='5' width='90' height='90' rx='20' ry='20' fill='%235c67f2'/%3e%3cpath d='M50,25 L50,75 M25,50 L75,50' stroke='white' stroke-width='10' stroke-linecap='round'/%3e%3c/svg%3e",
        vibrate: [200, 100, 200]
    };
    self.registration.showNotification(title, options);
}

// Öffnet die App, wenn auf die Benachrichtigung geklickt wird
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
