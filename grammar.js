const grammarModule = {
    container: null,
    currentQuestion: null,
    selectedAnswer: null,
    submitted: false,

    init: function() {
        this.container = document.getElementById('grammarContainer');
        this.bindEvents();
        this.displayQuestion();
    },

    bindEvents: function() {
        document.getElementById('submitGrammar').addEventListener('click', () => {
            this.submitAnswer();
        });
        
        document.getElementById('refreshGrammar').addEventListener('click', () => {
            this.displayQuestion();
        });
    },

    getRandomQuestion: function() {
        const grammarStats = storage.getGrammarStats();
        const questions = englishData.grammar;
        
        const availableQuestions = questions.filter(q => {
            const stat = grammarStats[q.id];
            if (!stat || stat.attempts < 3) return true;
            const accuracy = stat.correct / stat.attempts;
            return accuracy < 0.8;
        });
        
        if (availableQuestions.length === 0) {
            return questions[Math.floor(Math.random() * questions.length)];
        }
        
        return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    },

    displayQuestion: function() {
        this.currentQuestion = this.getRandomQuestion();
        this.selectedAnswer = null;
        this.submitted = false;

        const options = ['A', 'B', 'C', 'D'];
        
        let html = `
            <div class="question-card">
                <div class="question-title">语法知识点: <span style="color: #667eea;">${this.currentQuestion.topic}</span></div>
                <div class="question-content">${this.currentQuestion.question}</div>
                <div class="options-list">
        `;

        this.currentQuestion.options.forEach((option, index) => {
            html += `
                <div class="option-item" data-option="${options[index]}" onclick="grammarModule.selectAnswer('${options[index]}')">
                    <span class="option-letter">${options[index]}</span>
                    <span>${option}</span>
                </div>
            `;
        });

        html += `
                </div>
                <div class="analysis-box" id="grammarAnalysis">
                    <div class="analysis-title">答案与解析</div>
                    <div class="analysis-content">
                        <p><strong>正确答案：</strong>${this.currentQuestion.answer}</p>
                        <p><strong>解析：</strong>${this.currentQuestion.analysis}</p>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        
        document.getElementById('submitGrammar').style.display = 'inline-block';
        document.getElementById('refreshGrammar').style.display = 'none';
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
        const userAnswer = this.currentQuestion.options[answerIndex];
        const isCorrect = userAnswer === this.currentQuestion.answer;
        
        storage.updateGrammarStats(this.currentQuestion.id, isCorrect);
        
        document.querySelectorAll('.option-item').forEach((item, index) => {
            item.style.pointerEvents = 'none';
            const optionValue = this.currentQuestion.options[index];
            
            if (optionValue === this.currentQuestion.answer) {
                item.classList.add('correct');
            } else if (item.classList.contains('selected')) {
                item.classList.add('incorrect');
            }
        });
        
        document.getElementById('grammarAnalysis').classList.add('show');
        document.getElementById('submitGrammar').style.display = 'none';
        document.getElementById('refreshGrammar').style.display = 'inline-block';
    }
};