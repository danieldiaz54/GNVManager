const fs = require('fs');

let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => {
    input += chunk;
});

process.stdin.on('end', () => {
    try {
        if (!input || !input.trim()) {
            console.log(JSON.stringify({ decision: "allow" }));
            return;
        }

        const payload = JSON.parse(input);
        const cmd = (payload.toolCall && payload.toolCall.args && payload.toolCall.args.CommandLine) || '';
        
        // Bloquear comandos destructivos críticos no autorizados
        const destructivePatterns = [
            /\brm\s+-rf\s+\//i,
            /\brmdir\s+\/s\s+\/q\s+[c-z]:\\/i,
            /\bDROP\s+DATABASE\b/i,
            /\bDROP\s+SCHEMA\b/i,
            /\bTRUNCATE\s+TABLE\b/i,
            /\bformat\s+[c-z]:/i
        ];

        for (const pattern of destructivePatterns) {
            if (pattern.test(cmd)) {
                console.log(JSON.stringify({
                    decision: "deny",
                    reason: `[Safety Gate] Comando destructivo bloqueado preventivamente: ${cmd}`
                }));
                return;
            }
        }

        // Permitir ejecución normal
        console.log(JSON.stringify({
            decision: "allow"
        }));
    } catch (e) {
        // En caso de fallo de parsing, permitir ejecución sin bloquear
        console.log(JSON.stringify({ decision: "allow" }));
    }
});
