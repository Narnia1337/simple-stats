const API_URL = 'http://localhost:3000/api';

let currentData = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeStats();
});

async function initializeStats() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('player');
    
    if (!username) {
        window.location.href = '/';
        return;
    }
    document.title = `${username} - SkyBlock Stats`;
    setupNavigation();
    await loadPlayerData(username);
}

function setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const section = tab.dataset.section;
            switchSection(section);
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
    const searchInput = document.getElementById('nav-search');
    const searchBtn = document.getElementById('nav-search-btn');
    
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

function handleSearch() {
    const username = document.getElementById('nav-search').value.trim();
    if (username) {
        window.location.href = `/stats.html?player=${encodeURIComponent(username)}`;
    }
}

function switchSection(sectionName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

async function loadPlayerData(username) {
    try {
        const response = await fetch(`${API_URL}/stats/${encodeURIComponent(username)}`);
        
        if (!response.ok) {
            throw new Error('Player not found');
        }
        
        const data = await response.json();
        currentData = data;
        
        setTimeout(() => {
            displayPlayerData(data, username);
            setTimeout(() => {
                const loader = document.getElementById('startup-loader');
                const app = document.getElementById('stats-app');
                
                loader.classList.add('fade-out');
                app.style.opacity = '1';
                
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 500);
            }, 2000);
        }, 500);
        
    } catch (error) {
        console.error('Error loading player data:', error);
        window.location.href = '/?error=player_not_found';
    }
}

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

function displayPlayerData(data, username) {
    const headUrl = data.uuid ? 
        `https://crafatar.com/avatars/${data.uuid}?size=128&overlay=true` :
        `https://crafatar.com/avatars/${username}?size=128&overlay=true`;
    
    document.getElementById('player-head-large').src = headUrl;
    document.getElementById('player-head-large').alt = username;
    document.getElementById('player-name-large').textContent = username;
    document.getElementById('profile-badge').textContent = data.profileName || 'Unknown';
    document.getElementById('sb-level-badge').textContent = data.skyblockLevel || '0';
    document.getElementById('networth-main').textContent = formatNumber(data.netWorth || 0);
    document.getElementById('purse-main').textContent = formatNumber(data.purse || 0);
    document.getElementById('bank-main').textContent = formatNumber(data.bankBalance || 0);
    document.getElementById('skill-avg-badge').textContent = (data.skills?.average || 0).toFixed(1);
    document.getElementById('slayer-total-badge').textContent = data.slayers?.total || '0';
    document.getElementById('cata-badge').textContent = Math.floor(data.catacombs || 0);
    displaySkillsChart(data.skills);
    displaySlayersChart(data.slayers);
    const cataLevel = Math.floor(data.catacombs || 0);
    document.getElementById('cata-level-detail').textContent = cataLevel;
    const cataProgress = Math.min((cataLevel / 50) * 100, 100);
    document.getElementById('cata-progress').style.width = `${cataProgress}%`;
    document.getElementById('fairy-souls-detail').textContent = data.fairySouls || '0';
    document.getElementById('sb-level-detail').textContent = data.skyblockLevel || '0';
    displayDetailedSkills(data.skills);
    displayDetailedSlayers(data.slayers);
}

function displaySkillsChart(skills) {
    const container = document.getElementById('skills-chart');
    container.innerHTML = '';
    
    const mainSkills = ['farming', 'mining', 'combat', 'foraging', 'fishing', 'enchanting', 'alchemy', 'taming'];
    
    mainSkills.forEach(skill => {
        if (skills && skills[skill] !== undefined) {
            const level = skills[skill];
            const maxLevel = getSkillCap(skill);
            const progress = Math.min((level / maxLevel) * 100, 100);
            
            const skillItem = document.createElement('div');
            skillItem.className = 'skill-item';
            skillItem.innerHTML = `
                <div class="skill-header">
                    <span class="skill-name">${capitalize(skill)}</span>
                    <span class="skill-level">${level}/${maxLevel}</span>
                </div>
                <div class="skill-bar-container">
                    <div class="skill-bar-fill" style="width: ${progress}%"></div>
                </div>
            `;
            container.appendChild(skillItem);
        }
    });
}

