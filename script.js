document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabMetric = document.getElementById('tabMetric');
  const tabImperial = document.getElementById('tabImperial');
  const metricInputs = document.getElementById('metricInputs');
  const imperialInputs = document.getElementById('imperialInputs');

  const bmiForm = document.getElementById('bmiForm');
  const btnReset = document.getElementById('btnReset');
  const resultCard = document.getElementById('resultCard');

  const ageInput = document.getElementById('age');
  const heightCmInput = document.getElementById('heightCm');
  const weightKgInput = document.getElementById('weightKg');
  const heightFtInput = document.getElementById('heightFt');
  const heightInInput = document.getElementById('heightIn');
  const weightLbsInput = document.getElementById('weightLbs');

  const bmiValueEl = document.getElementById('bmiValue');
  const bmiCategoryEl = document.getElementById('bmiCategory');
  const gaugeIndicatorEl = document.getElementById('gaugeIndicator');
  const idealWeightEl = document.getElementById('idealWeight');
  const healthAdviceEl = document.getElementById('healthAdvice');

  const historyListEl = document.getElementById('historyList');
  const btnClearHistory = document.getElementById('btnClearHistory');

  let currentUnit = 'metric';
  const STORAGE_KEY = 'bmi_calculator_history_v2';

  // Unit Switching
  tabMetric.addEventListener('click', () => switchUnit('metric'));
  tabImperial.addEventListener('click', () => switchUnit('imperial'));

  function switchUnit(unit) {
    currentUnit = unit;
    if (unit === 'metric') {
      tabMetric.classList.add('active');
      tabImperial.classList.remove('active');
      metricInputs.classList.remove('hidden');
      imperialInputs.classList.add('hidden');

      // Convert imperial back to metric if available
      const ft = parseFloat(heightFtInput.value) || 0;
      const inch = parseFloat(heightInInput.value) || 0;
      const lbs = parseFloat(weightLbsInput.value) || 0;
      if (ft > 0 || inch > 0) {
        const totalInches = (ft * 12) + inch;
        heightCmInput.value = (totalInches * 2.54).toFixed(1);
      }
      if (lbs > 0) {
        weightKgInput.value = (lbs * 0.453592).toFixed(1);
      }
    } else {
      tabImperial.classList.add('active');
      tabMetric.classList.remove('active');
      imperialInputs.classList.remove('hidden');
      metricInputs.classList.add('hidden');

      // Convert metric to imperial
      const cm = parseFloat(heightCmInput.value) || 0;
      const kg = parseFloat(weightKgInput.value) || 0;
      if (cm > 0) {
        const totalInches = cm / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = Math.round(totalInches % 12);
        heightFtInput.value = ft;
        heightInInput.value = inch;
      }
      if (kg > 0) {
        weightLbsInput.value = (kg * 2.20462).toFixed(1);
      }
    }
  }

  // BMI Categories & Interpretation (Asia-Pacific / Thai Standard)
  function getBmiData(bmi) {
    if (bmi < 18.5) {
      return {
        category: 'ผอมเกินไป (Underweight)',
        color: 'var(--underweight)',
        indicatorPercent: Math.max(5, (bmi / 18.5) * 20),
        advice: 'น้ำหนักน้อยกว่าเกณฑ์ ควรรับประทานอาหารให้ครบ 5 หมู่ และเพิ่มปริมาณสารอาหารที่มีโปรตีนและพลังงานที่มีประโยชน์ พร้อมทั้งออกกำลังกายเพื่อเสริมสร้างกล้ามเนื้อ'
      };
    } else if (bmi <= 22.9) {
      return {
        category: 'สมส่วน / ปกติ (Normal)',
        color: 'var(--normal)',
        indicatorPercent: 20 + ((bmi - 18.5) / (22.9 - 18.5)) * 20,
        advice: 'น้ำหนักตัวอยู่ในเกณฑ์มาตรฐาน ดีเยี่ยม! ควรรักษาระดับน้ำหนักนี้ไว้ ด้วยการรับประทานอาหารที่มีประโยชน์และออกกำลังกายสม่ำเสมอสัปดาห์ละ 150 นาที'
      };
    } else if (bmi <= 24.9) {
      return {
        category: 'น้ำหนักเกิน / ท้วม (Overweight)',
        color: 'var(--overweight)',
        indicatorPercent: 40 + ((bmi - 23.0) / (24.9 - 23.0)) * 20,
        advice: 'เริ่มมีน้ำหนักเกินเกณฑ์มาตรฐาน ควรเริ่มควบคุมอาหารประเภทแป้ง ของทอด ของหวาน และเพิ่มการออกกำลังกายแบบคาร์ดิโออย่างสม่ำเสมอ'
      };
    } else if (bmi <= 29.9) {
      return {
        category: 'โรคอ้วนระดับ 1 (Obesity Grade 1)',
        color: 'var(--obese1)',
        indicatorPercent: 60 + ((bmi - 25.0) / (29.9 - 25.0)) * 20,
        advice: 'อยู่ในเกณฑ์โรคอ้วน มีความเสี่ยงต่อโรคความดัน เบาหวาน และไขมันในเลือดสูง ควรปรับพฤติกรรมการกินอย่างจริงจัง และปรึกษาแพทย์หรือผู้เชี่ยวชาญด้านโภชนาการ'
      };
    } else {
      return {
        category: 'โรคอ้วนอันตราย (Obesity Grade 2)',
        color: 'var(--obese2)',
        indicatorPercent: Math.min(95, 80 + ((bmi - 30.0) / 10.0) * 20),
        advice: 'อยู่ในเกณฑ์อ้วนมาก มีความเสี่ยงสูงต่อโรคหลอดเลือดหัวใจและภาวะแทรกซ้อนร้ายแรง ควรเข้ารับคำปรึกษาและวางแผนการรักษาร่วมกับแพทย์โดยเร็ว'
      };
    }
  }

  // Calculate Handler
  bmiForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let heightInMeters = 0;
    let weightInKg = 0;
    let displayHeight = '';
    let displayWeight = '';

    if (currentUnit === 'metric') {
      const cm = parseFloat(heightCmInput.value);
      const kg = parseFloat(weightKgInput.value);
      if (!cm || !kg || cm <= 0 || kg <= 0) return;
      heightInMeters = cm / 100;
      weightInKg = kg;
      displayHeight = `${cm} cm`;
      displayWeight = `${kg} kg`;
    } else {
      const ft = parseFloat(heightFtInput.value) || 0;
      const inch = parseFloat(heightInInput.value) || 0;
      const lbs = parseFloat(weightLbsInput.value) || 0;
      const totalInches = (ft * 12) + inch;
      if (totalInches <= 0 || lbs <= 0) return;
      heightInMeters = (totalInches * 2.54) / 100;
      weightInKg = lbs * 0.453592;
      displayHeight = `${ft}' ${inch}"`;
      displayWeight = `${lbs} lbs`;
    }

    const bmi = weightInKg / (heightInMeters * heightInMeters);
    const roundedBmi = parseFloat(bmi.toFixed(1));
    const bmiData = getBmiData(roundedBmi);

    // Calculate Ideal Weight Range (BMI 18.5 - 22.9 for Asia-Pacific)
    const minIdealKg = (18.5 * (heightInMeters * heightInMeters)).toFixed(1);
    const maxIdealKg = (22.9 * (heightInMeters * heightInMeters)).toFixed(1);

    // Display Results
    resultCard.classList.remove('hidden');
    bmiValueEl.textContent = roundedBmi.toFixed(1);
    bmiValueEl.style.color = bmiData.color;
    bmiCategoryEl.textContent = bmiData.category;
    bmiCategoryEl.style.backgroundColor = bmiData.color;

    // Gauge positioning
    gaugeIndicatorEl.style.left = `${Math.min(Math.max(bmiData.indicatorPercent, 3), 97)}%`;

    if (currentUnit === 'metric') {
      idealWeightEl.textContent = `${minIdealKg} - ${maxIdealKg} kg`;
    } else {
      const minIdealLbs = (minIdealKg * 2.20462).toFixed(1);
      const maxIdealLbs = (maxIdealKg * 2.20462).toFixed(1);
      idealWeightEl.textContent = `${minIdealLbs} - ${maxIdealLbs} lbs (${minIdealKg} - ${maxIdealKg} kg)`;
    }

    healthAdviceEl.textContent = bmiData.advice;

    // Save to history
    saveHistory({
      date: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
      bmi: roundedBmi.toFixed(1),
      category: bmiData.category,
      color: bmiData.color,
      height: displayHeight,
      weight: displayWeight
    });

    // Smooth scroll to result
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Reset Handler
  btnReset.addEventListener('click', () => {
    bmiForm.reset();
    resultCard.classList.add('hidden');
    if (currentUnit === 'metric') {
      heightCmInput.value = '170';
      weightKgInput.value = '65';
    } else {
      heightFtInput.value = '5';
      heightInInput.value = '7';
      weightLbsInput.value = '143';
    }
    ageInput.value = '25';
  });

  // Local Storage History Management
  function getHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(item) {
    const list = getHistory();
    list.unshift(item);
    if (list.length > 5) list.pop(); // keep last 5
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    renderHistory();
  }

  function renderHistory() {
    const list = getHistory();
    if (list.length === 0) {
      historyListEl.innerHTML = '<p class="empty-history">ยังไม่มีบันทึกประวัติการคำนวณ</p>';
      return;
    }

    historyListEl.innerHTML = list.map(item => `
      <div class="history-item">
        <div class="history-item-left">
          <strong>${item.category}</strong>
          <span class="history-date">${item.date} • ${item.weight} / ${item.height}</span>
        </div>
        <div class="history-bmi" style="color: ${item.color}">${item.bmi}</div>
      </div>
    `).join('');
  }

  btnClearHistory.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  });

  // Initial load
  renderHistory();
});
