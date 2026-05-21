const STORAGE_KEYS = {
    USER_DATA: 'english_learning_user_data',
    WORD_STATS: 'english_learning_word_stats',
    GRAMMAR_STATS: 'english_learning_grammar_stats',
    EXAM_HISTORY: 'english_learning_exam_history'
};

const storage = {
    init: function() {
        if (!this.getUserData()) {
            this.setUserData(this.getDefaultUserData());
        }
        if (!this.getWordStats()) {
            this.setWordStats(this.getDefaultWordStats());
        }
    },

    getDefaultUserData: function() {
        return {
            name: '',
            studyDays: 0,
            totalWordsLearned: 0,
            totalGrammarQuestions: 0,
            correctAnswers: 0
        };
    },

    getDefaultWordStats: function() {
        const stats = {};
        englishData.vocabulary.forEach(word => {
            stats[word.word] = {
                status: 'unknown',
                familiarity: 0,
                lastReviewed: null
            };
        });
        return stats;
    },

    getUserData: function() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading user data:', e);
            return null;
        }
    },

    setUserData: function(data) {
        try {
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving user data:', e);
            return false;
        }
    },

    getWordStats: function() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.WORD_STATS);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading word stats:', e);
            return null;
        }
    },

    setWordStats: function(data) {
        try {
            localStorage.setItem(STORAGE_KEYS.WORD_STATS, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving word stats:', e);
            return false;
        }
    },

    getGrammarStats: function() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.GRAMMAR_STATS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error reading grammar stats:', e);
            return {};
        }
    },

    setGrammarStats: function(data) {
        try {
            localStorage.setItem(STORAGE_KEYS.GRAMMAR_STATS, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving grammar stats:', e);
            return false;
        }
    },

    getExamHistory: function() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.EXAM_HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading exam history:', e);
            return [];
        }
    },

    setExamHistory: function(data) {
        try {
            localStorage.setItem(STORAGE_KEYS.EXAM_HISTORY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving exam history:', e);
            return false;
        }
    },

    updateWordStatus: function(word, status, lastMarkDate) {
        const stats = this.getWordStats();
        if (stats && stats[word]) {
            stats[word].status = status;
            stats[word].familiarity = status === 'known' ? 100 : status === 'familiar' ? 50 : 0;
            stats[word].lastReviewed = new Date().toISOString();
            if (lastMarkDate) {
                stats[word].lastMarkDate = lastMarkDate;
            }
            this.setWordStats(stats);
            
            const userData = this.getUserData();
            if (status === 'known') {
                userData.totalWordsLearned++;
            }
            this.setUserData(userData);
        }
    },

    updateGrammarStats: function(questionId, correct) {
        const stats = this.getGrammarStats();
        if (!stats[questionId]) {
            stats[questionId] = { attempts: 0, correct: 0 };
        }
        stats[questionId].attempts++;
        if (correct) {
            stats[questionId].correct++;
        }
        this.setGrammarStats(stats);

        const userData = this.getUserData();
        userData.totalGrammarQuestions++;
        if (correct) {
            userData.correctAnswers++;
        }
        this.setUserData(userData);
    },

    addExamResult: function(result) {
        const history = this.getExamHistory();
        history.push({
            ...result,
            date: new Date().toISOString()
        });
        this.setExamHistory(history);
    },

    getAllData: function() {
        return {
            userData: this.getUserData(),
            wordStats: this.getWordStats(),
            grammarStats: this.getGrammarStats(),
            examHistory: this.getExamHistory()
        };
    },

    importData: function(data) {
        try {
            if (data.userData) {
                this.setUserData(data.userData);
            }
            if (data.wordStats) {
                this.setWordStats(data.wordStats);
            }
            if (data.grammarStats) {
                this.setGrammarStats(data.grammarStats);
            }
            if (data.examHistory) {
                this.setExamHistory(data.examHistory);
            }
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    },

    exportData: function() {
        const data = this.getAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `english_learning_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    clearAllData: function() {
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.WORD_STATS);
        localStorage.removeItem(STORAGE_KEYS.GRAMMAR_STATS);
        localStorage.removeItem(STORAGE_KEYS.EXAM_HISTORY);
        this.init();
    }
};