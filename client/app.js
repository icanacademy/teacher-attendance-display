// Configuration
const isProxied = window.location.hostname.includes('icanacademy.work') || window.location.hostname.includes('ngrok');
const API_BASE_URL = isProxied
  ? `${window.location.protocol}//${window.location.hostname}/api`
  : 'http://localhost:5556/api';
const REFRESH_INTERVAL = 10000; // 10 seconds

// State
let teacherTimeslotData = {};
let studentTimeslotData = {};
let selectedDate = getTodayDateString();

// Time slot configuration (hour in 24-hour format) - All hours from 8am to 8pm for future-proofing
const TIME_SLOTS = {
  '8am': 8,
  '9am': 9,
  '10am': 10,
  '11am': 11,
  '12pm': 12,
  '1pm': 13,
  '2pm': 14,
  '3pm': 15,
  '4pm': 16,
  '5pm': 17,
  '6pm': 18,
  '7pm': 19,
  '8pm': 20
};

// Get today's date as string (YYYY-MM-DD) (timezone-safe)
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check if we're within 10 minutes before or after the time slot (for blinking)
function hasTimePassed(timeSlot) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const slotHour = TIME_SLOTS[timeSlot];

  // Convert current time and slot time to minutes since midnight
  const currentTimeInMinutes = (currentHour * 60) + currentMinute;
  const slotTimeInMinutes = slotHour * 60;

  // Start blinking 10 minutes before the shift
  const blinkStartTime = slotTimeInMinutes - 10;

  return currentTimeInMinutes >= blinkStartTime;
}

// Extract nickname from [Nickname] Full Name format
function extractNickname(teacherName) {
  const match = teacherName.match(/\[(.*?)\]/);
  return match ? match[1] : teacherName;
}

// Initialize the app
async function init() {
  console.log('🚀 Teacher Attendance Display starting...');

  // Update clock
  updateClock();
  setInterval(updateClock, 1000);

  // Initial data load
  await loadAttendance();

  // Set up auto-refresh
  setInterval(loadAttendance, REFRESH_INTERVAL);

  console.log('✅ App initialized - auto-refreshing every', REFRESH_INTERVAL / 1000, 'seconds');
}

// Korean Holidays 2025-2026
const koreanHolidays = {
  // 2025
  '2025-01-01': '🇰🇷 New Year\'s Day (Seollal)',
  '2025-01-28': '🇰🇷 Lunar New Year\'s Day',
  '2025-01-29': '🇰🇷 Lunar New Year',
  '2025-01-30': '🇰🇷 Lunar New Year',
  '2025-03-01': '🇰🇷 Independence Movement Day',
  '2025-05-05': '🇰🇷 Children\'s Day',
  '2025-05-06': '🇰🇷 Buddha\'s Birthday',
  '2025-06-06': '🇰🇷 Memorial Day',
  '2025-08-15': '🇰🇷 Liberation Day',
  '2025-09-28': '🇰🇷 Chuseok (Korean Thanksgiving)',
  '2025-09-29': '🇰🇷 Chuseok',
  '2025-09-30': '🇰🇷 Chuseok',
  '2025-10-03': '🇰🇷 National Foundation Day',
  '2025-10-09': '🇰🇷 Hangeul Day',
  '2025-12-25': '🇰🇷 Christmas Day',

  // 2026
  '2026-01-01': '🇰🇷 New Year\'s Day',
  '2026-02-16': '🇰🇷 Lunar New Year\'s Eve',
  '2026-02-17': '🇰🇷 Lunar New Year\'s Day',
  '2026-02-18': '🇰🇷 Lunar New Year',
  '2026-03-01': '🇰🇷 Independence Movement Day',
  '2026-05-05': '🇰🇷 Children\'s Day',
  '2026-05-25': '🇰🇷 Buddha\'s Birthday',
  '2026-06-06': '🇰🇷 Memorial Day',
  '2026-08-15': '🇰🇷 Liberation Day',
  '2026-09-16': '🇰🇷 Chuseok Eve',
  '2026-09-17': '🇰🇷 Chuseok (Korean Thanksgiving)',
  '2026-09-18': '🇰🇷 Chuseok',
  '2026-10-03': '🇰🇷 National Foundation Day',
  '2026-10-09': '🇰🇷 Hangeul Day',
  '2026-12-25': '🇰🇷 Christmas Day'
};

// Philippine Holidays 2025-2026
const philippineHolidays = {
  // 2025
  '2025-01-01': '🇵🇭 New Year\'s Day',
  '2025-02-14': '💝 Valentine\'s Day',
  '2025-02-25': '🇵🇭 EDSA People Power Revolution',
  '2025-04-09': '🇵🇭 Araw ng Kagitingan (Day of Valor)',
  '2025-04-17': '🇵🇭 Maundy Thursday',
  '2025-04-18': '🇵🇭 Good Friday',
  '2025-04-19': '🇵🇭 Black Saturday',
  '2025-04-20': '🐰 Easter Sunday',
  '2025-05-01': '🇵🇭 Labor Day',
  '2025-05-11': '💐 Mother\'s Day',
  '2025-06-12': '🇵🇭 Independence Day',
  '2025-06-15': '👔 Father\'s Day',
  '2025-08-21': '🇵🇭 Ninoy Aquino Day',
  '2025-08-25': '🇵🇭 National Heroes Day',
  '2025-10-05': '👨‍🏫 World Teachers\' Day',
  '2025-10-31': '🎃 Halloween',
  '2025-11-01': '🇵🇭 All Saints\' Day',
  '2025-11-02': '🇵🇭 All Souls\' Day',
  '2025-11-30': '🇵🇭 Bonifacio Day',
  '2025-12-01': '🎄 Start of Christmas Season',
  '2025-12-08': '🇵🇭 Feast of the Immaculate Conception',
  '2025-12-16': '🎶 Start of Simbang Gabi (Misa de Gallo)',
  '2025-12-17': '🎶 Simbang Gabi Day 2',
  '2025-12-18': '🎶 Simbang Gabi Day 3',
  '2025-12-19': '🎶 Simbang Gabi Day 4',
  '2025-12-20': '🎶 Simbang Gabi Day 5',
  '2025-12-21': '🎶 Simbang Gabi Day 6',
  '2025-12-22': '🎶 Simbang Gabi Day 7',
  '2025-12-23': '🎶 Simbang Gabi Day 8',
  '2025-12-24': '🎄 Christmas Eve (Noche Buena)',
  '2025-12-25': '🎅 Christmas Day',
  '2025-12-26': '🎁 Boxing Day',
  '2025-12-27': '🎄 Christmas Week',
  '2025-12-28': '🎄 Christmas Week',
  '2025-12-29': '🎄 Christmas Week',
  '2025-12-30': '🇵🇭 Rizal Day',
  '2025-12-31': '🎆 New Year\'s Eve',

  // 2026
  '2026-01-01': '🇵🇭 New Year\'s Day',
  '2026-02-14': '💝 Valentine\'s Day',
  '2026-02-25': '🇵🇭 EDSA People Power Revolution',
  '2026-04-02': '🇵🇭 Maundy Thursday',
  '2026-04-03': '🇵🇭 Good Friday',
  '2026-04-04': '🇵🇭 Black Saturday',
  '2026-04-05': '🐰 Easter Sunday',
  '2026-04-09': '🇵🇭 Araw ng Kagitingan (Day of Valor)',
  '2026-05-01': '🇵🇭 Labor Day',
  '2026-05-10': '💐 Mother\'s Day',
  '2026-06-12': '🇵🇭 Independence Day',
  '2026-06-21': '👔 Father\'s Day',
  '2026-08-21': '🇵🇭 Ninoy Aquino Day',
  '2026-08-31': '🇵🇭 National Heroes Day',
  '2026-10-05': '👨‍🏫 World Teachers\' Day',
  '2026-10-31': '🎃 Halloween',
  '2026-11-01': '🇵🇭 All Saints\' Day',
  '2026-11-02': '🇵🇭 All Souls\' Day',
  '2026-11-30': '🇵🇭 Bonifacio Day',
  '2026-12-01': '🎄 Start of Christmas Season',
  '2026-12-08': '🇵🇭 Feast of the Immaculate Conception',
  '2026-12-16': '🎶 Start of Simbang Gabi (Misa de Gallo)',
  '2026-12-17': '🎶 Simbang Gabi Day 2',
  '2026-12-18': '🎶 Simbang Gabi Day 3',
  '2026-12-19': '🎶 Simbang Gabi Day 4',
  '2026-12-20': '🎶 Simbang Gabi Day 5',
  '2026-12-21': '🎶 Simbang Gabi Day 6',
  '2026-12-22': '🎶 Simbang Gabi Day 7',
  '2026-12-23': '🎶 Simbang Gabi Day 8',
  '2026-12-24': '🎄 Christmas Eve (Noche Buena)',
  '2026-12-25': '🎅 Christmas Day',
  '2026-12-26': '🎁 Boxing Day',
  '2026-12-27': '🎄 Christmas Week',
  '2026-12-28': '🎄 Christmas Week',
  '2026-12-29': '🎄 Christmas Week',
  '2026-12-30': '🇵🇭 Rizal Day',
  '2026-12-31': '🎆 New Year\'s Eve'
};

