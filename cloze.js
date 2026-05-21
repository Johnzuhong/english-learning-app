const clozeModule = {
    container: null,
    currentQuestion: null,
    selectedAnswer: null,
    submitted: false,

    init: function() {
        this.container = document.getElementById('clozeContainer');
        this.bindEvents();
        this.displayQuestion();
    },

    bindEvents: function() {
        document.getElementById('submitCloze').addEventListener('click', () => {
            this.submitAnswer();
        });
        
        document.getElementById('refreshCloze').addEventListener('click', () => {
            this.displayQuestion();
        });
    },

    getRandomQuestion: function() {
        const questions = englishData.cloze;
        return questions[Math.floor(Math.random() * questions.length)];
    },

    displayQuestion: function() {
        this.currentQuestion = this.getRandomQuestion();
        this.selectedAnswer = null;
        this.submitted = false;

        let html = `
            <div class="question-card">
                <div class="question-title">完形填空 - ${this.currentQuestion.year}年真题</div>
                <div class="cloze-text">${this.currentQuestion.text}</div>
                <div style="margin-top: 25px;">
                    <div style="margin-bottom: 10px; font-weight: bold; color: #333;">请选择正确答案：</div>
                    <div class="options-list">
        `;

        const options = ['A', 'B', 'C', 'D'];
        this.currentQuestion.blanks.forEach((option, index) => {
            html += `
                <div class="option-item" data-option="${options[index]}" onclick="clozeModule.selectAnswer('${options[index]}')">
                    <span class="option-letter">${options[index]}</span>
                    <span>${option}</span>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
                <div class="analysis-box" id="clozeAnalysis">
                    <div class="analysis-title">答案与解析</div>
                    <div class="analysis-content">
                        <p><strong>正确答案：</strong>${this.currentQuestion.answer}</p>
                        <p><strong>解析：</strong>${this.currentQuestion.analysis}</p>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        
        document.getElementById('submitCloze').style.display = 'inline-block';
        document.getElementById('refreshCloze').style.display = 'none';
    },

    selectAnswer: function(option) {
        if (this.submitted) return;
        
        document.querySelectorAll('.option-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selected = document.querySelector(`.option-item[data-option="${option}"]`);
        if (selected) {
            selected.classList.add('selected');
            this.selectedAnswer = option;
        }
    },

    submitAnswer: function() {
        if (!this.selectedAnswer || this.submitted) return;
        
        this.submitted = true;
        
        const options = ['A', 'B', 'C', 'D'];
        const answerIndex = options.indexOf(this.selectedAnswer);
        const userAnswer = this.currentQuestion.blanks[answerIndex];
        const isCorrect = userAnswer === this.currentQuestion.answer;
        
        document.querySelectorAll('.option-item').forEach((item, index) => {
            item.style.pointerEvents = 'none';
            const optionValue = this.currentQuestion.blanks[index];
            
            if (optionValue === this.currentQuestion.answer) {
                item.classList.add('correct');
            } else if (item.classList.contains('selected')) {
                item.classList.add('incorrect');
            }
        });
        
        document.getElementById('clozeAnalysis').classList.add('show');
        document.getElementById('submitCloze').style.display = 'none';
        document.getElementById('refreshCloze').style.display = 'inline-block';
    }
};