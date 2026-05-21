const examModule = {
    container: null,
    currentExam: null,
    examMode: false,
    examAnswers: {},
    examStartTime: null,
    timeLeft: 0,
    timerInterval: null,

    init: function() {
        this.container = document.getElementById('examContainer');
        this.bindEvents();
        this.displayExamList();
    },

    bindEvents: function() {
        document.getElementById('startExam').addEventListener('click', () => {
            this.startSimulationExam();
        });
    },

    displayExamList: function() {
        const exams = englishData.exams;
        
        let html = `
            <div class="exam-list">
        `;

        exams.forEach(exam => {
            html += `
                <div class="exam-card" onclick="examModule.selectExam(${exam.id})">
                    <div class="exam-year">${exam.year}</div>
                    <div class="exam-semester">${exam.semester} Exam</div>
                    <div class="exam-type">${exam.type}</div>
                </div>
            `;
        });

        html += `</div>`;

        this.container.innerHTML = html;
    },

    selectExam: function(examId) {
        const exam = englishData.exams.find(e => e.id === examId);
        if (exam) {
            this.currentExam = exam;
            this.showExamDetail(exam);
        }
    },

    showExamDetail: function(exam) {
        let html = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h3 style="color: #667eea; font-size: 1.5rem;">${exam.year}年${exam.semester}真题</h3>
                <p style="color: #666; margin-top: 10px;">类型：${exam.type}</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                <h4 style="color: #333; margin-bottom: 15px;">试卷结构：</h4>
                <ul style="list-style: none; padding-left: 0;">
                    ${exam.sections.map((section, index) => `<li style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center;">
                        <span style="width: 30px; height: 30px; background: #667eea; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin-right: 15px;">${index + 1}</span>
                        ${section}
                    </li>`).join('')}
                </ul>
            </div>
            <div style="text-align: center;">
                <button class="submit-btn" onclick="examModule.startExam(${exam.id})" style="margin-right: 15px;">开始答题</button>
                <button class="refresh-btn" onclick="examModule.displayExamList()">返回列表</button>
            </div>
        `;

        this.container.innerHTML = html;
    },

    startExam: function(examId) {
        const exam = englishData.exams.find(e => e.id === examId);
        if (!exam) return;

        this.examMode = true;
        this.examAnswers = {};
        this.examStartTime = Date.now();
        this.timeLeft = 180;
        this.startTimer();

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h3 style="color: #667eea;">${exam.year}年${exam.semester}真题 - 模拟考试</h3>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="font-size: 1.2rem; font-weight: bold; color: ${this.timeLeft < 30 ? '#dc3545' : '#333'};">
                        剩余时间: <span id="examTimer">${this.formatTime(this.timeLeft)}</span>
                    </div>
                </div>
            </div>
        `;

        const vocabQuestions = this.generateVocabQuestions(5);
        const grammarQuestions = this.generateGrammarQuestions(5);

        html += this.renderQuestions('词汇部分', vocabQuestions, 'vocab');
        html += this.renderQuestions('语法部分', grammarQuestions, 'grammar');

        html += `
            <div style="text-align: center; margin-top: 30px;">
                <button class="submit-btn" onclick="examModule.submitExam()">提交试卷</button>
            </div>
        `;

        this.container.innerHTML = html;
        document.getElementById('startExam').style.display = 'none';
    },

    startTimer: function() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('examTimer').textContent = this.formatTime(this.timeLeft);
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.submitExam();
            }
        }, 1000);
    },

    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    generateVocabQuestions: function(count) {
        const questions = [];
        const shuffled = englishData.vocabulary.sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(count, shuffled.length); i++) {
            const word = shuffled[i];
            const options = [word.meaning];
            
            while (options.length < 4) {
                const randomWord = englishData.vocabulary[Math.floor(Math.random() * englishData.vocabulary.length)];
                if (!options.includes(randomWord.meaning)) {
                    options.push(randomWord.meaning);
                }
            }
            
            questions.push({
                question: `What does "${word.word}" mean?`,
                options: options.sort(() => Math.random() - 0.5),
                answer: word.meaning
            });
        }
        
        return questions;
    },

    generateGrammarQuestions: function(count) {
        const questions = [];
        const shuffled = englishData.grammar.sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(count, shuffled.length); i++) {
            const q = shuffled[i];
            questions.push({
                question: q.question,
                options: q.options,
                answer: q.answer
            });
        }
        
        return questions;
    },

    renderQuestions: function(title, questions, prefix) {
        let html = `
            <div style="margin-bottom: 30px;">
                <h4 style="color: #333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">${title}</h4>
        `;

        questions.forEach((q, index) => {
            const options = ['A', 'B', 'C', 'D'];
            this.examAnswers[`${prefix}_${index}`] = null;
            
            html += `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <p style="font-weight: bold; margin-bottom: 15px;">${index + 1}. ${q.question}</p>
                    <div class="options-list">
            `;

            q.options.forEach((option, oIndex) => {
                html += `
                    <div class="option-item" data-question="${prefix}_${index}" data-option="${options[oIndex]}" onclick="examModule.selectExamAnswer('${prefix}_${index}', '${options[oIndex]}')">
                        <span class="option-letter">${options[oIndex]}</span>
                        <span>${option}</span>
                    </div>
                `;
            });

            html += `</div></div>`;
        });

        html += `</div>`;
        return html;
    },

    selectExamAnswer: function(questionId, option) {
        document.querySelectorAll(`.option-item[data-question="${questionId}"]`).forEach(item => {
            item.classList.remove('selected');
        });
        
        const selected = document.querySelector(`.option-item[data-question="${questionId}"][data-option="${option}"]`);
        if (selected) {
            selected.classList.add('selected');
            this.examAnswers[questionId] = option;
        }
    },

    submitExam: function() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        const vocabQuestions = this.generateVocabQuestions(5);
        const grammarQuestions = this.generateGrammarQuestions(5);
        
        let correctCount = 0;
        let totalQuestions = 0;
        
        vocabQuestions.forEach((q, index) => {
            totalQuestions++;
            const userAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(this.examAnswers[`vocab_${index}`]);
            if (userAnswerIndex >= 0 && q.options[userAnswerIndex] === q.answer) {
                correctCount++;
            }
        });

        grammarQuestions.forEach((q, index) => {
            totalQuestions++;
            const userAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(this.examAnswers[`grammar_${index}`]);
            if (userAnswerIndex >= 0 && q.options[userAnswerIndex] === q.answer) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / totalQuestions) * 100);
        
        storage.addExamResult({
            examId: this.currentExam?.id || 0,
            score,
            correctCount,
            totalQuestions,
            timeTaken: 180 - this.timeLeft
        });

        this.displayExamResult(score, correctCount, totalQuestions);
    },

    displayExamResult: function(score, correct, total) {
        let html = `
            <div style="text-align: center; padding: 50px;">
                <div class="score-box">
                    <div class="score-circle">
                        <div class="score-value">${score}</div>
                        <div class="score-label">得分</div>
                    </div>
                </div>
                <div style="margin-top: 30px;">
                    <p style="font-size: 1.2rem; color: #333;">答对 <span style="color: #28a745; font-weight: bold;">${correct}</span> / ${total} 道题</p>
                    <p style="color: #666; margin-top: 10px;">用时：${this.formatTime(180 - this.timeLeft)}</p>
                </div>
                <div style="margin-top: 30px;">
                    <button class="submit-btn" onclick="examModule.startSimulationExam()" style="margin-right: 15px;">再做一套</button>
                    <button class="refresh-btn" onclick="examModule.exitExam()">返回题库</button>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    },

    startSimulationExam: function() {
        const randomExam = englishData.exams[Math.floor(Math.random() * englishData.exams.length)];
        this.startExam(randomExam.id);
    },

    exitExam: function() {
        this.examMode = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.displayExamList();
        document.getElementById('startExam').style.display = 'inline-block';
    }
};