// Daily Inspirational Quotes for Teachers
const dailyQuotes = [
  'Education is the most powerful weapon which you can use to change the world. - Nelson Mandela',
  'The beautiful thing about learning is that no one can take it away from you. - B.B. King',
  'Teaching is the one profession that creates all other professions. - Unknown',
  'A teacher affects eternity; they can never tell where their influence stops. - Henry Adams',
  'The art of teaching is the art of assisting discovery. - Mark Van Doren',
  'Tell me and I forget. Teach me and I remember. Involve me and I learn. - Benjamin Franklin',
  'Education is not preparation for life; education is life itself. - John Dewey',
  'What we learn with pleasure we never forget. - Alfred Mercier',
  'The task of the modern educator is not to cut down jungles, but to irrigate deserts. - C.S. Lewis',
  'Every child is gifted. They just unwrap their packages at different times. - Unknown',
  'Teaching kids to count is fine, but teaching them what counts is best. - Bob Talbert',
  'The influence of a good teacher can never be erased. - Unknown',
  'Teachers open the door, but you must enter by yourself. - Chinese Proverb',
  'In learning you will teach, and in teaching you will learn. - Phil Collins',
  'The best teachers teach from the heart, not from the book. - Unknown',
  'A good teacher can inspire hope, ignite imagination, and instill a love of learning. - Brad Henry',
  'Education is not filling a bucket, but lighting a fire. - William Butler Yeats',
  'The dream begins with a teacher who believes in you. - Dan Rather',
  'One child, one teacher, one book, and one pen can change the world. - Malala Yousafzai',
  'Teaching is a work of heart. - Unknown',
  'To teach is to touch a life forever. - Unknown',
  'Every student can learn, just not on the same day or in the same way. - George Evans',
  'The greatest sign of success for a teacher is to be able to say, "The children are now working as if I did not exist." - Maria Montessori',
  'Good teaching is more a giving of right questions than a giving of right answers. - Josef Albers',
  'The mediocre teacher tells. The good teacher explains. The superior teacher demonstrates. The great teacher inspires. - William Arthur Ward',
  'It is the supreme art of the teacher to awaken joy in creative expression and knowledge. - Albert Einstein',
  'Teachers who love teaching, teach children to love learning. - Unknown',
  'The whole purpose of education is to turn mirrors into windows. - Sydney J. Harris',
  'Teaching is the greatest act of optimism. - Colleen Wilcox',
  'No one is more cherished in this world than someone who lightens the burden of another. - Unknown',
  'The passion to teach is the passion to learn. - Unknown',
  'A teacher plants the seeds of knowledge that last a lifetime. - Unknown',
  'Teaching creates all other professions. - Unknown',
  'The best teachers are those who show you where to look, but don\'t tell you what to see. - Alexandra K. Trenfor',
  'Teachers appreciate knowing that they\'ve made a difference in students\' lives. - Unknown',
  'Great teachers empathize with kids, respect them, and believe that each one has something special. - Ann Lieberman',
  'The function of education is to teach one to think intensively and critically. - Martin Luther King Jr.',
  'Success is not the key to happiness. Happiness is the key to success. If you love teaching, you will be successful. - Herman Cain',
  'Teaching is a very noble profession that shapes the character, caliber, and future of an individual. - A.P.J. Abdul Kalam',
  'Education breeds confidence. Confidence breeds hope. Hope breeds peace. - Confucius',
  'Your work is to discover your work and then give yourself to it wholeheartedly. - Buddha',
  'The more that you read, the more things you will know. The more that you learn, the more places you\'ll go. - Dr. Seuss',
  'Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi',
  'The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice. - Brian Herbert',
  'Teachers change the world one student at a time. - Unknown',
  'Teaching is not about answering questions but about raising questions. - Maxine Greene',
  'Good teachers know how to bring out the best in students. - Charles Kuralt',
  'The secret of education lies in respecting the pupil. - Ralph Waldo Emerson',
  'Teaching might even be the greatest of the arts since the medium is the human mind and spirit. - John Steinbeck',
  'If you have knowledge, let others light their candles in it. - Margaret Fuller'
];

// Update clock display with holiday detection
function updateClock() {
  const now = new Date();

  // Format date
  const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const dateStr = now.toLocaleDateString('en-US', dateOptions);

  // Format time
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Update widget clock (larger format with AM/PM)
  const widgetTimeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  document.getElementById('widgetTime').textContent = widgetTimeStr;
  document.getElementById('widgetDate').textContent = dateStr;

  // Update holiday line
  updateHolidayLine(now);
}

// Check and display holidays
function updateHolidayLine(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const holidayElement = document.getElementById('holidayLine');

  const koreanHoliday = koreanHolidays[dateStr];
  const philippineHoliday = philippineHolidays[dateStr];

  let holidayText = '';

  if (koreanHoliday && philippineHoliday) {
    // Both countries have holidays
    holidayText = `${koreanHoliday} • ${philippineHoliday}`;
  } else if (koreanHoliday) {
    holidayText = koreanHoliday;
  } else if (philippineHoliday) {
    holidayText = philippineHoliday;
  } else {
    // No holiday - show regular day message
    holidayText = '📅 Regular day';
  }

  holidayElement.textContent = holidayText;
}

