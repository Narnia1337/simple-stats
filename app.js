const API_URL = 'http://localhost:3000/api';

let currentUsername = '';
let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    const searchBtn = document.getElementById('search-btn');
    const usernameInput = document.getElementById('username-input');
    
    searchBtn.addEventListener('click', handleSearch);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    setupTabs();
    updateRecentSearches();
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('player');
    if (username) {
        usernameInput.value = username;
        handleSearch();
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

function updateRecentSearches() {
    const container = document.getElementById('recent-searches');
    container.innerHTML = '';
    
    if (recentSearches.length === 0) return;
    
    recentSearches.slice(0, 5).forEach(username => {
        const item = document.createElement('span');
        item.className = 'recent-item';
        item.textContent = username;
        item.onclick = () => {
            document.getElementById('username-input').value = username;
            handleSearch();
        };
        container.appendChild(item);
    });
}

async function handleSearch() {
    const username = document.getElementById('username-input').value.trim();
    
    if (!username) {
        showError('Please enter a username');
        return;
    }
    
    currentUsername = username;
    addToRecentSearches(username);
    showLoader();
    hideError();
    
    try {
        const response = await fetch(`${API_URL}/stats/${encodeURIComponent(username)}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showError('Player not found');
            } else {
                showError('Failed to fetch player data');
            }
            hideLoader();
            return;
        }
        
        window.location.href = `/stats.html?player=${encodeURIComponent(username)}`;
        
    } catch (error) {
        console.error('Error:', error);
        showError('Connection error. Please try again.');
        hideLoader();
    }
}

function addToRecentSearches(username) {
    recentSearches = recentSearches.filter(u => u.toLowerCase() !== username.toLowerCase());
    recentSearches.unshift(username);
    recentSearches = recentSearches.slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    updateRecentSearches();
}

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

function displayStats(data, username) {
    const headUrl = data.uuid ? 
        `https://crafatar.com/avatars/${data.uuid}?size=128&overlay=true` :
        `https://crafatar.com/avatars/${username}?size=128&overlay=true`;
    
    const playerHead = document.getElementById('player-head');
    playerHead.src = headUrl;
    playerHead.alt = username;
    document.getElementById('player-name').textContent = username;
    document.getElementById('profile-name').textContent = data.profileName || 'Unknown';
    document.getElementById('sb-level').textContent = data.skyblockLevel || '0';
    const networth = typeof data.netWorth === 'number' ? formatNumber(data.netWorth) : '—';
    document.getElementById('networth').textContent = networth;
    document.getElementById('skill-avg').textContent = (data.skills?.average || 0).toFixed(1);
    document.getElementById('slayer-total').textContent = data.slayers?.total || '0';
    document.getElementById('catacombs-level').textContent = Math.floor(data.catacombs || 0);
    document.getElementById('networth-detail').textContent = networth;
    document.getElementById('purse').textContent = formatNumber(data.purse || 0);
    document.getElementById('bank').textContent = formatNumber(data.bankBalance || 0);
    document.getElementById('fairy-souls').textContent = data.fairySouls || '0';
    document.getElementById('cata-detail').textContent = Math.floor(data.catacombs || 0);
    const skillsOverview = document.getElementById('skills-overview');
    skillsOverview.innerHTML = '';
    
    const mainSkills = ['farming', 'mining', 'combat', 'foraging', 'fishing', 'enchanting', 'alchemy', 'taming'];
    
    mainSkills.forEach(skill => {
        if (data.skills && data.skills[skill] !== undefined) {
            const level = data.skills[skill];
            const maxLevel = getSkillCap(skill);
            const progress = Math.min((level / maxLevel) * 100, 100);
            
            const skillBar = document.createElement('div');
            skillBar.className = 'skill-bar';
            skillBar.innerHTML = `
                <span class="skill-name">${capitalize(skill)}</span>
                <div class="skill-progress-container">
                    <div class="skill-progress-bar" style="width: ${progress}%">
                        <span class="skill-level">${level}/${maxLevel}</span>
                    </div>
                </div>
            `;
            skillsOverview.appendChild(skillBar);
        }
    });
    const slayersOverview = document.getElementById('slayers-overview');
    slayersOverview.innerHTML = '';
    
    const slayers = ['zombie', 'spider', 'wolf', 'enderman', 'blaze', 'vampire'];
    
    slayers.forEach(slayer => {
        if (data.slayers && data.slayers[slayer] !== undefined) {
            const level = data.slayers[slayer];
            const maxLevel = slayer === 'vampire' ? 5 : 9;
            const progress = Math.min((level / maxLevel) * 100, 100);
            
            const slayerBar = document.createElement('div');
            slayerBar.className = 'slayer-bar';
            slayerBar.innerHTML = `
                <span class="slayer-name">${capitalize(slayer)}</span>
                <div class="slayer-progress-container">
                    <div class="slayer-progress-bar" style="width: ${progress}%">
                        <span class="slayer-level">${level}/${maxLevel}</span>
                    </div>
                </div>
            `;
            slayersOverview.appendChild(slayerBar);
        }
    });
    const skillsDetailed = document.getElementById('skills-detailed');
    skillsDetailed.innerHTML = '';
    
    const allSkills = [
        'farming', 'mining', 'combat', 'foraging', 'fishing',
        'enchanting', 'alchemy', 'taming', 'carpentry', 'runecrafting', 'social'
    ];
    
    allSkills.forEach(skill => {
        if (data.skills && data.skills[skill] !== undefined) {
            const level = data.skills[skill];
            const maxLevel = getSkillCap(skill);
            const progress = Math.min((level / maxLevel) * 100, 100);
            
            const card = document.createElement('div');
            card.className = 'skill-detail-card';
            card.innerHTML = `
                <div class="detail-header">
                    <span class="detail-name">${capitalize(skill)}</span>
                    <span class="detail-level">${level}/${maxLevel}</span>
                </div>
                <div class="detail-progress">
                    <div class="detail-progress-bar" style="width: ${progress}%"></div>
                </div>
            `;
            skillsDetailed.appendChild(card);
        }
    });
    const slayersDetailed = document.getElementById('slayers-detailed');
    slayersDetailed.innerHTML = '';
    
    slayers.forEach(slayer => {
        if (data.slayers && data.slayers[slayer] !== undefined) {
            const level = data.slayers[slayer];
            const maxLevel = slayer === 'vampire' ? 5 : 9;
            const progress = Math.min((level / maxLevel) * 100, 100);
            
            const card = document.createElement('div');
            card.className = 'slayer-detail-card';
            card.innerHTML = `
                <div class="detail-header">
                    <span class="detail-name">${capitalize(slayer)}</span>
                    <span class="detail-level">Tier ${level}</span>
                </div>
                <div class="detail-progress">
                    <div class="detail-progress-bar" style="width: ${progress}%"></div>
                </div>
            `;
            slayersDetailed.appendChild(card);
        }
    });
}

function getSkillCap(skill) {
    const caps = {
        farming: 60,
        mining: 60,
        combat: 60,
        foraging: 50,
        fishing: 50,
        enchanting: 60,
        alchemy: 50,
        taming: 50,
        carpentry: 50,
        runecrafting: 25,
        social: 25
    };
    return caps[skill] || 50;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error').style.display = 'flex';
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

function showStats() {
    document.getElementById('stats').style.display = 'block';
}

function hideStats() {
    document.getElementById('stats').style.display = 'none';
}