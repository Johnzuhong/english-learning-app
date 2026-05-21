const vocabularyModule = {
    container: null,
    currentWords: [],

    init: function() {
        this.container = document.getElementById('vocabContainer');
        this.bindEvents();
        this.displayWords();
    },

    bindEvents: function() {
        document.getElementById('refreshVocab').addEventListener('click', () => {
            this.displayWords();
        });
    },

    getRandomWords: function(count = 30) {
        const wordStats = storage.getWordStats();
        const today = new Date().toDateString();
        
        const unknownWords = englishData.vocabulary.filter(w => {
            const stat = wordStats[w.word];
            if (!stat) return true;
            
            if (stat.lastMarkDate === today) return false;
            
            return stat.status === 'unknown' || stat.status === 'familiar';
        });
        
        const shuffled = unknownWords.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    },

    displayWords: function() {
        this.currentWords = this.getRandomWords(30);
        
        if (this.currentWords.length === 0) {
            this.container.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h3 style="color: #28a745; margin-bottom: 20px;">🎉 恭喜！</h3>
                    <p style="color: #666;">你已经掌握了所有单词！</p>
                </div>
            `;
            return;
        }

        const wordStats = storage.getWordStats();
        let html = `
            <div class="stats-bar">
                <div class="stat-item">
                    <div class="stat-value">${this.currentWords.length}</div>
                    <div class="stat-label">待学习</div>
                </div>
            </div>
        `;

        this.currentWords.forEach((wordData, index) => {
            const stat = wordStats[wordData.word];
            const statusClass = stat?.status === 'familiar' ? 'btn-familiar' : stat?.status === 'known' ? 'btn-known' : 'btn-unknown';
            
            html += `
                <div class="word-card" data-word="${wordData.word}">
                    <div class="word-header">
                        <div>
                            <span class="word-title">${wordData.word}</span>
                            <span class="word-phonetic">${wordData.phonetic}</span>
                        </div>
                        <span style="color: #667eea; font-size: 0.9rem;">第 ${index + 1} 个</span>
                    </div>
                    <div class="word-meaning">${wordData.meaning}</div>
                    <div class="word-collocations">
                        <h4>搭配与例句</h4>
                        ${wordData.collocations.map(c => `<div class="collocation-item"><strong>${c.en}</strong><span style="color: #667eea; margin-left: 10px;">${c.zh}</span></div>`).join('')}
                    </div>
                    <div class="word-actions">
                        <button class="word-btn btn-unknown" onclick="vocabularyModule.markWord('${wordData.word}', 'unknown')">不认识</button>
                        <button class="word-btn btn-familiar" onclick="vocabularyModule.markWord('${wordData.word}', 'familiar')">熟悉</button>
                        <button class="word-btn btn-known" onclick="vocabularyModule.markWord('${wordData.word}', 'known')">认识</button>
                    </div>
                </div>
            `;
        });

        this.container.innerHTML = html;
    },

    markWord: function(word, status) {
        storage.updateWordStatus(word, status, new Date().toDateString());
        
        const card = document.querySelector(`.word-card[data-word="${word}"]`);
        if (card) {
            const buttons = card.querySelectorAll('.word-btn');
            buttons.forEach(btn => btn.disabled = true);
            
            card.style.borderLeftColor = status === 'known' ? '#28a745' : status === 'familiar' ? '#ffc107' : '#dc3545';
        }
        
        setTimeout(() => {
            this.displayWords();
        }, 500);
    }
};