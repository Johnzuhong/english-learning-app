const writingModule = {
    container: null,
    currentPrompt: null,
    submitted: false,

    init: function() {
        this.container = document.getElementById('writingContainer');
        this.bindEvents();
        this.displayPrompt();
    },

    bindEvents: function() {
        document.getElementById('submitWriting').addEventListener('click', () => {
            this.submitEssay();
        });
        
        document.getElementById('refreshWriting').addEventListener('click', () => {
            this.displayPrompt();
        });
    },

    getRandomPrompt: function() {
        const prompts = englishData.writing;
        return prompts[Math.floor(Math.random() * prompts.length)];
    },

    displayPrompt: function() {
        this.currentPrompt = this.getRandomPrompt();
        this.submitted = false;

        let html = `
            <div class="writing-prompt">
                <div class="writing-title">${this.currentPrompt.title}</div>
                <div class="writing-requirements">
                    <h4>写作要求：</h4>
                    <ul>
                        ${this.currentPrompt.requirements.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                <div class="writing-outline">
                    <h4>写作大纲：</h4>
                    <ol>
                        ${this.currentPrompt.outline.map(o => `<li>${o}</li>`).join('')}
                    </ol>
                </div>
            </div>
            <div>
                <h4 style="margin-bottom: 15px; color: #333;">请输入你的作文：</h4>
                <textarea id="essayText" class="writing-textarea" placeholder="在这里输入你的作文..."></textarea>
            </div>
            <div id="writingResult" style="display: none; margin-top: 30px;"></div>
        `;

        this.container.innerHTML = html;
        
        document.getElementById('submitWriting').style.display = 'inline-block';
        document.getElementById('refreshWriting').style.display = 'none';
    },

    submitEssay: function() {
        const essayText = document.getElementById('essayText').value.trim();
        
        if (!essayText || this.submitted) {
            alert('请输入作文内容！');
            return;
        }
        
        this.submitted = true;
        const score = this.evaluateEssay(essayText);
        
        this.displayResult(essayText, score);
        
        document.getElementById('submitWriting').style.display = 'none';
        document.getElementById('refreshWriting').style.display = 'inline-block';
    },

    evaluateEssay: function(text) {
        const metrics = this.analyzeText(text);
        
        let contentScore = Math.min(15, Math.floor(metrics.length / 30));
        contentScore += metrics.hasIntroduction ? 2 : 0;
        contentScore += metrics.hasConclusion ? 2 : 0;
        contentScore = Math.min(15, contentScore);
        
        let orgScore = 10;
        if (!metrics.hasIntroduction) orgScore -= 3;
        if (!metrics.hasConclusion) orgScore -= 3;
        if (metrics.paragraphCount < 3) orgScore -= 2;
        orgScore = Math.max(0, orgScore);
        
        let langScore = 10;
        if (metrics.errorCount > 5) langScore -= 3;
        if (metrics.repetitionCount > 3) langScore -= 2;
        if (metrics.vocabularyRichness < 0.5) langScore -= 2;
        langScore = Math.max(0, langScore);
        
        return {
            content: contentScore,
            organization: orgScore,
            language: langScore,
            total: contentScore + orgScore + langScore,
            suggestions: this.generateSuggestions(metrics, text)
        };
    },

    analyzeText: function(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        const words = text.toLowerCase().match(/[a-zA-Z]+/g) || [];
        const uniqueWords = new Set(words);
        
        return {
            length: text.length,
            wordCount: words.length,
            sentenceCount: sentences.length,
            paragraphCount: text.split('\n\n').filter(p => p.trim()).length,
            vocabularyRichness: uniqueWords.size / Math.max(1, words.length),
            hasIntroduction: sentences.length > 0 && sentences[0].length > 10,
            hasConclusion: sentences.length > 2 && sentences[sentences.length - 1].length > 10,
            errorCount: this.detectErrors(text),
            repetitionCount: this.detectRepetitions(words)
        };
    },

    detectErrors: function(text) {
        let errors = 0;
        const errorPatterns = [
            /\b(?:a|an)\s+(?:a|an)\b/i,
            /\b(?:the)\s+(?:the)\b/i,
            /\b(?:he|she|it)\s+(?:is|are)\b/i,
            /\b(?:they|we|you)\s+(?:is)\b/i,
            /\b(?:I)\s+(?:is)\b/i,
            /\b(?:has)\s+(?:been)\s+(?:done)\b/i,
            /\b(?:have)\s+(?:did)\b/i
        ];
        
        errorPatterns.forEach(pattern => {
            if (pattern.test(text)) errors++;
        });
        
        return errors;
    },

    detectRepetitions: function(words) {
        const wordCounts = {};
        words.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        
        let repetitions = 0;
        Object.values(wordCounts).forEach(count => {
            if (count > 3) repetitions++;
        });
        
        return repetitions;
    },

    generateSuggestions: function(metrics, text) {
        const suggestions = [];
        
        if (metrics.length < 300) {
            suggestions.push('作文篇幅较短，建议增加更多细节和例子来支持论点。');
        }
        
        if (!metrics.hasIntroduction) {
            suggestions.push('建议添加一个清晰的引言段落，明确表达文章主题。');
        }
        
        if (!metrics.hasConclusion) {
            suggestions.push('建议添加结论段落，总结主要观点。');
        }
        
        if (metrics.paragraphCount < 3) {
            suggestions.push('建议将文章分成更多段落，每段讨论一个主题。');
        }
        
        if (metrics.errorCount > 0) {
            suggestions.push('注意检查语法错误，特别是主谓一致和时态使用。');
        }
        
        if (metrics.repetitionCount > 0) {
            suggestions.push('注意避免重复使用相同的词汇，可以使用同义词替换。');
        }
        
        if (metrics.vocabularyRichness < 0.5) {
            suggestions.push('建议使用更多多样化的词汇，提升文章质量。');
        }
        
        const wordSuggestions = this.getWordSuggestions(text);
        if (wordSuggestions.length > 0) {
            suggestions.push(...wordSuggestions);
        }
        
        return suggestions;
    },

    getWordSuggestions: function(text) {
        const suggestions = [];
        const wordReplacements = {
            'very': 'extremely, highly, considerably',
            'good': 'excellent, outstanding, remarkable',
            'bad': 'poor, inadequate, unsatisfactory',
            'big': 'significant, substantial, considerable',
            'small': 'minor, modest, slight',
            'happy': 'pleased, delighted, content',
            'sad': 'unhappy, sorrowful, melancholy',
            'important': 'crucial, vital, essential',
            'use': 'utilize, employ, apply',
            'think': 'consider, contemplate, reflect'
        };
        
        Object.keys(wordReplacements).forEach(word => {
            if (text.toLowerCase().includes(word)) {
                suggestions.push(`可以考虑用 "${wordReplacements[word]}" 替换 "${word}"，使表达更丰富。`);
            }
        });
        
        return suggestions.slice(0, 3);
    },

    displayResult: function(essay, score) {
        const resultDiv = document.getElementById('writingResult');
        resultDiv.style.display = 'block';
        
        resultDiv.innerHTML = `
            <div class="score-box">
                <div class="score-circle">
                    <div class="score-value">${score.total}</div>
                    <div class="score-label">总分 / 35</div>
                </div>
            </div>
            <div class="score-details">
                <div class="score-item">
                    <span>内容完整性</span>
                    <span style="color: ${score.content >= 10 ? '#28a745' : score.content >= 7 ? '#ffc107' : '#dc3545'};">${score.content} / 15</span>
                </div>
                <div class="score-item">
                    <span>结构组织</span>
                    <span style="color: ${score.organization >= 7 ? '#28a745' : score.organization >= 5 ? '#ffc107' : '#dc3545'};">${score.organization} / 10</span>
                </div>
                <div class="score-item">
                    <span>语言表达</span>
                    <span style="color: ${score.language >= 7 ? '#28a745' : score.language >= 5 ? '#ffc107' : '#dc3545'};">${score.language} / 10</span>
                </div>
            </div>
            <div class="suggestions-box">
                <h4>修改建议：</h4>
                <ul class="suggestions-list">
                    ${score.suggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        `;
    }
};