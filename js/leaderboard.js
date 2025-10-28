class Leaderboard {
    constructor() {
        this.storageKey = 'ispySmokey_leaderboard';
        this.maxScores = 5;
    }

    // Get all scores from localStorage
    getScores() {
        const scores = localStorage.getItem(this.storageKey);
        return scores ? JSON.parse(scores) : [];
    }

    // Save scores to localStorage
    saveScores(scores) {
        localStorage.setItem(this.storageKey, JSON.stringify(scores));
    }

    // Add a new score
    addScore(name, time) {
        const scores = this.getScores();
        const newScore = {
            name: name.trim(),
            time: time,
            date: new Date().toISOString()
        };

        scores.push(newScore);
        scores.sort((a, b) => a.time - b.time); // Sort by time (fastest first)

        // Keep only top scores
        const topScores = scores.slice(0, this.maxScores);
        this.saveScores(topScores);

        return topScores;
    }

    // Format time for display
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    // Display leaderboard in UI
    displayLeaderboard() {
        const scores = this.getScores();
        const leaderboardList = document.getElementById('leaderboard-list');

        if (scores.length === 0) {
            leaderboardList.innerHTML = '<p class="no-scores">No scores yet. Be the first!</p>';
            return;
        }

        leaderboardList.innerHTML = scores.map((score, index) => `
            <div class="leaderboard-entry ${index === 0 ? 'first-place' : ''}">
                <div class="rank">${index + 1}</div>
                <div class="name">${score.name}</div>
                <div class="time">${this.formatTime(score.time)}</div>
            </div>
        `).join('');
    }

    // Check if a time qualifies for the leaderboard
    qualifiesForLeaderboard(time) {
        const scores = this.getScores();
        return scores.length < this.maxScores || time < scores[scores.length - 1].time;
    }
}
