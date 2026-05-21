const app = {
    init: function() {
        storage.init();
        this.bindNavigationEvents();
        this.bindDataEvents();
        this.bindModalEvents();
        
        vocabularyModule.init();
    },

    bindNavigationEvents: function() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.module-section');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetSection = btn.id.replace('Btn', 'Section');
                
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetSection) {
                        section.classList.add('active');
                    }
                });
                
                this.loadModule(targetSection);
            });
        });
    },

    loadModule: function(sectionId) {
        switch(sectionId) {
            case 'vocabSection':
                if (!vocabularyModule.container.innerHTML) {
                    vocabularyModule.init();
                }
                break;
            case 'grammarSection':
                grammarModule.init();
                break;
            case 'clozeSection':
                clozeModule.init();
                break;
            case 'readingSection':
                readingModule.init();
                break;
            case 'writingSection':
                writingModule.init();
                break;
            case 'examSection':
                examModule.init();
                break;
        }
    },

    bindDataEvents: function() {
        document.getElementById('exportBtn').addEventListener('click', () => {
            storage.exportData();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        if (storage.importData(data)) {
                            alert('数据导入成功！');
                            this.refreshModules();
                        } else {
                            alert('数据导入失败！');
                        }
                    } catch (error) {
                        alert('无效的文件格式！');
                    }
                };
                reader.readAsText(file);
            }
        });
    },

    bindModalEvents: function() {
        const modals = document.querySelectorAll('.modal');
        const closeBtns = document.querySelectorAll('.close');

        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modals.forEach(modal => modal.classList.remove('show'));
            });
        });

        window.addEventListener('click', (e) => {
            modals.forEach(modal => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
    },

    refreshModules: function() {
        if (document.getElementById('vocabSection').classList.contains('active')) {
            vocabularyModule.displayWords();
        }
        if (document.getElementById('grammarSection').classList.contains('active')) {
            grammarModule.displayQuestion();
        }
        if (document.getElementById('clozeSection').classList.contains('active')) {
            clozeModule.displayQuestion();
        }
        if (document.getElementById('readingSection').classList.contains('active')) {
            readingModule.displayPassage();
        }
        if (document.getElementById('writingSection').classList.contains('active')) {
            writingModule.displayPrompt();
        }
        if (document.getElementById('examSection').classList.contains('active')) {
            examModule.displayExamList();
        }
    },

    showModal: function(modalId, title, content) {
        const modal = document.getElementById(modalId);
        document.getElementById(modalId.replace('Modal', 'ModalTitle')).textContent = title;
        document.getElementById(modalId.replace('Modal', 'ModalBody')).innerHTML = content;
        modal.classList.add('show');
    },

    hideModal: function(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});