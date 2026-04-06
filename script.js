document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('checkbox');
    const convertBtn = document.getElementById('convert-btn');
    const infixInput = document.getElementById('infix-expression');
    const errorMsg = document.getElementById('error-msg');
    const resultSection = document.getElementById('result-section');
    const finalPostfix = document.getElementById('final-postfix');
    const tbody = document.querySelector('#conversion-table tbody');

    // Theme Management
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            themeToggle.checked = true;
        }
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }
    }

    themeToggle.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }    
    });

    // Infix to Postfix Logic
    const precedence = {
        '^': 3,
        '*': 2,
        '/': 2,
        '+': 1,
        '-': 1
    };

    const isOperand = (char) => {
        return /^[a-zA-Z0-9]$/.test(char);
    };

    const isOperator = (char) => {
        return ['+', '-', '*', '/', '^'].includes(char);
    };

    const convertInfixToPostfix = (expression) => {
        // remove all whitespace
        expression = expression.replace(/\s+/g, '');
        
        let stack = [];
        let postfix = "";
        let steps = []; // { symbol, stack, postfix }

        // add initial state
        steps.push({ symbol: "Initial", stack: "Empty", postfix: "" });

        for (let i = 0; i < expression.length; i++) {
            let char = expression[i];

            if (isOperand(char)) {
                postfix += char;
            } 
            else if (char === '(') {
                stack.push(char);
            } 
            else if (char === ')') {
                while (stack.length > 0 && stack[stack.length - 1] !== '(') {
                    postfix += stack.pop();
                }
                if (stack.length > 0 && stack[stack.length - 1] === '(') {
                    stack.pop(); // discard '('
                } else {
                    throw new Error("Mismatched parentheses");
                }
            } 
            else if (isOperator(char)) {
                // Right associative for '^'
                if (char === '^') {
                    while (stack.length > 0 && precedence[stack[stack.length - 1]] > precedence[char]) {
                        postfix += stack.pop();
                    }
                } else {
                    while (stack.length > 0 && precedence[stack[stack.length - 1]] >= precedence[char]) {
                        postfix += stack.pop();
                    }
                }
                stack.push(char);
            } else {
                throw new Error(`Invalid character encountered: ${char}`);
            }

            steps.push({
                symbol: char,
                stack: stack.length > 0 ? stack.join(' ') : "Empty",
                postfix: postfix
            });
        }

        while (stack.length > 0) {
            let topChar = stack.pop();
            if (topChar === '(' || topChar === ')') {
                throw new Error("Mismatched parentheses");
            }
            postfix += topChar;
            steps.push({
                symbol: "Pop remaining",
                stack: stack.length > 0 ? stack.join(' ') : "Empty",
                postfix: postfix
            });
        }

        return { postfix, steps };
    };

    const renderTable = (steps) => {
        tbody.innerHTML = '';
        steps.forEach((step, index) => {
            const tr = document.createElement('tr');
            
            // Add slight stagger to table row animations
            tr.style.animation = `fadeInUp 0.3s ease-out ${index * 0.05}s both`;

            const tdSymbol = document.createElement('td');
            tdSymbol.textContent = step.symbol;
            
            const tdStack = document.createElement('td');
            tdStack.textContent = step.stack;
            
            const tdPostfix = document.createElement('td');
            tdPostfix.textContent = step.postfix;

            tr.appendChild(tdSymbol);
            tr.appendChild(tdStack);
            tr.appendChild(tdPostfix);
            tbody.appendChild(tr);
        });
    };

    const handleConversion = () => {
        const expression = infixInput.value.trim();
        
        if (!expression) {
            showError("Please enter an expression.");
            return;
        }

        try {
            errorMsg.classList.remove('visible');
            
            // Allow animation to re-trigger
            resultSection.classList.remove('hidden');
            resultSection.style.animation = 'none';
            resultSection.offsetHeight; /* trigger reflow */
            resultSection.style.animation = 'fadeInUp 0.6s ease-out both';

            const { postfix, steps } = convertInfixToPostfix(expression);
            
            finalPostfix.textContent = postfix;
            renderTable(steps);
            
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } catch (error) {
            showError(error.message);
            resultSection.classList.add('hidden');
        }
    };

    const showError = (msg) => {
        errorMsg.textContent = msg;
        errorMsg.classList.add('visible');
    };

    convertBtn.addEventListener('click', handleConversion);
    
    infixInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleConversion();
        }
    });

    // Initial focus on input
    infixInput.focus();
});