function displaySlayersChart(slayers) {
    const container = document.getElementById('slayers-chart');
    container.innerHTML = '';
    
    const slayerTypes = ['zombie', 'spider', 'wolf', 'enderman', 'blaze', 'vampire'];
    
    slayerTypes.forEach(slayer => {
        if (slayers && slayers[slayer] !== undefined) {
            const level = slayers[slayer];
            const maxLevel = slayer === 'vampire' ? 5 : 9;
            const progress = Math.min((level / maxLevel) * 100, 100);
            
            const slayerItem = document.createElement('div');
            slayerItem.className = 'slayer-item';
            slayerItem.innerHTML = `
                <div class="slayer-header">
                    <span class="slayer-name">${capitalize(slayer)}</span>
                    <span class="slayer-level">${level}/${maxLevel}</span>
                </div>
                <div class="slayer-bar-container">
                    <div class="slayer-bar-fill" style="width: ${progress}%"></div>
                </div>
            `;
            container.appendChild(slayerItem);
        }
    });
}

function displayDetailedSkills(skills) {
    const container = document.getElementById('skills-detailed-grid');
    container.innerHTML = '';
    
    const allSkills = [
        'farming', 'mining', 'combat', 'foraging', 'fishing',
        'enchanting', 'alchemy', 'taming', 'carpentry', 'runecrafting', 'social'
    ];
    
    allSkills.forEach(skill => {
        if (skills && skills[skill] !== undefined) {
            const level = skills[skill];
            const maxLevel = getSkillCap(skill);
            const progress = Math.min((level / maxLevel) * 100, 100);
            
            const card = document.createElement('div');
            card.className = 'skill-detail-card';
            card.innerHTML = `
                <div class="detail-title">${capitalize(skill)}</div>
                <div class="detail-stats">
                    <div class="detail-stat-row">
                        <span>Current Level</span>
                        <span>${level}</span>
                    </div>
                    <div class="detail-stat-row">
                        <span>Max Level</span>
                        <span>${maxLevel}</span>
                    </div>
                    <div class="detail-stat-row">
                        <span>Progress</span>
                        <span>${progress.toFixed(1)}%</span>
                    </div>
                </div>
                <div class="skill-bar-container" style="margin-top: 1rem;">
                    <div class="skill-bar-fill" style="width: ${progress}%"></div>
                </div>
            `;
            container.appendChild(card);
        }
    });
}

function displayDetailedSlayers(slayers) {
    const container = document.getElementById('slayers-detailed-grid');
    container.innerHTML = '';
    
    const slayerTypes = ['zombie', 'spider', 'wolf', 'enderman', 'blaze', 'vampire'];
    
    slayerTypes.forEach(slayer => {
        if (slayers && slayers[slayer] !== undefined) {
            const level = slayers[slayer];
            const maxLevel = slayer === 'vampire' ? 5 : 9;
            const progress = Math.min((level / maxLevel) * 100, 100);
            
            const card = document.createElement('div');
            card.className = 'slayer-detail-card';
            card.innerHTML = `
                <div class="detail-title">${capitalize(slayer)} Slayer</div>
                <div class="detail-stats">
                    <div class="detail-stat-row">
                        <span>Current Tier</span>
                        <span>${level}</span>
                    </div>
                    <div class="detail-stat-row">
                        <span>Max Tier</span>
                        <span>${maxLevel}</span>
                    </div>
                    <div class="detail-stat-row">
                        <span>Completion</span>
                        <span>${progress.toFixed(1)}%</span>
                    </div>
                </div>
                <div class="slayer-bar-container" style="margin-top: 1rem;">
                    <div class="slayer-bar-fill" style="width: ${progress}%"></div>
                </div>
            `;
            container.appendChild(card);
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