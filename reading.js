const readingModule = {
    container: null,
    currentPassage: null,
    selectedAnswers: {},
    submitted: false,

    init: function() {
        this.container = document.getElementById('readingContainer');
        this.bindEvents();
        this.displayPassage();
    },

    bindEvents: function() {
        document.getElementById('submitReading').addEventListener('click', () => {
            this.submitAnswers();
        });
        
        document.getElementById('refreshReading').addEventListener('click', () => {
            this.displayPassage();
        });
    },

    getRandomPassage: function() {
        const passages = englishData.reading;
        return passages[Math.floor(Math.random() * passages.length)];
    },

    displayPassage: function() {
        this.currentPassage = this.getRandomPassage();
        this.selectedAnswers = {};
        this.submitted = false;

        let html = `
            <div class="reading-passage">
                <h3 style="color: #667eea; margin-bottom: 15px;">${this.currentPassage.title}</h3>
                <p style="color: #666; margin-bottom: 15px;">${this.currentPassage.year}年真题</p>
                <div class="reading-text">${this.currentPassage.passage}</div>
            </div>
            <div class="reading-questions">
        `;

        this.currentPassage.questions.forEach((q, qIndex) => {
            const options = ['A', 'B', 'C', 'D'];
            this.selectedAnswers[qIndex] = null;
            
            html += `
                <div class="reading-question">
                    <p><strong>问题 ${qIndex + 1}：</strong>${q.question}</p>
                    <div class="options-list">
            `;

            q.options.forEach((option, oIndex) => {
                html += `
                    <div class="option-item" data-q="${qIndex}" data-option="${options[oIndex]}" onclick="readingModule.selectAnswer(${qIndex}, '${options[oIndex]}')">
                        <span class="option-letter">${options[oIndex]}</span>
                        <span>${option}</span>
                    </div>
                `;
            });

            html += `
                    </div>
                    <div class="analysis-box" id="readingAnalysis_${qIndex}">
                        <div class="analysis-title">答案与解析</div>
                        <div class="analysis-content">
                            <p><strong>正确答案：</strong>${q.answer}</p>
                            <p><strong>解析：</strong>${q.analysis}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        this.container.innerHTML = html;
        
        document.getElementById('submitReading').style.display = 'inline-block';
        document.getElementById('refreshReading').style.display = 'none';
    },

    selectAnswer: function(qIndex, option) {
        if (this.submitted) return;
        
        document.querySelectorAll(`.option-item[data-q="${qIndex}"]`).forEach(item => {
            item.classList.remove('selected');
        });
        
        const selected = document.querySelector(`.option-item[data-q="${qIndex}"][data-option="${option}"]`);
        if (selected) {
            selected.classList.add('selected');
            this.selectedAnswers[qIndex] = option;
        }
    },

    submitAnswers: function() {
        const allAnswered = this.currentPassage.questions.every((_, qIndex) => this.selectedAnswers[qIndex] !== null);
        
        if (!allAnswered || this.submitted) {
            alert('请回答所有问题！');
            return;
        }
        
        this.submitted = true;
        
        let correctCount = 0;
        
        this.currentPassage.questions.forEach((q, qIndex) => {
            const options = ['A', 'B', 'C', 'D'];
            const answerIndex = options.indexOf(this.selectedAnswers[qIndex]);
            const userAnswer = q.options[answerIndex];
            const isCorrect = userAnswer === q.answer;
            
            if (isCorrect) correctCount++;
            
            document.querySelectorAll(`.option-item[data-q="${qIndex}"]`).forEach((item, index) => {
                item.style.pointerEvents = 'none';
                const optionValue = q.options[index];
                
                if (optionValue === q.answer) {
                    item.classList.add('correct');
                } else if (item.classList.contains('selected')) {
                    item.classList.add('incorrect');
                }
            });
            
            document.getElementById(`readingAnalysis_${qIndex}`).classList.add('show');
        });
        
        document.getElementById('submitReading').style.display = 'none';
        document.getElementById('refreshReading').style.display = 'inline-block';
        
        const resultHtml = `
            <div style="text-align: center; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 12px;">
                <p style="font-size: 1.2rem; color: #333;">你答对了 <span style="color: #28a745; font-weight: bold;">${correctCount}</span> / ${this.currentPassage.questions.length} 道题</p>
                <p style="color: #666; margin-top: 10px;">正确率：${Math.round((correctCount / this.currentPassage.questions.length) * 100)}%</p>
            </div>
        `;
        
        this.container.insertAdjacentHTML('beforeend', resultHtml);
    }
};