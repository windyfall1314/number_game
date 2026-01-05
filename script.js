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
        // 生成一个随机谜题，确保有唯一解
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            this.solution = [];
            this.userGrid = [];
            
            // 生成随机图案（填充率 40% ~ 60%）
            const fillRate = 0.40 + Math.random() * 0.20; // 40% ~ 60%
            
            for (let i = 0; i < this.size; i++) {
                this.solution[i] = [];
                this.userGrid[i] = [];
                for (let j = 0; j < this.size; j++) {
                    const filled = Math.random() < fillRate;
                    this.solution[i][j] = filled ? 1 : 0;
                    this.userGrid[i][j] = 0; // 0: 空白, 1: 填充, 2: 标记
                }
            }
            
            // 计算提示
            this.calculateHints();
            
            // 验证唯一解
            if (this.hasUniqueSolution()) {
                // 验证通过，使用这个谜题
                return;
            }
            
            attempts++;
        }
        
        // 如果多次尝试都失败，使用最后一次生成的谜题（即使可能不是唯一解）
        console.warn('无法生成唯一解谜题，使用当前生成的谜题');
    }
    
    // 计算逻辑验证公式：S = Σ(提示数字) + (数字组数 - 1)
    calculateMinWidth(hints) {
        if (hints.length === 0 || (hints.length === 1 && hints[0] === 0)) {
            return 0;
        }
        const sum = hints.reduce((a, b) => a + b, 0);
        const groups = hints.length;
        return sum + (groups - 1);
    }
    
    // 检查行/列是否容易上手（S = 网格宽度）
    isRowEasyToSolve(hints, width) {
        const minWidth = this.calculateMinWidth(hints);
        return minWidth === width;
    }
    
    // 使用回溯搜索验证唯一解
    hasUniqueSolution() {
        // 对于大网格（15x15），使用简化验证（因为完全回溯太慢）
        if (this.size >= 15) {
            // 使用启发式方法：检查是否有多行/列满足 S = 宽度（唯一填法）
            let easyRows = 0;
            let easyCols = 0;
            
            for (let i = 0; i < this.size; i++) {
                if (this.isRowEasyToSolve(this.rowHints[i], this.size)) {
                    easyRows++;
                }
                if (this.isRowEasyToSolve(this.colHints[i], this.size)) {
                    easyCols++;
                }
            }
            
            // 如果有足够多的"容易"行和列，认为可能是唯一解
            return easyRows >= this.size * 0.3 && easyCols >= this.size * 0.3;
        }
        
        // 对于小网格，使用完整的回溯搜索
        const testGrid = [];
        for (let i = 0; i < this.size; i++) {
            testGrid[i] = [];
            for (let j = 0; j < this.size; j++) {
                testGrid[i][j] = -1; // -1: 未确定, 0: 空白, 1: 填充
            }
        }
        
        // 使用回溯搜索找到所有解
        const solutions = [];
        this.backtrackSolve(testGrid, 0, 0, solutions);
        
        // 如果只有一个解，返回 true
        return solutions.length === 1;
    }
    
    // 回溯搜索求解
    backtrackSolve(grid, row, col, solutions) {
        // 如果已经找到多个解，停止搜索
        if (solutions.length > 1) {
            return;
        }
        
        // 如果已经遍历完所有格子
        if (row >= this.size) {
            // 验证解是否正确
            if (this.isValidSolution(grid)) {
                // 保存解（只保存第一个解用于比较）
                if (solutions.length === 0) {
                    const solution = [];
                    for (let i = 0; i < this.size; i++) {
                        solution[i] = [];
                        for (let j = 0; j < this.size; j++) {
                            solution[i][j] = grid[i][j];
                        }
                    }
                    solutions.push(solution);
                } else {
                    // 检查是否与第一个解相同
                    let isDifferent = false;
                    for (let i = 0; i < this.size; i++) {
                        for (let j = 0; j < this.size; j++) {
                            if (grid[i][j] !== solutions[0][i][j]) {
                                isDifferent = true;
                                break;
                            }
                        }
                        if (isDifferent) break;
                    }
                    if (isDifferent) {
                        solutions.push('different'); // 标记有不同解
                    }
                }
            }
            return;
        }
        
        // 计算下一个位置
        let nextRow = row;
        let nextCol = col + 1;
        if (nextCol >= this.size) {
            nextRow = row + 1;
            nextCol = 0;
        }
        
        // 尝试填充
        grid[row][col] = 1;
        if (this.isValidPartialSolution(grid, row, col)) {
            this.backtrackSolve(grid, nextRow, nextCol, solutions);
        }
        
        // 尝试空白
        grid[row][col] = 0;
        if (this.isValidPartialSolution(grid, row, col)) {
            this.backtrackSolve(grid, nextRow, nextCol, solutions);
        }
        
        // 回溯
        grid[row][col] = -1;
    }
    
    // 验证部分解是否有效
    isValidPartialSolution(grid, maxRow, maxCol) {
        // 检查已完成的行
        for (let i = 0; i <= maxRow; i++) {
            const row = [];
            let isComplete = true;
            for (let j = 0; j < this.size; j++) {
                if (grid[i][j] === -1) {
                    isComplete = false;
                    break;
                }
                row.push(grid[i][j]);
            }
            
            if (isComplete) {
                const hints = this.getHintsFromRow(row);
                if (!this.hintsMatch(hints, this.rowHints[i])) {
                    return false;
                }
            } else if (i === maxRow) {
                // 对于当前行，检查部分解是否可能
                const partialHints = this.getPartialHintsFromRow(row, maxCol);
                if (!this.partialHintsMatch(partialHints, this.rowHints[i])) {
                    return false;
                }
            }
        }
        
        // 检查已完成的列
        for (let j = 0; j <= maxCol; j++) {
            const col = [];
            let isComplete = true;
            for (let i = 0; i < this.size; i++) {
                if (grid[i][j] === -1) {
                    isComplete = false;
                    break;
                }
                col.push(grid[i][j]);
            }
            
            if (isComplete) {
                const hints = this.getHintsFromRow(col);
                if (!this.hintsMatch(hints, this.colHints[j])) {
                    return false;
                }
            } else {
                // 对于当前列，检查部分解是否可能
                const partialHints = this.getPartialHintsFromRow(col, maxRow);
                if (!this.partialHintsMatch(partialHints, this.colHints[j])) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // 验证完整解是否正确
    isValidSolution(grid) {
        // 检查所有行
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                row.push(grid[i][j]);
            }
            const hints = this.getHintsFromRow(row);
            if (!this.hintsMatch(hints, this.rowHints[i])) {
                return false;
            }
        }
        
        // 检查所有列
        for (let j = 0; j < this.size; j++) {
            const col = [];
            for (let i = 0; i < this.size; i++) {
                col.push(grid[i][j]);
            }
            const hints = this.getHintsFromRow(col);
            if (!this.hintsMatch(hints, this.colHints[j])) {
                return false;
            }
        }
        
        return true;
    }
    
    // 从行/列获取提示
    getHintsFromRow(row) {
        const hints = [];
        let count = 0;
        for (let i = 0; i < row.length; i++) {
            if (row[i] === 1) {
                count++;
            } else {
                if (count > 0) {
                    hints.push(count);
                    count = 0;
                }
            }
        }
        if (count > 0) {
            hints.push(count);
        }
        return hints.length > 0 ? hints : [0];
    }
    
    // 获取部分提示（用于部分解验证）
    getPartialHintsFromRow(row, maxIndex) {
        const hints = [];
        let count = 0;
        for (let i = 0; i <= maxIndex; i++) {
            if (row[i] === 1) {
                count++;
            } else if (row[i] === 0) {
                if (count > 0) {
                    hints.push(count);
                    count = 0;
                }
            } else {
                // 遇到未确定的格子，停止
                if (count > 0) {
                    hints.push(count);
                }
                break;
            }
        }
        if (count > 0) {
            hints.push(count);
        }
        return hints;
    }
    
    // 检查提示是否匹配
    hintsMatch(hints1, hints2) {
        if (hints1.length !== hints2.length) {
            return false;
        }
        for (let i = 0; i < hints1.length; i++) {
            if (hints1[i] !== hints2[i]) {
                return false;
            }
        }
        return true;
    }
    
    // 检查部分提示是否可能匹配
    partialHintsMatch(partialHints, targetHints) {
        // 部分提示必须是目标提示的前缀
        if (partialHints.length > targetHints.length) {
            return false;
        }
        
        for (let i = 0; i < partialHints.length; i++) {
            if (i === partialHints.length - 1) {
                // 最后一个提示可以小于等于目标（因为可能未完成）
                if (partialHints[i] > targetHints[i]) {
                    return false;
                }
            } else {
                // 前面的提示必须完全匹配
                if (partialHints[i] !== targetHints[i]) {
                    return false;
                }
            }
        }
        
        return true;
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