// Update daily inspirational quote
function updateDailyQuote() {
  // Pick quote based on day of year for consistency
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const quote = dailyQuotes[dayOfYear % dailyQuotes.length];

  document.getElementById('dailyQuote').textContent = quote;
}

// Load attendance data from API
async function loadAttendance() {
  try {
    // Fetch both teacher and student attendance by timeslot in parallel
    const [teacherResponse, studentResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/attendance/by-timeslot?date=${selectedDate}`),
      fetch(`${API_BASE_URL}/students/attendance/by-timeslot?date=${selectedDate}`)
    ]);

    if (!teacherResponse.ok) {
      throw new Error('Failed to fetch teacher attendance by timeslot');
    }
    if (!studentResponse.ok) {
      throw new Error('Failed to fetch student attendance by timeslot');
    }

    const teacherResult = await teacherResponse.json();
    const studentResult = await studentResponse.json();

    teacherTimeslotData = teacherResult.timeSlots;
    studentTimeslotData = studentResult.timeSlots;

    // Update UI
    updateUnifiedTimeslots();
    updateLastUpdateTime();

  } catch (error) {
    console.error('❌ Error loading attendance:', error);
  }
}

// Update unified timeslot display (teachers + students combined)
function updateUnifiedTimeslots() {
  const container = document.querySelector('.timeslots-grid');
  if (!container) return;

  let html = '';

  // Iterate through all time slots
  Object.keys(TIME_SLOTS).forEach(slot => {
    const teachers = teacherTimeslotData[slot] || [];
    const students = studentTimeslotData[slot] || [];

    // Only show time slot if there are teachers OR students
    if (teachers.length > 0 || students.length > 0) {
      html += `
        <section class="timeslot-section">
          <h3 class="timeslot-title">${slot.toUpperCase()}</h3>
          <div class="timeslot-content">`;

      // Teachers section
      if (teachers.length > 0) {
        html += `
            <div class="teachers-list">
              <span class="section-label">🍎</span>
              ${teachers.map(teacher => createTeacherTag(teacher, slot)).join('')}
            </div>`;
      }

      // Students section
      if (students.length > 0) {
        html += `
            <div class="students-list">
              <span class="section-label">📖</span>
              ${students.map(student => createStudentTag(student, slot)).join('')}
            </div>`;
      }

      html += `
          </div>
        </section>`;
    }
  });

  container.innerHTML = html;

  // Check if content overflows and apply compact mode if needed
  applyCompactModeIfNeeded();
}

// Detect overflow and apply compact mode
function applyCompactModeIfNeeded() {
  const attendanceCategory = document.querySelector('.attendance-category');
  if (!attendanceCategory) return;

  // Use requestAnimationFrame to ensure DOM has been updated
  requestAnimationFrame(() => {
    const hasOverflow = attendanceCategory.scrollHeight > attendanceCategory.clientHeight;

    if (hasOverflow) {
      document.body.classList.add('compact-mode');
      console.log('📦 Compact mode activated - lots of data detected');
    } else {
      document.body.classList.remove('compact-mode');
    }
  });
}

// Create teacher tag HTML
function createTeacherTag(teacher, timeSlot) {
  const nickname = extractNickname(teacher.name);
  let statusClass = '';
  let tooltipText = '';

  // Debug log to see what data we're receiving for ALL late/absent teachers
  if (teacher.status === 'late' || teacher.status === 'absent') {
    console.log('Teacher status:', teacher.status, 'Name:', teacher.name, 'Late reason:', teacher.late_reason, 'Absent reason:', teacher.absent_reason, 'Has title?', !!(teacher.late_reason || teacher.absent_reason));
  }

  // Simple status-based color coding
  if (teacher.status === 'present') {
    statusClass = 'status-present';  // Green
  } else if (teacher.status === 'late') {
    statusClass = 'status-late';     // Yellow
    // Add late reason to tooltip if available
    if (teacher.late_reason) {
      tooltipText = `Late: ${teacher.late_reason}`;
      console.log('Setting late tooltip for', teacher.name, ':', tooltipText);
    }
  } else if (teacher.status === 'absent') {
    statusClass = 'status-absent';   // Red (already marked as absent)
    // Add absent reason to tooltip if available
    if (teacher.absent_reason) {
      tooltipText = `Absent: ${teacher.absent_reason}`;
      console.log('Setting absent tooltip for', teacher.name, ':', tooltipText);
    }
  } else if (teacher.status === 'unmarked') {
    // Check if the time slot has passed
    const timePassed = hasTimePassed(timeSlot);

    if (timePassed) {
      statusClass = 'status-unmarked'; // Gray with blinking (time has passed)
    } else {
      statusClass = 'status-waiting';  // Gray without blinking (waiting for time)
    }
  } else {
    // Unknown status - default to waiting
    statusClass = 'status-waiting';
  }

  const titleAttr = tooltipText ? ` title="${tooltipText}"` : '';
  return `<span class="teacher-tag ${statusClass}"${titleAttr}>${nickname}</span>`;
}

// Create student tag HTML
function createStudentTag(student, timeSlot) {
  // Remove Korean text in brackets [한국어]
  const fullName = student.name.replace(/\s*\[.*?\]\s*/g, '').trim();
  let statusClass = '';
  let tooltipText = '';

  // Simple status-based color coding (same logic as teachers)
  if (student.status === 'present') {
    statusClass = 'status-present';  // Green
  } else if (student.status === 'late') {
    statusClass = 'status-late';     // Yellow
    // Add late reason to tooltip if available
    if (student.late_reason) {
      tooltipText = `Late: ${student.late_reason}`;
    }
  } else if (student.status === 'absent') {
    statusClass = 'status-absent';   // Red (already marked as absent)
    // Add absent reason to tooltip if available
    if (student.absent_reason) {
      tooltipText = `Absent: ${student.absent_reason}`;
    }
  } else if (student.status === 'unmarked') {
    // Check if the time slot has passed
    const timePassed = hasTimePassed(timeSlot);

    if (timePassed) {
      statusClass = 'status-unmarked'; // Gray with blinking (time has passed)
    } else {
      statusClass = 'status-waiting';  // Gray without blinking (waiting for time)
    }
  } else {
    // Unknown status - default to waiting
    statusClass = 'status-waiting';
  }

  const titleAttr = tooltipText ? ` title="${tooltipText}"` : '';
  return `<span class="student-tag ${statusClass}"${titleAttr}>${fullName}</span>`;
}

// Update last update timestamp
function updateLastUpdateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  document.getElementById('lastUpdate').textContent = `Last updated: ${timeStr}`;
}

// Fetch weather data
async function fetchWeather() {
  try {
    // wttr.in - 100% FREE, NO API KEY NEEDED!
    // Docs: https://github.com/chubin/wttr.in

    // Fetch real-time weather for Pasig City, Philippines
    const response = await fetch(
      'https://wttr.in/Pasig?format=j1'
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();

    // Extract current weather data from wttr.in format
    const currentCondition = data.current_condition[0];
    const temp = Math.round(parseInt(currentCondition.temp_C));
    const description = currentCondition.weatherDesc[0].value;
    const uvIndex = parseInt(currentCondition.uvIndex);

    updateWeatherDisplay({
      temp: temp,
      description: description,
      icon: getWeatherIcon(description),
      uvIndex: uvIndex
    });

    console.log('✅ Weather updated from wttr.in:', temp + '°C', description, 'UV:', uvIndex);
  } catch (error) {
    console.error('❌ Error fetching weather:', error.message);
    // Fallback to mock data if API fails
    const hour = new Date().getHours();
    let uvIndex = (hour >= 11 && hour < 14) ? 9 : (hour >= 9 && hour < 16) ? 6 : 3;
    updateWeatherDisplay({
      temp: 28,
      description: 'Partly Cloudy',
      icon: '⛅',
      uvIndex: uvIndex
    });
  }
}

// Convert weather description to emoji icon (works with wttr.in descriptions)
function getWeatherIcon(condition) {
  const conditionLower = condition.toLowerCase();

  // WeatherAPI.com returns descriptive text like "Partly cloudy", "Light rain", etc.
  if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
    return '☀️';
  } else if (conditionLower.includes('partly cloudy')) {
    return '⛅';
  } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
    return '☁️';
  } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    return '⛈️';
  } else if (conditionLower.includes('rain') && conditionLower.includes('light')) {
    return '🌦️';
  } else if (conditionLower.includes('rain')) {
    return '🌧️';
  } else if (conditionLower.includes('drizzle')) {
    return '🌦️';
  } else if (conditionLower.includes('snow')) {
    return '❄️';
  } else if (conditionLower.includes('mist') || conditionLower.includes('fog') || conditionLower.includes('haze')) {
    return '🌫️';
  }

  return '⛅'; // Default to partly cloudy
}

function getUVStatus(uvIndex) {
  if (uvIndex <= 2) {
    return { text: 'Low', class: 'low' };
  } else if (uvIndex <= 5) {
    return { text: 'Moderate', class: 'moderate' };
  } else if (uvIndex <= 7) {
    return { text: 'High', class: 'high' };
  } else if (uvIndex <= 10) {
    return { text: 'Very High', class: 'very-high' };
  } else {
    return { text: 'Extreme', class: 'extreme' };
  }
}

function updateWeatherDisplay(weather) {
  document.getElementById('weatherIcon').textContent = weather.icon;
  document.getElementById('weatherTemp').textContent = `${weather.temp}°C`;
  document.getElementById('weatherDesc').textContent = weather.description;

  // Update UV index
  const uvStatus = getUVStatus(weather.uvIndex);
  document.getElementById('uvIndex').textContent = weather.uvIndex;

  const uvStatusElement = document.getElementById('uvStatus');
  uvStatusElement.textContent = uvStatus.text;
  uvStatusElement.className = `uv-status ${uvStatus.class}`;
}

// Fetch word of the day
async function fetchWordOfDay() {
  try {
    // Extensive word collection with educational vocabulary
    const words = [
      { word: 'Perseverance', pos: 'noun', meaning: 'Persistence in doing something despite difficulty or delay in achieving success.' },
      { word: 'Resilience', pos: 'noun', meaning: 'The capacity to withstand or to recover quickly from difficulties; toughness.' },
      { word: 'Empathy', pos: 'noun', meaning: 'The ability to understand and share the feelings of another person.' },
      { word: 'Innovation', pos: 'noun', meaning: 'The introduction of new ideas, methods, or products.' },
      { word: 'Integrity', pos: 'noun', meaning: 'The quality of being honest and having strong moral principles.' },
      { word: 'Diligence', pos: 'noun', meaning: 'Careful and persistent work or effort.' },
      { word: 'Curiosity', pos: 'noun', meaning: 'A strong desire to know or learn something.' },
      { word: 'Ambition', pos: 'noun', meaning: 'A strong desire and determination to succeed.' },
      { word: 'Collaborate', pos: 'verb', meaning: 'To work jointly with others especially in an intellectual endeavor.' },
      { word: 'Eloquent', pos: 'adjective', meaning: 'Fluent or persuasive in speaking or writing.' },
      { word: 'Articulate', pos: 'adjective', meaning: 'Having or showing the ability to speak fluently and coherently.' },
      { word: 'Conscientious', pos: 'adjective', meaning: 'Wishing to do what is right, especially to do one\'s work properly.' },
      { word: 'Tenacity', pos: 'noun', meaning: 'The quality of being determined and persistent.' },
      { word: 'Optimism', pos: 'noun', meaning: 'Hopefulness and confidence about the future or success of something.' },
      { word: 'Pragmatic', pos: 'adjective', meaning: 'Dealing with things sensibly and realistically based on practical considerations.' },
      { word: 'Meticulous', pos: 'adjective', meaning: 'Showing great attention to detail; very careful and precise.' },
      { word: 'Exemplary', pos: 'adjective', meaning: 'Serving as a desirable model; representing the best of its kind.' },
      { word: 'Facilitate', pos: 'verb', meaning: 'To make an action or process easy or easier.' },
      { word: 'Comprehensive', pos: 'adjective', meaning: 'Complete and including everything that is necessary.' },
      { word: 'Dedication', pos: 'noun', meaning: 'The quality of being committed to a task or purpose.' },
      { word: 'Cultivate', pos: 'verb', meaning: 'To try to acquire or develop a quality or skill.' },
      { word: 'Flourish', pos: 'verb', meaning: 'To grow or develop in a healthy or vigorous way.' },
      { word: 'Profound', pos: 'adjective', meaning: 'Very great or intense; having deep insight or understanding.' },
      { word: 'Versatile', pos: 'adjective', meaning: 'Able to adapt or be adapted to many different functions or activities.' },
      { word: 'Catalyst', pos: 'noun', meaning: 'A person or thing that precipitates an event or change.' },
      { word: 'Wisdom', pos: 'noun', meaning: 'The quality of having experience, knowledge, and good judgment.' },
      { word: 'Courage', pos: 'noun', meaning: 'The ability to do something that frightens one; bravery.' },
      { word: 'Compassion', pos: 'noun', meaning: 'Sympathetic pity and concern for the sufferings of others.' },
      { word: 'Authentic', pos: 'adjective', meaning: 'Of undisputed origin; genuine and true.' },
      { word: 'Nurture', pos: 'verb', meaning: 'To care for and encourage the growth or development of.' },
      { word: 'Inspire', pos: 'verb', meaning: 'To fill someone with the urge or ability to do something creative.' },
      { word: 'Aspire', pos: 'verb', meaning: 'To direct one\'s hopes or ambitions toward achieving something.' },
      { word: 'Benevolent', pos: 'adjective', meaning: 'Well meaning and kindly; serving a charitable purpose.' },
      { word: 'Diligent', pos: 'adjective', meaning: 'Having or showing care in one\'s work or duties.' },
      { word: 'Earnest', pos: 'adjective', meaning: 'Resulting from sincere and intense conviction.' },
      { word: 'Fortitude', pos: 'noun', meaning: 'Courage in pain or adversity; mental and emotional strength.' },
      { word: 'Gratitude', pos: 'noun', meaning: 'The quality of being thankful; readiness to show appreciation.' },
      { word: 'Humble', pos: 'adjective', meaning: 'Having or showing a modest estimate of one\'s importance.' },
      { word: 'Initiative', pos: 'noun', meaning: 'The ability to assess and initiate things independently.' },
      { word: 'Judicious', pos: 'adjective', meaning: 'Having or showing good judgment; wise and sensible.' },
      { word: 'Kinship', pos: 'noun', meaning: 'A feeling of being close to someone or understanding them well.' },
      { word: 'Lucid', pos: 'adjective', meaning: 'Expressed clearly; easy to understand.' },
      { word: 'Magnanimous', pos: 'adjective', meaning: 'Generous or forgiving, especially toward a rival or less powerful person.' },
      { word: 'Noble', pos: 'adjective', meaning: 'Having or showing fine personal qualities or high moral principles.' },
      { word: 'Objective', pos: 'adjective', meaning: 'Not influenced by personal feelings or opinions.' },
      { word: 'Paramount', pos: 'adjective', meaning: 'More important than anything else; supreme.' },
      { word: 'Quest', pos: 'noun', meaning: 'A long or arduous search for something.' },
      { word: 'Rational', pos: 'adjective', meaning: 'Based on or in accordance with reason or logic.' },
      { word: 'Steadfast', pos: 'adjective', meaning: 'Resolutely or dutifully firm and unwavering.' },
      { word: 'Thrive', pos: 'verb', meaning: 'To grow or develop well or vigorously; to prosper.' },
      { word: 'Unanimous', pos: 'adjective', meaning: 'Fully in agreement; sharing the same opinion.' },
      { word: 'Vigilant', pos: 'adjective', meaning: 'Keeping careful watch for possible danger or difficulties.' },
      { word: 'Wholesome', pos: 'adjective', meaning: 'Conducive to or suggestive of good health and well-being.' },
      { word: 'Zeal', pos: 'noun', meaning: 'Great energy or enthusiasm in pursuit of a cause or objective.' },
      { word: 'Abundant', pos: 'adjective', meaning: 'Existing or available in large quantities; plentiful.' },
      { word: 'Benign', pos: 'adjective', meaning: 'Gentle and kindly; favorable and beneficial.' },
      { word: 'Candor', pos: 'noun', meaning: 'The quality of being open and honest in expression; frankness.' },
      { word: 'Deliberate', pos: 'adjective', meaning: 'Done consciously and intentionally; careful and unhurried.' },
      { word: 'Eloquence', pos: 'noun', meaning: 'Fluent or persuasive speaking or writing.' },
      { word: 'Fervent', pos: 'adjective', meaning: 'Having or displaying passionate intensity; ardent.' },
      { word: 'Gracious', pos: 'adjective', meaning: 'Courteous, kind, and pleasant; showing divine grace.' },
      { word: 'Harmony', pos: 'noun', meaning: 'The quality of forming a pleasing and consistent whole.' },
      { word: 'Insightful', pos: 'adjective', meaning: 'Having or showing accurate and deep understanding.' },
      { word: 'Jubilant', pos: 'adjective', meaning: 'Feeling or expressing great happiness and triumph.' },
      { word: 'Kindle', pos: 'verb', meaning: 'To light or set on fire; to arouse or inspire an emotion.' },
      { word: 'Leverage', pos: 'verb', meaning: 'To use something to maximum advantage.' },
      { word: 'Mentor', pos: 'noun', meaning: 'An experienced and trusted adviser; a teacher or coach.' },
      { word: 'Nurture', pos: 'noun', meaning: 'The process of caring for and encouraging growth or development.' },
      { word: 'Overcome', pos: 'verb', meaning: 'To succeed in dealing with a problem or difficulty.' },
      { word: 'Persistent', pos: 'adjective', meaning: 'Continuing firmly in an opinion or course of action.' },
      { word: 'Quintessential', pos: 'adjective', meaning: 'Representing the most perfect example of a quality or class.' },
      { word: 'Remarkable', pos: 'adjective', meaning: 'Worthy of attention; striking or extraordinary.' },
      { word: 'Synergy', pos: 'noun', meaning: 'The interaction of elements that produce a greater effect together.' },
      { word: 'Tenacious', pos: 'adjective', meaning: 'Not readily relinquishing a position or principle; persistent.' },
      { word: 'Unprecedented', pos: 'adjective', meaning: 'Never done or known before; without previous instance.' },
      { word: 'Vivacious', pos: 'adjective', meaning: 'Attractively lively and animated; full of energy.' },
      { word: 'Wisdom', pos: 'noun', meaning: 'The quality of having experience and good judgment.' },
      { word: 'Yearning', pos: 'noun', meaning: 'A feeling of intense longing for something.' },
      { word: 'Zealous', pos: 'adjective', meaning: 'Having great energy or enthusiasm in pursuit of a cause.' },
      { word: 'Accomplish', pos: 'verb', meaning: 'To achieve or complete successfully.' },
      { word: 'Breakthrough', pos: 'noun', meaning: 'A sudden, dramatic, and important discovery or development.' },
      { word: 'Champion', pos: 'verb', meaning: 'To vigorously support or defend a cause or person.' },
      { word: 'Determination', pos: 'noun', meaning: 'Firmness of purpose; resoluteness.' },
      { word: 'Endeavor', pos: 'noun', meaning: 'An attempt to achieve a goal; a serious effort.' },
      { word: 'Fulfillment', pos: 'noun', meaning: 'The achievement of something desired or predicted.' },
      { word: 'Genuine', pos: 'adjective', meaning: 'Truly what something is said to be; authentic.' },
      { word: 'Harmonious', pos: 'adjective', meaning: 'Free from disagreement or dissent; forming a consistent whole.' },
      { word: 'Illuminate', pos: 'verb', meaning: 'To light up; to help clarify or explain.' },
      { word: 'Justice', pos: 'noun', meaning: 'Just behavior or treatment; fairness.' },
      { word: 'Knowledge', pos: 'noun', meaning: 'Facts, information, and skills acquired through experience or education.' },
      { word: 'Leadership', pos: 'noun', meaning: 'The action of leading a group of people or an organization.' },
      { word: 'Mastery', pos: 'noun', meaning: 'Comprehensive knowledge or skill in a subject or activity.' },
      { word: 'Navigate', pos: 'verb', meaning: 'To plan and direct the route or course of a journey.' },
      { word: 'Opportunity', pos: 'noun', meaning: 'A set of circumstances that makes it possible to do something.' },
      { word: 'Prosperity', pos: 'noun', meaning: 'The state of being successful, especially financially.' },
      { word: 'Quality', pos: 'noun', meaning: 'The standard of something as measured against other things.' },
      { word: 'Respect', pos: 'noun', meaning: 'A feeling of deep admiration for someone or something.' },
      { word: 'Strength', pos: 'noun', meaning: 'The quality or state of being physically strong; emotional power.' },
      { word: 'Transform', pos: 'verb', meaning: 'To make a thorough or dramatic change in form or appearance.' }
    ];

    // Pick word based on day of year to have consistent word per day
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const word = words[dayOfYear % words.length];

    updateWordDisplay(word);
  } catch (error) {
    console.error('Error updating word of day:', error);
  }
}

function updateWordDisplay(word) {
  document.getElementById('wordOfDay').textContent = word.word;
  document.getElementById('wordPos').textContent = word.pos;
  document.getElementById('wordMeaning').textContent = word.meaning;
}

// Generate smart mascot message with AI-like contextual awareness
function updateMascotMessage() {
  try {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const messages = [];

    // Analyze attendance data for smart contextual messages
    let attendanceContext = '';
    try {
      const totalCount = parseInt(document.querySelectorAll('.teacher-tag').length) || 0;
      const presentCount = document.querySelectorAll('.teacher-tag.status-present').length;
      const lateCount = document.querySelectorAll('.teacher-tag.status-late').length;
      const absentCount = document.querySelectorAll('.teacher-tag.status-absent').length;
      const unmarkedCount = document.querySelectorAll('.teacher-tag.status-unmarked, .teacher-tag.status-waiting').length;

      if (totalCount > 0) {
        const presentPercent = Math.round((presentCount / totalCount) * 100);
        const latePercent = Math.round((lateCount / totalCount) * 100);

        // Perfect or near-perfect attendance
        if (presentPercent >= 95) {
          messages.push('🌟 Wow! ' + presentPercent + '% attendance today - that\'s incredible!');
          messages.push('💯 Amazing turnout! ' + presentCount + ' teachers are here and ready!');
          messages.push('⭐ Outstanding attendance! The team is complete today!');
          messages.push('🎉 Perfect attendance energy! You all showed up strong!');
        } else if (presentPercent >= 85) {
          messages.push('👍 Great attendance today! ' + presentCount + ' teachers present!');
          messages.push('✨ Strong showing! ' + presentPercent + '% of the team is here!');
          messages.push('💪 Solid attendance! The students are lucky to have you all!');
        } else if (presentPercent >= 70) {
          messages.push('📊 Good attendance! ' + presentCount + ' teachers checked in so far.');
          messages.push('👥 ' + presentPercent + '% present - keep up the momentum!');
        } else if (presentPercent < 70 && hour < 10) {
          messages.push('🌅 Still early! More teachers arriving soon.');
          messages.push('⏰ Give it time - the day is just starting!');
        } else if (presentPercent < 70) {
          messages.push('💙 Quality over quantity! Those present are making it count!');
          messages.push('🎯 Every teacher here is making a difference today!');
        }

        // Late arrivals
        if (lateCount > 0 && lateCount <= 2) {
          messages.push('⏰ A few late arrivals - better late than never! 😊');
          messages.push('🚗 Traffic happens! Glad everyone made it safely!');
        } else if (lateCount > 2) {
          messages.push('🚦 Busy morning! ' + lateCount + ' teachers arrived late.');
          messages.push('⏱️ Looks like traffic was rough today!');
        }

        // Absent teachers
        if (absentCount === 0 && totalCount > 0) {
          messages.push('🎊 Zero absences today - full team assembled!');
          messages.push('💯 Everyone\'s here! That\'s what teamwork looks like!');
          messages.push('🌟 Complete roster today - amazing commitment!');
        } else if (absentCount === 1) {
          messages.push('💙 One teacher absent today. Hope they\'re okay!');
          messages.push('🌈 Nearly full team! Missing one today.');
        } else if (absentCount > 1 && absentCount <= 3) {
          messages.push('🤒 A few teachers out today. Hope they feel better soon!');
          messages.push('💪 Team staying strong despite ' + absentCount + ' absences!');
        }

        // Unmarked teachers (contextual to time)
        if (unmarkedCount > 0 && hour >= 9) {
          messages.push('⏳ Still waiting on ' + unmarkedCount + ' teachers to check in!');
          messages.push('📱 ' + unmarkedCount + ' haven\'t marked yet - gentle reminder! 😊');
        }
      }
    } catch (e) {
      // If attendance data not ready, continue with time-based messages
    }

    // Time-of-day contextual messages
    if (hour >= 5 && hour < 8) {
      messages.push('🌅 Early bird! The day is full of possibilities!');
      messages.push('☕ Good morning! Time for coffee and preparation!');
      messages.push('🌄 Rise and shine! Another day to inspire young minds!');
      messages.push('🎯 Morning motivation: Every day is a chance to make a difference!');
      messages.push('✨ New day, new opportunities to inspire!');
    } else if (hour >= 8 && hour < 9) {
      messages.push('🔔 Classes starting soon! You\'ve got this!');
      messages.push('📚 First period energy! Let\'s make it count!');
      messages.push('🌟 The bell\'s about to ring - time to shine!');
      messages.push('🎓 School day begins! Ready to inspire?');
      messages.push('💫 Here we go! Another great day of teaching!');
    } else if (hour >= 9 && hour < 12) {
      messages.push('☀️ Morning lessons in full swing! Keep that energy up!');
      messages.push('📖 Mid-morning momentum! You\'re doing great!');
      messages.push('🌞 Beautiful morning for learning!');
      messages.push('💪 Power through! Lunch break is coming!');
      messages.push('🎨 Creative morning sessions! Students are engaged!');
      messages.push('✏️ Keep inspiring! The morning is flying by!');
    } else if (hour >= 12 && hour < 13) {
      messages.push('🍽️ Lunch time! Take a well-deserved break!');
      messages.push('🥪 Refuel time! You\'ve earned this break!');
      messages.push('😊 Midday pause - rest and recharge!');
      messages.push('🌮 Lunch break! Don\'t forget to eat!');
      messages.push('⏸️ Half day done! Time to breathe and relax!');
    } else if (hour >= 13 && hour < 15) {
      messages.push('🎯 Afternoon sessions! Second wind time!');
      messages.push('📚 Post-lunch energy! You\'ve got momentum!');
      messages.push('🌤️ Afternoon lessons - keep up the great work!');
      messages.push('💡 Afternoon inspiration hour! Ideas flowing!');
      messages.push('🌟 Halfway through the day - you\'re crushing it!');
      messages.push('✨ Afternoon excellence! Students are learning!');
    } else if (hour >= 15 && hour < 17) {
      messages.push('⏰ Final stretch! You\'re almost there!');
      messages.push('🏁 Last period push! Finish strong!');
      messages.push('💪 Late afternoon - maintain that energy!');
      messages.push('🌅 Almost done! The end is in sight!');
      messages.push('🎊 Final hours! Make them count!');
      messages.push('⭐ Wrapping up strong! Great day of teaching!');
    } else if (hour >= 17 && hour < 20) {
      messages.push('🌆 School day complete! Time to unwind!');
      messages.push('✅ Day done! You made a difference today!');
      messages.push('🏡 Evening time - head home and relax!');
      messages.push('😌 Well done today! Time for some rest!');
      messages.push('🌙 Great work today! Tomorrow is another day!');
      messages.push('💫 Classes over! Proud of your dedication!');
    } else if (hour >= 20 || hour < 5) {
      messages.push('🌙 Late night? Don\'t forget to rest!');
      messages.push('💤 Time to sleep! Tomorrow needs your energy!');
      messages.push('😴 It\'s late! Give yourself some rest!');
      messages.push('🌟 Burning midnight oil? Remember to take care!');
    }

    // Day-of-week contextual messages
    if (day === 0) { // Sunday
      messages.push('☀️ Happy Sunday! Enjoy your well-deserved rest!');
      messages.push('🌈 Sunday vibes! Relax and recharge!');
      messages.push('😊 Weekend warrior! Rest up for Monday!');
    } else if (day === 1) { // Monday
      messages.push('💪 Happy Monday! New week, new opportunities!');
      messages.push('🚀 Monday motivation! Let\'s start strong!');
      messages.push('🌟 Monday morning! Fresh start for everyone!');
      messages.push('✨ New week energy! You\'ve got this!');
      messages.push('🎯 Monday mindset: Make this week amazing!');
    } else if (day === 2) { // Tuesday
      messages.push('💼 Tuesday momentum! Keep the energy going!');
      messages.push('📚 Tuesday teaching! Finding your rhythm!');
      messages.push('🌟 Second day strong! You\'re in the flow!');
    } else if (day === 3) { // Wednesday
      messages.push('🐪 Happy Wednesday! Hump day hustle!');
      messages.push('⚡ Midweek power! Halfway to the weekend!');
      messages.push('🌟 Wednesday wisdom! Keep pushing forward!');
      messages.push('💪 Over the hump! Coasting to Friday!');
    } else if (day === 4) { // Thursday
      messages.push('🌟 Thursday thoughts! Friday is so close!');
      messages.push('💫 Almost there! One more day to go!');
      messages.push('🎯 Thursday drive! The weekend is near!');
      messages.push('✨ Pre-Friday energy! You can taste the weekend!');
    } else if (day === 5) { // Friday
      messages.push('🎉 It\'s Friday! The weekend is here!');
      messages.push('🌈 TGIF! You made it through another week!');
      messages.push('🎊 Friday feeling! Finish the week strong!');
      messages.push('💃 Friday vibes! Celebrate this week\'s wins!');
      messages.push('🥳 Last day! The weekend awaits!');
      messages.push('⭐ Friday success! Week accomplished!');
    } else if (day === 6) { // Saturday
      messages.push('🌞 Happy Saturday! Enjoy your weekend!');
      messages.push('😊 Saturday relaxation! You earned it!');
      messages.push('🌈 Weekend mode! Time to recharge!');
    }

    // Weather-based contextual messages
    try {
      const weatherDesc = document.getElementById('weatherDesc').textContent.toLowerCase();
      const temp = parseInt(document.getElementById('weatherTemp').textContent);

      if (weatherDesc.includes('rain') || weatherDesc.includes('drizzle')) {
        messages.push('☔ Rainy day ahead! Don\'t forget your umbrella!');
        messages.push('🌧️ Wet weather alert! Stay dry everyone!');
        messages.push('💧 Rain expected! Perfect day for indoor learning!');
        messages.push('🌂 Umbrella reminder! It\'s going to rain!');
      } else if (weatherDesc.includes('sunny') || weatherDesc.includes('clear')) {
        messages.push('☀️ Beautiful sunny day! Enjoy the sunshine!');
        messages.push('🌞 Gorgeous weather! Maybe an outdoor lesson?');
        messages.push('✨ Perfect weather for learning today!');
      } else if (weatherDesc.includes('cloud')) {
        messages.push('☁️ Cloudy but cozy! Great day for teaching!');
        messages.push('🌥️ Overcast but pleasant! Perfect learning weather!');
      }

      if (temp && temp > 30) {
        messages.push('🔥 Hot day! Stay hydrated and keep cool!');
        messages.push('🌡️ It\'s warm! Remember to drink water!');
      } else if (temp && temp < 20) {
        messages.push('🧊 Cool temperature! Maybe bring a jacket!');
        messages.push('❄️ Chilly today! Layer up!');
      }
    } catch (e) {
      // Weather element might not be ready
    }

    // General inspirational and educational messages
    const inspirationalMessages = [
      '✨ Remember: Teaching is the profession that creates all others!',
      '🌟 Your impact extends far beyond the classroom!',
      '💡 Every lesson you teach plants seeds for the future!',
      '🎓 Education is the most powerful weapon to change the world!',
      '🌈 You\'re not just teaching subjects, you\'re shaping lives!',
      '💫 Small daily improvements lead to stunning results!',
      '🎯 Your dedication inspires students every single day!',
      '🌟 Teaching: where the magic of learning happens!',
      '💖 A teacher affects eternity - your influence never stops!',
      '🌱 You help minds grow and dreams take flight!',
      '✏️ Every student is a story waiting to be written!',
      '🎨 Creativity in teaching sparks innovation in learning!',
      '📚 Knowledge is power, and you\'re the power source!',
      '🌟 You\'re making a difference, one student at a time!',
      '💪 Teaching is tough, but you\'re tougher!',
      '🎯 Focus on progress, not perfection!',
      '✨ Your patience today builds tomorrow\'s leaders!',
      '🌈 Every child learns differently - you adapt beautifully!',
      '🎊 Celebrate small wins - they add up!',
      '💝 Your kindness changes lives in ways you may never know!',
      '🌟 Stay curious, stay inspired, stay amazing!',
      '🦋 Transform struggles into learning opportunities!',
      '🌻 Bloom where you\'re planted - and help others bloom too!',
      '🎵 Teaching is an art, and you\'re an artist!',
      '🌠 Dream big, teach bigger, inspire the biggest!',
      '💫 You\'re creating future doctors, artists, and leaders!',
      '🎪 Make learning fun - engagement equals retention!',
      '🌟 Your enthusiasm is contagious! Keep spreading it!',
      '🔮 You\'re shaping the future, one lesson at a time!',
      '🎁 The gift of education is the greatest gift of all!',
      '🌺 Patience and persistence create masterpieces!',
      '🎭 Every day is a new performance - you\'re a star!',
      '🏆 Excellence is not an act, but a habit - you have it!',
      '🌸 Nurture growth, celebrate progress, inspire greatness!',
      '🎈 Learning should be joyful - you make it happen!',
      '🌊 Ride the waves of challenges - you\'re a pro!',
      '🦅 Help your students soar to new heights!',
      '🎯 Your consistency builds strong foundations!',
      '💎 You\'re polishing rough diamonds into gems!',
      '🌟 Believe in your students - belief builds confidence!',
      '🎓 You\'re not just a teacher, you\'re a life coach!',
      '🌈 Color outside the lines - creativity inspires!',
      '🎪 Make mistakes okay - that\'s where learning happens!',
      '💪 Your resilience teaches resilience!',
      '🌟 Keep shining - your light guides young minds!',
      '🎨 Every student is a canvas for your wisdom!',
      '🌱 Water the seeds of potential you see in every child!',
      '🎯 Stay focused on what matters: student growth!',
      '💫 Your passion for teaching fuels student passion for learning!',
      '🌟 Be the teacher you needed when you were young!'
    ];

    messages.push(...inspirationalMessages);

    // Pick a random message from the pool
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('mascotMessage').textContent = randomMessage;
  } catch (error) {
    console.error('Error updating mascot message:', error);
    // Fallback message
    document.getElementById('mascotMessage').textContent = 'Have a great day! 🌟';
  }
}

// Initialize widgets
// Generate QR Code for ICAN Academy Website
function generateQRCode() {
  const websiteUrl = 'https://icanacademy.com';
  const qrCodeElement = document.getElementById('qrCode');

  if (qrCodeElement) {
    // Use QR Server API to generate QR code
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(websiteUrl)}`;
    qrCodeElement.src = qrApiUrl;
    console.log('✅ QR Code generated for:', websiteUrl);
  }
}

async function initWidgets() {
  try {
    await fetchWeather();
    await fetchWordOfDay();
    updateMascotMessage();
    updateDailyQuote();
    generateQRCode();

    // Update weather every 30 minutes
    setInterval(fetchWeather, 30 * 60 * 1000);

    // Update word of day every hour
    setInterval(fetchWordOfDay, 60 * 60 * 1000);

    // Update mascot message every 5 minutes
    setInterval(updateMascotMessage, 5 * 60 * 1000);

    // Update daily quote every hour
    setInterval(updateDailyQuote, 60 * 60 * 1000);

    console.log('✅ Widgets initialized');
  } catch (error) {
    console.error('❌ Error initializing widgets:', error);
  }
}

// Floating Food Emojis Effect (Lunch Time: 11:50 AM - 12:50 PM)
function createFloatingFood() {
  // Filipino and Asian foods + popular international dishes
  const foodEmojis = [
    '🍚', // Rice (Kanin)
    '🍗', // Fried Chicken (Pritong Manok)
    '🍖', // Pork (Lechon)
    '🥘', // Adobo/Sinigang
    '🍜', // Pancit/Noodles
    '🍲', // Bulalo/Nilaga
    '🍤', // Hipon (Shrimp)
    '🐟', // Isda (Fish)
    '🦀', // Alimango (Crab)
    '🦑', // Pusit (Squid)
    '🥚', // Itlog (Egg)
    '🍳', // Pritong Itlog
    '🌽', // Mais (Corn)
    '🥔', // Patatas (Potato)
    '🍠', // Kamote (Sweet Potato)
    '🥬', // Gulay (Vegetables)
    '🥗', // Salad/Ensalada
    '🍌', // Saging (Banana)
    '🥭', // Mangga (Mango)
    '🍍', // Pinya (Pineapple)
    '🥥', // Buko (Coconut)
    '🍞', // Pandesal
    '🥐', // Bread
    '🥖', // Baguette
    '🍕', // Pizza
    '🍔', // Burger
    '🌭', // Hotdog
    '🌮', // Taco
    '🌯', // Burrito
    '🥙', // Shawarma
    '🥪', // Sandwich
    '🍝', // Pasta/Spaghetti
    '🍛', // Curry
    '🍱', // Bento
    '🍙', // Onigiri
    '🍣', // Sushi
    '🍡', // Dango
    '🥟', // Dumpling/Siomai
    '🥠', // Fortune Cookie
    '🍢', // Oden
    '🧆', // Falafel
    '🥓', // Bacon
    '🍕', // Extra Pizza
    '🧀', // Keso (Cheese)
    '🥛', // Gatas (Milk)
    '☕', // Kape (Coffee)
    '🧃', // Juice
    '🍩', // Donut
    '🍰', // Cake
    '🧁', // Cupcake
    '🍪'  // Cookie
  ];

  const food = document.createElement('div');
  food.className = 'floating-food';
  food.textContent = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];

  // Random horizontal position
  food.style.left = Math.random() * 100 + 'vw';

  // Random animation duration (15-25 seconds)
  const duration = 15 + Math.random() * 10;
  food.style.animationDuration = duration + 's';

  // Random horizontal drift
  const drift = -20 + Math.random() * 40;
  food.style.setProperty('--drift', drift + 'vw');

  document.body.appendChild(food);

  // Remove after animation completes
  setTimeout(() => {
    food.remove();
  }, duration * 1000);
}

function checkLunchTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Check if it's lunch time (11:50 AM to 12:50 PM)
  const isLunchTime = (hours === 11 && minutes >= 50) || (hours === 12 && minutes < 50);

  const existingEffect = document.querySelector('.lunch-effect-active');

  if (isLunchTime && !existingEffect) {
    // Start lunch effect
    document.body.classList.add('lunch-effect-active');
    console.log('🍽️ Lunch time! Starting floating food effect...');

    // Create initial batch of food
    for (let i = 0; i < 8; i++) {
      setTimeout(() => createFloatingFood(), i * 1000);
    }

    // Continue creating food every 3 seconds during lunch
    const lunchInterval = setInterval(() => {
      const checkTime = new Date();
      const h = checkTime.getHours();
      const m = checkTime.getMinutes();
      const stillLunch = (h === 11 && m >= 50) || (h === 12 && m < 50);

      if (stillLunch) {
        createFloatingFood();
      } else {
        clearInterval(lunchInterval);
        document.body.classList.remove('lunch-effect-active');
        console.log('🍽️ Lunch time ended. Stopping effect.');
      }
    }, 3000);
  }
}

// Check lunch time every minute
setInterval(checkLunchTime, 60000);
// Check immediately on load
checkLunchTime();

// Fullscreen functionality
function toggleFullscreen() {
  if (!document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.mozFullScreenElement) {
    // Enter fullscreen
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    }
    console.log('✅ Entering fullscreen mode');
  } else {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
    console.log('✅ Exiting fullscreen mode');
  }
}

// Initialize fullscreen controls
function initFullscreenControls() {
  // Add event listener to fullscreen button
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    console.log('✅ Fullscreen button initialized');
  }

  // Add keyboard shortcut (F key)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // Update button icon when fullscreen state changes
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
  document.addEventListener('mozfullscreenchange', updateFullscreenButton);
}

// Update fullscreen button icon based on current state
function updateFullscreenButton() {
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  if (!fullscreenBtn) return;

  const isFullscreen = document.fullscreenElement ||
                       document.webkitFullscreenElement ||
                       document.mozFullScreenElement;

  if (isFullscreen) {
    fullscreenBtn.textContent = '⛶'; // Exit fullscreen icon
    fullscreenBtn.title = 'Exit Fullscreen (F)';
  } else {
    fullscreenBtn.textContent = '⛶'; // Enter fullscreen icon
    fullscreenBtn.title = 'Enter Fullscreen (F)';
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    initWidgets();
    initFullscreenControls();
  });
} else {
  init();
  initWidgets();
  initFullscreenControls();
}
