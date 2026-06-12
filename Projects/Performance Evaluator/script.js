 function loadSavedSubjects() {
            const savedPerf = localStorage.getItem('quests_performance');
            const container = document.getElementById('subjectList');
            container.innerHTML = '';
            
            let loadedData = [];
            if (savedPerf) {
                try {
                    loadedData = JSON.parse(savedPerf);
                } catch(e) {
                    loadedData = [];
                }
            }

            if (loadedData.length > 0) {
                loadedData.forEach(sub => {
                    const div = document.createElement('div');
                    div.className = 'subject-row';
                    div.innerHTML = `
                        <input type="text" class="sub-name" placeholder="Subject Name" value="${sub.name || ''}">
                        <input type="number" class="sub-marks" placeholder="Obtained" value="${sub.obtained !== undefined ? sub.obtained : ''}">
                        <input type="number" class="sub-total" placeholder="Total Marks" value="${sub.total !== undefined ? sub.total : ''}">
                        <button class="btn btn-remove" onclick="this.parentElement.remove()"><i class="ri-delete-bin-line"></i></button>
                    `;
                    container.appendChild(div);
                });
            } else {
                addSubjectRow();
            }

            const profile = JSON.parse(localStorage.getItem('quests_profile') || '{}');
            if (profile.name) {
                document.getElementById('username').value = profile.name;
            }
        }

        function addSubjectRow() {
            const container = document.getElementById('subjectList');
            const div = document.createElement('div');
            div.className = 'subject-row';
            div.innerHTML = `
                <input type="text" class="sub-name" placeholder="Subject Name">
                <input type="number" class="sub-marks" placeholder="Obtained">
                <input type="number" class="sub-total" placeholder="Total Marks">
                <button class="btn btn-remove" onclick="this.parentElement.remove()"><i class="ri-delete-bin-line"></i></button>
            `;
            container.appendChild(div);
        }

        function evaluatePerformance() {
            const user = document.getElementById('username').value.trim() || 'Scholar';
            
            // Save profile name back to quests_profile if edited
            const profile = JSON.parse(localStorage.getItem('quests_profile') || '{"name": "Scholar"}');
            profile.name = user;
            localStorage.setItem('quests_profile', JSON.stringify(profile));

            const rows = document.querySelectorAll('.subject-row');
            const results = [];
            const saveList = [];

            rows.forEach(row => {
                const name = row.querySelector('.sub-name').value.trim();
                const marks = parseFloat(row.querySelector('.sub-marks').value);
                const total = parseFloat(row.querySelector('.sub-total').value);

                if (name && !isNaN(marks) && !isNaN(total) && total > 0) {
                    const percent = (marks / total) * 100;
                    results.push({ name, percent });
                    saveList.push({ name, obtained: marks, total, percentage: percent });
                }
            });

            if (results.length === 0) return alert('Please enter at least one subject with valid marks!');

            // Save performance details to localstorage for report page
            localStorage.setItem('quests_performance', JSON.stringify(saveList));

            results.sort((a, b) => b.percent - a.percent);
            const strong = results[0];
            const weak = results[results.length - 1];
            const resDiv = document.getElementById('analysis-result');

            resDiv.style.display = 'block';
            resDiv.innerHTML = `
                <div class="result-box strong">
                    <i class="ri-medal-fill"></i>
                    <div class="result-text">
                        <h3>Peak Performance: ${strong.name}</h3>
                        <p><strong>${user}</strong> Your Strong Subject is <strong>${strong.name}</strong>, Keep going champ!</p>
                    </div>
                </div>
                <div class="result-box weak">
                    <i class="ri-error-warning-fill"></i>
                    <div class="result-text">
                        <h3>Focus Required: ${weak.name}</h3>
                        <p><strong>${user}</strong> Your Weak subject is <strong>${weak.name}</strong>, Study hard dude!</p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="report.html" class="btn btn-track" style="display: inline-flex; text-decoration: none; padding: 12px 24px; font-size: 14px;"><i class="ri-file-chart-line"></i> View Academic Report</a>
                </div>
            `;
            resDiv.scrollIntoView({ behavior: 'smooth' });
        }

        // Theme sync with TaskQuest
        const currentTheme = localStorage.getItem('quests_theme') || 'cosmic';
        document.body.setAttribute('data-theme', currentTheme);

        // Load subjects on page load
        window.addEventListener('DOMContentLoaded', loadSavedSubjects);