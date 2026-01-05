class NonogramGame {
    constructor() {
        this.size = 10;
        this.grid = [];
        this.solution = [];
        this.userGrid = [];
        this.rowHints = [];
        this.colHints = [];
        this.isDrawing = false;
        this.drawMode = null; // 'fill' or 'mark'
        this.showAnswer = false; // 是否显示答案
        this.reasoningMode = false; // 是否在推理模式
        this.savedUserGrid = null; // 保存的原始游戏状态
        this.reasoningGrid = []; // 推理界面的网格
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generatePuzzle();
        this.render();
        this.updateAnswerButton();
    }
    
    setupEventListeners() {
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('checkBtn').addEventListener('click', () => this.checkSolution());
        document.getElementById('reasoningBtn').addEventListener('click', () => this.openReasoningMode());
        document.getElementById('answerBtn').addEventListener('click', () => this.toggleAnswer());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.size = e.target.value === 'easy' ? 5 : e.target.value === 'medium' ? 10 : 15;
            this.newGame();
        });
        
        // 推理界面按钮
        document.getElementById('applyReasoningBtn').addEventListener('click', () => this.applyReasoning());
        document.getElementById('cancelReasoningBtn').addEventListener('click', () => this.closeReasoningMode());
        document.getElementById('clearReasoningBtn').addEventListener('click', () => this.clearReasoning());
    }
    
    generatePuzzle() {
        // 生成一个随机谜题
        this.solution = [];
        this.userGrid = [];
        
        // 生成随机图案（30-40% 的格子被填充）
        const fillRate = 0.35;
        for (let i = 0; i < this.size; i++) {
            this.solution[i] = [];
            this.userGrid[i] = [];
            for (let j = 0; j < this.size; j++) {
                const filled = Math.random() < fillRate;
                this.solution[i][j] = filled ? 1 : 0;
                this.userGrid[i][j] = 0; // 0: 空白, 1: 填充, 2: 标记
            }
        }
        
        // 确保谜题有解（至少有一些填充的格子）
        let hasFilled = false;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.solution[i][j] === 1) {
                    hasFilled = true;
                    break;
                }
            }
            if (hasFilled) break;
        }
        
        if (!hasFilled) {
            // 如果没有任何填充，创建一个简单的图案
            for (let i = 0; i < Math.min(3, this.size); i++) {
                for (let j = 0; j < Math.min(3, this.size); j++) {
                    this.solution[i][j] = 1;
                }
            }
        }
        
        this.calculateHints();
    }
    
    calculateHints() {
        // 计算行提示
        this.rowHints = [];
        for (let i = 0; i < this.size; i++) {
            const hint = [];
            let count = 0;
            for (let j = 0; j < this.size; j++) {
                if (this.solution[i][j] === 1) {
                    count++;
                } else {
                    if (count > 0) {
                        hint.push(count);
                        count = 0;
                    }
                }
            }
            if (count > 0) {
                hint.push(count);
            }
            this.rowHints.push(hint.length > 0 ? hint : [0]);
        }
        
        // 计算列提示
        this.colHints = [];
        for (let j = 0; j < this.size; j++) {
            const hint = [];
            let count = 0;
            for (let i = 0; i < this.size; i++) {
                if (this.solution[i][j] === 1) {
                    count++;
                } else {
                    if (count > 0) {
                        hint.push(count);
                        count = 0;
                    }
                }
            }
            if (count > 0) {
                hint.push(count);
            }
            this.colHints.push(hint.length > 0 ? hint : [0]);
        }
    }
    
    render() {
        this.renderGrid();
        this.renderRowHints();
        this.renderColHints();
    }
    
    renderGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.style.gridTemplateColumns = `repeat(${this.size}, 40px)`;
        gridElement.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // 如果显示答案模式
                if (this.showAnswer) {
                    // 显示正确答案
                    if (this.solution[i][j] === 1) {
                        cell.classList.add('solution-filled');
                    }
                    
                    // 标注错误的地方
                    const userValue = this.userGrid[i][j] === 1 ? 1 : 0;
                    const solutionValue = this.solution[i][j];
                    
                    if (userValue !== solutionValue) {
                        cell.classList.add('error');
                        // 如果用户填充了但应该是空白，显示X标记
                        if (userValue === 1 && solutionValue === 0) {
                            cell.classList.add('error-filled');
                        }
                        // 如果应该是填充但用户没填充，显示缺失标记
                        if (userValue === 0 && solutionValue === 1) {
                            cell.classList.add('error-missing');
                        }
                    }
                } else {
                    // 正常模式：显示用户操作
                    if (this.userGrid[i][j] === 1) {
                        cell.classList.add('filled');
                    } else if (this.userGrid[i][j] === 2) {
                        cell.classList.add('marked');
                    }
                }
                
                // 只有在不显示答案时才允许交互
                if (!this.showAnswer) {
                    // 鼠标事件
                    cell.addEventListener('mousedown', (e) => this.handleMouseDown(e, i, j));
                    cell.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, i, j));
                    cell.addEventListener('mouseup', () => this.handleMouseUp());
                    
                    // 触摸事件（移动设备）
                    cell.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        this.handleMouseDown(e, i, j);
                    });
                    cell.addEventListener('touchmove', (e) => {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (element && element.classList.contains('cell')) {
                            const row = parseInt(element.dataset.row);
                            const col = parseInt(element.dataset.col);
                            this.handleMouseEnter(e, row, col);
                        }
                    });
                    cell.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        this.handleMouseUp();
                    });
                    
                    // 右键点击
                    cell.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        this.toggleCell(i, j, 'mark');
                    });
                } else {
                    // 显示答案模式下，禁用交互
                    cell.style.cursor = 'default';
                }
                
                gridElement.appendChild(cell);
            }
        }
    }
    
    renderRowHints() {
        const rowHintsElement = document.getElementById('rowHints');
        rowHintsElement.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            const hint = document.createElement('div');
            hint.className = 'row-hint';
            // 如果提示是 [0]，显示为空
            const hintArray = this.rowHints[i];
            hint.textContent = (hintArray.length === 1 && hintArray[0] === 0) ? '' : hintArray.join(' ');
            rowHintsElement.appendChild(hint);
        }
    }
    
    renderColHints() {
        const colHintsElement = document.getElementById('colHints');
        colHintsElement.innerHTML = '';
        
        for (let j = 0; j < this.size; j++) {
            const hint = document.createElement('div');
            hint.className = 'col-hint';
            // 如果提示是 [0]，显示为空
            const hintArray = this.colHints[j];
            const hintText = (hintArray.length === 1 && hintArray[0] === 0) ? '' : hintArray.map(num => num.toString()).join('\n');
            hint.textContent = hintText;
            hint.style.whiteSpace = 'pre-line';
            hint.style.textAlign = 'center';
            colHintsElement.appendChild(hint);
        }
    }
    
    handleMouseDown(e, row, col) {
        this.isDrawing = true;
        if (e.button === 2 || e.ctrlKey || e.metaKey) {
            this.drawMode = 'mark';
            this.toggleCell(row, col, 'mark');
        } else {
            this.drawMode = 'fill';
            this.toggleCell(row, col, 'fill');
        }
    }
    
    handleMouseEnter(e, row, col) {
        if (!this.isDrawing) return;
        this.toggleCell(row, col, this.drawMode);
    }
    
    handleMouseUp() {
        this.isDrawing = false;
        this.drawMode = null;
    }
    
    toggleCell(row, col, mode) {
        const currentState = this.userGrid[row][col];
        
        if (mode === 'fill') {
            // 左键：填充/取消填充（切换）
            // 如果当前是标记状态，清除标记并填充
            if (currentState === 1) {
                this.userGrid[row][col] = 0;
            } else if (currentState === 2) {
                // 如果已标记，清除标记并填充
                this.userGrid[row][col] = 1;
            } else {
                this.userGrid[row][col] = 1;
            }
        } else if (mode === 'mark') {
            // 右键：只在空白时添加标记，已标记时保持标记（不消失）
            // 如果当前是填充状态，清除填充并标记
            if (currentState === 0) {
                // 空白状态，添加标记
                this.userGrid[row][col] = 2;
            } else if (currentState === 1) {
                // 如果已填充，清除填充并标记
                this.userGrid[row][col] = 2;
            }
            // 如果已经是标记状态（currentState === 2），保持标记不变
        }
        
        this.updateCellDisplay(row, col);
    }
    
    updateCellDisplay(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        cell.classList.remove('filled', 'marked');
        
        if (this.userGrid[row][col] === 1) {
            cell.classList.add('filled');
        } else if (this.userGrid[row][col] === 2) {
            cell.classList.add('marked');
        }
    }
    
    reset() {
        this.showAnswer = false; // 重置时关闭答案显示
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.userGrid[i][j] = 0;
            }
        }
        this.render();
        this.updateAnswerButton();
    }
    
    checkSolution() {
        let correct = true;
        let allFilled = true;
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const userValue = this.userGrid[i][j] === 1 ? 1 : 0;
                const solutionValue = this.solution[i][j];
                
                if (userValue !== solutionValue) {
                    correct = false;
                }
                
                if (this.userGrid[i][j] === 0 && this.solution[i][j] === 1) {
                    allFilled = false;
                }
            }
        }
        
        if (correct && allFilled) {
            this.showMessage('恭喜！你完成了这个数织谜题！', 'success');
        } else if (correct) {
            this.showMessage('很好！所有填充的格子都是正确的，但还有格子需要填充。', 'success');
        } else {
            this.showMessage('有些格子不正确，请检查你的答案。', 'error');
        }
    }
    
    showMessage(text, type = 'success') {
        const messageElement = document.getElementById('message');
        messageElement.textContent = text;
        messageElement.className = `message ${type} show`;
        
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 3000);
    }
    
    newGame() {
        this.showAnswer = false; // 新游戏时关闭答案显示
        this.generatePuzzle();
        this.render();
        this.updateAnswerButton();
    }
    
    toggleAnswer() {
        this.showAnswer = !this.showAnswer;
        this.render();
        this.updateAnswerButton();
    }
    
    updateAnswerButton() {
        const answerBtn = document.getElementById('answerBtn');
        if (this.showAnswer) {
            answerBtn.textContent = '隐藏答案';
            answerBtn.style.background = '#f44336';
        } else {
            answerBtn.textContent = '答案';
            answerBtn.style.background = '#667eea';
        }
    }
    
    // 打开推理模式
    openReasoningMode() {
        // 保存当前游戏状态
        this.savedUserGrid = [];
        for (let i = 0; i < this.size; i++) {
            this.savedUserGrid[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.savedUserGrid[i][j] = this.userGrid[i][j];
            }
        }
        
        // 初始化推理网格（从当前状态开始）
        this.reasoningGrid = [];
        for (let i = 0; i < this.size; i++) {
            this.reasoningGrid[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.reasoningGrid[i][j] = this.userGrid[i][j];
            }
        }
        
        this.reasoningMode = true;
        this.renderReasoningMode();
        
        // 显示推理界面
        const overlay = document.getElementById('reasoningOverlay');
        overlay.classList.add('show');
    }
    
    // 关闭推理模式
    closeReasoningMode() {
        this.reasoningMode = false;
        const overlay = document.getElementById('reasoningOverlay');
        overlay.classList.remove('show');
    }
    
    // 应用推理结果
    applyReasoning() {
        // 将推理结果应用到主游戏
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.userGrid[i][j] = this.reasoningGrid[i][j];
            }
        }
        
        this.closeReasoningMode();
        this.render();
        this.showMessage('推理结果已应用到主游戏', 'success');
    }
    
    // 清空推理
    clearReasoning() {
        // 恢复到保存的状态
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.reasoningGrid[i][j] = this.savedUserGrid[i][j];
            }
        }
        this.renderReasoningMode();
    }
    
    // 渲染推理模式
    renderReasoningMode() {
        this.renderReasoningGrid();
        this.renderReasoningRowHints();
        this.renderReasoningColHints();
    }
    
    // 渲染推理网格
    renderReasoningGrid() {
        const gridElement = document.getElementById('reasoningGrid');
        gridElement.style.gridTemplateColumns = `repeat(${this.size}, 40px)`;
        gridElement.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'reasoning-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                if (this.reasoningGrid[i][j] === 1) {
                    cell.classList.add('filled');
                } else if (this.reasoningGrid[i][j] === 2) {
                    cell.classList.add('marked');
                }
                
                // 鼠标事件
                cell.addEventListener('mousedown', (e) => this.handleReasoningMouseDown(e, i, j));
                cell.addEventListener('mouseenter', (e) => this.handleReasoningMouseEnter(e, i, j));
                cell.addEventListener('mouseup', () => this.handleReasoningMouseUp());
                
                // 触摸事件
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.handleReasoningMouseDown(e, i, j);
                });
                cell.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (element && element.classList.contains('reasoning-cell')) {
                        const row = parseInt(element.dataset.row);
                        const col = parseInt(element.dataset.col);
                        this.handleReasoningMouseEnter(e, row, col);
                    }
                });
                cell.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.handleReasoningMouseUp();
                });
                
                // 右键点击
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.toggleReasoningCell(i, j, 'mark');
                });
                
                gridElement.appendChild(cell);
            }
        }
    }
    
    // 渲染推理行提示
    renderReasoningRowHints() {
        const rowHintsElement = document.getElementById('reasoningRowHints');
        rowHintsElement.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            const hint = document.createElement('div');
            hint.className = 'reasoning-row-hint';
            const hintArray = this.rowHints[i];
            hint.textContent = (hintArray.length === 1 && hintArray[0] === 0) ? '' : hintArray.join(' ');
            rowHintsElement.appendChild(hint);
        }
    }
    
    // 渲染推理列提示
    renderReasoningColHints() {
        const colHintsElement = document.getElementById('reasoningColHints');
        colHintsElement.innerHTML = '';
        
        for (let j = 0; j < this.size; j++) {
            const hint = document.createElement('div');
            hint.className = 'reasoning-col-hint';
            const hintArray = this.colHints[j];
            const hintText = (hintArray.length === 1 && hintArray[0] === 0) ? '' : hintArray.map(num => num.toString()).join('\n');
            hint.textContent = hintText;
            hint.style.whiteSpace = 'pre-line';
            hint.style.textAlign = 'center';
            colHintsElement.appendChild(hint);
        }
    }
    
    // 推理模式鼠标事件
    handleReasoningMouseDown(e, row, col) {
        this.isDrawing = true;
        if (e.button === 2 || e.ctrlKey || e.metaKey) {
            this.drawMode = 'mark';
            this.toggleReasoningCell(row, col, 'mark');
        } else {
            this.drawMode = 'fill';
            this.toggleReasoningCell(row, col, 'fill');
        }
    }
    
    handleReasoningMouseEnter(e, row, col) {
        if (!this.isDrawing) return;
        this.toggleReasoningCell(row, col, this.drawMode);
    }
    
    handleReasoningMouseUp() {
        this.isDrawing = false;
        this.drawMode = null;
    }
    
    // 切换推理格子
    toggleReasoningCell(row, col, mode) {
        const currentState = this.reasoningGrid[row][col];
        
        if (mode === 'fill') {
            if (currentState === 1) {
                this.reasoningGrid[row][col] = 0;
            } else if (currentState === 2) {
                this.reasoningGrid[row][col] = 1;
            } else {
                this.reasoningGrid[row][col] = 1;
            }
        } else if (mode === 'mark') {
            if (currentState === 0) {
                this.reasoningGrid[row][col] = 2;
            } else if (currentState === 1) {
                this.reasoningGrid[row][col] = 2;
            }
        }
        
        this.updateReasoningCellDisplay(row, col);
    }
    
    // 更新推理格子显示
    updateReasoningCellDisplay(row, col) {
        const cell = document.querySelector(`#reasoningGrid [data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        cell.classList.remove('filled', 'marked');
        
        if (this.reasoningGrid[row][col] === 1) {
            cell.classList.add('filled');
        } else if (this.reasoningGrid[row][col] === 2) {
            cell.classList.add('marked');
        }
    }
}

// 防止右键菜单
document.addEventListener('contextmenu', (e) => {
    if (e.target.classList.contains('cell') || e.target.classList.contains('reasoning-cell')) {
        e.preventDefault();
    }
});

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new NonogramGame();
});

