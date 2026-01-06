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
    
    async init() {
        this.setupEventListeners();
        
        // 确保 DOM 完全加载后再显示 loading
        await this.waitForDOMReady();
        
        // 显示初始加载状态
        this.showLoading();
        
        // 强制浏览器重排，确保 loading 元素可见
        this.forceReflow();
        
        // 使用 requestAnimationFrame 确保 UI 更新后再执行生成
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resolve();
                });
            });
        });
        
        // 异步生成谜题
        await this.generatePuzzleAsync();
        this.render();
        this.updateAnswerButton();
        
        // 隐藏加载状态
        this.hideLoading();
    }
    
    // 等待 DOM 完全准备好
    waitForDOMReady() {
        return new Promise(resolve => {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                // DOM 已经准备好，但再等一个事件循环确保所有元素都已渲染
                setTimeout(resolve, 0);
            } else {
                window.addEventListener('load', () => {
                    setTimeout(resolve, 0);
                });
            }
        });
    }
    
    // 强制浏览器重排，确保样式应用
    forceReflow() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            // 触发重排
            void loadingOverlay.offsetHeight;
            // 强制应用样式
            loadingOverlay.style.display = 'flex';
            void loadingOverlay.offsetHeight;
        }
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
            
            // 生成随机图案（填充率 50% ~ 60%）
            const fillRate = 0.50 + Math.random() * 0.10; // 50% ~ 60%
            
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

            // 行和列都不能全空
            if (!this.hasNoEmptyLinesOrCols()) {
                attempts++;
                continue;
            }
            
            // 行和列都不能全满
            if (!this.hasNoFullLinesOrCols()) {
                attempts++;
                continue;
            }
            
            // 验证唯一解和逻辑可解性
            if (this.hasUniqueSolution() && this.isLogicallySolvable()) {
                // 验证通过，使用这个谜题
                return;
            }
            
            attempts++;
        }
        
        // 如果多次尝试都失败，使用最后一次生成的谜题（即使可能不是唯一解）
        console.warn('无法生成唯一解谜题，使用当前生成的谜题');
    }
    
    // 异步版本的生成函数，避免阻塞UI
    async generatePuzzleAsync() {
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

            // 行和列都不能全空
            if (!this.hasNoEmptyLinesOrCols()) {
                attempts++;
                // 每5次尝试让出控制权，避免阻塞UI
                if (attempts % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
                continue;
            }
            
            // 行和列都不能全满
            if (!this.hasNoFullLinesOrCols()) {
                attempts++;
                // 每5次尝试让出控制权，避免阻塞UI
                if (attempts % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
                continue;
            }
            
            // 验证唯一解和逻辑可解性（这些操作可能耗时）
            // 在验证前让出控制权，确保UI能更新
            await new Promise(resolve => setTimeout(resolve, 0));
            
            if (this.hasUniqueSolution() && this.isLogicallySolvable()) {
                // 验证通过，使用这个谜题
                return;
            }
            
            attempts++;
            
            // 每5次尝试让出控制权，避免阻塞UI
            if (attempts % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
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

    // 检查是否不存在整行或整列全空（提示为 [0]）
    hasNoEmptyLinesOrCols() {
        // 检查行
        for (let i = 0; i < this.size; i++) {
            const hints = this.rowHints[i];
            if (hints.length === 1 && hints[0] === 0) {
                return false;
            }
        }

        // 检查列
        for (let j = 0; j < this.size; j++) {
            const hints = this.colHints[j];
            if (hints.length === 1 && hints[0] === 0) {
                return false;
            }
        }

        return true;
    }
    
    // 检查是否存在整行或整列全满（提示数字总和等于网格宽度）
    hasNoFullLinesOrCols() {
        // 检查行
        for (let i = 0; i < this.size; i++) {
            const hints = this.rowHints[i];
            if (hints.length > 0 && hints[0] !== 0) {
                const sum = hints.reduce((a, b) => a + b, 0);
                // 如果提示总和等于网格宽度，说明该行全满
                if (sum === this.size) {
                    return false;
                }
            }
        }

        // 检查列
        for (let j = 0; j < this.size; j++) {
            const hints = this.colHints[j];
            if (hints.length > 0 && hints[0] !== 0) {
                const sum = hints.reduce((a, b) => a + b, 0);
                // 如果提示总和等于网格宽度，说明该列全满
                if (sum === this.size) {
                    return false;
                }
            }
        }

        return true;
    }
    
    // 使用优化的唯一性检测：先逻辑求解，后有限递归
    hasUniqueSolution() {
        // 阶段一：快速逻辑求解
        const logicalGrid = [];
        for (let i = 0; i < this.size; i++) {
            logicalGrid[i] = [];
            for (let j = 0; j < this.size; j++) {
                logicalGrid[i][j] = -1; // -1: 未知, 0: 空白, 1: 填充
            }
        }
        
        const logicalResult = this.logicalSolve(logicalGrid);
        
        // 结果 A：如果棋盘被填满 -> 谜题有效且适合人类
        if (logicalResult.solved) {
            // 验证求解结果是否正确
            return this.validateLogicalSolution(logicalGrid);
        }
        
        // 结果 B：如果出现冲突 -> 无解，丢弃
        if (this.hasConflict(logicalGrid)) {
            return false;
        }
        
        // 结果 C：如果有剩余空格（卡住了） -> 进入阶段二：有限递归
        return this.checkUniquenessWithLimitedRecursion(logicalGrid);
    }
    
    // 检查网格是否有冲突
    hasConflict(grid) {
        // 检查所有行
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                row.push(grid[i][j]);
            }
            if (!this.isLineValid(row, this.rowHints[i])) {
                return true;
            }
        }
        
        // 检查所有列
        for (let j = 0; j < this.size; j++) {
            const col = [];
            for (let i = 0; i < this.size; i++) {
                col.push(grid[i][j]);
            }
            if (!this.isLineValid(col, this.colHints[j])) {
                return true;
            }
        }
        
        return false;
    }
    
    // 检查一行/列的部分解是否有效
    isLineValid(line, hints) {
        const currentHints = [];
        let count = 0;
        let hasUncertainty = false;
        
        for (let i = 0; i < line.length; i++) {
            if (line[i] === 1) {
                count++;
            } else if (line[i] === 0) {
                if (count > 0) {
                    currentHints.push(count);
                    count = 0;
                }
            } else {
                // 遇到未知格子
                hasUncertainty = true;
                if (count > 0) {
                    // 当前块可能未完成
                    break;
                }
            }
        }
        
        if (count > 0 && !hasUncertainty) {
            currentHints.push(count);
        }
        
        // 检查当前提示是否是目标提示的前缀
        if (currentHints.length > hints.length) {
            return false;
        }
        
        for (let i = 0; i < currentHints.length; i++) {
            if (i === currentHints.length - 1 && hasUncertainty) {
                // 最后一个提示可以小于等于目标（因为可能未完成）
                if (currentHints[i] > hints[i]) {
                    return false;
                }
            } else {
                // 前面的提示必须完全匹配
                if (currentHints[i] !== hints[i]) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // 阶段二：有限递归检查唯一性
    checkUniquenessWithLimitedRecursion(grid) {
        // 找到第一个未知格子
        let unknownRow = -1;
        let unknownCol = -1;
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (grid[i][j] === -1) {
                    unknownRow = i;
                    unknownCol = j;
                    break;
                }
            }
            if (unknownRow !== -1) break;
        }
        
        // 如果没有未知格子，验证解
        if (unknownRow === -1) {
            return this.validateLogicalSolution(grid);
        }
        
        // 限制递归深度，避免性能问题
        const maxDepth = Math.min(10, this.size * this.size / 10);
        return this.limitedRecursiveCheck(grid, unknownRow, unknownCol, 0, maxDepth);
    }
    
    // 有限递归检查
    limitedRecursiveCheck(grid, row, col, depth, maxDepth) {
        if (depth >= maxDepth) {
            // 达到最大深度，假设有唯一解（保守策略）
            return true;
        }
        
        // 分支1：假设该格为"黑"
        const grid1 = grid.map(r => [...r]);
        grid1[row][col] = 1;
        
        // 运行逻辑求解器
        const result1 = this.logicalSolve(grid1);
        let solution1 = null;
        
        if (result1.solved) {
            if (this.validateLogicalSolution(grid1)) {
                solution1 = grid1.map(r => [...r]);
            } else {
                solution1 = 'invalid';
            }
        } else if (this.hasConflict(grid1)) {
            solution1 = 'invalid';
        } else {
            // 继续递归
            const nextUnknown = this.findNextUnknown(grid1);
            if (nextUnknown) {
                const recursiveResult = this.limitedRecursiveCheck(grid1, nextUnknown.row, nextUnknown.col, depth + 1, maxDepth);
                if (recursiveResult === true) {
                    solution1 = grid1.map(r => [...r]);
                } else if (recursiveResult === false) {
                    solution1 = 'invalid';
                } else {
                    solution1 = recursiveResult;
                }
            }
        }
        
        // 分支2：假设该格为"白"
        const grid2 = grid.map(r => [...r]);
        grid2[row][col] = 0;
        
        // 运行逻辑求解器
        const result2 = this.logicalSolve(grid2);
        let solution2 = null;
        
        if (result2.solved) {
            if (this.validateLogicalSolution(grid2)) {
                solution2 = grid2.map(r => [...r]);
            } else {
                solution2 = 'invalid';
            }
        } else if (this.hasConflict(grid2)) {
            solution2 = 'invalid';
        } else {
            // 继续递归
            const nextUnknown = this.findNextUnknown(grid2);
            if (nextUnknown) {
                const recursiveResult = this.limitedRecursiveCheck(grid2, nextUnknown.row, nextUnknown.col, depth + 1, maxDepth);
                if (recursiveResult === true) {
                    solution2 = grid2.map(r => [...r]);
                } else if (recursiveResult === false) {
                    solution2 = 'invalid';
                } else {
                    solution2 = recursiveResult;
                }
            }
        }
        
        // 判定结果
        if (solution1 === 'invalid' && solution2 === 'invalid') {
            return false; // 两个分支都无解 -> 原题无解
        }
        
        if (solution1 === 'invalid') {
            // 分支1无解，分支2有解 -> 该格确定为白
            return true; // 继续求解
        }
        
        if (solution2 === 'invalid') {
            // 分支2无解，分支1有解 -> 该格确定为黑
            return true; // 继续求解
        }
        
        if (solution1 !== null && solution2 !== null && solution1 !== 'invalid' && solution2 !== 'invalid') {
            // 两个分支都有解，检查是否相同
            if (this.solutionsEqual(solution1, solution2)) {
                return true; // 唯一解
            } else {
                return false; // 多重解（无效谜题）
            }
        }
        
        return true; // 保守策略：假设有唯一解
    }
    
    // 找到下一个未知格子
    findNextUnknown(grid) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (grid[i][j] === -1) {
                    return { row: i, col: j };
                }
            }
        }
        return null;
    }
    
    // 比较两个解是否相同
    solutionsEqual(solution1, solution2) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (solution1[i][j] !== solution2[i][j]) {
                    return false;
                }
            }
        }
        return true;
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
    
    // ========== 逻辑可解性验证算法 ==========
    
    // 检查谜题是否可以通过逻辑推理解决（无需猜测）
    isLogicallySolvable() {
        // 创建逻辑求解网格：-1: 未知, 0: 确定为白, 1: 确定为黑
        const logicalGrid = [];
        for (let i = 0; i < this.size; i++) {
            logicalGrid[i] = [];
            for (let j = 0; j < this.size; j++) {
                logicalGrid[i][j] = -1; // 初始化为未知
            }
        }
        
        // 执行逻辑求解
        const result = this.logicalSolve(logicalGrid);
        
        // 检查是否完全求解（没有未知格子）
        if (result.solved) {
            // 验证求解结果是否正确
            return this.validateLogicalSolution(logicalGrid);
        }
        
        return false;
    }
    
    // 全局迭代传播算法
    logicalSolve(grid) {
        const queue = new Set(); // 待检查的行/列队列
        const maxIterations = 100; // 最大迭代次数，防止无限循环
        let iterations = 0;
        let hasProgress = true;
        
        // 初始化：将所有行和列加入队列
        for (let i = 0; i < this.size; i++) {
            queue.add(`row_${i}`);
            queue.add(`col_${i}`);
        }
        
        while (queue.size > 0 && hasProgress && iterations < maxIterations) {
            iterations++;
            hasProgress = false;
            const currentQueue = Array.from(queue);
            queue.clear();
            
            for (const item of currentQueue) {
                const [type, index] = item.split('_');
                const idx = parseInt(index);
                
                let changed = false;
                if (type === 'row') {
                    changed = this.solveLine(this.rowHints[idx], this.size, grid[idx], idx, 'row', grid);
                } else {
                    // 提取列数据
                    const colData = [];
                    for (let i = 0; i < this.size; i++) {
                        colData.push(grid[i][idx]);
                    }
                    const newColData = [...colData];
                    changed = this.solveLine(this.colHints[idx], this.size, newColData, idx, 'col', grid);
                    // 将结果写回网格
                    if (changed) {
                        for (let i = 0; i < this.size; i++) {
                            if (newColData[i] !== -1 && grid[i][idx] === -1) {
                                grid[i][idx] = newColData[i];
                            }
                        }
                    }
                }
                
                if (changed) {
                    hasProgress = true;
                    // 将受影响的行/列加入队列
                    if (type === 'row') {
                        for (let j = 0; j < this.size; j++) {
                            if (grid[idx][j] !== -1) {
                                queue.add(`col_${j}`);
                            }
                        }
                    } else {
                        for (let i = 0; i < this.size; i++) {
                            if (grid[i][idx] !== -1) {
                                queue.add(`row_${i}`);
                            }
                        }
                    }
                }
            }
        }
        
        // 检查是否完全求解
        let solved = true;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (grid[i][j] === -1) {
                    solved = false;
                    break;
                }
            }
            if (!solved) break;
        }
        
        return { solved, grid };
    }
    
    // 单行/列的逻辑求解（取交集）
    solveLine(hints, width, currentState, lineIndex, type, fullGrid) {
        // 如果提示为空或只有0，该行/列全为空白
        if (hints.length === 0 || (hints.length === 1 && hints[0] === 0)) {
            let changed = false;
            for (let i = 0; i < width; i++) {
                if (currentState[i] === -1) {
                    currentState[i] = 0;
                    changed = true;
                }
            }
            return changed;
        }
        
        // 使用左右边界法（Left-Right Overlap）快速求解
        const result = this.solveLineWithOverlap(hints, width, currentState);
        
        if (result === null) {
            // 无解，返回false（表示冲突）
            return false;
        }
        
        // 应用结果到当前状态
        let changed = false;
        for (let i = 0; i < width; i++) {
            if (result[i] !== -1 && currentState[i] === -1) {
                currentState[i] = result[i];
                changed = true;
            }
        }
        
        // 如果是行，更新完整网格
        if (type === 'row' && changed) {
            for (let j = 0; j < width; j++) {
                if (currentState[j] !== -1) {
                    fullGrid[lineIndex][j] = currentState[j];
                }
            }
        }
        
        return changed;
    }
    
    // 左右边界法（Left-Right Overlap）- 快速逻辑求解
    solveLineWithOverlap(hints, width, currentState) {
        // 计算左边界（Left Bound）：将所有数字块尽可能靠左放置
        const leftBounds = this.calculateLeftBounds(hints, width, currentState);
        if (leftBounds === null) return null;
        
        // 计算右边界（Right Bound）：将所有数字块尽可能靠右放置
        const rightBounds = this.calculateRightBounds(hints, width, currentState);
        if (rightBounds === null) return null;
        
        // 初始化结果数组
        const result = new Array(width).fill(-1);
        
        // 计算重叠区间，确定哪些位置必然是黑色
        for (let i = 0; i < hints.length; i++) {
            const hintLen = hints[i];
            const leftStart = leftBounds[i];
            const rightStart = rightBounds[i];
            
            // 重叠区间：[rightStart, leftStart + hintLen - 1]
            // 只有当 rightStart < leftStart + hintLen 时才有重叠
            if (rightStart < leftStart + hintLen) {
                const overlapStart = rightStart;
                const overlapEnd = leftStart + hintLen - 1;
                
                // 重叠区域必然是黑色
                for (let pos = overlapStart; pos <= overlapEnd; pos++) {
                    if (pos >= 0 && pos < width) {
                        // 检查是否与已知状态冲突
                        if (currentState[pos] === 0) {
                            return null; // 冲突，无解
                        }
                        result[pos] = 1;
                    }
                }
            }
        }
        
        // 确定空白位置：在已知黑色块之间的空白区域
        // 以及左右边界之外的区域
        for (let i = 0; i < width; i++) {
            if (result[i] === -1) {
                // 检查这个位置是否在所有可能的黑色块范围之外
                let canBeBlack = false;
                for (let j = 0; j < hints.length; j++) {
                    const hintLen = hints[j];
                    const leftStart = leftBounds[j];
                    const rightStart = rightBounds[j];
                    if (i >= leftStart && i < leftStart + hintLen) {
                        canBeBlack = true;
                        break;
                    }
                    if (i >= rightStart && i < rightStart + hintLen) {
                        canBeBlack = true;
                        break;
                    }
                }
                
                // 如果这个位置不可能在任何黑色块中，且已知状态不是黑色，则确定为白色
                if (!canBeBlack && currentState[i] !== 1) {
                    result[i] = 0;
                }
            }
        }
        
        return result;
    }
    
    // 计算左边界：将所有数字块尽可能靠左放置
    calculateLeftBounds(hints, width, currentState) {
        const bounds = [];
        let currentPos = 0;
        
        for (let i = 0; i < hints.length; i++) {
            const hintLen = hints[i];
            
            // 跳过当前位置之前的已知白色格子
            while (currentPos < width && currentState[currentPos] === 0) {
                currentPos++;
            }
            
            // 检查是否可以放置
            if (currentPos + hintLen > width) {
                return null; // 无法放置，无解
            }
            
            // 检查放置位置是否与已知状态冲突
            let canPlace = true;
            for (let j = currentPos; j < currentPos + hintLen; j++) {
                if (currentState[j] === 0) {
                    canPlace = false;
                    // 移动到冲突位置之后
                    currentPos = j + 1;
                    break;
                }
            }
            
            if (!canPlace) {
                // 重新尝试从新位置开始
                i--; // 回退，重新尝试当前提示
                continue;
            }
            
            bounds.push(currentPos);
            currentPos += hintLen;
            
            // 如果后面还有提示，需要至少一个空白分隔
            if (i < hints.length - 1) {
                if (currentPos >= width) {
                    return null; // 没有足够空间
                }
                currentPos++; // 跳过分隔空白
            }
        }
        
        return bounds;
    }
    
    // 计算右边界：将所有数字块尽可能靠右放置
    calculateRightBounds(hints, width, currentState) {
        const bounds = [];
        let currentPos = width - 1;
        
        // 从右到左处理
        for (let i = hints.length - 1; i >= 0; i--) {
            const hintLen = hints[i];
            
            // 跳过当前位置之后的已知白色格子
            while (currentPos >= 0 && currentState[currentPos] === 0) {
                currentPos--;
            }
            
            // 检查是否可以放置
            if (currentPos - hintLen + 1 < 0) {
                return null; // 无法放置，无解
            }
            
            const startPos = currentPos - hintLen + 1;
            
            // 检查放置位置是否与已知状态冲突
            let canPlace = true;
            for (let j = startPos; j <= currentPos; j++) {
                if (currentState[j] === 0) {
                    canPlace = false;
                    // 移动到冲突位置之前
                    currentPos = j - 1;
                    break;
                }
            }
            
            if (!canPlace) {
                // 重新尝试从新位置开始
                i++; // 回退，重新尝试当前提示
                continue;
            }
            
            bounds.unshift(startPos); // 从前面插入，保持顺序
            currentPos = startPos - 1;
            
            // 如果前面还有提示，需要至少一个空白分隔
            if (i > 0) {
                if (currentPos < 0) {
                    return null; // 没有足够空间
                }
                currentPos--; // 跳过分隔空白
            }
        }
        
        return bounds;
    }
    
    // 生成所有符合提示的排列组合
    generateAllCombinations(hints, width, currentState) {
        const combinations = [];
        
        // 递归生成所有可能的排列
        const generate = (hintIndex, startPos, currentCombination) => {
            if (hintIndex >= hints.length) {
                // 所有提示都已放置，检查剩余位置是否都是空白
                const combination = [...currentCombination];
                for (let i = startPos; i < width; i++) {
                    combination[i] = 0;
                }
                
                // 检查是否符合当前已知状态
                if (this.isCompatible(combination, currentState)) {
                    combinations.push(combination);
                }
                return;
            }
            
            const hintValue = hints[hintIndex];
            const remainingHints = hints.slice(hintIndex + 1);
            // 计算剩余提示所需的最小空间：所有提示值的和 + 分隔空白的数量
            const minSpaceNeeded = remainingHints.length > 0 
                ? remainingHints.reduce((sum, h) => sum + h, 0) + (remainingHints.length - 1)
                : 0;
            const maxStart = width - hintValue - minSpaceNeeded;
            
            // 尝试在当前提示的所有可能位置放置
            for (let pos = startPos; pos <= maxStart; pos++) {
                // 检查是否可以在这个位置放置
                let canPlace = true;
                const newCombination = [...currentCombination];
                
                // 检查放置位置之前是否有足够的空白
                for (let i = startPos; i < pos; i++) {
                    if (currentState[i] === 1) {
                        canPlace = false;
                        break;
                    }
                }
                
                if (!canPlace) continue;
                
                // 放置当前提示的连续块
                for (let i = pos; i < pos + hintValue; i++) {
                    if (currentState[i] === 0) {
                        canPlace = false;
                        break;
                    }
                    newCombination[i] = 1;
                }
                
                if (!canPlace) continue;
                
                // 如果后面还有提示，需要至少一个空白分隔
                if (hintIndex < hints.length - 1) {
                    if (pos + hintValue < width) {
                        newCombination[pos + hintValue] = 0;
                    }
                }
                
                // 递归处理下一个提示
                generate(hintIndex + 1, pos + hintValue + 1, newCombination);
            }
        };
        
        // 初始化组合数组
        const initialCombination = new Array(width).fill(-1);
        generate(0, 0, initialCombination);
        
        return combinations;
    }
    
    // 检查组合是否与当前已知状态兼容
    isCompatible(combination, currentState) {
        for (let i = 0; i < combination.length; i++) {
            if (currentState[i] !== -1 && combination[i] !== currentState[i]) {
                return false;
            }
        }
        return true;
    }
    
    // 取所有组合的交集
    getIntersection(combinations, width) {
        if (combinations.length === 0) {
            return new Array(width).fill(-1);
        }
        
        const intersection = new Array(width).fill(-1);
        
        // 对于每个位置，检查所有组合的值
        for (let i = 0; i < width; i++) {
            let allBlack = true;
            let allWhite = true;
            
            for (const combination of combinations) {
                if (combination[i] === 1) {
                    allWhite = false;
                } else {
                    allBlack = false;
                }
            }
            
            if (allBlack) {
                intersection[i] = 1; // 所有组合都是黑色
            } else if (allWhite) {
                intersection[i] = 0; // 所有组合都是白色
            } else {
                intersection[i] = -1; // 不确定
            }
        }
        
        return intersection;
    }
    
    // 验证逻辑求解结果是否正确
    validateLogicalSolution(logicalGrid) {
        // 检查逻辑求解结果是否与正确答案匹配
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const logicalValue = logicalGrid[i][j];
                const solutionValue = this.solution[i][j];
                
                if (logicalValue !== solutionValue) {
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
    
    async newGame() {
        this.showAnswer = false; // 新游戏时关闭答案显示
        
        // 显示加载状态
        this.showLoading();
        
        // 强制重排，确保 loading 可见
        this.forceReflow();
        
        // 使用 requestAnimationFrame 确保 UI 更新后再执行生成
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resolve();
                });
            });
        });
        
        // 异步生成谜题
        await this.generatePuzzleAsync();
        this.render();
        this.updateAnswerButton();
        
        // 隐藏加载状态
        this.hideLoading();
    }
    
    // 显示加载状态
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            // 先确保元素可见
            loadingOverlay.style.display = 'flex';
            // 强制重排
            void loadingOverlay.offsetHeight;
            // 添加 show 类触发动画
            loadingOverlay.classList.add('show');
            // 再次强制重排确保动画开始
            void loadingOverlay.offsetHeight;
        } else {
            console.warn('Loading overlay element not found');
        }
    }
    
    // 隐藏加载状态
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
            // 延迟移除 display，确保动画完成
            setTimeout(() => {
                if (!loadingOverlay.classList.contains('show')) {
                    loadingOverlay.style.display = 'none';
                }
            }, 300);
        }
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

// 初始化游戏 - 兼容多种加载方式，确保在 GitHub Pages 上正常工作
(function() {
    function initGame() {
        // 确保所有必要的元素都存在
        const requiredElements = ['loadingOverlay', 'grid', 'rowHints', 'colHints'];
        const allElementsExist = requiredElements.every(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Required element #${id} not found`);
                return false;
            }
            return true;
        });
        
        if (allElementsExist) {
            try {
                new NonogramGame();
            } catch (error) {
                console.error('Failed to initialize game:', error);
            }
        } else {
            // 如果元素还没准备好，等待一下再试
            setTimeout(initGame, 100);
        }
    }
    
    // 兼容多种 DOM 就绪状态
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        // DOM 已经加载完成
        if (document.readyState === 'complete') {
            initGame();
        } else {
            window.addEventListener('load', initGame);
        }
    }
})();

