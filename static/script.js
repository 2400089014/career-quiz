document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("quiz-form");
  const loader = document.getElementById("loader");
  const resultDiv = document.getElementById("result");
  const mapDiv = document.getElementById("map");

  // Fetch questions from the Flask backend
  const response = await fetch("/quiz");
  const data = await response.json();
  const questions = data.questions;

  // Render each question with Yes/No radio buttons
  questions.forEach((q, index) => {
    const questionBox = document.createElement("div");
    questionBox.className = "question";

    questionBox.innerHTML = `
      <p>Q${index + 1}: ${q.question}</p>
      <label><input type="radio" name="q${index}" value="Yes"> Yes</label>
      <label><input type="radio" name="q${index}" value="No"> No</label>
    `;

    form.appendChild(questionBox);
  });

  // Add event listener to submit button
  const submitBtn = document.getElementById("submit-btn");
  submitBtn.addEventListener("click", submitAnswers);

  async function submitAnswers(event) {
    event.preventDefault(); // Prevent page reload

    const answers = [];
    const totalQuestions = questions.length;

    for (let i = 0; i < totalQuestions; i++) {
      const selected = document.querySelector(`input[name="q${i}"]:checked`);
      if (!selected) {
        alert("⚠️ Please answer all questions before submitting!");
        return;
      }
      answers.push(selected.value);
    }

    // Show loader, hide results
    loader.style.display = "block";
    resultDiv.style.display = "none";
    mapDiv.style.display = "none";

    try {
      const res = await fetch("/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user123", // you can dynamically generate or fetch real user_id
          answers: answers,
        }),
      });

      const data = await res.json();

      loader.style.display = "none";
      resultDiv.style.display = "block";

      const relevantColleges = data.govt_colleges.filter(college =>
        college.courses.some(course => data.pathway.courses.includes(course))
      );

      resultDiv.innerHTML = `
        <h2><i class="fas fa-graduation-cap"></i> Recommended Stream: ${data.recommended_stream}</h2>

        <p><strong><i class="fas fa-chart-pie"></i> Score Breakdown:</strong></p>
        <ul>
          ${Object.entries(data.score_breakdown)
            .map(([stream, score]) => `<li>${stream}: ${score}</li>`)
            .join("")}
        </ul>

        <p><strong><i class="fas fa-book-open"></i> Suggested Courses:</strong> ${data.pathway.courses.join(", ")}</p>
        <p><strong><i class="fas fa-briefcase"></i> Career Options:</strong> ${data.pathway.careers.join(", ")}</p>

        <h3><i class="fas fa-university"></i> Relevant Govt Colleges:</h3>
        <ul>
          ${relevantColleges.length > 0
            ? relevantColleges.map(college =>
                `<li><strong>${college.name}</strong> — Courses: ${college.courses.join(", ")}</li>`
              ).join("")
            : "<li>No matching colleges found</li>"
          }
        </ul>
      `;

      // Show Map
      mapDiv.style.display = "block";

      if (window.quizMap) {
        window.quizMap.remove();
      }

      const mapCenter = relevantColleges.length > 0
        ? [relevantColleges[0].lat, relevantColleges[0].lng]
        : [16.5, 80.6];

      const map = L.map("map").setView(mapCenter, 8);
      window.quizMap = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      relevantColleges.forEach(college => {
        L.marker([college.lat, college.lng])
          .addTo(map)
          .bindPopup(`<strong>${college.name}</strong><br>Courses: ${college.courses.join(", ")}`);
      });

    } catch (err) {
      loader.style.display = "none";
      alert("❌ Error submitting quiz. Please try again.");
      console.error(err);
    }
  }
});
