class PasswordChecker {
    constructor() {
        this.passwords = JSON.parse(localStorage.getItem('passwords')) || [];
    }


    checkPasswordStrength(password) {
        const checks = {
            length: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumbers: /[0-9]/.test(password),
            hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        const strength = {
            score: 0,
            issues: []
        };

        // Bewertung der Passwortstärke
        if (checks.length) strength.score += 1;
        else strength.issues.push("Passwort ist zu kurz (mindestens 8 Zeichen)");

        if (checks.hasUpperCase) strength.score += 1;
        else strength.issues.push("Keine Großbuchstaben vorhanden");

        if (checks.hasLowerCase) strength.score += 1;
        else strength.issues.push("Keine Kleinbuchstaben vorhanden");

        if (checks.hasNumbers) strength.score += 1;
        else strength.issues.push("Keine Zahlen vorhanden");

        if (checks.hasSpecialChars) strength.score += 1;
        else strength.issues.push("Keine Sonderzeichen vorhanden");

        // Bestimmung der Stärke
        if (strength.score === 5) {
            strength.rating = "Sehr stark";
            strength.color = "#2ecc71"; // Grün
        } else if (strength.score >= 3) {
            strength.rating = "Gut";
            strength.color = "#f1c40f"; // Gelb
        } else {
            strength.rating = "Schwach";
            strength.color = "#e74c3c"; // Rot
        }

        return strength;
    }


    generateSecurePassword(length = 16) {
        const charset = {
            lowercase: "abcdefghijklmnopqrstuvwxyz",
            uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            numbers: "0123456789",
            special: "!@#$%^&*()_+-=[]{}|;:,.<>?"
        };


        let password = [
            charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)],
            charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)],
            charset.numbers[Math.floor(Math.random() * charset.numbers.length)],
            charset.special[Math.floor(Math.random() * charset.special.length)]
        ];

        const allChars = charset.lowercase + charset.uppercase + charset.numbers + charset.special;
        for (let i = password.length; i < length; i++) {
            password.push(allChars[Math.floor(Math.random() * allChars.length)]);
        }


        password = password.sort(() => Math.random() - 0.5).join('');

        return password;
    }


    checkAllPasswords() {
        const results = {
            total: this.passwords.length,
            weak: 0,
            good: 0,
            strong: 0,
            details: []
        };

        this.passwords.forEach(entry => {
            const strength = this.checkPasswordStrength(entry.password);
            results.details.push({
                website: entry.website,
                username: entry.username,
                strength: strength
            });

            if (strength.score === 5) results.strong++;
            else if (strength.score >= 3) results.good++;
            else results.weak++;
        });

        return results;
    }


    displayResults() {
        const results = this.checkAllPasswords();
        console.log("=== Passwort-Analyse ===");
        console.log(`Gesamtanzahl Passwörter: ${results.total}`);
        console.log(`Sehr starke Passwörter: ${results.strong}`);
        console.log(`Gute Passwörter: ${results.good}`);
        console.log(`Schwache Passwörter: ${results.weak}`);
        console.log("\nDetaillierte Analyse:");
        
        results.details.forEach(detail => {
            console.log(`\nWebsite: ${detail.website}`);
            console.log(`Benutzer: ${detail.username}`);
            console.log(`Stärke: ${detail.strength.rating}`);
            if (detail.strength.issues.length > 0) {
                console.log("Verbesserungsvorschläge:");
                detail.strength.issues.forEach(issue => console.log(`- ${issue}`));
            }
        });
    }
}

const checker = new PasswordChecker();


console.log("\nNeues sicheres Passwort generiert:");
console.log(checker.generateSecurePassword());


checker.displayResults(); 