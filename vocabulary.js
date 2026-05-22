const vocabularyModule = {
    container: null,
    currentWords: [],
    currentUnit: 1,
    settings: {
        sortOrder: 'order',
        displayMode: 'both',
        filterMode: 'all',
        speechMode: false,
        reviewMode: false
    },
    recognition: null,

    init: function() {
        this.container = document.getElementById('vocabContainer');
        this.loadSettings();
        this.bindEvents();
        this.displayWords();
    },

    loadSettings: function() {
        const saved = localStorage.getItem('vocabSettings');
        if (saved) {
            this.settings = JSON.parse(saved);
        }
    },

    saveSettings: function() {
        localStorage.setItem('vocabSettings', JSON.stringify(this.settings));
    },

    bindEvents: function() {
        document.getElementById('refreshVocab').addEventListener('click', () => {
            this.displayWords();
        });

        document.getElementById('vocabSettingsBtn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        document.getElementById('scheduleBtn').addEventListener('click', () => {
            this.showScheduleModal();
        });
    },

    getFilteredWords: function() {
        const wordStats = storage.getWordStats();
        const today = new Date().toDateString();
        
        let filtered = englishData.vocabulary.filter(w => {
            const stat = wordStats[w.word];
            
            if (!stat) {
                if (this.settings.filterMode === 'review-only') return false;
                if (this.settings.filterMode === 'hide-known-familiar') return false;
                return true;
            }
            
            if (this.settings.filterMode === 'review-only') {
                return stat.status === 'familiar';
            }
            
            if (stat.status === 'known') {
                return false;
            }
            
            if (this.settings.filterMode === 'hide-known-familiar') {
                return stat.status === 'unknown' && (!stat.lastMarkDate || stat.lastMarkDate !== today);
            }
            
            if (stat.lastMarkDate === today) {
                return false;
            }
            
            return true;
        });

        if (this.settings.sortOrder === 'random') {
            filtered = filtered.sort(() => Math.random() - 0.5);
        } else if (this.settings.sortOrder === 'new-first') {
            filtered = filtered.sort((a, b) => {
                const statA = wordStats[a.word];
                const statB = wordStats[b.word];
                if (!statA || statA.status === 'unknown') return -1;
                if (!statB || statB.status === 'unknown') return 1;
                return 0;
            });
        } else if (this.settings.sortOrder === 'review-first') {
            filtered = filtered.sort((a, b) => {
                const statA = wordStats[a.word];
                const statB = wordStats[b.word];
                const reviewA = statA && statA.status === 'familiar' && this.needsReview(statA, todayDate);
                const reviewB = statB && statB.status === 'familiar' && this.needsReview(statB, todayDate);
                if (reviewA && !reviewB) return -1;
                if (!reviewA && reviewB) return 1;
                return 0;
            });
        }

        return filtered;
    },

    needsReview: function(stat, todayDate) {
        if (!stat.lastMarkDate) return true;
        
        const lastDate = new Date(stat.lastMarkDate);
        const daysSinceReview = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        
        const reviewIntervals = [1, 2, 4, 7, 15];
        const familiarity = stat.familiarity || 50;
        
        let intervalIndex = Math.min(Math.floor(familiarity / 20), reviewIntervals.length - 1);
        const targetInterval = reviewIntervals[intervalIndex];
        
        if (daysSinceReview === 0) {
            const firstMarkDate = stat.firstMarkDate || stat.lastMarkDate;
            const firstDate = new Date(firstMarkDate);
            const daysSinceFirst = Math.floor((todayDate - firstDate) / (1000 * 60 * 60 * 24));
            return daysSinceFirst >= targetInterval;
        }
        
        return daysSinceReview >= targetInterval;
    },

    displayWords: function() {
        const unitBadge = document.getElementById('unitBadge');
        if (unitBadge) {
            unitBadge.textContent = `第 ${this.currentUnit} 天`;
        }
        
        const filteredWords = this.getFilteredWords();
        this.currentWords = filteredWords.slice(0, 30);
        
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
            <div class="word-list">
        `;

        this.currentWords.forEach((wordData, index) => {
            const stat = wordStats[wordData.word];
            const status = stat?.status || 'unknown';
            const statusColor = status === 'known' ? '#28a745' : status === 'familiar' ? '#ffc107' : '#dc3545';
            
            let wordDisplay = `<span class="word-text">${wordData.word}</span>`;
            let meaningDisplay = `<span class="meaning-text">${wordData.meaning}</span>`;
            
            if (this.settings.reviewMode) {
                meaningDisplay = '';
            } else if (this.settings.displayMode === 'english') {
                meaningDisplay = '';
            } else if (this.settings.displayMode === 'chinese') {
                wordDisplay = '';
            }

            html += `
                <div class="word-list-item" data-word="${wordData.word}" style="border-left: 3px solid ${statusColor};">
                    <div class="word-info">
                        ${wordDisplay}
                        ${meaningDisplay}
                    </div>
                    <button class="word-arrow" onclick="vocabularyModule.showWordDetail('${wordData.word}')">›</button>
                </div>
            `;
        });

        html += `</div>`;
        this.container.innerHTML = html;
    },

    showWordDetail: function(word) {
        const wordData = englishData.vocabulary.find(w => w.word === word);
        if (!wordData) return;

        const wordStats = storage.getWordStats();
        const stat = wordStats[word];
        const status = stat?.status || 'unknown';
        
        const isReviewMode = this.settings.reviewMode || (this.settings.speechMode && status === 'familiar');

        const modal = document.createElement('div');
        modal.className = 'word-detail-modal active';
        
        let meaningDisplay = isReviewMode ? '<div class="meaning-hidden">点击下方按钮，说出单词释义...</div>' : `<div class="detail-meaning">${wordData.meaning}</div>`;
        
        let collocationsDisplay = wordData.collocations.map(c => {
            if (isReviewMode) {
                return `<div class="collocation-row"><strong>${c.en}</strong><span class="collocation-hidden">（中文释义已隐藏）</span></div>`;
            }
            return `<div class="collocation-row"><strong>${c.en}</strong><span>${c.zh}</span></div>`;
        }).join('');
        
        modal.innerHTML = `
            <div class="modal-overlay" onclick="vocabularyModule.closeDetailModal()"></div>
            <div class="modal-content-detail">
                <div class="detail-header">
                    <span class="detail-word">${wordData.word}</span>
                    <span class="detail-phonetic">${wordData.phonetic}</span>
                    <button class="close-btn" onclick="vocabularyModule.closeDetailModal()">&times;</button>
                </div>
                ${meaningDisplay}
                <div class="detail-collocations">
                    <h4>搭配与例句</h4>
                    ${collocationsDisplay}
                </div>
                ${isReviewMode ? `
                    <div class="speech-section">
                        <button class="speech-btn" onclick="vocabularyModule.startSpeechRecognition('${word}')">🎤 开始语音答题</button>
                        <div id="speechResult"></div>
                        <div id="speechAnalysis"></div>
                    </div>
                ` : ''}
                <div class="detail-actions">
                    <button class="action-btn-unknown" onclick="vocabularyModule.markWord('${word}', 'unknown'); vocabularyModule.closeDetailModal();">不认识</button>
                    <button class="action-btn-familiar" onclick="vocabularyModule.markWord('${word}', 'familiar'); vocabularyModule.closeDetailModal();">熟悉</button>
                    <button class="action-btn-known" onclick="vocabularyModule.markWord('${word}', 'known'); vocabularyModule.closeDetailModal();">认识</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    startSpeechRecognition: function(word) {
        const wordData = englishData.vocabulary.find(w => w.word === word);
        if (!wordData) return;

        const hasSpeechSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

        if (hasSpeechSupport) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.lang = 'zh-CN';
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            const speechBtn = document.querySelector('.speech-btn');
            const resultDiv = document.getElementById('speechResult');
            const analysisDiv = document.getElementById('speechAnalysis');

            speechBtn.innerHTML = '🎤 正在聆听...';
            speechBtn.disabled = true;
            resultDiv.innerHTML = '';
            analysisDiv.innerHTML = '';

            this.recognition.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                resultDiv.innerHTML = `<strong>你的回答：</strong>${speechResult}`;
                
                this.analyzeSpeechAnswer(speechResult, wordData.meaning, analysisDiv);
                
                speechBtn.innerHTML = '🎤 开始语音答题';
                speechBtn.disabled = false;
            };

            this.recognition.onerror = (event) => {
                resultDiv.innerHTML = `<span style="color: #dc3545;">语音识别出错：${event.error}</span>`;
                speechBtn.innerHTML = '🎤 开始语音答题';
                speechBtn.disabled = false;
            };

            this.recognition.onend = () => {
                if (speechBtn.disabled) {
                    speechBtn.innerHTML = '🎤 开始语音答题';
                    speechBtn.disabled = false;
                }
            };

            this.recognition.start();
        } else {
            const speechSection = document.querySelector('.speech-section');
            speechSection.innerHTML = `
                <div style="color: #667eea; margin-bottom: 15px;">您的浏览器不支持语音识别，请手动输入答案：</div>
                <input type="text" id="manualAnswer" placeholder="请输入单词的中文释义..." class="manual-input" />
                <button class="manual-submit-btn" onclick="vocabularyModule.submitManualAnswer('${word}')">提交答案</button>
                <div id="speechResult"></div>
                <div id="speechAnalysis"></div>
            `;
        }
    },

    submitManualAnswer: function(word) {
        const wordData = englishData.vocabulary.find(w => w.word === word);
        if (!wordData) return;

        const input = document.getElementById('manualAnswer');
        const resultDiv = document.getElementById('speechResult');
        const analysisDiv = document.getElementById('speechAnalysis');

        const userAnswer = input.value.trim();
        
        if (!userAnswer) {
            resultDiv.innerHTML = '<span style="color: #dc3545;">请输入答案</span>';
            return;
        }

        resultDiv.innerHTML = `<strong>你的回答：</strong>${userAnswer}`;
        this.analyzeSpeechAnswer(userAnswer, wordData.meaning, analysisDiv);
        input.value = '';
    },

    analyzeSpeechAnswer: function(userAnswer, correctAnswer, analysisDiv) {
        const cleanCorrect = correctAnswer.toLowerCase().replace(/[，。！？、]/g, '').replace(/^[vna]\.\s*/g, '').replace(/\s*[vna]\.\s*/g, ' ');
        const cleanUser = userAnswer.toLowerCase().replace(/[，。！？、]/g, '');
        
        const userSegments = cleanUser.split('').filter(c => c.trim());
        const correctSegments = cleanCorrect.split('').filter(c => c.trim());
        
        let matchedCount = 0;
        const tempCorrect = [...correctSegments];
        
        userSegments.forEach(char => {
            const index = tempCorrect.indexOf(char);
            if (index !== -1) {
                matchedCount++;
                tempCorrect.splice(index, 1);
            }
        });
        
        const maxLen = Math.max(userSegments.length, correctSegments.length);
        const accuracy = maxLen > 0 ? Math.round((matchedCount / maxLen) * 100) : 0;
        
        let result, color;
        if (accuracy >= 70) {
            result = `🎉 回答正确！匹配度：${accuracy}%`;
            color = '#28a745';
        } else if (accuracy >= 50) {
            result = `👍 回答基本正确！匹配度：${accuracy}%`;
            color = '#ffc107';
        } else {
            result = `💡 继续努力！正确答案：${correctAnswer}`;
            color = '#dc3545';
        }
        
        analysisDiv.innerHTML = `<div style="color: ${color}; font-weight: bold; margin-top: 10px;">${result}</div>`;
    },

    closeDetailModal: function() {
        const modal = document.querySelector('.word-detail-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
    },

    markWord: function(word, status) {
        storage.updateWordStatus(word, status, new Date().toDateString());
        this.displayWords();
    },

    showSettingsModal: function() {
        const modal = document.createElement('div');
        modal.className = 'settings-modal active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="vocabularyModule.closeSettingsModal()"></div>
            <div class="modal-content-settings">
                <div class="settings-header">
                    <h3>设置</h3>
                    <button class="close-btn" onclick="vocabularyModule.closeSettingsModal()">&times;</button>
                </div>
                
                <div class="settings-section">
                    <h4>单词列表记忆顺序</h4>
                    <div class="radio-group">
                        <label><input type="radio" name="sortOrder" value="order" ${this.settings.sortOrder === 'order' ? 'checked' : ''}> 顺序</label>
                        <label><input type="radio" name="sortOrder" value="random" ${this.settings.sortOrder === 'random' ? 'checked' : ''}> 乱序</label>
                        <label><input type="radio" name="sortOrder" value="new-first" ${this.settings.sortOrder === 'new-first' ? 'checked' : ''}> 生词优先</label>
                        <label><input type="radio" name="sortOrder" value="review-first" ${this.settings.sortOrder === 'review-first' ? 'checked' : ''}> 复习优先</label>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>单词信息显示</h4>
                    <div class="radio-group">
                        <label><input type="radio" name="displayMode" value="both" ${this.settings.displayMode === 'both' ? 'checked' : ''}> 英文+释义</label>
                        <label><input type="radio" name="displayMode" value="english" ${this.settings.displayMode === 'english' ? 'checked' : ''}> 英文</label>
                        <label><input type="radio" name="displayMode" value="chinese" ${this.settings.displayMode === 'chinese' ? 'checked' : ''}> 释义</label>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>单词熟悉度过滤</h4>
                    <div class="radio-group">
                        <label><input type="radio" name="filterMode" value="all" ${this.settings.filterMode === 'all' ? 'checked' : ''}> 显示全部</label>
                        <label><input type="radio" name="filterMode" value="hide-known" ${this.settings.filterMode === 'hide-known' ? 'checked' : ''}> 隐藏认识词</label>
                        <label><input type="radio" name="filterMode" value="hide-known-familiar" ${this.settings.filterMode === 'hide-known-familiar' ? 'checked' : ''}> 仅生词</label>
                        <label><input type="radio" name="filterMode" value="review-only" ${this.settings.filterMode === 'review-only' ? 'checked' : ''}> 仅需复习</label>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>复习模式</h4>
                    <div class="radio-group">
                        <label><input type="radio" name="reviewMode" value="off" ${!this.settings.reviewMode ? 'checked' : ''}> 关闭（正常学习）</label>
                        <label><input type="radio" name="reviewMode" value="on" ${this.settings.reviewMode ? 'checked' : ''}> 开启（仅显示英文，语音答题）</label>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>语音答题模式</h4>
                    <div class="radio-group">
                        <label><input type="radio" name="speechMode" value="off" ${!this.settings.speechMode ? 'checked' : ''}> 关闭</label>
                        <label><input type="radio" name="speechMode" value="on" ${this.settings.speechMode ? 'checked' : ''}> 开启（复习阶段闭卷答题）</label>
                    </div>
                </div>

                <div class="settings-actions">
                    <button class="reset-btn" onclick="vocabularyModule.resetSchedule()">重设单词记忆学习计划</button>
                    <button class="save-btn" onclick="vocabularyModule.saveSettingsAndClose()">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    closeSettingsModal: function() {
        const modal = document.querySelector('.settings-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
    },

    saveSettingsAndClose: function() {
        const sortOrder = document.querySelector('input[name="sortOrder"]:checked')?.value;
        const displayMode = document.querySelector('input[name="displayMode"]:checked')?.value;
        const filterMode = document.querySelector('input[name="filterMode"]:checked')?.value;
        const reviewMode = document.querySelector('input[name="reviewMode"]:checked')?.value;
        const speechMode = document.querySelector('input[name="speechMode"]:checked')?.value;

        if (sortOrder) this.settings.sortOrder = sortOrder;
        if (displayMode) this.settings.displayMode = displayMode;
        if (filterMode) this.settings.filterMode = filterMode;
        if (reviewMode) this.settings.reviewMode = reviewMode === 'on';
        if (speechMode) this.settings.speechMode = speechMode === 'on';

        this.saveSettings();
        this.closeSettingsModal();
        this.displayWords();
    },

    resetSchedule: function() {
        const confirmReset = confirm('确定要重置单词记忆学习计划吗？所有学习进度将被清除。');
        if (confirmReset) {
            storage.clearAllData();
            storage.init();
            this.displayWords();
            this.closeSettingsModal();
        }
    },

    showScheduleModal: function() {
        const schedule = this.generateSchedule();
        const progress = this.calculateProgress();

        const modal = document.createElement('div');
        modal.className = 'schedule-modal active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="vocabularyModule.closeScheduleModal()"></div>
            <div class="modal-content-schedule">
                <div class="schedule-header">
                    <h3>艾宾浩斯记忆进度计划表</h3>
                    <button class="close-btn" onclick="vocabularyModule.closeScheduleModal()">&times;</button>
                </div>
                
                <div class="schedule-progress">
                    <div class="progress-info">
                        <span>当前进度: ${progress.current}/${progress.total}</span>
                        <span>总进度: ${progress.percentage}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span>今日新词: ${progress.newToday}</span>
                        <span>今日复习: ${progress.reviewToday}</span>
                        <span>今日完成度: ${progress.todayPercentage}%</span>
                    </div>
                </div>

                <div class="schedule-table-container">
                    <table class="schedule-table">
                        <thead>
                            <tr>
                                <th>第n天</th>
                                <th>首记</th>
                                <th>复习1</th>
                                <th>复习2</th>
                                <th>复习3</th>
                                <th>复习4</th>
                                <th>复习5</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${schedule.map((row, index) => `
                                <tr>
                                    <td>${row.day}</td>
                                    ${row.cells.map((cell, idx) => `
                                        <td class="${cell.active ? 'active-cell' : ''}${cell.current ? ' current-cell' : ''}">${cell.text}</td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    closeScheduleModal: function() {
        const modal = document.querySelector('.schedule-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
    },

    generateSchedule: function() {
        const schedule = [];
        const totalDays = 18;
        const wordsPerDay = 20;
        const totalUnits = Math.ceil(englishData.vocabulary.length / wordsPerDay);
        
        for (let day = 1; day <= totalDays; day++) {
            const cells = [];
            const unitNum = day;
            
            cells.push({
                text: unitNum <= totalUnits ? `Unit ${unitNum}` : '-',
                active: unitNum <= totalUnits,
                current: day === this.currentUnit
            });

            const reviewDays = [day + 1, day + 2, day + 4, day + 7, day + 15];
            reviewDays.forEach(reviewDay => {
                if (reviewDay <= totalDays) {
                    cells.push({
                        text: `Unit ${unitNum}`,
                        active: true,
                        current: false
                    });
                } else {
                    cells.push({
                        text: '-',
                        active: false,
                        current: false
                    });
                }
            });

            schedule.push({ day, cells });
        }
        
        return schedule;
    },

    calculateProgress: function() {
        const wordStats = storage.getWordStats();
        const totalWords = englishData.vocabulary.length;
        const knownWords = Object.values(wordStats).filter(s => s.status === 'known').length;
        const today = new Date().toDateString();
        const todayReviewed = Object.values(wordStats).filter(s => s.lastMarkDate === today).length;
        const newToday = Object.values(wordStats).filter(s => s.lastMarkDate === today && s.status === 'known').length;

        return {
            current: knownWords,
            total: totalWords,
            percentage: Math.round((knownWords / totalWords) * 100),
            newToday: newToday,
            reviewToday: todayReviewed - newToday,
            todayPercentage: totalWords > 0 ? Math.round((todayReviewed / totalWords) * 100) : 0
        };
    }
};